import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	createPracticeSession,
	finalizePracticeSession,
	registerSessionAttempt,
} from "../domain/practice/sessionLifecycle.ts";
import type { ExercisePrescription } from "../domain/practice/prescription.ts";
import type {
	ExerciseAttemptRecord,
	ExerciseCompletionMode,
	PracticeSessionRecord,
} from "../types/attempt.ts";
import { useLocalStorage } from "./useLocalStorage";

export const PRACTICE_SESSIONS_STORAGE_KEY = "vocalgym-practice-sessions-v2";

export function usePracticeSession(
	exerciseId: string,
	prescription: ExercisePrescription,
) {
	const [sessions, setSessions] = useLocalStorage<PracticeSessionRecord[]>(
		PRACTICE_SESSIONS_STORAGE_KEY,
		[],
	);
	const [sessionId] = useState(() => crypto.randomUUID());
	const statusRef = useRef<PracticeSessionRecord["status"]>("active");

	useEffect(() => {
		setSessions((current) => {
			if (current.some((session) => session.id === sessionId)) return current;
			return [
				...current,
				createPracticeSession(exerciseId, prescription, new Date(), sessionId),
			];
		});
	}, [exerciseId, prescription, sessionId, setSessions]);

	const session = useMemo(
		() => sessions.find((item) => item.id === sessionId) ?? null,
		[sessionId, sessions],
	);

	const registerAttempt = useCallback(
		(attempt: ExerciseAttemptRecord) => {
			setSessions((current) =>
				current.map((item) =>
					item.id === sessionId
						? registerSessionAttempt(item, attempt.id, attempt.metrics.evaluable)
						: item,
				),
			);
		},
		[sessionId, setSessions],
	);

	const finalize = useCallback(
		(
			status: Exclude<PracticeSessionRecord["status"], "active">,
			mode: ExerciseCompletionMode | null,
			interruptionReason?: PracticeSessionRecord["interruptionReason"],
		) => {
			statusRef.current = status;
			setSessions((current) =>
				current.map((item) =>
					item.id === sessionId
						? finalizePracticeSession(
								item,
								status,
								mode,
								new Date(),
								interruptionReason,
							)
						: item,
				),
			);
		},
		[sessionId, setSessions],
	);

	const completeMeasured = useCallback(
		() => finalize("completed", "measured"),
		[finalize],
	);
	const completeManual = useCallback(
		() => finalize("completed", "manual-unscored"),
		[finalize],
	);
	const closePartial = useCallback(() => {
		if (statusRef.current === "active") finalize("partial", null, "user");
	}, [finalize]);
	const interruptForDiscomfort = useCallback(
		() => finalize("interrupted", null, "discomfort"),
		[finalize],
	);

	return {
		sessionId,
		session,
		registerAttempt,
		completeMeasured,
		completeManual,
		closePartial,
		interruptForDiscomfort,
	};
}
