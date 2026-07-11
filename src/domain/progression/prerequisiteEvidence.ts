import type { Exercise } from "../../types/vocal.ts";
import type { SessionRecord } from "../../types/vocalgym.ts";

export function progressionEligibleIds(
	sessions: SessionRecord[] = [],
): Set<string> {
	const ids = new Set<string>();
	for (const session of sessions) {
		for (const id of session.progressionEligibleExerciseIds ?? []) ids.add(id);
	}
	return ids;
}

export function isExerciseUnlockedByEvidence(
	exercise: Exercise,
	catalog: Exercise[],
	sessions: SessionRecord[] = [],
): boolean {
	const level = exercise.progressionLevel ?? 1;
	if (level <= 1) return true;

	const eligible = progressionEligibleIds(sessions);
	if (exercise.prerequisites && exercise.prerequisites.length > 0) {
		return exercise.prerequisites.every((id) => eligible.has(id));
	}

	const previousLevelIds = catalog
		.filter(
			(candidate) =>
				candidate.block === exercise.block &&
				(candidate.progressionLevel ?? 1) === level - 1,
		)
		.map((candidate) => candidate.id);

	if (previousLevelIds.length === 0) return false;
	return previousLevelIds.some((id) => eligible.has(id));
}
