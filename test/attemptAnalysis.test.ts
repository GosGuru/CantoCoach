import assert from "node:assert/strict";
import test from "node:test";
import {
	analyzePitchAttempt,
	type PitchObservation,
} from "../src/audio/analysis/attemptMetrics.ts";
import { buildTechnicalFeedback } from "../src/audio/analysis/technicalFeedback.ts";

const TARGET_HZ = 220;

function frequencyAtCents(cents: number): number {
	return TARGET_HZ * 2 ** (cents / 1200);
}

function observationsFromCents(centsValues: Array<number | null>): PitchObservation[] {
	return centsValues.map((cents, index) => ({
		timestampMs: index * 50,
		frequencyHz: cents === null ? null : frequencyAtCents(cents),
		confidence: cents === null ? 0 : 0.96,
		rms: cents === null ? 0.001 : 0.18,
	}));
}

test("detects an onset arriving from below and its stabilization time", () => {
	const metrics = analyzePitchAttempt(
		observationsFromCents([-80, -50, -20, 0, 3, -2, 4, 1, -1, 2]),
		TARGET_HZ,
	);

	assert.equal(metrics.evaluable, true);
	assert.equal(metrics.onsetDirection, "below");
	assert.ok((metrics.initialErrorCents ?? 0) < -75);
	assert.equal(metrics.stabilizationTimeMs, 100);
	assert.ok((metrics.medianAbsolutePitchErrorCents ?? 999) < 5);
});

test("rejects an attempt with too little voiced material", () => {
	const metrics = analyzePitchAttempt(
		observationsFromCents([null, null, 0, null, null, null, 2, null, null]),
		TARGET_HZ,
	);

	assert.equal(metrics.evaluable, false);
	assert.equal(metrics.reason, "not-enough-voice");
});

test("prioritizes onset before later pitch metrics", () => {
	const metrics = analyzePitchAttempt(
		observationsFromCents([-90, -65, -40, -20, -10, 0, 2, -2, 3, -1]),
		TARGET_HZ,
	);
	const feedback = buildTechnicalFeedback(metrics);

	assert.equal(feedback.focus, "onset");
	assert.match(feedback.nextTarget, /±25 cents/);
});

test("returns success for a repeatably centered attempt", () => {
	const metrics = analyzePitchAttempt(
		observationsFromCents([8, 5, 2, -2, 4, -3, 1, 0, 3, -1, 2, 0]),
		TARGET_HZ,
	);
	const feedback = buildTechnicalFeedback(metrics);

	assert.equal(metrics.evaluable, true);
	assert.equal(feedback.focus, "success");
});
