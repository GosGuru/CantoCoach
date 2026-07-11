import { vocalExercises } from "../data/vocalExercises";
import type { Exercise, VoiceBlock } from "../types/vocal";
import type {
	CoachFeedback,
	DailyReportInput,
	DailyRoutine,
	SessionRecord,
	VocalProfile,
} from "../types/vocalgym";

export type { DailyReportInput, CoachFeedback };

export const DEFAULT_PROFILE: VocalProfile = {
	voiceType: "baritone",
	level: "beginner",
	goals: ["Warmup", "Closure", "Resonancia", "Passaggio", "Repertorio"],
};

const BLOCK_ORDER: VoiceBlock[] = [
	"Warmup",
	"Closure",
	"Resonancia",
	"Passaggio",
	"Repertorio",
];

function levelCap(level: VocalProfile["level"]): number {
	switch (level) {
		case "beginner":
			return 2;
		case "intermediate":
			return 3;
		case "advanced":
			return 5;
		default:
			return 2;
	}
}

function getCompletedIds(
	recentSessions: SessionRecord[] | undefined,
): Set<string> {
	const ids = new Set<string>();
	for (const session of recentSessions ?? []) {
		for (const id of session.completedExerciseIds) {
			ids.add(id);
		}
	}
	return ids;
}

function prerequisitesCovered(
	exercise: Exercise,
	recentSessions: SessionRecord[] | undefined,
): boolean {
	const prereqs = exercise.prerequisites;
	if (!prereqs || prereqs.length === 0) return true;
	const completed = getCompletedIds(recentSessions);
	return prereqs.every((id) => completed.has(id));
}

function exerciseAllowedForProfile(
	exercise: Exercise,
	profile: VocalProfile,
	recentSessions: SessionRecord[] | undefined,
	extraCap?: number,
): boolean {
	const cap = extraCap ?? levelCap(profile.level);
	if ((exercise.progressionLevel ?? 1) > cap) return false;
	if (
		(exercise.progressionLevel ?? 1) >= 4 &&
		!prerequisitesCovered(exercise, recentSessions)
	) {
		return false;
	}
	return true;
}

function filterExercisesByProfile(
	profile: VocalProfile,
	recentSessions: SessionRecord[] | undefined,
	extraCap?: number,
): Exercise[] {
	return vocalExercises.filter((e) =>
		exerciseAllowedForProfile(e, profile, recentSessions, extraCap),
	);
}

function pickExercisesForBlocks(
	available: Exercise[],
	blocks: VoiceBlock[],
	minutes: number,
): Exercise[] {
	const poolByBlock = new Map<VoiceBlock, Exercise[]>();
	for (const block of blocks) {
		const blockExercises = available.filter((e) => e.block === block);
		blockExercises.sort(
			(a, b) => (a.progressionLevel ?? 1) - (b.progressionLevel ?? 1),
		);
		poolByBlock.set(block, blockExercises);
	}

	const chosen: Exercise[] = [];
	let remaining = minutes;
	let safety = 0;

	while (remaining > 0 && safety < 50) {
		safety += 1;
		let picked = false;
		for (const block of blocks) {
			if (remaining <= 0) break;
			const pool = poolByBlock.get(block) ?? [];
			const candidate = pool.find(
				(e) =>
					e.durationMinutes <= remaining && !chosen.some((c) => c.id === e.id),
			);
			if (candidate) {
				chosen.push(candidate);
				remaining -= candidate.durationMinutes;
				picked = true;
			}
		}
		if (!picked) break;
	}

	return chosen;
}

function resolveBlocks(
	goal: VoiceBlock | "balanced",
	profile: VocalProfile,
): VoiceBlock[] {
	const ordered: VoiceBlock[] = [];
	ordered.push("Warmup");
	ordered.push("Closure");

	if (goal === "balanced") {
		ordered.push("Resonancia", "Passaggio", "Repertorio");
	} else {
		ordered.push(goal);
		for (const block of [
			"Resonancia",
			"Passaggio",
			"Repertorio",
		] as VoiceBlock[]) {
			if (!ordered.includes(block)) ordered.push(block);
		}
	}

	// Prioritize user goals while keeping the warmup/closure foundation.
	for (const block of profile.goals) {
		if (block !== "Warmup" && block !== "Closure" && !ordered.includes(block)) {
			ordered.push(block);
		}
	}

	return ordered;
}

function makeRoutine(
	date: string,
	exercises: Exercise[],
	focus: string,
	adaptationReason: string,
): DailyRoutine {
	const totalMinutes = exercises.reduce((sum, e) => sum + e.durationMinutes, 0);
	return {
		date,
		exercises: exercises.map((e) => e.id),
		totalMinutes,
		focus,
		adaptationReason,
	};
}

export function generateRoutine(
	profile: VocalProfile,
	goal: VoiceBlock | "balanced",
	minutes: number,
	recentSessions?: SessionRecord[],
): DailyRoutine {
	const available = filterExercisesByProfile(profile, recentSessions);
	const blocks = resolveBlocks(goal, profile);
	const chosen = pickExercisesForBlocks(available, blocks, minutes);

	if (chosen.length === 0) {
		const fallback = available.filter((e) => e.block === "Warmup");
		fallback.sort(
			(a, b) => (a.progressionLevel ?? 1) - (b.progressionLevel ?? 1),
		);
		const first = fallback[0] ?? vocalExercises[0];
		return makeRoutine(
			new Date().toISOString().split("T")[0],
			[first],
			"Calentamiento básico por defecto",
			"No se encontraron ejercicios ajustados al perfil; se usó el ejercicio más accesible.",
		);
	}

	const goalLabel = goal === "balanced" ? "equilibrada" : goal;
	const voiceType = profile.voiceType ?? "baritone";
	const focus = `Rutina ${goalLabel} adaptada a ${voiceType} nivel ${profile.level}`;
	const adaptationReason = `Perfil: ${voiceType}, ${profile.level}. Objetivos: ${profile.goals.join(", ")}.`;
	return makeRoutine(
		new Date().toISOString().split("T")[0],
		chosen,
		focus,
		adaptationReason,
	);
}

function buildRecoveryRoutine(date: string, reason: string): DailyRoutine {
	const recovery = vocalExercises.filter(
		(e) => e.id === "warmup-silent-laugh" || e.id === "warmup-sigh-yawn",
	);
	return makeRoutine(date, recovery, "Recuperación vocal activa", reason);
}

export function analyzeDailyReport(
	input: DailyReportInput,
	profile?: VocalProfile,
	recentSessions?: SessionRecord[],
): CoachFeedback {
	const activeProfile = profile ?? DEFAULT_PROFILE;
	const date = input.date;

	if (
		input.sensations.toLowerCase().includes("dolor") ||
		input.sensations.toLowerCase().includes("afonía") ||
		input.sensations.toLowerCase().includes("sangre")
	) {
		return {
			summary:
				"Detecté una señal de alarma en tu reporte (dolor, afonía o sangrado). La voz no entrena con dolor.",
			primaryIssue: "dolor",
			recommendation:
				"Suspendé el entrenamiento hoy. Hidratación, silencio relativo y consultá a un foniatra o logopeda especializado en voz.",
			nextRoutine: buildRecoveryRoutine(
				date,
				"Señal de alarma reportada por el usuario.",
			),
			closingPhrase:
				"Escuchá a tu cuerpo. La técnica existe para servirte, no para dominarte.",
			blocks: [
				"Warmup: Liberación suave sin fonación forzada.",
				"Closure: Cierre mínimo solo si no hay molestia.",
			],
		};
	}

	const hasConstriction = input.constriction >= 2;
	const hasPassaggioIssue = input.passaggioControl < 2;
	const isFatigued = input.energy <= 1;
	const isEquilibrated = input.passaggioControl >= 3 && input.constriction <= 1;

	let primaryIssue: CoachFeedback["primaryIssue"] = "equilibrio";
	let summary =
		"Hoy fue un día equilibrado. Vamos a mantener el trabajo técnico sin forzar.";
	let recommendation = "Rutina completa con énfasis en cierre y resonancia.";
	let selectedBlocks: VoiceBlock[] = [...BLOCK_ORDER];
	let extraCap: number | undefined;
	let totalMinutes = 30;
	let blocksExplanation: string[] = [];

	if (hasConstriction) {
		primaryIssue = "constricción";
		summary =
			"Tu reporte muestra constricción. Esto indica que las cuerdas falsas o músculos constrictores están participando más de lo necesario.";
		recommendation =
			"Mañana priorizamos retracción y cierre cordal suave. Evitamos carga en el passaggio hasta que el canal se libere.";
		selectedBlocks = ["Warmup", "Closure", "Warmup", "Closure", "Resonancia"];
		extraCap = 2;
		totalMinutes = 20;
		blocksExplanation = [
			"Warmup: Reír silencioso y bostezo para bajar la laringe y liberar el velo.",
			"Closure: Cierre cordal suave sin refuerzo de cuerdas falsas.",
			"Resonancia: Brillar sin tensión lateral.",
		];
	} else if (hasPassaggioIssue) {
		primaryIssue = "passaggio";
		summary =
			"La transición por el passaggio todavía no fluye. Vamos a trabajar la voz mixta con escalas cortas y twang moderado.";
		recommendation =
			"Incluiremos ejercicios de mix y twang en rango reducido, sin forzar volumen.";
		selectedBlocks = [
			"Warmup",
			"Closure",
			"Resonancia",
			"Passaggio",
			"Passaggio",
		];
		extraCap = Math.min(levelCap(activeProfile.level), 3);
		totalMinutes = 28;
		blocksExplanation = [
			"Warmup: Calentamiento con bostezo para preparar la laringe.",
			"Closure: Cierre estable como base de la transición.",
			"Resonancia: Twang y espacio para atravesar el passaggio.",
			"Passaggio: Laringe neutra y embudo ariepiglótico.",
		];
	} else if (isFatigued) {
		primaryIssue = "fatiga";
		summary =
			"Reportás fatiga. No es necesario apagar la sesión, pero sí reducir la carga y extensión de rango.";
		recommendation =
			"Rutina corta de calentamiento y cierre cordal. Evitamos mix y repertorio.";
		selectedBlocks = ["Warmup", "Closure", "Resonancia"];
		extraCap = 2;
		totalMinutes = 20;
		blocksExplanation = [
			"Warmup: Despertar la voz sin presión.",
			"Closure: Cierre eficiente con poco aire.",
			"Resonancia: Trabajo de espacio sin forzar el passaggio.",
		];
	} else if (isEquilibrated) {
		primaryIssue = "equilibrio";
		summary =
			"El passaggio fluyó y la constricción estuvo bajo control. Es un buen día para tocar repertorio.";
		recommendation =
			"Añadimos un bloque de repertorio conseguido para transferir la técnica a la canción.";
		selectedBlocks = [
			"Warmup",
			"Closure",
			"Resonancia",
			"Passaggio",
			"Repertorio",
		];
		extraCap = levelCap(activeProfile.level);
		totalMinutes = 32;
		blocksExplanation = [
			"Warmup: Preparación técnica breve.",
			"Closure: Cierre en buenas condiciones.",
			"Resonancia: Mantener el brillo y el espacio.",
			"Passaggio: Reforzar la transición.",
			"Repertorio: Transferir la técnica a la canción.",
		];
	} else {
		blocksExplanation = [
			"Warmup: Activación suave.",
			"Closure: Cierre cordal.",
			"Resonancia: Espacio y brillo.",
			"Passaggio: Transición controlada.",
		];
	}

	// Prioritize user's goals among the selected blocks when possible.
	for (const block of activeProfile.goals) {
		if (
			block !== "Warmup" &&
			block !== "Closure" &&
			!selectedBlocks.includes(block)
		) {
			selectedBlocks.push(block);
		}
	}

	const available = filterExercisesByProfile(
		activeProfile,
		recentSessions,
		extraCap,
	);
	const chosen = pickExercisesForBlocks(
		available,
		selectedBlocks,
		totalMinutes,
	);

	return {
		summary,
		primaryIssue,
		recommendation,
		nextRoutine: makeRoutine(
			date,
			chosen,
			recommendation,
			`Constricción=${input.constriction}, Passaggio=${input.passaggioControl}, Energía=${input.energy}. Sensaciones: ${input.sensations}`,
		),
		closingPhrase:
			"Escuchá a tu cuerpo. La técnica existe para servirte, no para dominarte.",
		blocks: blocksExplanation,
	};
}
