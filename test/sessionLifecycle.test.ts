import assert from "node:assert/strict";
import test from "node:test";
import {
	createPracticeSession,
	finalizePracticeSession,
	registerSessionAttempt,
} from "../src/domain/practice/sessionLifecycle.ts";
import type { ExercisePrescription } from "../src/domain/practice/prescription.ts";

const PRESCRIPTION: ExercisePrescription = {
	version: 1,
	sets: 2,
	repetitionsPerSet: 3,
	noteDurationMs: 2500,
	restBetweenRepsMs: 4000,
	restBetweenSetsMs: 15000,
	minimumEvaluableAttempts: 3,
};

test("creates a versioned active practice session", () => {
	const session = createPracticeSession(
		"exercise-1",
		PRESCRIPTION,
		new Date("2026-07-11T15:00:00.000Z"),
		"session-1",
	);
	assert.equal(session.id, "session-1");
	assert.equal(session.version, 2);
	assert.equal(session.status, "active");
	assert.equal(session.completedRepetitions, 0);
	assert.deepEqual(session.prescription, PRESCRIPTION);
});

test("only evaluable attempts advance prescribed repetitions", () => {
	const session = createPracticeSession(
		"exercise-1",
		PRESCRIPTION,
		new Date("2026-07-11T15:00:00.000Z"),
		"session-1",
	);
	const failed = registerSessionAttempt(session, "attempt-1", false);
	const valid = registerSessionAttempt(failed, "attempt-2", true);
	const duplicate = registerSessionAttempt(valid, "attempt-2", true);

	assert.equal(failed.completedRepetitions, 0);
	assert.equal(valid.completedRepetitions, 1);
	assert.equal(duplicate.completedRepetitions, 1);
	assert.deepEqual(duplicate.attemptIds, ["attempt-1", "attempt-2"]);
});

test("separates measured and manual completion", () => {
	const session = createPracticeSession(
		"exercise-1",
		PRESCRIPTION,
		new Date("2026-07-11T15:00:00.000Z"),
		"session-1",
	);
	const measured = finalizePracticeSession(
		session,
		"completed",
		"measured",
		new Date("2026-07-11T15:05:00.000Z"),
	);
	const manual = finalizePracticeSession(
		createPracticeSession(
			"exercise-1",
			PRESCRIPTION,
			new Date("2026-07-11T16:00:00.000Z"),
			"session-2",
		),
		"completed",
		"manual-unscored",
		new Date("2026-07-11T16:05:00.000Z"),
	);

	assert.equal(measured.completionMode, "measured");
	assert.equal(manual.completionMode, "manual-unscored");
});

test("records discomfort as interruption without completion mode", () => {
	const session = createPracticeSession(
		"exercise-1",
		PRESCRIPTION,
		new Date("2026-07-11T15:00:00.000Z"),
		"session-1",
	);
	const interrupted = finalizePracticeSession(
		session,
		"interrupted",
		null,
		new Date("2026-07-11T15:02:00.000Z"),
		"discomfort",
	);
	assert.equal(interrupted.status, "interrupted");
	assert.equal(interrupted.interruptionReason, "discomfort");
	assert.equal(interrupted.completionMode, undefined);
});
