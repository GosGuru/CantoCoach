import assert from "node:assert/strict";
import test from "node:test";
import {
	buildCalibrationProfile,
	evaluateVoiceActivity,
	smoothNoiseFloor,
} from "../src/audio/input/voiceActivity.ts";

test("uses the lower calibration percentile instead of requiring perfect silence", () => {
	const profile = buildCalibrationProfile([
		0.004,
		0.0042,
		0.0041,
		0.012,
		0.005,
		0.0043,
	]);

	assert.ok(profile.noiseFloorRms < 0.005);
	assert.ok(profile.voiceThresholdRms > profile.noiseFloorRms);
});

test("detects a soft voiced frame backed by pitch confidence", () => {
	const profile = buildCalibrationProfile([0.004, 0.0042, 0.0038, 0.0041]);
	const result = evaluateVoiceActivity(
		{ rms: 0.0052, peak: 0.025, pitchConfidence: 0.56 },
		profile,
	);

	assert.equal(result.active, true);
});

test("does not treat steady room noise as voice", () => {
	const profile = buildCalibrationProfile([0.02, 0.021, 0.019, 0.02]);
	const result = evaluateVoiceActivity(
		{ rms: 0.021, peak: 0.028, pitchConfidence: 0 },
		profile,
	);

	assert.equal(result.active, false);
});

test("adapts the noise floor slowly before voice starts", () => {
	const profile = buildCalibrationProfile([0.004, 0.004, 0.004, 0.004]);
	const adapted = smoothNoiseFloor(profile, 0.0048);

	assert.ok(adapted.noiseFloorRms > profile.noiseFloorRms);
	assert.ok(adapted.noiseFloorRms < 0.0048);
});
