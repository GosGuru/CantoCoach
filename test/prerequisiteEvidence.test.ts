import assert from "node:assert/strict";
import test from "node:test";
import { isExerciseUnlockedByEvidence } from "../src/domain/progression/prerequisiteEvidence.ts";
import type { Exercise } from "../src/types/vocal.ts";
import type { SessionRecord } from "../src/types/vocalgym.ts";

const LEVEL_ONE: Exercise = {
	id: "closure-level-1",
	name: "Closure 1",
	block: "Closure",
	instructions: ["test"],
	autochecks: ["test"],
	scalePattern: {
		type: "sustained",
		defaultBpm: 72,
		frequencies: [220],
	},
	durationMinutes: 3,
	progressionLevel: 1,
};

const LEVEL_TWO: Exercise = {
	...LEVEL_ONE,
	id: "closure-level-2",
	name: "Closure 2",
	progressionLevel: 2,
};

const ROUTINE = {
	date: "2026-07-11",
	exercises: [LEVEL_ONE.id],
	totalMinutes: 3,
	focus: "test",
};

const REPORT = {
	date: "2026-07-11",
	constriction: 0 as const,
	passaggioControl: 2 as const,
	energy: 2 as const,
	sensations: "",
};

const FEEDBACK = {
	summary: "test",
	primaryIssue: "equilibrio" as const,
	recommendation: "test",
	nextRoutine: ROUTINE,
	closingPhrase: "test",
};

function session(
	completedExerciseIds: string[],
	progressionEligibleExerciseIds?: string[],
): SessionRecord {
	return {
		id: crypto.randomUUID(),
		date: "2026-07-11",
		routine: ROUTINE,
		completedExerciseIds,
		progressionEligibleExerciseIds,
		report: REPORT,
		feedback: FEEDBACK,
		totalMinutes: 3,
	};
}

test("level one exercises are always unlocked", () => {
	assert.equal(
		isExerciseUnlockedByEvidence(LEVEL_ONE, [LEVEL_ONE, LEVEL_TWO], []),
		true,
	);
});

test("manual completion does not unlock the next level", () => {
	const manualSession = session([LEVEL_ONE.id], []);
	assert.equal(
		isExerciseUnlockedByEvidence(
			LEVEL_TWO,
			[LEVEL_ONE, LEVEL_TWO],
			[manualSession],
		),
		false,
	);
});

test("measured eligible completion unlocks the next level", () => {
	const measuredSession = session([LEVEL_ONE.id], [LEVEL_ONE.id]);
	assert.equal(
		isExerciseUnlockedByEvidence(
			LEVEL_TWO,
			[LEVEL_ONE, LEVEL_TWO],
			[measuredSession],
		),
		true,
	);
});
