import { useCallback, useEffect, useRef, useState } from "react";

const NOTE_GAP = 0.05; // seconds of silence between notes for articulation
const ATTACK_TIME = 0.01;
const PEAK_GAIN = 0.5;
const RELEASE_VALUE = 0.001;
const FILTER_START = 1200; // Hz
const FILTER_END = 400; // Hz

interface UseVocalSynthesizerReturn {
	isPlaying: boolean;
	currentNoteIndex: number;
	currentBpm: number;
	setBpm: (bpm: number) => void;
	startScale: (frequencies: number[]) => void;
	pause: () => void;
	resume: () => void;
	stop: () => void;
}

export function useVocalSynthesizer(): UseVocalSynthesizerReturn {
	const [isPlaying, setIsPlaying] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
	const [currentBpm, setCurrentBpm] = useState(90);

	const audioCtxRef = useRef<AudioContext | null>(null);
	const frequenciesRef = useRef<number[]>([]);
	const startTimeRef = useRef<number>(0);
	const currentNoteRef = useRef<number>(-1);
	const rafIdRef = useRef<number | null>(null);
	const activeNodesRef = useRef<Set<AudioNode>>(new Set());
	const bpmRef = useRef(currentBpm);
	const isPlayingRef = useRef(isPlaying);

	useEffect(() => {
		bpmRef.current = currentBpm;
	}, [currentBpm]);

	useEffect(() => {
		isPlayingRef.current = isPlaying;
	}, [isPlaying]);

	const cancelRaf = useCallback(() => {
		if (rafIdRef.current !== null) {
			cancelAnimationFrame(rafIdRef.current);
			rafIdRef.current = null;
		}
	}, []);

	const disposeAllSounds = useCallback(() => {
		const ctx = audioCtxRef.current;
		const now = ctx?.currentTime ?? 0;
		activeNodesRef.current.forEach((node) => {
			try {
				if (node instanceof OscillatorNode) {
					node.stop(now);
				}
				node.disconnect();
			} catch {
				// Node may already be stopped or disconnected.
			}
		});
		activeNodesRef.current.clear();
	}, []);

	const scheduleNote = useCallback(
		(ctx: AudioContext, frequency: number, when: number, duration: number) => {
			// Oscillator 1: Fundamental — triangle wave for the wooden body of the note.
			const fundamentalOsc = ctx.createOscillator();
			fundamentalOsc.type = "triangle";
			fundamentalOsc.frequency.setValueAtTime(frequency, when);

			const fundamentalGain = ctx.createGain();
			fundamentalGain.gain.setValueAtTime(0.6, when);

			// Oscillator 2: First harmonic — sine wave one octave above for tuning clarity.
			const firstHarmonicOsc = ctx.createOscillator();
			firstHarmonicOsc.type = "sine";
			firstHarmonicOsc.frequency.setValueAtTime(frequency * 2, when);

			const firstHarmonicGain = ctx.createGain();
			firstHarmonicGain.gain.setValueAtTime(0.18, when);

			// Oscillator 3: Second harmonic — sine wave one octave + fifth above for acoustic brightness.
			const secondHarmonicOsc = ctx.createOscillator();
			secondHarmonicOsc.type = "sine";
			secondHarmonicOsc.frequency.setValueAtTime(frequency * 3, when);

			const secondHarmonicGain = ctx.createGain();
			secondHarmonicGain.gain.setValueAtTime(0.05, when);

			// Master gain envelope: fast attack + exponential decay for a piano-like feel.
			const masterGain = ctx.createGain();
			masterGain.gain.setValueAtTime(0.0001, when);
			masterGain.gain.exponentialRampToValueAtTime(
				PEAK_GAIN,
				when + ATTACK_TIME,
			);
			masterGain.gain.exponentialRampToValueAtTime(
				RELEASE_VALUE,
				when + duration,
			);

			// Dynamic lowpass filter: bright attack, warm decay.
			const filter = ctx.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.setValueAtTime(FILTER_START, when);
			filter.frequency.exponentialRampToValueAtTime(
				FILTER_END,
				when + duration,
			);
			filter.Q.setValueAtTime(0.7, when);

			// Route all partials into the master gain, then through the filter.
			fundamentalOsc.connect(fundamentalGain);
			firstHarmonicOsc.connect(firstHarmonicGain);
			secondHarmonicOsc.connect(secondHarmonicGain);

			fundamentalGain.connect(masterGain);
			firstHarmonicGain.connect(masterGain);
			secondHarmonicGain.connect(masterGain);

			masterGain.connect(filter);
			filter.connect(ctx.destination);

			fundamentalOsc.start(when);
			firstHarmonicOsc.start(when);
			secondHarmonicOsc.start(when);

			fundamentalOsc.stop(when + duration + 0.02);
			firstHarmonicOsc.stop(when + duration + 0.02);
			secondHarmonicOsc.stop(when + duration + 0.02);

			const nodes: AudioNode[] = [
				fundamentalOsc,
				firstHarmonicOsc,
				secondHarmonicOsc,
				fundamentalGain,
				firstHarmonicGain,
				secondHarmonicGain,
				masterGain,
				filter,
			];
			nodes.forEach((node) => activeNodesRef.current.add(node));

			const cleanup = () => {
				nodes.forEach((node) => {
					try {
						node.disconnect();
					} catch {
						// Ignore already-disconnected nodes.
					}
					activeNodesRef.current.delete(node);
				});
			};

			fundamentalOsc.addEventListener("ended", cleanup, { once: true });
		},
		[],
	);

	const scheduleScale = useCallback(
		(ctx: AudioContext, frequencies: number[], fromIndex = 0) => {
			const noteDuration = 60 / bpmRef.current;
			const now = ctx.currentTime;

			// Adjust start time so the visual indicator stays synced when resuming.
			startTimeRef.current = now - fromIndex * (noteDuration + NOTE_GAP);

			frequencies.forEach((frequency, index) => {
				if (index < fromIndex) return;
				const offset = index - fromIndex;
				const when = now + offset * (noteDuration + NOTE_GAP);
				scheduleNote(ctx, frequency, when, noteDuration);
			});
		},
		[scheduleNote],
	);

	const tick = useCallback(() => {
		const ctx = audioCtxRef.current;
		const frequencies = frequenciesRef.current;
		if (!ctx || frequencies.length === 0 || !isPlayingRef.current) return;

		const now = ctx.currentTime;
		const noteDuration = 60 / bpmRef.current;
		const elapsed = now - startTimeRef.current;
		const rawIndex = Math.floor(elapsed / (noteDuration + NOTE_GAP));
		const index =
			rawIndex >= 0 && rawIndex < frequencies.length ? rawIndex : -1;

		if (index !== currentNoteRef.current) {
			currentNoteRef.current = index;
			setCurrentNoteIndex(index);
		}

		if (rawIndex >= frequencies.length) {
			setIsPlaying(false);
			setIsPaused(false);
			currentNoteRef.current = -1;
			setCurrentNoteIndex(-1);
			return;
		}

		rafIdRef.current = requestAnimationFrame(tick);
	}, []);

	useEffect(() => {
		if (isPlaying) {
			rafIdRef.current = requestAnimationFrame(tick);
		} else {
			cancelRaf();
		}
	}, [isPlaying, tick, cancelRaf]);

	const startScale = useCallback(
		async (frequencies: number[]) => {
			const AudioContextClass =
				window.AudioContext ||
				(
					window as unknown as {
						webkitAudioContext?: typeof AudioContext;
					}
				).webkitAudioContext;

			if (!AudioContextClass) return;

			let ctx = audioCtxRef.current;
			if (!ctx) {
				ctx = new AudioContextClass();
				audioCtxRef.current = ctx;
			}

			if (ctx.state === "suspended") {
				await ctx.resume();
			}

			frequenciesRef.current = frequencies;
			setIsPaused(false);
			setIsPlaying(true);

			const fromIndex = isPaused ? currentNoteRef.current + 1 : 0;
			scheduleScale(ctx, frequencies, fromIndex);
		},
		[isPaused, scheduleScale],
	);

	const pause = useCallback(() => {
		disposeAllSounds();
		const ctx = audioCtxRef.current;
		if (ctx) {
			ctx.suspend();
		}
		setIsPaused(true);
		setIsPlaying(false);
	}, [disposeAllSounds]);

	const resume = useCallback(async () => {
		const ctx = audioCtxRef.current;
		if (!ctx) return;
		await ctx.resume();

		const frequencies = frequenciesRef.current;
		if (frequencies.length === 0) return;

		setIsPaused(false);
		setIsPlaying(true);
		scheduleScale(ctx, frequencies, currentNoteRef.current + 1);
	}, [scheduleScale]);

	const stop = useCallback(() => {
		disposeAllSounds();
		const ctx = audioCtxRef.current;
		if (ctx) {
			ctx.close();
			audioCtxRef.current = null;
		}
		frequenciesRef.current = [];
		currentNoteRef.current = -1;
		setCurrentNoteIndex(-1);
		setIsPlaying(false);
		setIsPaused(false);
	}, [disposeAllSounds]);

	useEffect(() => {
		return () => {
			stop();
		};
	}, [stop]);

	const setBpm = useCallback((bpm: number) => {
		setCurrentBpm(Math.max(40, Math.min(208, bpm)));
	}, []);

	return {
		isPlaying,
		currentNoteIndex,
		currentBpm,
		setBpm,
		startScale,
		pause,
		resume,
		stop,
	};
}
