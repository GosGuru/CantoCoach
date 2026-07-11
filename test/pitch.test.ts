import assert from "node:assert/strict";
import test from "node:test";
import {
	centsBetween,
	frequencyToNearestNote,
	midiToFrequency,
} from "../src/audio/pitch/pitchMath.ts";
import { detectPitchYin } from "../src/audio/pitch/yin.ts";

function sineWave(
	frequencyHz: number,
	sampleRate = 48_000,
	length = 4096,
	amplitude = 0.5,
): Float32Array {
	const buffer = new Float32Array(length);
	for (let index = 0; index < length; index += 1) {
		buffer[index] = amplitude * Math.sin((2 * Math.PI * frequencyHz * index) / sampleRate);
	}
	return buffer;
}

test("converts A4 between MIDI and frequency", () => {
	assert.equal(midiToFrequency(69), 440);
	assert.ok(Math.abs(centsBetween(440, 440)) < 0.000_001);
	assert.equal(frequencyToNearestNote(440).noteName, "A4");
});

test("reports approximately 100 cents for one semitone", () => {
	const aSharp4 = midiToFrequency(70);
	assert.ok(Math.abs(centsBetween(aSharp4, 440) - 100) < 0.000_001);
});

test("detects a clean A4 synthetic signal", () => {
	const detection = detectPitchYin(sineWave(440), 48_000);
	assert.ok(detection, "Expected a pitch detection");
	assert.ok(Math.abs(detection.frequencyHz - 440) < 1);
	assert.ok(detection.confidence > 0.9);
});

test("detects a baritone-range G3 synthetic signal", () => {
	const detection = detectPitchYin(sineWave(196), 48_000);
	assert.ok(detection, "Expected a pitch detection");
	assert.ok(Math.abs(detection.frequencyHz - 196) < 1);
});

test("rejects silence", () => {
	const detection = detectPitchYin(new Float32Array(4096), 48_000);
	assert.equal(detection, null);
});

test("rejects a signal below the configured level", () => {
	const detection = detectPitchYin(sineWave(220, 48_000, 4096, 0.000_1), 48_000);
	assert.equal(detection, null);
});
