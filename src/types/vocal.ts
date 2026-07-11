export type VoiceBlock =
	| "Warmup"
	| "Closure"
	| "Resonancia"
	| "Passaggio"
	| "Repertorio";

export type ScaleType =
	| "5-note-ascending-descending"
	| "octave-slide"
	| "sirens"
	| "sustained"
	| "staccato"
	| "arpeggio"
	| "legato";

export interface ScalePattern {
	type: ScaleType;
	defaultBpm: number;
	// Frequencies in Hz for each note of the pattern, in order.
	frequencies: number[];
	// Optional note names for display (e.g., ['G3', 'A3', 'B3', 'C4']).
	noteNames?: string[];
}

export interface ExerciseGuidance {
	objective: string;
	setup: string[];
	execution: string[];
	commonMistakes: string[];
	stopSignals?: string[];
}

export interface ExerciseResource {
	title: string;
	url: string;
	kind: "video" | "article" | "source";
	sourceLabel: string;
}

export interface Exercise {
	id: string;
	name: string;
	block: VoiceBlock;
	// Short cues displayed while practicing.
	instructions: string[];
	// Physical sensations the user can report while practicing.
	autochecks: string[];
	// Optional step-by-step explanation for exercises that are hard to infer from a cue.
	guidance?: ExerciseGuidance;
	// Optional external demonstrations or reading. Links never replace the safety gate.
	resources?: ExerciseResource[];
	scalePattern: ScalePattern;
	// Approximate duration in minutes.
	durationMinutes: number;
	// Pedagogical progression level within the block (1–5).
	progressionLevel?: number;
	// Overall technical difficulty.
	difficulty?: "beginner" | "intermediate" | "advanced";
	// IDs of exercises that should feel comfortable before attempting this one.
	prerequisites?: string[];
}
