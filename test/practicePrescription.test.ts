import assert from "node:assert/strict";
import test from "node:test";
import {
	calculatePrescriptionDurationMs,
	prescriptionPosition,
	resolveExercisePrescription,
	totalPrescriptionRepetitions,
} from "../src/domain/practice/prescription.ts";
import type { Exercise } from "../src/types/vocal.ts";

const CLOSURE_EXERCISE: Exercise = {
	id: "closure-test",
	name: "Ataques mum",
	block: "Closure",
	instructions: ["Atacá sin arrastre."],
	autochecks: ["Sin dolor"],
	scalePattern: {
		type: "sustained",
		defaultBpm: 72,
		frequencies: [220],
		noteNames: ["A3"],
	},
	durationMinutes: 5,
};

test("derives a versioned closure prescription", () => {
	const prescription = resolveExercisePrescription(CLOSURE_EXERCISE);
	assert.equal(prescription.version, 1);
	assert.equal(prescription.sets, 3);
	assert.equal(prescription.repetitionsPerSet, 4);
	assert.equal(prescription.noteDurationMs, 3000);
	assert.equal(totalPrescriptionRepetitions(prescription), 12);
	assert.ok(calculatePrescriptionDurationMs(prescription) > 60_000);
});

test("maps completed repetitions to set and repetition", () => {
	const prescription = resolveExercisePrescription(CLOSURE_EXERCISE);
	assert.deepEqual(prescriptionPosition(0, prescription), {
		set: 1,
		repetition: 1,
		complete: false,
	});
	assert.deepEqual(prescriptionPosition(4, prescription), {
		set: 2,
		repetition: 1,
		complete: false,
	});
	assert.equal(prescriptionPosition(12, prescription).complete, true);
});
