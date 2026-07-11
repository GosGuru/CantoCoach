import { vocalExercises } from "../data/vocalExercises";
import { isExerciseUnlockedByEvidence } from "../domain/progression/prerequisiteEvidence.ts";
import type { Exercise, VoiceBlock } from "../types/vocal";
import type {
	CoachFeedback,
	DailyReportInput,
	DailyRoutine,
	SessionRecord,
	VocalProfile,
} from "../types/vocalgym";
import { getLocalDateKey } from "../utils/localDate";

export type { CoachFeedback, DailyReportInput };

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

function exerciseAllowedForProfile(
	exercise: Exercise,
	profile: VocalProfile,
	recentSessions?: SessionRecord[],
	extraCap?: number,
): boolean {
	const cap = extraCap ?? levelCap(profile.level);
	const level = exercise.progressionLevel ?? 1;
	if (level > cap) return false;
	if (
		level > 1 &&
		!isExerciseUnlockedByEvidence(
			exercise,
			vocalExercises,
			recentSessions ?? [],
		)
	) {
		return false;
	}
	return true;
}

function filterExercisesByProfile(
	profile: VocalProfile,
	recentSessions?: SessionRecord[],
	extraCap?: number,
): Exercise[] {
	return vocalExercises.filter((exercise) =>
		exerciseAllowedForProfile(exercise, profile, recentSessions, extraCap),
	);
}

function pickExercisesForBlocks(
	available: Exercise[],
	blocks: VoiceBlock[],
	minutes: number,
): Exercise[] {
	const poolByBlock = new Map<VoiceBlock, Exercise[]>();
	for (const block of BLOCK_ORDER) {
		poolByBlock.set(
			block,
			available
				.filter((exercise) => exercise.block === block)
				.sort(
					(left, right) =>
						(left.progressionLevel ?? 1) - (right.progressionLevel ?? 1),
				),
		);
	}

	const chosen: Exercise[] = [];
	let remaining = Math.max(1, minutes);
	let safety = 0;

	while (remaining > 0 && safety < 50) {
		safety += 1;
		let picked = false;
		for (const block of blocks) {
			if (remaining <= 0) break;
			const candidate = (poolByBlock.get(block) ?? []).find(
				(exercise) =>
					exercise.durationMinutes <= remaining &&
					!chosen.some((selected) => selected.id === exercise.id),
			);
			if (!candidate) continue;
			chosen.push(candidate);
			remaining -= candidate.durationMinutes;
			picked = true;
		}
		if (!picked) break;
	}

	return chosen;
}

function resolveBlocks(
	goal: VoiceBlock | "balanced",
	profile: VocalProfile,
): VoiceBlock[] {
	const technicalGoals = profile.goals.filter(
		(block) => block !== "Warmup" && block !== "Closure",
	);
	const requested = goal === "balanced" ? technicalGoals : [goal, ...technicalGoals];
	const ordered: VoiceBlock[] = ["Warmup", "Closure"];

	for (const block of requested) {
		if (!ordered.includes(block)) ordered.push(block);
	}
	for (const block of BLOCK_ORDER) {
		if (!ordered.includes(block)) ordered.push(block);
	}
	return ordered;
}

function makeRoutine(
	date: string,
	exercises: Exercise[],
	focus: string,
	adaptationReason: string,
): DailyRoutine {
	return {
		date,
		exercises: exercises.map((exercise) => exercise.id),
		totalMinutes: exercises.reduce(
			(total, exercise) => total + exercise.durationMinutes,
			0,
		),
		focus,
		adaptationReason,
	};
}

function emptySafetyRoutine(date: string, reason: string): DailyRoutine {
	return makeRoutine(date, [], "Descanso vocal", reason);
}

export function generateRoutine(
	profile: VocalProfile,
	goal: VoiceBlock | "balanced",
	minutes: number,
	recentSessions?: SessionRecord[],
): DailyRoutine {
	const available = filterExercisesByProfile(profile, recentSessions);
	const chosen = pickExercisesForBlocks(
		available,
		resolveBlocks(goal, profile),
		minutes,
	);
	const date = getLocalDateKey();

	if (chosen.length === 0) {
		const fallback = available
			.filter((exercise) => exercise.block === "Warmup")
			.sort(
				(left, right) =>
					(left.progressionLevel ?? 1) - (right.progressionLevel ?? 1),
			)[0];
		if (!fallback) {
			return emptySafetyRoutine(
				date,
				"No se encontró una prescripción compatible con el perfil actual.",
			);
		}
		return makeRoutine(
			date,
			[fallback],
			"Calentamiento básico",
			"Se usó el ejercicio más accesible disponible.",
		);
	}

	const voiceType = profile.voiceType ?? "baritone";
	const goalLabel = goal === "balanced" ? "equilibrada" : goal;
	return makeRoutine(
		date,
		chosen,
		`Rutina ${goalLabel} para ${voiceType}, nivel ${profile.level}`,
		`Objetivos priorizados: ${profile.goals.join(", ")}. Cada nivel superior requiere evidencia medida del nivel anterior dentro del mismo bloque.`,
	);
}

function normalizeText(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

function criticalReportReasons(input: DailyReportInput): string[] {
	const reasons: string[] = [];
	const text = normalizeText(input.sensations);

	if (input.constriction === 3) reasons.push("tensión o molestia severa");
	if (/\bdolor\b/.test(text)) reasons.push("dolor reportado");
	if (/\bafonia\b|\bsin voz\b|\bperdi la voz\b/.test(text)) {
		reasons.push("pérdida o ausencia de voz");
	}
	if (/\bsangre\b|\bsangrado\b/.test(text)) reasons.push("sangre o sangrado");
	if (/dificultad.{0,20}respirar|falta de aire/.test(text)) {
		reasons.push("dificultad para respirar");
	}
	if (/dificultad.{0,20}tragar|dolor.{0,20}tragar/.test(text)) {
		reasons.push("dificultad o dolor al tragar");
	}
	return [...new Set(reasons)];
}

export function analyzeDailyReport(
	input: DailyReportInput,
	profile: VocalProfile = DEFAULT_PROFILE,
	recentSessions?: SessionRecord[],
): CoachFeedback {
	const criticalReasons = criticalReportReasons(input);
	if (criticalReasons.length > 0) {
		return {
			summary:
				"El reporte contiene una señal que hace inseguro recomendar más práctica vocal desde la aplicación.",
			primaryIssue: "dolor",
			recommendation:
				"Detené el entrenamiento. CantoCoach no puede determinar la causa; buscá evaluación profesional si la señal es intensa, súbita o persiste.",
			nextRoutine: emptySafetyRoutine(
				input.date,
				`Entrenamiento bloqueado por: ${criticalReasons.join(", ")}.`,
			),
			closingPhrase:
				"La práctica suma cuando es segura. Hoy la decisión técnica correcta es parar.",
			blocks: [],
		};
	}

	const hasConstriction = input.constriction >= 2;
	const hasPassaggioIssue = input.passaggioControl < 2;
	const isFatigued = input.energy <= 1;
	const isEquilibrated = input.passaggioControl >= 3 && input.constriction <= 1;

	let primaryIssue: CoachFeedback["primaryIssue"] = "equilibrio";
	let summary =
		"El reporte subjetivo fue equilibrado. Mantenemos una carga técnica moderada.";
	let recommendation = "Rutina completa con énfasis en cierre y resonancia.";
	let selectedBlocks: VoiceBlock[] = [...BLOCK_ORDER];
	let extraCap: number | undefined;
	let totalMinutes = 30;
	let blocksExplanation = [
		"Warmup: activación suave.",
		"Closure: inicio y cierre eficiente.",
		"Resonancia: claridad sin empuje.",
		"Passaggio: transición controlada.",
	];

	if (hasConstriction) {
		primaryIssue = "constricción";
		summary =
			"Reportaste tensión moderada. La aplicación no puede determinar su causa, así que reducimos carga y rango.";
		recommendation =
			"Usá una sesión breve y suave. Si aparece dolor o la tensión aumenta, detenete y actualizá el chequeo de seguridad.";
		selectedBlocks = ["Warmup", "Closure", "Warmup", "Resonancia"];
		extraCap = 2;
		totalMinutes = 18;
		blocksExplanation = [
			"Warmup: bajar demanda y comprobar comodidad.",
			"Closure: fonación ligera sin buscar potencia.",
			"Resonancia: claridad en rango cómodo.",
		];
	} else if (isFatigued) {
		primaryIssue = "fatiga";
		summary = "Reportaste fatiga. Reducimos duración, extensión y complejidad.";
		recommendation =
			"Rutina breve de preparación y fonación cómoda, sin ampliar rango ni forzar volumen.";
		selectedBlocks = ["Warmup", "Closure", "Resonancia"];
		extraCap = 2;
		totalMinutes = 18;
		blocksExplanation = [
			"Warmup: comprobar respuesta con poca carga.",
			"Closure: eficiencia a volumen moderado.",
			"Resonancia: mantener claridad dentro del rango cómodo.",
		];
	} else if (hasPassaggioIssue) {
		primaryIssue = "passaggio";
		summary =
			"Reportaste dificultad en la transición. Priorizamos continuidad y menor presión, sin diagnosticar el mecanismo usado.";
		recommendation =
			"Trabajá escalas cortas y slides suaves en un rango reducido. Evitá competir con el volumen de la referencia.";
		selectedBlocks = [
			"Warmup",
			"Closure",
			"Resonancia",
			"Passaggio",
			"Passaggio",
		];
		extraCap = Math.min(levelCap(profile.level), 3);
		totalMinutes = 26;
		blocksExplanation = [
			"Warmup: preparación breve.",
			"Closure: inicio estable.",
			"Resonancia: claridad con menor esfuerzo.",
			"Passaggio: continuidad en rango reducido.",
		];
	} else if (isEquilibrated) {
		primaryIssue = "equilibrio";
		summary =
			"Reportaste una transición fluida y poca tensión. Es un buen día para transferir la técnica a repertorio.";
		recommendation =
			"Mantenemos el núcleo técnico y añadimos repertorio sin perder precisión.";
		selectedBlocks = [...BLOCK_ORDER];
		extraCap = levelCap(profile.level);
		totalMinutes = 32;
		blocksExplanation = [
			"Warmup: preparación técnica breve.",
			"Closure: conservar inicios eficientes.",
			"Resonancia: sostener claridad.",
			"Passaggio: reforzar continuidad.",
			"Repertorio: transferir sin perder intención.",
		];
	}

	for (const block of profile.goals) {
		if (block !== "Warmup" && block !== "Closure") selectedBlocks.push(block);
	}

	const available = filterExercisesByProfile(profile, recentSessions, extraCap);
	const chosen = pickExercisesForBlocks(available, selectedBlocks, totalMinutes);

	return {
		summary,
		primaryIssue,
		recommendation,
		nextRoutine: makeRoutine(
			input.date,
			chosen,
			recommendation,
			`Autoinforme: tensión=${input.constriction}, passaggio=${input.passaggioControl}, energía=${input.energy}. Las respuestas son subjetivas; los desbloqueos técnicos dependen de evidencia medida.`,
		),
		closingPhrase:
			"Usá la técnica como herramienta: una corrección clara, una repetición consciente.",
		blocks: blocksExplanation,
	};
}
