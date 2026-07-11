import assert from "node:assert/strict";
import test from "node:test";
import { compareAttempts } from "../src/domain/attempts/compareAttempts.ts";
import type { ExerciseAttemptRecord } from "../src/types/attempt.ts";

function attempt(
	id: string,
	values: {
		pitch: number;
		stabilization: number;
		stability: number;
		end: number;
	},
): ExerciseAttemptRecord {
	return {
		id,
		version: 1,
		exerciseId: "closure-mum",
		localDate: "2026-07-11",
		createdAt: `2026-07-11T10:00:0${id}.000Z`,
		durationMs: 3200,
		target: { frequencyHz: 220, noteName: "A3" },
		observations: [],
		metrics: {
			evaluable: true,
			measurementConfidence: 0.9,
			voicedFrameRatio: 0.95,
			initialErrorCents: 10,
			onsetDirection: "direct",
			stabilizationTimeMs: values.stabilization,
			medianAbsolutePitchErrorCents: values.pitch,
			pitchStabilityMadCents: values.stability,
			phraseEndDriftCents: values.end,
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
			clippedFrameRatio: 0,
			sampleRate: 48_000,
			analysisIntervalMs: 45,
		},
		completionMode: "measured",
	};
}

test("reports improvement when retry metrics decrease", () => {
	const previous = attempt("1", {
		pitch: 35,
		stabilization: 420,
		stability: 22,
		end: -30,
	});
	const current = attempt("2", {
		pitch: 18,
		stabilization: 220,
		stability: 11,
		end: -10,
	});
	const comparison = compareAttempts(current, previous);

	assert.ok(comparison);
	assert.equal(comparison.improvedMetricCount, 4);
	assert.equal(comparison.regressedMetricCount, 0);
	assert.match(comparison.summary, /Mejoraste/);
});

test("does not compare different targets", () => {
	const previous = attempt("1", {
		pitch: 35,
		stabilization: 420,
		stability: 22,
		end: -30,
	});
	const current = {
		...attempt("2", {
			pitch: 18,
			stabilization: 220,
			stability: 11,
			end: -10,
		}),
		target: { frequencyHz: 247, noteName: "B3" },
	};

	assert.equal(compareAttempts(current, previous), null);
});
