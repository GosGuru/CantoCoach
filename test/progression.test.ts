import assert from "node:assert/strict";
import test from "node:test";
import { evaluateExerciseProgression } from "../src/domain/progression/evaluateExerciseProgression.ts";
import type { ExerciseAttemptRecord } from "../src/types/attempt.ts";
import type { Exercise } from "../src/types/vocal.ts";

const EXERCISE: Exercise = {
	id: "closure-mum",
	name: "Ataques mum",
	block: "Closure",
	instructions: ["Ataque directo."],
	autochecks: ["Sin molestia"],
	scalePattern: {
		type: "sustained",
		defaultBpm: 72,
		frequencies: [220],
		noteNames: ["A3"],
	},
	durationMinutes: 5,
};

function attempt(
	id: string,
	values: {
		pitch?: number;
		stability?: number;
		stabilization?: number;
		confidence?: number;
		voiced?: number;
		clipped?: number;
		evaluable?: boolean;
	} = {},
): ExerciseAttemptRecord {
	return {
		id,
		version: 1,
		practiceSessionId: "session-1",
		exerciseId: EXERCISE.id,
		localDate: "2026-07-11",
		createdAt: `2026-07-11T10:00:${id.padStart(2, "0")}.000Z`,
		durationMs: 3000,
		target: { frequencyHz: 220, noteName: "A3" },
		observations: [],
		metrics: {
			evaluable: values.evaluable ?? true,
			measurementConfidence: values.confidence ?? 0.9,
			voicedFrameRatio: values.voiced ?? 0.9,
			initialErrorCents: 10,
			onsetDirection: "direct",
			stabilizationTimeMs: values.stabilization ?? 200,
			medianAbsolutePitchErrorCents: values.pitch ?? 18,
			pitchStabilityMadCents: values.stability ?? 12,
			phraseEndDriftCents: 8,
		},
		feedback: {
			focus: "success",
			observation: "ok",
			evidence: "ok",
			action: "repeat",
			nextTarget: "repeat",
		},
		captureQuality: {
			noiseFloorRms: 0.002,
			clippedFrameRatio: values.clipped ?? 0,
			sampleRate: 48_000,
			analysisIntervalMs: 45,
		},
		completionMode: "measured",
	};
}

test("requires enough valid attempts before progression", () => {
	const result = evaluateExerciseProgression(EXERCISE, [attempt("1"), attempt("2")]);
	assert.equal(result.state, "building");
	assert.equal(result.evaluableAttempts, 2);
	assert.equal(result.requiredAttempts, 4);
});

test("allows progression after consistent valid attempts", () => {
	const result = evaluateExerciseProgression(EXERCISE, [
		attempt("1"),
		attempt("2"),
		attempt("3"),
		attempt("4"),
	]);
	assert.equal(result.state, "ready");
	assert.equal(result.passedCriteria, result.totalCriteria);
});

test("holds progression when recent attacks stabilize too slowly", () => {
	const result = evaluateExerciseProgression(EXERCISE, [
		attempt("1", { stabilization: 450 }),
		attempt("2", { stabilization: 430 }),
		attempt("3", { stabilization: 410 }),
		attempt("4", { stabilization: 390 }),
	]);
	assert.equal(result.state, "hold");
	assert.ok(result.passedCriteria < result.totalCriteria);
});

test("rejects low-quality captures as evidence", () => {
	const result = evaluateExerciseProgression(EXERCISE, [
		attempt("1", { clipped: 0.3 }),
		attempt("2", { confidence: 0.3 }),
		attempt("3", { voiced: 0.2 }),
		attempt("4", { evaluable: false }),
	]);
	assert.equal(result.state, "no-evidence");
	assert.equal(result.evaluableAttempts, 0);
});
