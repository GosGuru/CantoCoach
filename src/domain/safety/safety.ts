import { getLocalDateKey } from "../../utils/localDate";

export type SafetyState = "safe" | "caution" | "blocked";

export interface SafetyCheckInput {
	painWhileSpeaking: boolean;
	painWhileSinging: boolean;
	suddenVoiceLoss: boolean;
	bloodPresent: boolean;
	breathingDifficulty: boolean;
	swallowingDifficulty: boolean;
	completeAphonia: boolean;
	severeDiscomfort: boolean;
	fatigue: 0 | 1 | 2 | 3;
}

export interface DailySafetyCheck extends SafetyCheckInput {
	localDate: string;
	completedAt: string;
	state: SafetyState;
	reasons: string[];
}

const CRITICAL_FIELDS: Array<{
	key: keyof Omit<SafetyCheckInput, "fatigue">;
	label: string;
}> = [
	{ key: "painWhileSpeaking", label: "dolor al hablar" },
	{ key: "painWhileSinging", label: "dolor al cantar" },
	{ key: "suddenVoiceLoss", label: "pérdida súbita de voz" },
	{ key: "bloodPresent", label: "presencia de sangre o sangrado" },
	{ key: "breathingDifficulty", label: "dificultad para respirar" },
	{ key: "swallowingDifficulty", label: "dificultad para tragar" },
	{ key: "completeAphonia", label: "afonía completa" },
	{ key: "severeDiscomfort", label: "molestia severa" },
];

export function evaluateSafety(input: SafetyCheckInput): {
	state: SafetyState;
	reasons: string[];
} {
	const reasons = CRITICAL_FIELDS.filter(({ key }) => input[key]).map(
		({ label }) => label,
	);

	if (reasons.length > 0) {
		return { state: "blocked", reasons };
	}

	if (input.fatigue >= 2) {
		return {
			state: "caution",
			reasons: [
				input.fatigue === 3 ? "fatiga vocal alta" : "fatiga vocal moderada",
			],
		};
	}

	return { state: "safe", reasons: [] };
}

export function createDailySafetyCheck(
	input: SafetyCheckInput,
	now = new Date(),
): DailySafetyCheck {
	const evaluation = evaluateSafety(input);
	return {
		...input,
		...evaluation,
		localDate: getLocalDateKey(now),
		completedAt: now.toISOString(),
	};
}

export function isSafetyCheckCurrent(
	check: DailySafetyCheck | null,
	now = new Date(),
): check is DailySafetyCheck {
	return check?.localDate === getLocalDateKey(now);
}
