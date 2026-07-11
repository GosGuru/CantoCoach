import type { SessionRecord } from "../../types/vocalgym";
import {
	DEFAULT_TIME_ZONE,
	getLocalDateKey,
	shiftDateKey,
	startOfWeekDateKey,
} from "../../utils/localDate";

interface SessionWithStatus extends SessionRecord {
	status?: "completed" | "partial" | "blocked";
}

export function qualifiesForAdherence(session: SessionWithStatus): boolean {
	if (session.status === "blocked") return false;
	if (session.feedback.primaryIssue === "dolor") return false;
	return session.totalMinutes > 0 || session.completedExerciseIds.length > 0;
}

export function calculateCurrentStreak(
	sessions: SessionWithStatus[],
	now = new Date(),
	timeZone = DEFAULT_TIME_ZONE,
): number {
	const today = getLocalDateKey(now, timeZone);
	const dates = new Set(
		sessions.filter(qualifiesForAdherence).map((session) => session.date),
	);

	let cursor = dates.has(today) ? today : shiftDateKey(today, -1);
	let streak = 0;

	while (dates.has(cursor)) {
		streak += 1;
		cursor = shiftDateKey(cursor, -1);
	}

	return streak;
}

export function calculateWeeklyMinutes(
	sessions: SessionWithStatus[],
	now = new Date(),
	timeZone = DEFAULT_TIME_ZONE,
): number {
	const today = getLocalDateKey(now, timeZone);
	const weekStart = startOfWeekDateKey(today, 1);

	return sessions
		.filter(
			(session) =>
				qualifiesForAdherence(session) &&
				session.date >= weekStart &&
				session.date <= today,
		)
		.reduce((total, session) => total + session.totalMinutes, 0);
}
