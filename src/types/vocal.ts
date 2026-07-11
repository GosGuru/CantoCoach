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
	// Optional note names for display (e.g., ['G3', 'A3', 'B3', 'C4', 'B3', 'A3', 'G3']).
	noteNames?: string[];
}

export interface Exercise {
	id: string;
	name: string;
	block: VoiceBlock;
	// Short, direct anatomical instructions for the exercise.
	instructions: string[];
	// Physical sensations the user should verify while practicing.
	autochecks: string[];
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
