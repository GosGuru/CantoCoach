import { useMemo, useState } from "react";
import {
	Check,
	ChevronLeft,
	Clock,
	ListChecks,
	Music,
	Pause,
	Play,
	Square,
} from "lucide-react";
import type { Exercise, VoiceBlock } from "../types/vocal";
import { useVocalSynthesizer } from "../hooks/useVocalSynthesizer";

interface FocusPlayerProps {
	exercise: Exercise;
	onClose: () => void;
	onComplete: (exercise: Exercise) => void;
}

const BLOCK_LABELS: Record<VoiceBlock, string> = {
	Warmup: "Calentamiento",
	Closure: "Cierre Cordal",
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

const TEMPO_OPTIONS = [
	{ label: "Lento", bpm: 60 },
	{ label: "Normal", bpm: 90 },
	{ label: "Rápido", bpm: 120 },
];

export function FocusPlayer({
	exercise,
	onClose,
	onComplete,
}: FocusPlayerProps) {
	const {
		isPlaying,
		currentNoteIndex,
		currentBpm,
		setBpm,
		startScale,
		pause,
		resume,
		stop,
	} = useVocalSynthesizer();

	const [checkedAutochecks, setCheckedAutochecks] = useState<Set<string>>(
		new Set(),
	);

	const totalNotes = exercise.scalePattern.frequencies.length;
	const noteNames = exercise.scalePattern.noteNames ?? [];
	const focusInstruction =
		currentNoteIndex >= 0
			? currentNoteIndex % Math.max(exercise.instructions.length, 1)
			: 0;

	const handleToggleAutocheck = (item: string) => {
		setCheckedAutochecks((prev) => {
			const next = new Set(prev);
			if (next.has(item)) {
				next.delete(item);
			} else {
				next.add(item);
			}
			return next;
		});
	};

	const handlePlayPause = () => {
		if (isPlaying) {
			pause();
		} else if (currentNoteIndex >= 0) {
			resume();
		} else {
			startScale(exercise.scalePattern.frequencies);
		}
	};

	const handleStopAndComplete = () => {
		stop();
		onComplete(exercise);
	};

	const handleClose = () => {
		stop();
		onClose();
	};

	const progressPercent = useMemo(() => {
		if (totalNotes === 0) return 0;
		if (currentNoteIndex < 0) return 0;
		return ((currentNoteIndex + 1) / totalNotes) * 100;
	}, [currentNoteIndex, totalNotes]);

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-canvas">
			<div
				className={`absolute inset-0 bg-gradient-to-b ${BLOCK_TINT[exercise.block]} pointer-events-none`}
				aria-hidden="true"
			/>

			<header className="relative flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border glass-panel">
				<button
					type="button"
					onClick={handleClose}
					className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					aria-label="Volver al panel"
				>
					<ChevronLeft className="w-4 h-4" aria-hidden="true" />
					Volver
				</button>
				<div className="text-center px-4">
					<p className="text-[10px] uppercase tracking-wider text-text-subtle">
						{BLOCK_LABELS[exercise.block]}
					</p>
					<h1 className="text-base sm:text-lg font-semibold text-text truncate max-w-[50vw]">
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
					{/* Note indicator */}
					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border shadow-elevated">
						<div className="flex items-center gap-2 mb-4">
							<Music className="w-5 h-5 text-accent" aria-hidden="true" />
							<h2 className="section-title">Indicador de notas</h2>
						</div>
						<div className="flex items-stretch gap-1.5 h-20 sm:h-24">
							{exercise.scalePattern.frequencies.map((_, index) => {
								const isActive = index === currentNoteIndex;
								const isPast =
									currentNoteIndex >= 0 && index < currentNoteIndex;
								const label = noteNames[index] ?? `${index + 1}`;
								return (
									<div
										key={index}
										className={`flex-1 flex flex-col items-center justify-center rounded-lg border text-xs font-medium transition-all duration-200
											${
												isActive
													? "bg-accent text-accent-foreground border-accent shadow-glow scale-105 z-10"
													: isPast
														? "bg-surface/60 text-text-muted border-border"
														: "bg-surface text-text-subtle border-border"
											}
										`}
										aria-current={isActive ? "true" : undefined}
									>
										<span className="text-sm sm:text-base font-display">
											{label}
										</span>
									</div>
								);
							})}
						</div>
						<div className="mt-4 h-1.5 bg-surface rounded-full overflow-hidden border border-border">
							<div
								className="h-full bg-gradient-to-r from-accent to-gold transition-all duration-200"
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
						<p className="mt-3 text-sm text-text-muted">
							{currentNoteIndex >= 0 ? (
								<>
									Nota actual:{" "}
									<span className="text-text font-medium">
										{noteNames[currentNoteIndex] ?? currentNoteIndex + 1}
									</span>{" "}
									<span className="text-text-subtle">
										({currentNoteIndex + 1} de {totalNotes})
									</span>
								</>
							) : (
								"Presioná Iniciar Escala para comenzar la guía sonora."
							)}
						</p>
					</section>

					{/* Control panel */}
					<section className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel rounded-2xl p-5 sm:p-6 border border-border">
						<button
							type="button"
							onClick={handlePlayPause}
							className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl btn-primary text-base font-semibold"
							aria-label={isPlaying ? "Pausar escala" : "Iniciar escala"}
						>
							{isPlaying ? (
								<>
									<Pause className="w-5 h-5" aria-hidden="true" />
									Pausar
								</>
							) : (
								<>
									<Play className="w-5 h-5" aria-hidden="true" />
									{currentNoteIndex >= 0 ? "Continuar" : "Iniciar Escala"}
								</>
							)}
						</button>

						<div className="flex items-center gap-2">
							<span className="text-sm text-text-muted mr-1">Tempo:</span>
							{TEMPO_OPTIONS.map((option) => (
								<button
									key={option.label}
									type="button"
									onClick={() => setBpm(option.bpm)}
									className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
										${
											currentBpm === option.bpm
												? "bg-accent text-accent-foreground"
												: "bg-surface text-text-muted border border-border hover:text-text hover:bg-elevated"
										}
									`}
									aria-pressed={currentBpm === option.bpm}
								>
									{option.label} ({option.bpm} BPM)
								</button>
							))}
						</div>
					</section>

					{/* Instructions */}
					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border">
						<h2 className="section-title mb-4">Instrucciones de acción</h2>
						<ul className="space-y-3">
							{exercise.instructions.map((instruction, index) => (
								<li
									key={index}
									className={`p-4 rounded-xl border transition-colors
										${
											index === focusInstruction
												? "bg-accent/8 border-accent/30"
												: "bg-surface/40 border-border"
										}
									`}
								>
									<p className="text-sm sm:text-base text-text leading-relaxed">
										{instruction}
									</p>
									{index === focusInstruction && (
										<span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-accent">
											Focus
										</span>
									)}
								</li>
							))}
						</ul>
					</section>

					{/* Autochecks */}
					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border">
						<div className="flex items-center gap-2 mb-4">
							<ListChecks className="w-5 h-5 text-emerald" aria-hidden="true" />
							<h2 className="section-title">Autoverificación</h2>
						</div>
						<p className="text-sm text-text-muted mb-4">
							Marcá las sensaciones que confirmás mientras practicás.
						</p>
						<ul className="space-y-2">
							{exercise.autochecks.map((item) => {
								const checked = checkedAutochecks.has(item);
								return (
									<li key={item}>
										<label
											className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
												${
													checked
														? "bg-emerald/8 border-emerald/30"
														: "bg-surface/40 border-border hover:bg-surface/70"
												}
											`}
										>
											<span
												className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors
													${
														checked
															? "bg-emerald border-emerald"
															: "bg-surface border-text-subtle"
													}
												`}
											>
												{checked && (
													<Check
														className="w-3.5 h-3.5 text-ink"
														aria-hidden="true"
													/>
												)}
											</span>
											<input
												type="checkbox"
												className="sr-only"
												checked={checked}
												onChange={() => handleToggleAutocheck(item)}
											/>
											<span
												className={`text-sm leading-relaxed ${
													checked ? "text-emerald" : "text-text-muted"
												}`}
											>
												{item}
											</span>
										</label>
									</li>
								);
							})}
						</ul>
					</section>
				</div>
			</main>

			<footer className="relative p-4 sm:p-6 border-t border-border glass-panel">
				<div className="max-w-2xl mx-auto flex items-center gap-3">
					<button
						type="button"
						onClick={() => stop()}
						className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-secondary font-medium"
						aria-label="Detener audio"
					>
						<Square className="w-5 h-5" aria-hidden="true" />
						Detener
					</button>
					<button
						type="button"
						onClick={handleStopAndComplete}
						className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary font-medium"
						aria-label="Finalizar ejercicio y guardar progreso"
					>
						<Check className="w-5 h-5" aria-hidden="true" />
						Finalizar ejercicio
					</button>
				</div>
			</footer>
		</div>
	);
}
