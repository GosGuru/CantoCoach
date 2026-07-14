import { useMemo, useState } from "react";
import {
	AlertTriangle,
	Check,
	ChevronLeft,
	Clock,
	KeyboardMusic,
	ListChecks,
	LoaderCircle,
	Music,
	Pause,
	Play,
	Square,
	Waves,
} from "lucide-react";
import { PIANO_SAMPLE_ATTRIBUTION } from "../audio/synthesis/pianoSampler.ts";
import {
	resolveExercisePrescription,
	totalPrescriptionRepetitions,
} from "../domain/practice/prescription.ts";
import { evaluateExerciseProgression } from "../domain/progression/evaluateExerciseProgression.ts";
import { usePracticeSession } from "../hooks/usePracticeSession.ts";
import { useVocalSynthesizer } from "../hooks/useVocalSynthesizer";
import type {
	AttemptTarget,
	ExerciseAttemptRecord,
	ExerciseCompletionMode,
	ExerciseCompletionRecord,
} from "../types/attempt.ts";
import type { Exercise, ScalePattern, VoiceBlock } from "../types/vocal";
import { getLocalDateKey } from "../utils/localDate.ts";
import { ExerciseLearningPanel } from "./ExerciseLearningPanel.tsx";
import { MeasuredAttemptPanel } from "./MeasuredAttemptPanel";
import { ProgressionSummary } from "./ProgressionSummary";

interface FocusPlayerProps {
	exercise: Exercise;
	onClose: () => void;
	onComplete: (
		exercise: Exercise,
		completion: ExerciseCompletionRecord,
	) => void;
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

const ATTEMPTS_STORAGE_KEY = "vocalgym-attempts-v1";

function readStoredAttempts(): ExerciseAttemptRecord[] {
	try {
		const raw = window.localStorage.getItem(ATTEMPTS_STORAGE_KEY);
		return raw ? (JSON.parse(raw) as ExerciseAttemptRecord[]) : [];
	} catch {
		return [];
	}
}

function deduplicateAttempts(
	attempts: ExerciseAttemptRecord[],
): ExerciseAttemptRecord[] {
	return [...new Map(attempts.map((attempt) => [attempt.id, attempt])).values()];
}

function patternFromIndex(pattern: ScalePattern, startIndex: number): ScalePattern {
	return {
		...pattern,
		frequencies: pattern.frequencies.slice(startIndex),
		noteNames: pattern.noteNames?.slice(startIndex),
	};
}

export function FocusPlayer({ exercise, onClose, onComplete }: FocusPlayerProps) {
	const prescription = useMemo(
		() => resolveExercisePrescription(exercise),
		[exercise],
	);
	const {
		sessionId,
		session,
		registerAttempt,
		completeMeasured,
		completeManual,
		closePartial,
		interruptForDiscomfort,
	} = usePracticeSession(exercise.id, prescription);
	const {
		isPlaying,
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
	} = useVocalSynthesizer(exercise.scalePattern.defaultBpm);
	const [checkedAutochecks, setCheckedAutochecks] = useState<Set<string>>(
		new Set(),
	);
	const [sessionAttempts, setSessionAttempts] = useState<ExerciseAttemptRecord[]>(
		[],
	);
	const [selectedStartIndex, setSelectedStartIndex] = useState(0);
	const [playbackStartIndex, setPlaybackStartIndex] = useState(0);

	const noteNames = exercise.scalePattern.noteNames ?? [];
	const totalNotes = exercise.scalePattern.frequencies.length;
	const displayCurrentNoteIndex =
		playbackStartIndex >= 0 && currentNoteIndex >= 0
			? playbackStartIndex + currentNoteIndex
			: -1;
	const completedRepetitions =
		session?.completedRepetitions ??
		sessionAttempts.filter((attempt) => attempt.metrics.evaluable).length;
	const requiredRepetitions = totalPrescriptionRepetitions(prescription);
	const prescriptionComplete = completedRepetitions >= requiredRepetitions;

	const allAttempts = useMemo(
		() => deduplicateAttempts([...readStoredAttempts(), ...sessionAttempts]),
		[sessionAttempts],
	);
	const progression = useMemo(
		() => evaluateExerciseProgression(exercise, allAttempts),
		[allAttempts, exercise],
	);

	const focusInstruction =
		displayCurrentNoteIndex >= 0
			? displayCurrentNoteIndex % Math.max(exercise.instructions.length, 1)
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
		if (totalNotes === 0 || displayCurrentNoteIndex < 0) return 0;
		return ((displayCurrentNoteIndex + 1) / totalNotes) * 100;
	}, [displayCurrentNoteIndex, totalNotes]);

	const selectedStartLabel =
		noteNames[selectedStartIndex] ?? String(selectedStartIndex + 1);

	const toggleAutocheck = (item: string) => {
		setCheckedAutochecks((previous) => {
			const next = new Set(previous);
			if (next.has(item)) next.delete(item);
			else next.add(item);
			return next;
		});
	};

	const startPatternFrom = (requestedIndex: number) => {
		if (totalNotes === 0) return;
		const safeIndex = Math.max(0, Math.min(requestedIndex, totalNotes - 1));
		setSelectedStartIndex(safeIndex);
		setPlaybackStartIndex(safeIndex);
		void startScale(patternFromIndex(exercise.scalePattern, safeIndex));
	};

	const handlePlayPause = () => {
		if (isPlaying) pause();
		else if (currentNoteIndex >= 0 && playbackStartIndex >= 0) resume();
		else startPatternFrom(selectedStartIndex);
	};

	const handleStopReference = () => {
		stop();
		setPlaybackStartIndex(selectedStartIndex);
	};

	const handlePlayTarget = async (target: AttemptTarget): Promise<void> => {
		stop();
		setPlaybackStartIndex(-1);
		await startScale({
			type: "sustained",
			defaultBpm: 58,
			frequencies: [target.frequencyHz],
			noteNames: [target.noteName],
		});
	};

	const handleAttemptRecorded = (attempt: ExerciseAttemptRecord) => {
		registerAttempt(attempt);
		setSessionAttempts((current) =>
			current.some((item) => item.id === attempt.id)
				? current
				: [...current, attempt],
		);
	};

	const createCompletion = (
		mode: ExerciseCompletionMode,
	): ExerciseCompletionRecord => ({
		id: crypto.randomUUID(),
		version: 1,
		exerciseId: exercise.id,
		practiceSessionId: sessionId,
		localDate: getLocalDateKey(),
		createdAt: new Date().toISOString(),
		mode,
		attemptIds: sessionAttempts.map((attempt) => attempt.id),
		progressionEligible: mode === "measured" && progression.state === "ready",
		progressionSnapshot: mode === "measured" ? progression : undefined,
	});

	const handleClose = () => {
		stop();
		closePartial();
		onClose();
	};

	const handleCompleteManual = () => {
		stop();
		completeManual();
		onComplete(exercise, createCompletion("manual-unscored"));
	};

	const handleCompleteMeasured = () => {
		if (!prescriptionComplete) return;
		stop();
		completeMeasured();
		onComplete(exercise, createCompletion("measured"));
	};

	const handleDiscomfort = () => {
		stop();
		interruptForDiscomfort();
		window.localStorage.removeItem("vocalgym-daily-safety-v1");
		onClose();
		window.setTimeout(() => window.location.reload(), 0);
	};

	const referenceBusy = isPlaying || isLoading;
	const referenceCanStop = referenceBusy || currentNoteIndex >= 0;
	const continuousPattern = ["sirens", "octave-slide"].includes(
		exercise.scalePattern.type,
	);

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
					Cerrar sesión
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
					{completedRepetitions}/{requiredRepetitions}
				</div>
			</header>

			<main className="relative flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="max-w-2xl mx-auto space-y-6">
					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border shadow-elevated">
						<div className="flex items-start justify-between gap-4 mb-4">
							<div className="flex items-center gap-2">
								<Music className="w-5 h-5 text-accent" aria-hidden="true" />
								<h2 className="section-title">Referencia sonora</h2>
							</div>
							<span className="shrink-0 rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
								Inicio: {selectedStartLabel}
							</span>
						</div>

						<div className="flex items-stretch gap-1.5 h-20 sm:h-24">
							{exercise.scalePattern.frequencies.map((_, index) => {
								const active = index === displayCurrentNoteIndex;
								const selected = index === selectedStartIndex;
								const past =
									displayCurrentNoteIndex >= 0 && index < displayCurrentNoteIndex;
								const noteLabel = noteNames[index] ?? String(index + 1);
								return (
									<button
										type="button"
										key={`${noteLabel}-${index}`}
										onClick={() => startPatternFrom(index)}
										aria-label={`Empezar desde ${noteLabel}, nota ${index + 1} de ${totalNotes}`}
										aria-current={active ? "step" : undefined}
										aria-pressed={selected}
										className={`flex-1 min-w-0 flex items-center justify-center rounded-lg border text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
											active
												? "bg-accent text-accent-foreground border-accent shadow-glow scale-105 z-10"
												: selected
													? "bg-accent/12 text-text border-accent/70 ring-2 ring-accent/20"
													: past
														? "bg-surface/60 text-text-muted border-border"
														: "bg-surface text-text-subtle border-border hover:border-accent/55 hover:text-text"
										}`}
									>
										<span className="truncate px-1 text-sm sm:text-base font-display">
											{noteLabel}
										</span>
									</button>
								);
							})}
						</div>

						<div className="mt-4 h-1.5 bg-surface rounded-full overflow-hidden border border-border">
							<div
								className="h-full bg-gradient-to-r from-accent to-gold transition-all duration-150"
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
						<p className="mt-3 text-xs leading-relaxed text-text-subtle">
							Tocá cualquier nota para saltar ahí y continuar el patrón desde ese punto.
						</p>
					</section>

					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border space-y-5">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
							<div className="flex w-full sm:w-auto gap-2">
								<button
									type="button"
									disabled={isLoading}
									onClick={handlePlayPause}
									className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl btn-primary text-base font-semibold disabled:opacity-60"
								>
									{isLoading ? (
										<>
											<LoaderCircle className="w-5 h-5 animate-spin" aria-hidden="true" />
											Cargando piano…
										</>
									) : isPlaying ? (
										<>
											<Pause className="w-5 h-5" aria-hidden="true" /> Pausar
										</>
									) : currentNoteIndex >= 0 && playbackStartIndex >= 0 ? (
										<>
											<Play className="w-5 h-5" aria-hidden="true" /> Continuar
										</>
									) : (
										<>
											<Play className="w-5 h-5" aria-hidden="true" />
											{selectedStartIndex === 0
												? "Escuchar patrón"
												: `Desde ${selectedStartLabel}`}
										</>
									)}
								</button>
								<button
									type="button"
									disabled={!referenceCanStop}
									onClick={handleStopReference}
									className="inline-flex items-center justify-center gap-2 rounded-xl btn-secondary px-4 py-3.5 disabled:opacity-40"
									aria-label="Detener referencia sonora"
								>
									<Square className="w-5 h-5" aria-hidden="true" />
									<span className="hidden sm:inline">Detener</span>
								</button>
							</div>

							<div className="flex flex-wrap items-center justify-center gap-2">
								{tempoOptions.map((option) => (
									<button
										key={option.label}
										type="button"
										disabled={isLoading}
										onClick={() => setBpm(option.bpm)}
										className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
											currentBpm === option.bpm
												? "bg-accent text-accent-foreground"
												: "bg-surface text-text-muted border border-border hover:text-text"
										}`}
									>
										{option.label} ({option.bpm})
									</button>
								))}
							</div>
						</div>

						<div>
							<p className="text-xs uppercase tracking-wider text-text-subtle mb-2">
								Sonido de referencia
							</p>
							<div className="grid grid-cols-2 gap-2">
								<button
									type="button"
									disabled={referenceBusy || continuousPattern}
									onClick={() => setTimbre("piano")}
									className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium disabled:opacity-45 ${
										timbre === "piano"
											? "border-accent bg-accent/10 text-text"
											: "border-border bg-surface text-text-muted"
									}`}
								>
									<KeyboardMusic className="w-4 h-4" aria-hidden="true" />
									Piano real
								</button>
								<button
									type="button"
									disabled={referenceBusy}
									onClick={() => setTimbre("guide")}
									className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium disabled:opacity-45 ${
										timbre === "guide" || continuousPattern
											? "border-sky bg-sky/10 text-text"
											: "border-border bg-surface text-text-muted"
									}`}
								>
									<Waves className="w-4 h-4" aria-hidden="true" />
									Guía sostenida
								</button>
							</div>
							<p className="text-xs text-text-subtle mt-2 leading-relaxed">
								{continuousPattern
									? "Las sirenas y los slides usan guía continua para que el tono pueda desplazarse sin cortes."
									: "El piano usa muestras reales. La guía sostenida sirve cuando necesitás oír el centro durante más tiempo."}
							</p>
							{timbre === "piano" && !continuousPattern && (
								<p className="text-[11px] text-text-subtle mt-2">
									Muestras: {PIANO_SAMPLE_ATTRIBUTION.instrument} ·{" "}
									<a
										href={PIANO_SAMPLE_ATTRIBUTION.sourceUrl}
										target="_blank"
										rel="noreferrer"
										className="underline hover:text-text"
									>
										{PIANO_SAMPLE_ATTRIBUTION.license}
									</a>
								</p>
							)}
						</div>
					</section>

					<MeasuredAttemptPanel
						exercise={exercise}
						practiceSessionId={sessionId}
						prescription={prescription}
						completedRepetitions={completedRepetitions}
						referencePlaying={referenceBusy}
						onPlayTarget={handlePlayTarget}
						onAttemptRecorded={handleAttemptRecorded}
					/>

					<ProgressionSummary result={progression} />

					<ExerciseLearningPanel
						exercise={exercise}
						focusInstruction={focusInstruction}
					/>

					<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border">
						<div className="flex items-center gap-2 mb-2">
							<ListChecks className="w-5 h-5 text-emerald" aria-hidden="true" />
							<h2 className="section-title">Autoverificación</h2>
						</div>
						<p className="text-sm text-text-muted mb-4">
							Estas sensaciones no sustituyen la medición ni diagnostican su causa.
						</p>
						<ul className="space-y-2">
							{exercise.autochecks.map((item) => {
								const checked = checkedAutochecks.has(item);
								return (
									<li key={item}>
										<label className="flex items-start gap-3 p-3 rounded-xl border bg-surface/40 border-border cursor-pointer">
											<input
												type="checkbox"
												checked={checked}
												onChange={() => toggleAutocheck(item)}
												className="sr-only"
											/>
											<span
												className={`w-5 h-5 rounded-md border flex items-center justify-center ${
													checked
														? "bg-emerald border-emerald"
														: "bg-surface border-text-subtle"
												}`}
											>
												{checked && <Check className="w-3.5 h-3.5 text-ink" />}
											</span>
											<span className="text-sm text-text-muted">{item}</span>
										</label>
									</li>
								);
							})}
						</ul>
					</section>
				</div>
			</main>

			<footer className="relative p-4 sm:p-6 border-t border-border glass-panel">
				<div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-3">
					<button
						type="button"
						onClick={handleStopReference}
						className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-secondary"
					>
						<Square className="w-5 h-5" /> Detener audio
					</button>
					<button
						type="button"
						onClick={handleDiscomfort}
						className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose/40 bg-rose/10 text-rose"
					>
						<AlertTriangle className="w-5 h-5" /> Molestia
					</button>
					<button
						type="button"
						onClick={handleCompleteManual}
						className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-secondary"
					>
						<Check className="w-5 h-5" /> Registrar manual
					</button>
					<button
						type="button"
						disabled={!prescriptionComplete}
						onClick={handleCompleteMeasured}
						className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary disabled:opacity-50"
					>
						<Check className="w-5 h-5" />
						{prescriptionComplete
							? "Completar medido"
							: `Faltan ${requiredRepetitions - completedRepetitions}`}
					</button>
				</div>
			</footer>
		</div>
	);
}
