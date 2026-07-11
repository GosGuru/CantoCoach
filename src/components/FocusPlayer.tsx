import { useMemo, useState } from "react";
import {
	AlertTriangle,
	Check,
	ChevronLeft,
	Clock,
	ListChecks,
	Music,
	Pause,
	Play,
	Square,
} from "lucide-react";
import { useVocalSynthesizer } from "../hooks/useVocalSynthesizer";
import type { AttemptTarget } from "../types/attempt.ts";
import type { Exercise, VoiceBlock } from "../types/vocal";
import { MeasuredAttemptPanel } from "./MeasuredAttemptPanel";

interface FocusPlayerProps {
	exercise: Exercise;
	onClose: () => void;
	onComplete: (exercise: Exercise) => void;
}

const BLOCK_LABELS: Record<VoiceBlock, string> = {
	Warmup: "Calentamiento",
	Closure: "Cierre cordal",
	Resonancia: "Resonancia",
	Passaggio: "Passaggio",
	Repertorio: "Repertorio",
};

const BLOCK_TINT: Record<VoiceBlock, string> = {
	Warmup: "from-rose/8 to-transparent",
	Closure: "from-sky/8 to-transparent",
	Resonancia: "from-accent/8 to-transparent",
	Passaggio: "from-gold/8 to-transparent",
	Repertorio: "from-emerald/8 to-transparent",
};

export function FocusPlayer({ exercise, onClose, onComplete }: FocusPlayerProps) {
	const {
		isPlaying,
		currentNoteIndex,
		currentBpm,
		setBpm,
		startScale,
		pause,
		resume,
		stop,
	} = useVocalSynthesizer(exercise.scalePattern.defaultBpm);
	const [checkedAutochecks, setCheckedAutochecks] = useState<Set<string>>(
		new Set(),
	);

	const noteNames = exercise.scalePattern.noteNames ?? [];
	const totalNotes = exercise.scalePattern.frequencies.length;
	const focusInstruction =
		currentNoteIndex >= 0
			? currentNoteIndex % Math.max(exercise.instructions.length, 1)
			: 0;

	const tempoOptions = useMemo(() => {
		const base = exercise.scalePattern.defaultBpm;
		return [
			{ label: "Lento", bpm: Math.max(40, base - 20) },
			{ label: "Base", bpm: base },
			{ label: "Rápido", bpm: Math.min(208, base + 20) },
		];
	}, [exercise.scalePattern.defaultBpm]);

	const progressPercent = useMemo(() => {
		if (totalNotes === 0 || currentNoteIndex < 0) return 0;
		return ((currentNoteIndex + 1) / totalNotes) * 100;
	}, [currentNoteIndex, totalNotes]);

	const toggleAutocheck = (item: string) => {
		setCheckedAutochecks((previous) => {
			const next = new Set(previous);
			if (next.has(item)) next.delete(item);
			else next.add(item);
			return next;
		});
	};

	const handlePlayPause = () => {
		if (isPlaying) {
			pause();
		} else if (currentNoteIndex >= 0) {
			resume();
		} else {
			startScale(exercise.scalePattern);
		}
	};

	const handlePlayTarget = (target: AttemptTarget) => {
		stop();
		startScale({
			type: "sustained",
			defaultBpm: 60,
			frequencies: [target.frequencyHz],
			noteNames: [target.noteName],
		});
	};

	const handleClose = () => {
		stop();
		onClose();
	};

	const handleComplete = () => {
		stop();
		onComplete(exercise);
	};

	const handleDiscomfort = () => {
		stop();
		window.localStorage.removeItem("vocalgym-daily-safety-v1");
		onClose();
		window.setTimeout(() => window.location.reload(), 0);
	};

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-canvas">
			<div
				className={`absolute inset-0 bg-gradient-to-b ${BLOCK_TINT[exercise.block]} pointer-events-none`}
				aria-hidden="true"
			/>

			<header className="relative flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border glass-panel">
				<button
					type="button"
					onClick={handleClose}
					className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface/70 transition-colors"
				>
					<ChevronLeft className="w-4 h-4" aria-hidden="true" />
					Volver
				</button>
				<div className="text-center px-2 min-w-0">
					<p className="text-[10px] uppercase tracking-wider text-text-subtle">
						{BLOCK_LABELS[exercise.block]}
					</p>
					<h1 className="text-base sm:text-lg font-semibold text-text truncate max-w-[48vw]">
						{exercise.name}
					</h1>
				</div>
				<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/70 border border-border text-sm font-medium text-text-muted">
					<Clock className="w-4 h-4" aria-hidden="true" />
					{exercise.durationMinutes} min
				</div>
			</header>

			<main className="relative flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="max-w-2xl mx-auto space-y-6">
					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border shadow-elevated">
						<div className="flex items-center gap-2 mb-4">
							<Music className="w-5 h-5 text-accent" aria-hidden="true" />
							<h2 className="section-title">Referencia sonora</h2>
						</div>

						<div className="flex items-stretch gap-1.5 h-20 sm:h-24">
							{exercise.scalePattern.frequencies.map((_, index) => {
								const active = index === currentNoteIndex;
								const past = currentNoteIndex >= 0 && index < currentNoteIndex;
								return (
									<div
										key={`${noteNames[index] ?? "note"}-${index}`}
										className={`flex-1 min-w-0 flex items-center justify-center rounded-lg border text-xs font-medium transition-all duration-150 ${
											active
												? "bg-accent text-accent-foreground border-accent shadow-glow scale-105 z-10"
												: past
													? "bg-surface/60 text-text-muted border-border"
													: "bg-surface text-text-subtle border-border"
										}`}
										aria-current={active ? "true" : undefined}
									>
										<span className="truncate px-1 text-sm sm:text-base font-display">
											{noteNames[index] ?? index + 1}
										</span>
									</div>
								);
							})}
						</div>

						<div className="mt-4 h-1.5 bg-surface rounded-full overflow-hidden border border-border">
							<div
								className="h-full bg-gradient-to-r from-accent to-gold transition-all duration-150"
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
						<p className="mt-3 text-sm text-text-muted">
							{currentNoteIndex >= 0
								? `Nota actual: ${noteNames[currentNoteIndex] ?? currentNoteIndex + 1}`
								: "Escuchá el patrón completo o elegí una nota para realizar un intento medido."}
						</p>
					</section>

					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border space-y-4">
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<button
								type="button"
								onClick={handlePlayPause}
								className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl btn-primary text-base font-semibold"
							>
								{isPlaying ? (
									<><Pause className="w-5 h-5" aria-hidden="true" />Pausar</>
								) : (
									<><Play className="w-5 h-5" aria-hidden="true" />{currentNoteIndex >= 0 ? "Continuar" : "Escuchar patrón"}</>
								)}
							</button>

							<div className="flex flex-wrap items-center justify-center gap-2">
								<span className="text-sm text-text-muted mr-1">Tempo:</span>
								{tempoOptions.map((option) => (
									<button
										key={option.label}
										type="button"
										onClick={() => setBpm(option.bpm)}
										className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
											currentBpm === option.bpm
												? "bg-accent text-accent-foreground"
												: "bg-surface text-text-muted border border-border hover:text-text"
										}`}
										aria-pressed={currentBpm === option.bpm}
									>
										{option.label} ({option.bpm})
									</button>
								))}
							</div>
						</div>
						<p className="text-xs text-text-subtle">
							Los cambios de tempo reprograman el audio y el indicador desde la posición actual.
						</p>
					</section>

					<MeasuredAttemptPanel
						exercise={exercise}
						referencePlaying={isPlaying}
						onPlayTarget={handlePlayTarget}
					/>

					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border">
						<h2 className="section-title mb-4">Instrucciones</h2>
						<ul className="space-y-3">
							{exercise.instructions.map((instruction, index) => (
								<li
									key={instruction}
									className={`p-4 rounded-xl border ${
										index === focusInstruction
											? "bg-accent/8 border-accent/30"
											: "bg-surface/40 border-border"
									}`}
								>
									<p className="text-sm sm:text-base text-text leading-relaxed">{instruction}</p>
									{index === focusInstruction && (
										<span className="inline-flex mt-2 text-xs font-medium text-accent">Foco actual</span>
									)}
								</li>
							))}
						</ul>
					</section>

					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border">
						<div className="flex items-center gap-2 mb-2">
							<ListChecks className="w-5 h-5 text-emerald" aria-hidden="true" />
							<h2 className="section-title">Autoverificación</h2>
						</div>
						<p className="text-sm text-text-muted mb-4">
							Son sensaciones reportadas por vos; no son mediciones anatómicas.
						</p>
						<ul className="space-y-2">
							{exercise.autochecks.map((item) => {
								const checked = checkedAutochecks.has(item);
								return (
									<li key={item}>
										<label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${checked ? "bg-emerald/8 border-emerald/30" : "bg-surface/40 border-border"}`}>
											<input
												type="checkbox"
												checked={checked}
												onChange={() => toggleAutocheck(item)}
												className="sr-only"
											/>
											<span className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center ${checked ? "bg-emerald border-emerald" : "bg-surface border-text-subtle"}`}>
												{checked && <Check className="w-3.5 h-3.5 text-ink" aria-hidden="true" />}
											</span>
											<span className={`text-sm leading-relaxed ${checked ? "text-emerald" : "text-text-muted"}`}>{item}</span>
										</label>
									</li>
								);
							})}
						</ul>
					</section>
				</div>
			</main>

			<footer className="relative p-4 sm:p-6 border-t border-border glass-panel">
				<div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch gap-3">
					<button
						type="button"
						onClick={stop}
						className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-secondary font-medium"
					>
						<Square className="w-5 h-5" aria-hidden="true" />
						Detener audio
					</button>
					<button
						type="button"
						onClick={handleDiscomfort}
						className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose/40 bg-rose/10 text-rose font-medium hover:bg-rose/15"
					>
						<AlertTriangle className="w-5 h-5" aria-hidden="true" />
						Parar por molestia
					</button>
					<button
						type="button"
						onClick={handleComplete}
						className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary font-medium"
					>
						<Check className="w-5 h-5" aria-hidden="true" />
						Finalizar ejercicio
					</button>
				</div>
			</footer>
		</div>
	);
}
