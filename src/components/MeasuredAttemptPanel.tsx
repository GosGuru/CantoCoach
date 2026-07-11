import { useEffect, useMemo, useRef, useState } from "react";
import {
	AlertTriangle,
	BarChart3,
	CheckCircle2,
	Clock3,
	Headphones,
	Mic2,
	Play,
	RefreshCw,
	Square,
	Target,
} from "lucide-react";
import { compareAttempts } from "../domain/attempts/compareAttempts.ts";
import {
	prescriptionPosition,
	totalPrescriptionRepetitions,
	type ExercisePrescription,
} from "../domain/practice/prescription.ts";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useMeasuredAttempt } from "../hooks/useMeasuredAttempt.ts";
import type { AttemptTarget, ExerciseAttemptRecord } from "../types/attempt.ts";
import type { Exercise } from "../types/vocal";

interface MeasuredAttemptPanelProps {
	exercise: Exercise;
	practiceSessionId: string;
	prescription: ExercisePrescription;
	completedRepetitions: number;
	referencePlaying: boolean;
	onPlayTarget: (target: AttemptTarget) => Promise<void>;
	onAttemptRecorded: (attempt: ExerciseAttemptRecord) => void;
}

const ATTEMPTS_STORAGE_KEY = "vocalgym-attempts-v1";
const POST_REFERENCE_SILENCE_MS = 450;
const DURATION_OPTIONS_MS = [4000, 6000, 8000] as const;

function uniqueTargets(exercise: Exercise): AttemptTarget[] {
	const targets = new Map<string, AttemptTarget>();
	exercise.scalePattern.frequencies.forEach((frequencyHz, index) => {
		const noteName =
			exercise.scalePattern.noteNames?.[index] ?? `${frequencyHz.toFixed(1)} Hz`;
		const key = frequencyHz.toFixed(2);
		if (!targets.has(key)) targets.set(key, { frequencyHz, noteName });
	});
	return [...targets.values()];
}

function formatSigned(value: number | null, unit: string): string {
	if (value === null) return "—";
	const rounded = Math.round(value);
	return `${rounded > 0 ? "+" : ""}${rounded} ${unit}`;
}

function formatMetric(value: number | null, unit: string): string {
	return value === null ? "—" : `${Math.round(value)} ${unit}`;
}

function isActiveStatus(status: ReturnType<typeof useMeasuredAttempt>["status"]): boolean {
	return ["requesting", "calibrating", "countdown", "recording", "analyzing"].includes(
		status,
	);
}

function delay(milliseconds: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function MeasuredAttemptPanel({
	exercise,
	practiceSessionId,
	prescription,
	completedRepetitions,
	referencePlaying,
	onPlayTarget,
	onAttemptRecorded,
}: MeasuredAttemptPanelProps) {
	const targets = useMemo(() => uniqueTargets(exercise), [exercise]);
	const [selectedIndex, setSelectedIndex] = useState(() =>
		Math.floor(Math.max(0, targets.length - 1) / 2),
	);
	const initialDuration = Math.max(6000, prescription.noteDurationMs);
	const [captureDurationMs, setCaptureDurationMs] = useState(initialDuration);
	const [guidedStarting, setGuidedStarting] = useState(false);
	const [attempts, setAttempts] = useLocalStorage<ExerciseAttemptRecord[]>(
		ATTEMPTS_STORAGE_KEY,
		[],
	);
	const reportedResultIds = useRef(new Set<string>());
	const guidedTokenRef = useRef(0);
	const {
		status,
		countdown,
		progress,
		hasVoiceStarted,
		reading,
		result,
		errorMessage,
		isSupported,
		start,
		cancel,
		reset,
	} = useMeasuredAttempt(exercise.id, practiceSessionId, captureDurationMs);

	const target = targets[selectedIndex] ?? targets[0];
	const active = isActiveStatus(status) || guidedStarting;
	const position = prescriptionPosition(completedRepetitions, prescription);
	const totalRepetitions = totalPrescriptionRepetitions(prescription);

	const previousAttempt = useMemo(() => {
		if (!target) return null;
		return (
			[...attempts]
				.filter(
					(attempt) =>
						attempt.exerciseId === exercise.id &&
						Math.abs(attempt.target.frequencyHz - target.frequencyHz) <= 0.5,
				)
				.sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
		);
	}, [attempts, exercise.id, target]);

	const comparison = useMemo(() => {
		if (!result) return null;
		const previous = result.previousAttemptId
			? attempts.find((attempt) => attempt.id === result.previousAttemptId) ?? null
			: previousAttempt;
		return compareAttempts(result, previous);
	}, [attempts, previousAttempt, result]);

	useEffect(() => {
		if (!result || reportedResultIds.current.has(result.id)) return;
		reportedResultIds.current.add(result.id);
		setAttempts((current) =>
			current.some((attempt) => attempt.id === result.id)
				? current
				: [...current, result],
		);
		onAttemptRecorded(result);
	}, [onAttemptRecorded, result, setAttempts]);

	useEffect(() => {
		if (referencePlaying && isActiveStatus(status)) cancel();
	}, [cancel, referencePlaying, status]);

	useEffect(() => {
		guidedTokenRef.current += 1;
		reset();
		setGuidedStarting(false);
		setSelectedIndex(Math.floor(Math.max(0, targets.length - 1) / 2));
		setCaptureDurationMs(Math.max(6000, prescription.noteDurationMs));
	}, [exercise.id, prescription.noteDurationMs, reset, targets.length]);

	useEffect(
		() => () => {
			guidedTokenRef.current += 1;
		},
		[],
	);

	if (!target) {
		return (
			<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border">
				<p className="text-sm text-text-muted">
					Este ejercicio no contiene notas medibles.
				</p>
			</section>
		);
	}

	const startAttempt = (previousAttemptId = previousAttempt?.id) => {
		void start({ target, previousAttemptId });
	};

	const startGuidedAttempt = async (
		previousAttemptId = previousAttempt?.id,
	): Promise<void> => {
		const token = guidedTokenRef.current + 1;
		guidedTokenRef.current = token;
		reset();
		setGuidedStarting(true);
		try {
			await onPlayTarget(target);
			if (guidedTokenRef.current !== token) return;
			await delay(POST_REFERENCE_SILENCE_MS);
			if (guidedTokenRef.current !== token) return;
			await start({ target, previousAttemptId });
		} finally {
			if (guidedTokenRef.current === token) setGuidedStarting(false);
		}
	};

	const cancelEverything = () => {
		guidedTokenRef.current += 1;
		setGuidedStarting(false);
		cancel();
	};

	const retryAttempt = () => {
		void startGuidedAttempt(result?.id);
	};
	const prescriptionProgress = Math.min(
		100,
		Math.round((completedRepetitions / totalRepetitions) * 100),
	);

	return (
		<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border">
			<header className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-xl bg-emerald/15 flex items-center justify-center shrink-0">
					<Target className="w-5 h-5 text-emerald" aria-hidden="true" />
				</div>
				<div className="min-w-0 flex-1">
					<h2 className="section-title">Práctica prescrita</h2>
					<p className="text-sm text-text-muted mt-1 leading-relaxed">
						{prescription.sets} series × {prescription.repetitionsPerSet} repeticiones.
						El tiempo comienza cuando la app detecta que realmente empezaste a cantar.
					</p>
				</div>
			</header>

			<div className="mt-4 rounded-xl border border-border bg-surface/60 p-4">
				<div className="flex items-center justify-between gap-3 text-sm">
					<span className="font-medium text-text">
						{position.complete
							? "Prescripción completada"
							: `Serie ${position.set}/${prescription.sets} · Repetición ${position.repetition}/${prescription.repetitionsPerSet}`}
					</span>
					<span className="text-text-muted">
						{completedRepetitions}/{totalRepetitions}
					</span>
				</div>
				<div className="mt-3 h-2 rounded-full bg-canvas border border-border overflow-hidden">
					<div
						className="h-full bg-gradient-to-r from-accent to-emerald transition-[width]"
						style={{ width: `${prescriptionProgress}%` }}
					/>
				</div>
			</div>

			<div className="mt-5 grid gap-4 sm:grid-cols-2">
				<div>
					<p className="text-xs uppercase tracking-wider text-text-subtle mb-2">
						Nota objetivo
					</p>
					<div className="flex flex-wrap gap-2">
						{targets.map((item, index) => (
							<button
								key={`${item.frequencyHz}-${item.noteName}`}
								type="button"
								disabled={active || position.complete}
								onClick={() => {
									reset();
									setSelectedIndex(index);
								}}
								className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
									index === selectedIndex
										? "border-accent bg-accent/10 text-text"
										: "border-border bg-surface text-text-muted hover:text-text"
								}`}
							>
								{item.noteName}
							</button>
						))}
					</div>
				</div>

				<div>
					<p className="text-xs uppercase tracking-wider text-text-subtle mb-2 flex items-center gap-1.5">
						<Clock3 className="w-3.5 h-3.5" aria-hidden="true" />
						Duración después de detectar tu voz
					</p>
					<div className="flex flex-wrap gap-2">
						{DURATION_OPTIONS_MS.map((milliseconds) => (
							<button
								key={milliseconds}
								type="button"
								disabled={active || position.complete}
								onClick={() => {
									reset();
									setCaptureDurationMs(milliseconds);
								}}
								className={`px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50 ${
									captureDurationMs === milliseconds
										? "border-emerald bg-emerald/10 text-text"
										: "border-border bg-surface text-text-muted hover:text-text"
								}`}
							>
								{milliseconds / 1000} s
							</button>
						))}
					</div>
				</div>
			</div>

			<div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
				<button
					type="button"
					disabled={active || referencePlaying || position.complete}
					onClick={() => void onPlayTarget(target)}
					className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-secondary disabled:opacity-50"
				>
					<Play className="w-4 h-4" aria-hidden="true" />
					Solo escuchar
				</button>
				<button
					type="button"
					disabled={!isSupported || referencePlaying || active || position.complete}
					onClick={() => void startGuidedAttempt()}
					className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary disabled:opacity-50"
				>
					<Headphones className="w-4 h-4" aria-hidden="true" />
					{guidedStarting ? "Cargando piano…" : "Escuchar y grabar"}
				</button>
				<button
					type="button"
					disabled={
					status === "analyzing" ||
					position.complete ||
					(!active && (!isSupported || referencePlaying))
				}
					onClick={active ? cancelEverything : () => startAttempt()}
					className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium disabled:opacity-50 ${
						active
							? "border border-rose/40 bg-rose/10 text-rose"
							: "btn-secondary"
					}`}
				>
					{active ? (
						<>
							<Square className="w-4 h-4" aria-hidden="true" />
							Cancelar
						</>
					) : (
						<>
							<Mic2 className="w-4 h-4" aria-hidden="true" />
							Solo grabar
						</>
					)}
				</button>
			</div>

			{!isSupported && (
				<p className="mt-4 text-sm text-rose">
					El navegador no ofrece una captura compatible.
				</p>
			)}
			{errorMessage && <p className="mt-4 text-sm text-rose">{errorMessage}</p>}

			<div className="mt-5 rounded-xl border border-border bg-surface/60 min-h-40 flex items-center justify-center p-5">
				{status === "idle" && !guidedStarting && (
					<div className="text-center">
						<Headphones className="w-7 h-7 text-text-subtle mx-auto" aria-hidden="true" />
						<p className="text-sm text-text-muted mt-2">
							Usá auriculares. La app espera hasta 3,5 segundos a que empieces a cantar.
						</p>
					</div>
				)}
				{guidedStarting && (
					<p className="text-sm text-text-muted">Reproduciendo la referencia completa…</p>
				)}
				{status === "requesting" && (
					<p className="text-sm text-text-muted">Solicitando el micrófono…</p>
				)}
				{status === "calibrating" && (
					<div className="text-center">
						<BarChart3 className="w-7 h-7 text-sky mx-auto animate-pulse" aria-hidden="true" />
						<p className="text-sm font-semibold text-text mt-2">Calibrando el ambiente</p>
						<p className="text-xs text-text-muted mt-1">Mantené silencio un instante.</p>
					</div>
				)}
				{status === "countdown" && (
					<div className="text-center">
						<p className="text-6xl font-bold font-display text-accent">{countdown}</p>
						<p className="text-sm text-text-muted mt-2">Prepará {target.noteName}</p>
					</div>
				)}
				{status === "recording" && (
					<div className="w-full text-center">
						<p className="text-xs uppercase tracking-wider text-rose font-semibold">
							{hasVoiceStarted ? "Capturando tu voz" : "Micrófono listo"}
						</p>
						{reading ? (
							<>
								<p className="text-4xl font-bold font-display text-text mt-2">
									{reading.noteName}
								</p>
								<p className="text-sm text-text-muted mt-1">
									{reading.frequencyHz.toFixed(1)} Hz · confianza{" "}
									{Math.round(reading.confidence * 100)}%
								</p>
							</>
						) : (
							<p className="text-sm text-text-muted mt-4">
								{hasVoiceStarted
									? "Seguimos grabando aunque haya un pequeño corte."
									: "Empezá a cantar cuando estés cómodo; el tiempo todavía no corre."}
							</p>
						)}
						<div className="mt-5 h-2 bg-canvas rounded-full overflow-hidden border border-border">
							<div
								className="h-full bg-gradient-to-r from-accent to-emerald transition-[width] duration-75"
								style={{ width: `${Math.round(progress * 100)}%` }}
							/>
						</div>
					</div>
				)}
				{status === "analyzing" && (
					<p className="text-sm text-text-muted">
						Calculando ataque, afinación y estabilidad…
					</p>
				)}
				{status === "error" && (
					<div className="text-center">
						<AlertTriangle className="w-7 h-7 text-rose mx-auto" aria-hidden="true" />
						<p className="text-sm text-rose mt-2">No se pudo completar el intento.</p>
					</div>
				)}
				{status === "complete" && result && (
					<div className="w-full">
						<div className="flex items-center gap-2">
							<CheckCircle2
								className={`w-5 h-5 ${
									result.metrics.evaluable ? "text-emerald" : "text-gold"
								}`}
								aria-hidden="true"
							/>
							<p className="font-semibold text-text">{result.feedback.observation}</p>
						</div>
						<p className="text-sm text-text-muted mt-2 leading-relaxed">
							{result.feedback.evidence}
						</p>
						<div className="mt-4 rounded-xl border border-accent/25 bg-accent/8 p-4">
							<p className="text-xs uppercase tracking-wider text-accent font-semibold">
								Próxima acción
							</p>
							<p className="text-sm text-text mt-1">{result.feedback.action}</p>
							<p className="text-xs text-text-muted mt-2">
								Objetivo: {result.feedback.nextTarget}
							</p>
						</div>
					</div>
				)}
			</div>

			{result && (
				<>
					<div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
						<div className="rounded-lg bg-surface border border-border p-3">
							<p className="text-[10px] uppercase text-text-subtle">Entrada</p>
							<p className="text-sm font-semibold mt-1">
								{formatSigned(result.metrics.initialErrorCents, "cents")}
							</p>
						</div>
						<div className="rounded-lg bg-surface border border-border p-3">
							<p className="text-[10px] uppercase text-text-subtle">Estabilización</p>
							<p className="text-sm font-semibold mt-1">
								{formatMetric(result.metrics.stabilizationTimeMs, "ms")}
							</p>
						</div>
						<div className="rounded-lg bg-surface border border-border p-3">
							<p className="text-[10px] uppercase text-text-subtle">Error central</p>
							<p className="text-sm font-semibold mt-1">
								{formatMetric(
									result.metrics.medianAbsolutePitchErrorCents,
									"cents",
								)}
							</p>
						</div>
						<div className="rounded-lg bg-surface border border-border p-3">
							<p className="text-[10px] uppercase text-text-subtle">Estabilidad</p>
							<p className="text-sm font-semibold mt-1">
								{formatMetric(result.metrics.pitchStabilityMadCents, "cents")}
							</p>
						</div>
					</div>

					{comparison && (
						<div
							className={`mt-4 rounded-xl border p-4 ${
								comparison.improvedMetricCount > comparison.regressedMetricCount
									? "border-emerald/30 bg-emerald/8"
									: "border-border bg-surface/60"
							}`}
						>
							<p className="text-sm font-semibold text-text">{comparison.summary}</p>
							<div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-muted">
								<span>
									Afinación: {formatSigned(comparison.pitchErrorDeltaCents, "cents")}
								</span>
								<span>
									Entrada: {formatSigned(comparison.stabilizationDeltaMs, "ms")}
								</span>
								<span>
									Estabilidad: {formatSigned(comparison.stabilityDeltaCents, "cents")}
								</span>
							</div>
						</div>
					)}

					{!position.complete && (
						<button
							type="button"
							onClick={retryAttempt}
							className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary"
						>
							<RefreshCw className="w-4 h-4" aria-hidden="true" />
							Siguiente repetición con la corrección
						</button>
					)}
				</>
			)}

			<p className="mt-4 text-xs text-text-subtle">
				Solo los intentos evaluables avanzan la prescripción. La app mide señal
				acústica; no determina apoyo, registro ni estado anatómico.
			</p>
		</section>
	);
}
