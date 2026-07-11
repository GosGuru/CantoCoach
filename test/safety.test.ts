import assert from "node:assert/strict";
import test from "node:test";
import {
	createDailySafetyCheck,
	evaluateSafety,
	type SafetyCheckInput,
} from "../src/domain/safety/safety.ts";

const SAFE_INPUT: SafetyCheckInput = {
	painWhileSpeaking: false,
	painWhileSinging: false,
	suddenVoiceLoss: false,
	bloodPresent: false,
	breathingDifficulty: false,
	swallowingDifficulty: false,
	completeAphonia: false,
	severeDiscomfort: false,
	fatigue: 0,
};

test("allows a session without critical signals", () => {
	assert.deepEqual(evaluateSafety(SAFE_INPUT), { state: "safe", reasons: [] });
});

test("marks moderate fatigue as caution", () => {
	const result = evaluateSafety({ ...SAFE_INPUT, fatigue: 2 });
	assert.equal(result.state, "caution");
	assert.deepEqual(result.reasons, ["fatiga vocal moderada"]);
});

test("blocks pain even when fatigue is low", () => {
	const result = evaluateSafety({ ...SAFE_INPUT, painWhileSinging: true });
	assert.equal(result.state, "blocked");
	assert.ok(result.reasons.includes("dolor al cantar"));
});

test("collects every critical reason", () => {
	const result = evaluateSafety({
		...SAFE_INPUT,
		bloodPresent: true,
		breathingDifficulty: true,
	});
	assert.equal(result.state, "blocked");
	assert.equal(result.reasons.length, 2);
});

test("stores the Montevideo calendar day", () => {
	const check = createDailySafetyCheck(
		SAFE_INPUT,
		new Date("2026-07-12T01:30:00.000Z"),
	);
	assert.equal(check.localDate, "2026-07-11");
});
