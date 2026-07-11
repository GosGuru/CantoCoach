import type { ExerciseAttemptRecord } from "../../types/attempt.ts";

export interface AttemptComparison {
	pitchErrorDeltaCents: number | null;
	stabilizationDeltaMs: number | null;
	stabilityDeltaCents: number | null;
	phraseEndDeltaCents: number | null;
	improvedMetricCount: number;
	regressedMetricCount: number;
	summary: string;
}

function lowerIsBetter(
	current: number | null,
	previous: number | null,
): number | null {
	if (current === null || previous === null) return null;
	return current - previous;
}

function absoluteLowerIsBetter(
	current: number | null,
	previous: number | null,
): number | null {
	if (current === null || previous === null) return null;
	return Math.abs(current) - Math.abs(previous);
}

function classification(delta: number | null, tolerance: number): -1 | 0 | 1 {
	if (delta === null || Math.abs(delta) <= tolerance) return 0;
	return delta < 0 ? 1 : -1;
}

export function compareAttempts(
	current: ExerciseAttemptRecord,
	previous: ExerciseAttemptRecord | null,
): AttemptComparison | null {
	if (!previous) return null;
	if (
		current.exerciseId !== previous.exerciseId ||
		Math.abs(current.target.frequencyHz - previous.target.frequencyHz) > 0.5
	) {
		return null;
	}

	const pitchErrorDeltaCents = lowerIsBetter(
		current.metrics.medianAbsolutePitchErrorCents,
		previous.metrics.medianAbsolutePitchErrorCents,
	);
	const stabilizationDeltaMs = lowerIsBetter(
		current.metrics.stabilizationTimeMs,
		previous.metrics.stabilizationTimeMs,
	);
	const stabilityDeltaCents = lowerIsBetter(
		current.metrics.pitchStabilityMadCents,
		previous.metrics.pitchStabilityMadCents,
	);
	const phraseEndDeltaCents = absoluteLowerIsBetter(
		current.metrics.phraseEndDriftCents,
		previous.metrics.phraseEndDriftCents,
	);

	const classifications = [
		classification(pitchErrorDeltaCents, 3),
		classification(stabilizationDeltaMs, 40),
		classification(stabilityDeltaCents, 3),
		classification(phraseEndDeltaCents, 4),
	];
	const improvedMetricCount = classifications.filter((value) => value === 1).length;
	const regressedMetricCount = classifications.filter((value) => value === -1).length;

	let summary = "El resultado fue similar al intento anterior.";
	if (improvedMetricCount > regressedMetricCount) {
		summary = `Mejoraste ${improvedMetricCount} métrica${improvedMetricCount === 1 ? "" : "s"} respecto al intento anterior.`;
	} else if (regressedMetricCount > improvedMetricCount) {
		summary = `El intento perdió precisión en ${regressedMetricCount} métrica${regressedMetricCount === 1 ? "" : "s"}. Repetí sin aumentar volumen.`;
	}

	return {
		pitchErrorDeltaCents,
		stabilizationDeltaMs,
		stabilityDeltaCents,
		phraseEndDeltaCents,
		improvedMetricCount,
		regressedMetricCount,
		summary,
	};
}
