import assert from "node:assert/strict";
import test from "node:test";
import {
	createPitchContinuityState,
	stabilizePitchFrequency,
} from "../src/audio/pitch/pitchContinuity.ts";

test("corrects an obvious octave error toward the target on the first frame", () => {
	const state = createPitchContinuityState();
	const stabilized = stabilizePitchFrequency(110, 220, state);
	assert.ok(Math.abs(stabilized - 220) < 0.01);
});

test("prefers temporal continuity after the voice is established", () => {
	const state = createPitchContinuityState();
	stabilizePitchFrequency(220, 220, state);
	stabilizePitchFrequency(221, 220, state);
	const stabilized = stabilizePitchFrequency(110.5, 220, state);
	assert.ok(stabilized > 200);
});

test("does not force a nearby wrong note onto the target", () => {
	const state = createPitchContinuityState();
	const stabilized = stabilizePitchFrequency(196, 220, state);
	assert.ok(Math.abs(stabilized - 196) < 0.01);
});
