import type {
	PitchAttemptMetrics,
	PitchObservation,
} from "../audio/analysis/attemptMetrics.ts";
import type { TechnicalFeedback } from "../audio/analysis/technicalFeedback.ts";

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
	practiceSessionId?: string;
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
	version: 1;
	exerciseId: string;
	localDate: string;
	startedAt: string;
	endedAt?: string;
	attemptIds: string[];
	status: "active" | "partial" | "completed" | "interrupted";
	interruptionReason?: "discomfort" | "user" | "technical";
}
