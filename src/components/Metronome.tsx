import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus } from "lucide-react";

interface MetronomeProps {
	defaultBpm?: number;
	storageKey: string;
}

const MIN_BPM = 40;
const MAX_BPM = 208;

function clampBpm(value: number) {
	return Math.min(MAX_BPM, Math.max(MIN_BPM, value));
}

export function Metronome({ defaultBpm = 80, storageKey }: MetronomeProps) {
	const [bpm, setBpm] = useState(() => {
		try {
			const stored = window.localStorage.getItem(storageKey);
			if (stored) {
				const parsed = Number.parseInt(stored, 10);
				if (!Number.isNaN(parsed)) return clampBpm(parsed);
			}
		} catch {
			// localStorage may be unavailable in private/sandboxed modes.
		}
		return clampBpm(defaultBpm);
	});

	const [isPlaying, setIsPlaying] = useState(false);
	const [beat, setBeat] = useState(0);

	const ctxRef = useRef<AudioContext | null>(null);
	const nextNoteTimeRef = useRef(0);
	const beatCountRef = useRef(0);
	const timerRef = useRef<number | null>(null);

	useEffect(() => {
		try {
			window.localStorage.setItem(storageKey, String(bpm));
		} catch {
			// Ignore storage errors.
		}
	}, [bpm, storageKey]);

	const getContext = useCallback(() => {
		if (ctxRef.current) return ctxRef.current;
		const AudioContextClass =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext?: typeof AudioContext })
				.webkitAudioContext;
		if (!AudioContextClass) return null;
		ctxRef.current = new AudioContextClass();
		return ctxRef.current;
	}, []);

	const scheduleClick = useCallback((time: number) => {
		const ctx = ctxRef.current;
		if (!ctx) return;

		const isAccent = beatCountRef.current % 4 === 0;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.frequency.setValueAtTime(isAccent ? 1000 : 760, time);
		gain.gain.setValueAtTime(0.0001, time);
		gain.gain.exponentialRampToValueAtTime(0.45, time + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(time);
		osc.stop(time + 0.06);

		setBeat((b) => (b + 1) % 4);
		beatCountRef.current += 1;
	}, []);

	const scheduler = useCallback(() => {
		const ctx = ctxRef.current;
		if (!ctx) return;

		while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
			scheduleClick(nextNoteTimeRef.current);
			nextNoteTimeRef.current += 60.0 / bpm;
		}

		timerRef.current = window.setTimeout(scheduler, 25);
	}, [bpm, scheduleClick]);

	const toggle = useCallback(async () => {
		if (isPlaying) {
			if (timerRef.current) window.clearTimeout(timerRef.current);
			await ctxRef.current?.suspend();
			setIsPlaying(false);
			return;
		}

		const ctx = getContext();
		if (!ctx) return;

		await ctx.resume();
		nextNoteTimeRef.current = ctx.currentTime + 0.05;
		beatCountRef.current = 0;
		setIsPlaying(true);
	}, [getContext, isPlaying]);

	useEffect(() => {
		if (!isPlaying) return;
		scheduler();
		return () => {
			if (timerRef.current) window.clearTimeout(timerRef.current);
		};
	}, [isPlaying, scheduler]);

	useEffect(() => {
		return () => {
			if (timerRef.current) window.clearTimeout(timerRef.current);
			ctxRef.current?.close();
		};
	}, []);

	const step = useCallback((delta: number) => {
		setBpm((current) => clampBpm(current + delta));
	}, []);

	return (
		<div className="glass-panel rounded-xl p-4 border border-border space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div
						className={`w-3 h-3 rounded-full border border-border transition-colors duration-75 ${
							isPlaying && beat === 0 ? "bg-accent shadow-glow" : "bg-surface"
						}`}
						aria-hidden="true"
					/>
					<span className="text-xs font-medium text-text-muted uppercase tracking-wider">
						Metrónomo
					</span>
				</div>
				<button
					type="button"
					onClick={toggle}
					className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
						isPlaying
							? "bg-rose/15 text-rose border border-rose/30 hover:bg-rose/20"
							: "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/20"
					}`}
					aria-label={isPlaying ? "Pausar metrónomo" : "Iniciar metrónomo"}
					aria-pressed={isPlaying}
				>
					{isPlaying ? (
						<>
							<Pause className="w-4 h-4" aria-hidden="true" />
							Pausar
						</>
					) : (
						<>
							<Play className="w-4 h-4" aria-hidden="true" />
							Iniciar
						</>
					)}
				</button>
			</div>

			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={() => step(-1)}
					className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface text-text border border-border hover:bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					aria-label="Bajar un BPM"
				>
					<Minus className="w-4 h-4" aria-hidden="true" />
				</button>

				<input
					type="range"
					min={MIN_BPM}
					max={MAX_BPM}
					value={bpm}
					onChange={(e) => setBpm(clampBpm(Number(e.target.value)))}
					className="flex-1 accent-accent h-2 bg-surface rounded-lg appearance-none cursor-pointer"
					aria-label="Tempo en BPM"
				/>

				<button
					type="button"
					onClick={() => step(1)}
					className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-surface text-text border border-border hover:bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					aria-label="Subir un BPM"
				>
					<Plus className="w-4 h-4" aria-hidden="true" />
				</button>
			</div>

			<div className="text-center">
				<span className="text-3xl font-display text-text">{bpm}</span>
				<span className="text-sm text-text-muted ml-1">BPM</span>
			</div>
		</div>
	);
}
