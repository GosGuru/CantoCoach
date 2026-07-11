import type { ExerciseAttemptRecord } from "../../types/attempt.ts";
import type { Exercise, VoiceBlock } from "../../types/vocal.ts";

export type ProgressionState =
	| "no-evidence"
	| "building"
	| "hold"
	| "ready";

export interface ProgressionGateResult {
	state: ProgressionState;
	evaluableAttempts: number;
	requiredAttempts: number;
	passedCriteria: number;
	totalCriteria: number;
	reasons: string[];
	summary: string;
}

interface Criteria {
	maxPitchErrorCents: number;
	maxStabilityCents: number;
	maxStabilizationMs?: number;
	maxPhraseEndDriftCents?: number;
	minConfidence: number;
	minVoicedRatio: number;
	maxClippedFrameRatio: number;
	requiredAttempts: number;
}

const BLOCK_CRITERIA: Record<VoiceBlock, Criteria> = {
	Warmup: {
		maxPitchErrorCents: 35,
		maxStabilityCents: 25,
		minConfidence: 0.55,
		minVoicedRatio: 0.55,
		maxClippedFrameRatio: 0.08,
		requiredAttempts: 3,
	},
	Closure: {
		maxPitchErrorCents: 25,
		maxStabilityCents: 20,
		maxStabilizationMs: 300,
		minConfidence: 0.62,
		minVoicedRatio: 0.65,
		maxClippedFrameRatio: 0.06,
		requiredAttempts: 4,
	},
	Resonancia: {
		maxPitchErrorCents: 25,
		maxStabilityCents: 18,
		minConfidence: 0.62,
		minVoicedRatio: 0.65,
		maxClippedFrameRatio: 0.06,
		requiredAttempts: 4,
	},
	Passaggio: {
		maxPitchErrorCents: 32,
		maxStabilityCents: 24,
		minConfidence: 0.58,
		minVoicedRatio: 0.55,
		maxClippedFrameRatio: 0.08,
		requiredAttempts: 3,
	},
	Repertorio: {
		maxPitchErrorCents: 28,
		maxStabilityCents: 24,
		maxPhraseEndDriftCents: 22,
		minConfidence: 0.58,
		minVoicedRatio: 0.6,
		maxClippedFrameRatio: 0.08,
		requiredAttempts: 3,
	},
};

function isCaptureValid(attempt: ExerciseAttemptRecord, criteria: Criteria): boolean {
	return (
		attempt.completionMode === "measured" &&
		attempt.metrics.evaluable &&
		attempt.metrics.measurementConfidence >= criteria.minConfidence &&
		attempt.metrics.voicedFrameRatio >= criteria.minVoicedRatio &&
		attempt.captureQuality.clippedFrameRatio <= criteria.maxClippedFrameRatio
	);
}

function average(values: number[]): number | null {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function finite(values: Array<number | null>): number[] {
	return values.filter((value): value is number => value !== null && Number.isFinite(value));
}

export function evaluateExerciseProgression(
	exercise: Exercise,
	attempts: ExerciseAttemptRecord[],
): ProgressionGateResult {
	const criteria = BLOCK_CRITERIA[exercise.block];
	const valid = attempts
		.filter((attempt) => attempt.exerciseId === exercise.id)
		.filter((attempt) => isCaptureValid(attempt, criteria))
		.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
		.slice(0, criteria.requiredAttempts);

	if (valid.length === 0) {
		return {
			state: "no-evidence",
			evaluableAttempts: 0,
			requiredAttempts: criteria.requiredAttempts,
			passedCriteria: 0,
			totalCriteria: 2,
			reasons: ["Todavía no hay intentos medidos con calidad suficiente."],
			summary: "Necesitás evidencia técnica antes de avanzar.",
		};
	}

	if (valid.length < criteria.requiredAttempts) {
		return {
			state: "building",
			evaluableAttempts: valid.length,
			requiredAttempts: criteria.requiredAttempts,
			passedCriteria: 0,
			totalCriteria: 2,
			reasons: [
				`Hay ${valid.length} intento${valid.length === 1 ? "" : "s"} válido${valid.length === 1 ? "" : "s"}; se requieren ${criteria.requiredAttempts}.`,
			],
			summary: "La evidencia todavía no es suficiente para decidir progresión.",
		};
	}

	const pitchError = average(
		finite(valid.map((attempt) => attempt.metrics.medianAbsolutePitchErrorCents)),
	);
	const stability = average(
		finite(valid.map((attempt) => attempt.metrics.pitchStabilityMadCents)),
	);
	const stabilization = average(
		finite(valid.map((attempt) => attempt.metrics.stabilizationTimeMs)),
	);
	const phraseEnd = average(
		finite(valid.map((attempt) => attempt.metrics.phraseEndDriftCents)).map(Math.abs),
	);

	const checks: Array<{ passed: boolean; reason: string }> = [
		{
			passed: pitchError !== null && pitchError <= criteria.maxPitchErrorCents,
			reason: `Afinación media ${Math.round(pitchError ?? 0)} cents; objetivo ≤ ${criteria.maxPitchErrorCents}.`,
		},
		{
			passed: stability !== null && stability <= criteria.maxStabilityCents,
			reason: `Estabilidad media ${Math.round(stability ?? 0)} cents; objetivo ≤ ${criteria.maxStabilityCents}.`,
		},
	];

	if (criteria.maxStabilizationMs !== undefined) {
		checks.push({
			passed:
				stabilization !== null && stabilization <= criteria.maxStabilizationMs,
			reason: `Estabilización media ${Math.round(stabilization ?? 0)} ms; objetivo ≤ ${criteria.maxStabilizationMs}.`,
		});
	}

	if (criteria.maxPhraseEndDriftCents !== undefined) {
		checks.push({
			passed: phraseEnd !== null && phraseEnd <= criteria.maxPhraseEndDriftCents,
			reason: `Deriva final media ${Math.round(phraseEnd ?? 0)} cents; objetivo ≤ ${criteria.maxPhraseEndDriftCents}.`,
		});
	}

	const passedCriteria = checks.filter((check) => check.passed).length;
	const ready = passedCriteria === checks.length;

	return {
		state: ready ? "ready" : "hold",
		evaluableAttempts: valid.length,
		requiredAttempts: criteria.requiredAttempts,
		passedCriteria,
		totalCriteria: checks.length,
		reasons: checks.map((check) => `${check.passed ? "✓" : "•"} ${check.reason}`),
		summary: ready
			? "La evidencia reciente cumple los criterios para subir de dificultad."
			: "Mantenemos el nivel hasta conseguir resultados más consistentes.",
	};
}
