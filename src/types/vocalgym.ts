/**
 * Tipos centrales del historial y progreso de VocalGym.
 * Estos tipos definen el contrato entre el agente coach, la UI y los datos de sesión.
 */

import type { VoiceBlock } from "./vocal";

/** Tipos de voz soportados por VocalGym. */
export type VoiceType =
	| "baritone"
	| "tenor"
	| "bass"
	| "contralto"
	| "mezzo"
	| "soprano";

/** Perfil vocal simplificado del usuario. */
export interface VocalProfile {
	voiceType?: VoiceType;
	level: "beginner" | "intermediate" | "advanced";
	/** Bloques en los que el usuario quiere enfocarse. */
	goals: VoiceBlock[];
}

/** Rutina del día generada por el agente. */
export interface DailyRoutine {
	date: string;
	exercises: string[]; // IDs de ejercicios
	totalMinutes: number;
	focus: string;
	adaptationReason?: string;
}

/** Datos que el usuario envía en el reporte diario. */
export interface DailyReportInput {
	date: string;
	constriction: 0 | 1 | 2 | 3;
	passaggioControl: 0 | 1 | 2 | 3;
	energy: 0 | 1 | 2 | 3;
	sensations: string;
	notes?: string;
}

/** Feedback generado por el agente coach a partir del reporte diario. */
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
	/** Explicación por bloque de por qué se eligió cada sección. */
	blocks?: string[];
}

/** Registro de una sesión completada y persistida. */
export interface SessionRecord {
	id: string;
	date: string;
	routine: DailyRoutine;
	completedExerciseIds: string[];
	report: DailyReportInput;
	feedback: CoachFeedback;
	totalMinutes: number;
}
