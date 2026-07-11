import type {
	ExerciseCompletionMode,
	PracticeSessionRecord,
} from "../../types/attempt.ts";
import type { ExercisePrescription } from "./prescription.ts";
import { getLocalDateKey } from "../../utils/localDate.ts";

export function createPracticeSession(
	exerciseId: string,
	prescription: ExercisePrescription,
	now = new Date(),
	id = crypto.randomUUID(),
): PracticeSessionRecord {
	return {
		id,
		version: 2,
		exerciseId,
		localDate: getLocalDateKey(now),
		startedAt: now.toISOString(),
		attemptIds: [],
		prescription,
		status: "active",
		completedRepetitions: 0,
	};
}

export function registerSessionAttempt(
	session: PracticeSessionRecord,
	attemptId: string,
	evaluable: boolean,
): PracticeSessionRecord {
	if (session.attemptIds.includes(attemptId)) return session;
	return {
		...session,
		attemptIds: [...session.attemptIds, attemptId],
		completedRepetitions:
			session.completedRepetitions + (evaluable ? 1 : 0),
	};
}

export function finalizePracticeSession(
	session: PracticeSessionRecord,
	status: Exclude<PracticeSessionRecord["status"], "active">,
	mode: ExerciseCompletionMode | null,
	now = new Date(),
	interruptionReason?: PracticeSessionRecord["interruptionReason"],
): PracticeSessionRecord {
	if (session.status !== "active") return session;
	return {
		...session,
		status,
		completionMode: mode ?? undefined,
		endedAt: now.toISOString(),
		interruptionReason,
	};
}
