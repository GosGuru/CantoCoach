import assert from "node:assert/strict";
import test from "node:test";
import { analyzePitchAttempt } from "../src/audio/analysis/attemptMetrics.ts";
import { buildTechnicalFeedback } from "../src/audio/analysis/technicalFeedback.ts";

test("reports pitch unavailable when voice energy exists without stable pitch", () => {
	const observations = Array.from({ length: 30 }, (_, index) => ({
		timestampMs: index * 35,
		frequencyHz: null,
		confidence: 0,
		rms: 0.035,
		voiceActive: true,
	}));
	const metrics = analyzePitchAttempt(observations, 220);
	const feedback = buildTechnicalFeedback(metrics);

	assert.equal(metrics.evaluable, false);
	assert.equal(metrics.reason, "pitch-unavailable");
	assert.equal(metrics.voiceActivityRatio, 1);
	assert.match(feedback.observation, /Escuché tu voz/);
});

test("still reports insufficient voice when the microphone remains inactive", () => {
	const observations = Array.from({ length: 30 }, (_, index) => ({
		timestampMs: index * 35,
		frequencyHz: null,
		confidence: 0,
		rms: 0.002,
		voiceActive: false,
	}));
	const metrics = analyzePitchAttempt(observations, 220);

	assert.equal(metrics.reason, "not-enough-voice");
	assert.equal(metrics.voiceActivityRatio, 0);
});
