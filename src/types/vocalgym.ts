import type { VoiceBlock } from "./vocal";

export type VoiceType =
	| "baritone"
	| "tenor"
	| "bass"
	| "contralto"
	| "mezzo"
	| "soprano";

export interface VocalProfile {
	voiceType?: VoiceType;
	level: "beginner" | "intermediate" | "advanced";
	goals: VoiceBlock[];
}

export interface DailyRoutine {
	date: string;
	exercises: string[];
	totalMinutes: number;
	focus: string;
	adaptationReason?: string;
}

export interface DailyReportInput {
	date: string;
	constriction: 0 | 1 | 2 | 3;
	passaggioControl: 0 | 1 | 2 | 3;
	energy: 0 | 1 | 2 | 3;
	sensations: string;
	notes?: string;
}

export interface CoachFeedback {
	summary: string;
	primaryIssue:
		| "constricción"
		| "passaggio"
		| "fatiga"
		| "equilibrio"
		| "dolor";
	recommendation: string;
	nextRoutine: DailyRoutine;
	closingPhrase: string;
	blocks?: string[];
}

export interface SessionRecord {
	id: string;
	date: string;
	routine: DailyRoutine;
	/** Todos los ejercicios registrados para adherencia, incluidos los manuales. */
	completedExerciseIds: string[];
	/** Solo ejercicios con una finalización medida que pasó los gates técnicos. */
	progressionEligibleExerciseIds?: string[];
	report: DailyReportInput;
	feedback: CoachFeedback;
	totalMinutes: number;
}
