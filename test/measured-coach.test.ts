import assert from "node:assert/strict";
import test from "node:test";
import { deriveMeasuredCoachSnapshot } from "../src/domain/coach/measuredCoach.ts";
import type { ExerciseAttemptRecord } from "../src/types/attempt.ts";
import type { DailyRoutine } from "../src/types/vocalgym.ts";

const routine: DailyRoutine = {
	date: "2026-07-24",
	exercises: ["first", "second"],
	totalMinutes: 10,
	focus: "Prueba",
	adaptationReason: "Rutina base",
};

function attempt(overrides: Partial<ExerciseAttemptRecord> = {}): ExerciseAttemptRecord {
	return {
		id: "attempt-1",
		version: 1,
		practiceSessionId: "session-1",
		exerciseId: "first",
		localDate: "2026-07-24",
		createdAt: "2026-07-24T20:00:00.000Z",
		durationMs: 6000,
		target: { frequencyHz: 220, noteName: "A3" },
		observations: [],
		metrics: {
			evaluable: true,
			measurementConfidence: 0.8,
			voicedFrameRatio: 0.75,
			initialErrorCents: 10,
			onsetDirection: "direct",
			stabilizationTimeMs: 150,
			medianAbsolutePitchErrorCents: 14,
			pitchStabilityMadCents: 9,
			phraseEndDriftCents: 5,
		},
		feedback: {
			focus: "success",
			observation: "El intento fue estable.",
			evidence: "Datos suficientes.",
			action: "Repetí una vez más sin aumentar volumen.",
			nextTarget: "Confirmar el resultado.",
		},
		captureQuality: {
			noiseFloorRms: 0.01,
			clippedFrameRatio: 0,
			sampleRate: 48000,
			analysisIntervalMs: 40,
		},
		completionMode: "measured",
		...overrides,
	};
}

test("guía a escuchar cuando todavía no hay intentos", () => {
	const result = deriveMeasuredCoachSnapshot({
		routine,
		completedIds: [],
		attempts: [],
		sessions: [],
		today: "2026-07-24",
	});
	assert.equal(result.stage, "listen");
	assert.equal(result.nextExerciseId, "first");
});

test("prioriza una corrección técnica después de un intento fallido", () => {
	const failed = attempt({
		metrics: {
			...attempt().metrics,
			evaluable: false,
			reason: "pitch-unavailable",
		},
		feedback: {
			focus: "capture",
			observation: "Escuché tu voz, pero faltó una nota estable.",
			evidence: "Pitch insuficiente.",
			action: "Cantá una vocal clara a volumen medio.",
			nextTarget: "Lograr altura estable.",
		},
	});
	const result = deriveMeasuredCoachSnapshot({
		routine,
		completedIds: [],
		attempts: [failed],
		sessions: [],
		today: "2026-07-24",
	});
	assert.equal(result.stage, "correct");
	assert.equal(result.primaryAction, "Cantá una vocal clara a volumen medio.");
});

test("pide confirmar un intento exitoso antes de avanzar", () => {
	const result = deriveMeasuredCoachSnapshot({
		routine,
		completedIds: ["first"],
		attempts: [attempt()],
		sessions: [],
		today: "2026-07-24",
	});
	assert.equal(result.stage, "advance");
	assert.equal(result.nextExerciseId, "second");
	assert.equal(result.bestPitchErrorCents, 14);
});

test("muestra cierre y resumen cuando la rutina está completa", () => {
	const result = deriveMeasuredCoachSnapshot({
		routine,
		completedIds: ["first", "second"],
		attempts: [attempt()],
		sessions: [],
		today: "2026-07-24",
	});
	assert.equal(result.stage, "complete");
	assert.equal(result.completionPercent, 100);
	assert.equal(result.evaluableAttemptCount, 1);
	assert.equal(result.averageConfidence, 0.8);
});
