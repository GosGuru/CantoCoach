import { useCallback, useEffect, useRef, useState } from "react";
import {
	playPianoNote,
	preloadPianoForFrequencies,
} from "../audio/synthesis/pianoSampler.ts";
import type { ScalePattern } from "../types/vocal";

const MIN_GAIN = 0.0001;
const GUIDE_PEAK_GAIN = 0.28;
const ATTACK_SECONDS = 0.018;
const START_DELAY_SECONDS = 0.045;

export type ReferenceTimbre = "piano" | "guide";

interface UseVocalSynthesizerReturn {
	isPlaying: boolean;
	isPaused: boolean;
	isLoading: boolean;
	currentNoteIndex: number;
	currentBpm: number;
	timbre: ReferenceTimbre;
	setTimbre: (timbre: ReferenceTimbre) => void;
	setBpm: (bpm: number) => void;
	startScale: (pattern: ScalePattern | number[]) => Promise<void>;
	pause: () => void;
	resume: () => void;
	stop: () => void;
}

interface PlaybackTiming {
	stepSeconds: number;
	noteSeconds: number;
	continuous: boolean;
}

interface ScheduledPattern {
	durationSeconds: number;
	startAt: number;
	stepSeconds: number;
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
			return { stepSeconds: beat, noteSeconds: beat * 0.48, continuous: false };
		case "legato":
			return { stepSeconds: beat * 0.9, noteSeconds: beat * 1.04, continuous: false };
		case "sustained":
			return { stepSeconds: beat * 1.55, noteSeconds: beat * 1.45, continuous: false };
		case "sirens":
		case "octave-slide":
			return { stepSeconds: beat, noteSeconds: beat, continuous: true };
		default:
			return { stepSeconds: beat, noteSeconds: beat * 0.9, continuous: false };
	}
}

export function useVocalSynthesizer(initialBpm = 90): UseVocalSynthesizerReturn {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
	const [currentBpm, setCurrentBpm] = useState(() => clampBpm(initialBpm));
	const [timbre, setTimbreState] = useState<ReferenceTimbre>("piano");

	const audioContextRef = useRef<AudioContext | null>(null);
	const patternRef = useRef<ScalePattern | null>(null);
	const currentIndexRef = useRef(-1);
	const isPlayingRef = useRef(false);
	const bpmRef = useRef(clampBpm(initialBpm));
	const timbreRef = useRef<ReferenceTimbre>("piano");
	const timelineStartRef = useRef(0);
	const stepSecondsRef = useRef(1);
	const frameRef = useRef<number | null>(null);
	const activeNodesRef = useRef<Set<AudioNode>>(new Set());
	const playbackTimerRef = useRef<number | null>(null);
	const completionResolverRef = useRef<(() => void) | null>(null);
	const scheduleTokenRef = useRef(0);

	useEffect(() => {
		isPlayingRef.current = isPlaying;
	}, [isPlaying]);

	useEffect(() => {
		if (isPlayingRef.current) return;
		const nextBpm = clampBpm(initialBpm);
		bpmRef.current = nextBpm;
		setCurrentBpm(nextBpm);
	}, [initialBpm]);

	const setTimbre = useCallback((nextTimbre: ReferenceTimbre) => {
		timbreRef.current = nextTimbre;
		setTimbreState(nextTimbre);
	}, []);

	const cancelAnimation = useCallback(() => {
		if (frameRef.current !== null) {
			cancelAnimationFrame(frameRef.current);
			frameRef.current = null;
		}
	}, []);

	const resolveCompletion = useCallback(() => {
		if (playbackTimerRef.current !== null) {
			window.clearTimeout(playbackTimerRef.current);
			playbackTimerRef.current = null;
		}
		const resolve = completionResolverRef.current;
		completionResolverRef.current = null;
		resolve?.();
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
				// A scheduled source may already have ended.
			}
		}
		activeNodesRef.current.clear();
	}, []);

	const registerNodes = useCallback(
		(nodes: AudioNode[], cleanupNode: AudioScheduledSourceNode) => {
			for (const node of nodes) activeNodesRef.current.add(node);
			cleanupNode.addEventListener(
				"ended",
				() => {
					for (const node of nodes) {
						try {
							node.disconnect();
						} catch {
							// Ignore nodes already disconnected by stop or rescheduling.
						}
						activeNodesRef.current.delete(node);
					}
				},
				{ once: true },
			);
		},
		[],
	);

	const createGuideTone = useCallback(
		(
			context: AudioContext,
			frequency: number,
			when: number,
			duration: number,
		) => {
			const fundamental = context.createOscillator();
			fundamental.type = "sine";
			fundamental.frequency.setValueAtTime(frequency, when);
			const harmonic = context.createOscillator();
			harmonic.type = "sine";
			harmonic.frequency.setValueAtTime(frequency * 2, when);
			const harmonicGain = context.createGain();
			harmonicGain.gain.setValueAtTime(0.07, when);
			const master = context.createGain();
			const filter = context.createBiquadFilter();

			master.gain.setValueAtTime(MIN_GAIN, when);
			master.gain.exponentialRampToValueAtTime(
				GUIDE_PEAK_GAIN,
				when + ATTACK_SECONDS,
			);
			master.gain.setValueAtTime(
				GUIDE_PEAK_GAIN,
				Math.max(when + ATTACK_SECONDS, when + duration - 0.1),
			);
			master.gain.exponentialRampToValueAtTime(MIN_GAIN, when + duration);
			filter.type = "lowpass";
			filter.frequency.setValueAtTime(2400, when);
			filter.Q.setValueAtTime(0.4, when);

			fundamental.connect(master);
			harmonic.connect(harmonicGain);
			harmonicGain.connect(master);
			master.connect(filter);
			filter.connect(context.destination);
			fundamental.start(when);
			harmonic.start(when);
			fundamental.stop(when + duration + 0.02);
			harmonic.stop(when + duration + 0.02);
			registerNodes(
				[fundamental, harmonic, harmonicGain, master, filter],
				fundamental,
			);
		},
		[registerNodes],
	);

	const createContinuousGuide = useCallback(
		(
			context: AudioContext,
			frequencies: number[],
			fromIndex: number,
			when: number,
			stepSeconds: number,
		) => {
			const remaining = frequencies.slice(fromIndex);
			if (remaining.length === 0) return;
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			const filter = context.createBiquadFilter();
			const duration = Math.max(stepSeconds, remaining.length * stepSeconds);

			oscillator.type = "sine";
			oscillator.frequency.setValueAtTime(remaining[0], when);
			remaining.slice(1).forEach((frequency, index) => {
				oscillator.frequency.exponentialRampToValueAtTime(
					frequency,
					when + (index + 1) * stepSeconds,
				);
			});
			gain.gain.setValueAtTime(MIN_GAIN, when);
			gain.gain.exponentialRampToValueAtTime(GUIDE_PEAK_GAIN, when + 0.04);
			gain.gain.setValueAtTime(GUIDE_PEAK_GAIN, when + duration - 0.1);
			gain.gain.exponentialRampToValueAtTime(MIN_GAIN, when + duration);
			filter.type = "lowpass";
			filter.frequency.setValueAtTime(2300, when);
			oscillator.connect(gain);
			gain.connect(filter);
			filter.connect(context.destination);
			oscillator.start(when);
			oscillator.stop(when + duration + 0.02);
			registerNodes([oscillator, gain, filter], oscillator);
		},
		[registerNodes],
	);

	const schedulePattern = useCallback(
		async (
			context: AudioContext,
			pattern: ScalePattern,
			fromIndex = 0,
		): Promise<ScheduledPattern> => {
			const timing = resolveTiming(pattern, bpmRef.current);
			const frequencies = pattern.frequencies.slice(fromIndex);
			const usePiano = timbreRef.current === "piano" && !timing.continuous;

			if (usePiano) {
				await preloadPianoForFrequencies(context, frequencies);
			}

			const startAt = context.currentTime + START_DELAY_SECONDS;
			stepSecondsRef.current = timing.stepSeconds;
			timelineStartRef.current = startAt - fromIndex * timing.stepSeconds;
			currentIndexRef.current = fromIndex - 1;
			setCurrentNoteIndex(fromIndex - 1);

			if (timing.continuous) {
				createContinuousGuide(
					context,
					pattern.frequencies,
					fromIndex,
					startAt,
					timing.stepSeconds,
				);
			} else {
				for (let index = fromIndex; index < pattern.frequencies.length; index += 1) {
					const offset = index - fromIndex;
					const when = startAt + offset * timing.stepSeconds;
					if (usePiano) {
						const playback = await playPianoNote(
							context,
							pattern.frequencies[index],
							when,
							timing.noteSeconds,
						);
						registerNodes(playback.nodes, playback.source);
					} else {
						createGuideTone(
							context,
							pattern.frequencies[index],
							when,
							timing.noteSeconds,
						);
					}
				}
			}

			const remainingCount = Math.max(1, pattern.frequencies.length - fromIndex);
			const durationSeconds = timing.continuous
				? remainingCount * timing.stepSeconds
				: (remainingCount - 1) * timing.stepSeconds + timing.noteSeconds;
			return { durationSeconds, startAt, stepSeconds: timing.stepSeconds };
		},
		[createContinuousGuide, createGuideTone, registerNodes],
	);

	const finishPlayback = useCallback(() => {
		cancelAnimation();
		setIsPlaying(false);
		setIsPaused(false);
		setIsLoading(false);
		currentIndexRef.current = -1;
		setCurrentNoteIndex(-1);
		resolveCompletion();
	}, [cancelAnimation, resolveCompletion]);

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
			finishPlayback();
			return;
		}
		frameRef.current = requestAnimationFrame(tick);
	}, [finishPlayback]);

	useEffect(() => {
		if (isPlaying) frameRef.current = requestAnimationFrame(tick);
		else cancelAnimation();
	}, [cancelAnimation, isPlaying, tick]);

	const ensureContext = useCallback(async () => {
		const AudioContextClass =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext?: typeof AudioContext })
				.webkitAudioContext;
		if (!AudioContextClass) return null;
		if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
		if (audioContextRef.current.state === "suspended") {
			await audioContextRef.current.resume();
		}
		return audioContextRef.current;
	}, []);

	const startScale = useCallback(
		async (patternInput: ScalePattern | number[]): Promise<void> => {
			const token = scheduleTokenRef.current + 1;
			scheduleTokenRef.current = token;
			resolveCompletion();
			disposeNodes();
			const context = await ensureContext();
			if (!context || scheduleTokenRef.current !== token) return;
			const pattern = normalizePattern(patternInput);
			patternRef.current = pattern;
			setIsLoading(true);
			setIsPaused(false);

			try {
				const scheduled = await schedulePattern(context, pattern, 0);
				if (scheduleTokenRef.current !== token) return;
				setIsLoading(false);
				setIsPlaying(true);
				await new Promise<void>((resolve) => {
					completionResolverRef.current = resolve;
					playbackTimerRef.current = window.setTimeout(
						finishPlayback,
						Math.ceil(
							(scheduled.durationSeconds + START_DELAY_SECONDS + 0.08) * 1000,
						),
					);
				});
			} catch {
				if (scheduleTokenRef.current !== token) return;
				// Network or CORS failures fall back to the continuous guide timbre.
				timbreRef.current = "guide";
				setTimbreState("guide");
				setIsLoading(false);
				const scheduled = await schedulePattern(context, pattern, 0);
				setIsPlaying(true);
				await new Promise<void>((resolve) => {
					completionResolverRef.current = resolve;
					playbackTimerRef.current = window.setTimeout(
						finishPlayback,
						Math.ceil(
							(scheduled.durationSeconds + START_DELAY_SECONDS + 0.08) * 1000,
						),
					);
				});
			}
		},
		[disposeNodes, ensureContext, finishPlayback, resolveCompletion, schedulePattern],
	);

	const pause = useCallback(() => {
		scheduleTokenRef.current += 1;
		disposeNodes();
		resolveCompletion();
		void audioContextRef.current?.suspend();
		setIsPaused(true);
		setIsPlaying(false);
	}, [disposeNodes, resolveCompletion]);

	const resume = useCallback(() => {
		void (async () => {
			const context = await ensureContext();
			const pattern = patternRef.current;
			if (!context || !pattern) return;
			const fromIndex = Math.max(0, currentIndexRef.current + 1);
			disposeNodes();
			setIsLoading(true);
			await schedulePattern(
				context,
				pattern,
				fromIndex >= pattern.frequencies.length ? 0 : fromIndex,
			);
			setIsLoading(false);
			setIsPaused(false);
			setIsPlaying(true);
		})();
	}, [disposeNodes, ensureContext, schedulePattern]);

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
			resolveCompletion();
			void (async () => {
				setIsLoading(true);
				await schedulePattern(context, pattern, fromIndex);
				setIsLoading(false);
				setIsPlaying(true);
			})();
		},
		[disposeNodes, resolveCompletion, schedulePattern],
	);

	const stop = useCallback(() => {
		scheduleTokenRef.current += 1;
		cancelAnimation();
		resolveCompletion();
		disposeNodes();
		const context = audioContextRef.current;
		if (context) void context.close();
		audioContextRef.current = null;
		patternRef.current = null;
		currentIndexRef.current = -1;
		setCurrentNoteIndex(-1);
		setIsPlaying(false);
		setIsPaused(false);
		setIsLoading(false);
	}, [cancelAnimation, disposeNodes, resolveCompletion]);

	useEffect(() => stop, [stop]);

	return {
		isPlaying,
		isPaused,
		isLoading,
		currentNoteIndex,
		currentBpm,
		timbre,
		setTimbre,
		setBpm,
		startScale,
		pause,
		resume,
		stop,
	};
}
