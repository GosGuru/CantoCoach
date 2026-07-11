import { useCallback, useEffect, useRef, useState } from "react";
import type { PracticeSessionRecord } from "../types/attempt.ts";
import { getLocalDateKey } from "../utils/localDate.ts";
import { useLocalStorage } from "./useLocalStorage";

const PRACTICE_SESSIONS_STORAGE_KEY = "vocalgym-practice-sessions-v2";

type FinalStatus = Exclude<PracticeSessionRecord["status"], "active">;

export function usePracticeSession(exerciseId: string) {
	const [, setSessions] = useLocalStorage<PracticeSessionRecord[]>(
		PRACTICE_SESSIONS_STORAGE_KEY,
		[],
	);
	const [sessionId] = useState(() => crypto.randomUUID());
	const statusRef = useRef<PracticeSessionRecord["status"]>("active");

	useEffect(() => {
		const startedAt = new Date().toISOString();
		setSessions((current) => {
			if (current.some((session) => session.id === sessionId)) return current;
			return [
				...current,
				{
					id: sessionId,
					version: 1,
					exerciseId,
					localDate: getLocalDateKey(),
					startedAt,
					attemptIds: [],
					status: "active",
				},
			];
		});
	}, [exerciseId, sessionId, setSessions]);

	const registerAttempt = useCallback(
		(attemptId: string) => {
			setSessions((current) =>
				current.map((session) =>
					session.id === sessionId && !session.attemptIds.includes(attemptId)
						? { ...session, attemptIds: [...session.attemptIds, attemptId] }
						: session,
				),
			);
		},
		[sessionId, setSessions],
	);

	const finalize = useCallback(
		(
			status: FinalStatus,
			interruptionReason?: PracticeSessionRecord["interruptionReason"],
		) => {
			statusRef.current = status;
			setSessions((current) =>
				current.map((session) =>
					session.id === sessionId
						? {
								...session,
								status,
								endedAt: new Date().toISOString(),
								interruptionReason,
							}
						: session,
				),
			);
		},
		[sessionId, setSessions],
	);

	const complete = useCallback(() => finalize("completed"), [finalize]);
	const closePartial = useCallback(() => {
		if (statusRef.current === "active") finalize("partial", "user");
	}, [finalize]);
	const interruptForDiscomfort = useCallback(
		() => finalize("interrupted", "discomfort"),
		[finalize],
	);

	return {
		sessionId,
		registerAttempt,
		complete,
		closePartial,
		interruptForDiscomfort,
	};
}
