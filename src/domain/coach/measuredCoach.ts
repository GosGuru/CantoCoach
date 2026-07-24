import type { ExerciseAttemptRecord } from "../../types/attempt.ts";
import type { DailyRoutine, SessionRecord } from "../../types/vocalgym.ts";

export type CoachStage = "listen" | "correct" | "advance" | "complete";

export interface MeasuredCoachSnapshot {
	stage: CoachStage;
	completedExercises: number;
	totalExercises: number;
	completionPercent: number;
	nextExerciseId: string | null;
	latestAttempt: ExerciseAttemptRecord | null;
	todayAttemptCount: number;
	evaluableAttemptCount: number;
	bestPitchErrorCents: number | null;
	averageConfidence: number | null;
	primaryAction: string;
	nextTarget: string;
	adaptationReason: string;
	lastSessionDate: string | null;
}

interface MeasuredCoachInput {
	routine: DailyRoutine | null;
	completedIds: string[];
	attempts: ExerciseAttemptRecord[];
	sessions: SessionRecord[];
	today: string;
}

function newestFirst<T extends { createdAt: string }>(items: T[]): T[] {
	return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function average(values: number[]): number | null {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function bestPitchError(attempts: ExerciseAttemptRecord[]): number | null {
	const values = attempts
		.map((attempt) => attempt.metrics.medianAbsolutePitchErrorCents)
		.filter((value): value is number => value !== null);
	return values.length > 0 ? Math.min(...values) : null;
}

export function deriveMeasuredCoachSnapshot({
	routine,
	completedIds,
	attempts,
	sessions,
	today,
}: MeasuredCoachInput): MeasuredCoachSnapshot {
	const routineIds = routine?.exercises ?? [];
	const completedExercises = routineIds.filter((id) => completedIds.includes(id)).length;
	const totalExercises = routineIds.length;
	const completionPercent =
		totalExercises === 0 ? 0 : Math.round((completedExercises / totalExercises) * 100);
	const nextExerciseId = routineIds.find((id) => !completedIds.includes(id)) ?? null;
	const todayAttempts = newestFirst(attempts.filter((attempt) => attempt.localDate === today));
	const latestAttempt = todayAttempts[0] ?? newestFirst(attempts)[0] ?? null;
	const evaluableToday = todayAttempts.filter((attempt) => attempt.metrics.evaluable);
	const allComplete = totalExercises > 0 && completedExercises >= totalExercises;

	let stage: CoachStage = "listen";
	let primaryAction = "Escuchá la referencia completa antes de cantar.";
	let nextTarget = "Repetir el patrón con una emisión cómoda y sin competir con el volumen del piano.";

	if (allComplete) {
		stage = "complete";
		primaryAction = "Cerrá la sesión con el reporte diario para que la próxima rutina se adapte.";
		nextTarget = "Registrar sensaciones y conservar el mejor resultado técnico de hoy.";
	} else if (latestAttempt && latestAttempt.localDate === today) {
		if (!latestAttempt.metrics.evaluable || latestAttempt.feedback.focus !== "success") {
			stage = "correct";
			primaryAction = latestAttempt.feedback.action;
			nextTarget = latestAttempt.feedback.nextTarget;
		} else {
			stage = "advance";
			primaryAction = latestAttempt.feedback.action;
			nextTarget = latestAttempt.feedback.nextTarget;
		}
	}

	const recurringTechnicalFocus = newestFirst(attempts)
		.slice(0, 6)
		.map((attempt) => attempt.feedback)
		.find((feedback) => feedback.focus !== "success");

	const adaptationReason = recurringTechnicalFocus
		? `La prioridad medida más reciente es ${recurringTechnicalFocus.observation.toLowerCase()} ${recurringTechnicalFocus.action}`
		: routine?.adaptationReason ??
			"Todavía no hay suficiente evidencia acústica; la app mantiene una carga conservadora hasta medir varios intentos.";

	const lastSessionDate = [...sessions]
		.sort((left, right) => right.date.localeCompare(left.date))[0]?.date ?? null;

	return {
		stage,
		completedExercises,
		totalExercises,
		completionPercent,
		nextExerciseId,
		latestAttempt,
		todayAttemptCount: todayAttempts.length,
		evaluableAttemptCount: evaluableToday.length,
		bestPitchErrorCents: bestPitchError(evaluableToday),
		averageConfidence: average(
			evaluableToday.map((attempt) => attempt.metrics.measurementConfidence),
		),
		primaryAction,
		nextTarget,
		adaptationReason,
		lastSessionDate,
	};
}
