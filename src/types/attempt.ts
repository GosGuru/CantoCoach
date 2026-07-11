import type {
	PitchAttemptMetrics,
	PitchObservation,
} from "../audio/analysis/attemptMetrics.ts";
import type { TechnicalFeedback } from "../audio/analysis/technicalFeedback.ts";
import type { ProgressionGateResult } from "../domain/progression/evaluateExerciseProgression.ts";
import type { ExercisePrescription } from "../domain/practice/prescription.ts";

export type ExerciseCompletionMode = "measured" | "manual-unscored";

export interface AttemptTarget {
	frequencyHz: number;
	noteName: string;
}

export interface CaptureQuality {
	noiseFloorRms: number;
	clippedFrameRatio: number;
	sampleRate: number;
	analysisIntervalMs: number;
}

export interface ExerciseAttemptRecord {
	id: string;
	version: 1;
	practiceSessionId: string;
	exerciseId: string;
	localDate: string;
	createdAt: string;
	durationMs: number;
	target: AttemptTarget;
	observations: PitchObservation[];
	metrics: PitchAttemptMetrics;
	feedback: TechnicalFeedback;
	captureQuality: CaptureQuality;
	completionMode: "measured";
	previousAttemptId?: string;
}

export interface PracticeSessionRecord {
	id: string;
	version: 2;
	exerciseId: string;
	localDate: string;
	startedAt: string;
	endedAt?: string;
	attemptIds: string[];
	prescription: ExercisePrescription;
	completedRepetitions: number;
	status: "active" | "partial" | "completed" | "interrupted";
	completionMode?: ExerciseCompletionMode;
	interruptionReason?: "discomfort" | "user" | "technical";
}

export interface ExerciseCompletionRecord {
	id: string;
	version: 1;
	exerciseId: string;
	practiceSessionId?: string;
	localDate: string;
	createdAt: string;
	mode: ExerciseCompletionMode;
	attemptIds: string[];
	progressionEligible: boolean;
	progressionSnapshot?: ProgressionGateResult;
}
