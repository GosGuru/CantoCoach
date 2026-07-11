import { useCallback, useEffect, useRef, useState } from "react";
import type { ScalePattern } from "../types/vocal";

const MIN_GAIN = 0.0001;
const PEAK_GAIN = 0.42;
const ATTACK_SECONDS = 0.012;
const START_DELAY_SECONDS = 0.035;

interface UseVocalSynthesizerReturn {
	isPlaying: boolean;
	isPaused: boolean;
	currentNoteIndex: number;
	currentBpm: number;
	setBpm: (bpm: number) => void;
	startScale: (pattern: ScalePattern | number[]) => void;
	pause: () => void;
	resume: () => void;
	stop: () => void;
}

interface PlaybackTiming {
	stepSeconds: number;
	noteSeconds: number;
	continuous: boolean;
}

function clampBpm(bpm: number): number {
	return Math.max(40, Math.min(208, Math.round(bpm)));
}

function normalizePattern(pattern: ScalePattern | number[]): ScalePattern {
	if (Array.isArray(pattern)) {
		return {
			type: "5-note-ascending-descending",
			defaultBpm: 90,
			frequencies: pattern,
		};
	}
	return pattern;
}

function resolveTiming(pattern: ScalePattern, bpm: number): PlaybackTiming {
	const beat = 60 / bpm;

	switch (pattern.type) {
		case "staccato":
			return { stepSeconds: beat, noteSeconds: beat * 0.42, continuous: false };
		case "legato":
			return { stepSeconds: beat * 0.9, noteSeconds: beat * 0.96, continuous: false };
		case "sustained":
			return { stepSeconds: beat * 1.4, noteSeconds: beat * 1.3, continuous: false };
		case "sirens":
		case "octave-slide":
			return { stepSeconds: beat, noteSeconds: beat, continuous: true };
		default:
			return { stepSeconds: beat, noteSeconds: beat * 0.86, continuous: false };
	}
}

export function useVocalSynthesizer(initialBpm = 90): UseVocalSynthesizerReturn {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
	const [currentBpm, setCurrentBpm] = useState(() => clampBpm(initialBpm));

	const audioContextRef = useRef<AudioContext | null>(null);
	const patternRef = useRef<ScalePattern | null>(null);
	const currentIndexRef = useRef(-1);
	const isPlayingRef = useRef(false);
	const bpmRef = useRef(clampBpm(initialBpm));
	const timelineStartRef = useRef(0);
	const stepSecondsRef = useRef(1);
	const frameRef = useRef<number | null>(null);
	const activeNodesRef = useRef<Set<AudioNode>>(new Set());

	useEffect(() => {
		isPlayingRef.current = isPlaying;
	}, [isPlaying]);

	useEffect(() => {
		if (isPlayingRef.current) return;
		const nextBpm = clampBpm(initialBpm);
		bpmRef.current = nextBpm;
		setCurrentBpm(nextBpm);
	}, [initialBpm]);

	const cancelAnimation = useCallback(() => {
		if (frameRef.current !== null) {
			cancelAnimationFrame(frameRef.current);
			frameRef.current = null;
		}
	}, []);

	const disposeNodes = useCallback(() => {
		const context = audioContextRef.current;
		const now = context?.currentTime ?? 0;

		for (const node of activeNodesRef.current) {
			try {
				const stoppable = node as AudioNode & { stop?: (when?: number) => void };
				if (typeof stoppable.stop === "function") stoppable.stop(now);
				node.disconnect();
			} catch {
				// The node may have already ended.
			}
		}
		activeNodesRef.current.clear();
	}, []);

	const registerNodes = useCallback((nodes: AudioNode[], cleanupNode: OscillatorNode) => {
		for (const node of nodes) activeNodesRef.current.add(node);
		cleanupNode.addEventListener(
			"ended",
			() => {
				for (const node of nodes) {
					try {
						node.disconnect();
					} catch {
						// Ignore already disconnected nodes.
					}
					activeNodesRef.current.delete(node);
				}
			},
			{ once: true },
		);
	}, []);

	const createTone = useCallback(
		(
			context: AudioContext,
			frequency: number,
			when: number,
			duration: number,
		) => {
			const fundamental = context.createOscillator();
			fundamental.type = "triangle";
			fundamental.frequency.setValueAtTime(frequency, when);

			const harmonic = context.createOscillator();
			harmonic.type = "sine";
			harmonic.frequency.setValueAtTime(frequency * 2, when);

			const fundamentalGain = context.createGain();
			fundamentalGain.gain.setValueAtTime(0.72, when);
			const harmonicGain = context.createGain();
			harmonicGain.gain.setValueAtTime(0.16, when);

			const master = context.createGain();
			master.gain.setValueAtTime(MIN_GAIN, when);
			master.gain.exponentialRampToValueAtTime(
				PEAK_GAIN,
				when + ATTACK_SECONDS,
			);
			master.gain.setValueAtTime(
				PEAK_GAIN,
				Math.max(when + ATTACK_SECONDS, when + duration - 0.05),
			);
			master.gain.exponentialRampToValueAtTime(MIN_GAIN, when + duration);

			const filter = context.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.setValueAtTime(1450, when);
			filter.Q.setValueAtTime(0.7, when);

			fundamental.connect(fundamentalGain);
			harmonic.connect(harmonicGain);
			fundamentalGain.connect(master);
			harmonicGain.connect(master);
			master.connect(filter);
			filter.connect(context.destination);

			fundamental.start(when);
			harmonic.start(when);
			fundamental.stop(when + duration + 0.02);
			harmonic.stop(when + duration + 0.02);

			registerNodes(
				[fundamental, harmonic, fundamentalGain, harmonicGain, master, filter],
				fundamental,
			);
		},
		[registerNodes],
	);

	const createContinuousPattern = useCallback(
		(
			context: AudioContext,
			frequencies: number[],
			fromIndex: number,
			when: number,
			stepSeconds: number,
		) => {
			const remaining = frequencies.slice(fromIndex);
			if (remaining.length === 0) return;

			const fundamental = context.createOscillator();
			fundamental.type = "triangle";
			const harmonic = context.createOscillator();
			harmonic.type = "sine";

			fundamental.frequency.setValueAtTime(remaining[0], when);
			harmonic.frequency.setValueAtTime(remaining[0] * 2, when);

			remaining.slice(1).forEach((frequency, index) => {
				const targetTime = when + (index + 1) * stepSeconds;
				fundamental.frequency.exponentialRampToValueAtTime(frequency, targetTime);
				harmonic.frequency.exponentialRampToValueAtTime(
					frequency * 2,
					targetTime,
				);
			});

			const fundamentalGain = context.createGain();
			fundamentalGain.gain.setValueAtTime(0.72, when);
			const harmonicGain = context.createGain();
			harmonicGain.gain.setValueAtTime(0.14, when);
			const master = context.createGain();
			const duration = Math.max(stepSeconds, remaining.length * stepSeconds);

			master.gain.setValueAtTime(MIN_GAIN, when);
			master.gain.exponentialRampToValueAtTime(
				PEAK_GAIN,
				when + ATTACK_SECONDS,
			);
			master.gain.setValueAtTime(
				PEAK_GAIN,
				Math.max(when + ATTACK_SECONDS, when + duration - 0.08),
			);
			master.gain.exponentialRampToValueAtTime(MIN_GAIN, when + duration);

			const filter = context.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.setValueAtTime(1550, when);

			fundamental.connect(fundamentalGain);
			harmonic.connect(harmonicGain);
			fundamentalGain.connect(master);
			harmonicGain.connect(master);
			master.connect(filter);
			filter.connect(context.destination);

			fundamental.start(when);
			harmonic.start(when);
			fundamental.stop(when + duration + 0.02);
			harmonic.stop(when + duration + 0.02);

			registerNodes(
				[fundamental, harmonic, fundamentalGain, harmonicGain, master, filter],
				fundamental,
			);
		},
		[registerNodes],
	);

	const schedulePattern = useCallback(
		(context: AudioContext, pattern: ScalePattern, fromIndex = 0) => {
			const timing = resolveTiming(pattern, bpmRef.current);
			const startAt = context.currentTime + START_DELAY_SECONDS;
			stepSecondsRef.current = timing.stepSeconds;
			timelineStartRef.current = startAt - fromIndex * timing.stepSeconds;
			currentIndexRef.current = fromIndex - 1;
			setCurrentNoteIndex(fromIndex - 1);

			if (timing.continuous) {
				createContinuousPattern(
					context,
					pattern.frequencies,
					fromIndex,
					startAt,
					timing.stepSeconds,
				);
				return;
			}

			pattern.frequencies.forEach((frequency, index) => {
				if (index < fromIndex) return;
				const offset = index - fromIndex;
				createTone(
					context,
					frequency,
					startAt + offset * timing.stepSeconds,
					timing.noteSeconds,
				);
			});
		},
		[createContinuousPattern, createTone],
	);

	const tick = useCallback(() => {
		const context = audioContextRef.current;
		const pattern = patternRef.current;
		if (!context || !pattern || !isPlayingRef.current) return;

		const elapsed = context.currentTime - timelineStartRef.current;
		const rawIndex = Math.floor(elapsed / stepSecondsRef.current);
		const nextIndex =
			rawIndex >= 0 && rawIndex < pattern.frequencies.length ? rawIndex : -1;

		if (nextIndex !== currentIndexRef.current) {
			currentIndexRef.current = nextIndex;
			setCurrentNoteIndex(nextIndex);
		}

		if (rawIndex >= pattern.frequencies.length) {
			setIsPlaying(false);
			setIsPaused(false);
			currentIndexRef.current = -1;
			setCurrentNoteIndex(-1);
			return;
		}

		frameRef.current = requestAnimationFrame(tick);
	}, []);

	useEffect(() => {
		if (isPlaying) {
			frameRef.current = requestAnimationFrame(tick);
		} else {
			cancelAnimation();
		}
	}, [cancelAnimation, isPlaying, tick]);

	const ensureContext = useCallback(async () => {
		const AudioContextClass =
			window.AudioContext ||
			(
				window as unknown as {
					webkitAudioContext?: typeof AudioContext;
				}
			).webkitAudioContext;

		if (!AudioContextClass) return null;
		if (!audioContextRef.current) {
			audioContextRef.current = new AudioContextClass();
		}
		if (audioContextRef.current.state === "suspended") {
			await audioContextRef.current.resume();
		}
		return audioContextRef.current;
	}, []);

	const startScale = useCallback(
		(patternInput: ScalePattern | number[]) => {
			void (async () => {
				const context = await ensureContext();
				if (!context) return;

				disposeNodes();
				const pattern = normalizePattern(patternInput);
				patternRef.current = pattern;
				setIsPaused(false);
				setIsPlaying(true);
				schedulePattern(context, pattern, 0);
			})();
		},
		[disposeNodes, ensureContext, schedulePattern],
	);

	const pause = useCallback(() => {
		disposeNodes();
		void audioContextRef.current?.suspend();
		setIsPaused(true);
		setIsPlaying(false);
	}, [disposeNodes]);

	const resume = useCallback(() => {
		void (async () => {
			const context = await ensureContext();
			const pattern = patternRef.current;
			if (!context || !pattern) return;

			const fromIndex = Math.max(0, currentIndexRef.current + 1);
			if (fromIndex >= pattern.frequencies.length) {
				schedulePattern(context, pattern, 0);
			} else {
				schedulePattern(context, pattern, fromIndex);
			}
			setIsPaused(false);
			setIsPlaying(true);
		})();
	}, [ensureContext, schedulePattern]);

	const setBpm = useCallback(
		(bpm: number) => {
			const nextBpm = clampBpm(bpm);
			bpmRef.current = nextBpm;
			setCurrentBpm(nextBpm);

			if (!isPlayingRef.current) return;
			const pattern = patternRef.current;
			const context = audioContextRef.current;
			if (!pattern || !context) return;

			const fromIndex = Math.max(0, currentIndexRef.current);
			disposeNodes();
			schedulePattern(context, pattern, fromIndex);
		},
		[disposeNodes, schedulePattern],
	);

	const stop = useCallback(() => {
		cancelAnimation();
		disposeNodes();
		const context = audioContextRef.current;
		if (context) void context.close();
		audioContextRef.current = null;
		patternRef.current = null;
		currentIndexRef.current = -1;
		setCurrentNoteIndex(-1);
		setIsPlaying(false);
		setIsPaused(false);
	}, [cancelAnimation, disposeNodes]);

	useEffect(() => stop, [stop]);

	return {
		isPlaying,
		isPaused,
		currentNoteIndex,
		currentBpm,
		setBpm,
		startScale,
		pause,
		resume,
		stop,
	};
}
