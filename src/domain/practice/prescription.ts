import type { Exercise, VoiceBlock } from "../../types/vocal.ts";

export interface ExercisePrescription {
	version: 1;
	sets: number;
	repetitionsPerSet: number;
	noteDurationMs: number;
	restBetweenRepsMs: number;
	restBetweenSetsMs: number;
	minimumEvaluableAttempts: number;
}

const BLOCK_DEFAULTS: Record<VoiceBlock, Omit<ExercisePrescription, "version">> = {
	Warmup: {
		sets: 2,
		repetitionsPerSet: 3,
		noteDurationMs: 2200,
		restBetweenRepsMs: 3500,
		restBetweenSetsMs: 15000,
		minimumEvaluableAttempts: 3,
	},
	Closure: {
		sets: 3,
		repetitionsPerSet: 4,
		noteDurationMs: 1800,
		restBetweenRepsMs: 3500,
		restBetweenSetsMs: 18000,
		minimumEvaluableAttempts: 4,
	},
	Resonancia: {
		sets: 3,
		repetitionsPerSet: 4,
		noteDurationMs: 2500,
		restBetweenRepsMs: 4000,
		restBetweenSetsMs: 20000,
		minimumEvaluableAttempts: 4,
	},
	Passaggio: {
		sets: 2,
		repetitionsPerSet: 3,
		noteDurationMs: 2600,
		restBetweenRepsMs: 6000,
		restBetweenSetsMs: 25000,
		minimumEvaluableAttempts: 3,
	},
	Repertorio: {
		sets: 2,
		repetitionsPerSet: 3,
		noteDurationMs: 3200,
		restBetweenRepsMs: 8000,
		restBetweenSetsMs: 30000,
		minimumEvaluableAttempts: 3,
	},
};

export function resolveExercisePrescription(
	exercise: Exercise,
): ExercisePrescription {
	const base = BLOCK_DEFAULTS[exercise.block];
	const noteDurationMs =
		exercise.scalePattern.type === "staccato"
			? Math.min(base.noteDurationMs, 1500)
			: exercise.scalePattern.type === "sustained"
				? Math.max(base.noteDurationMs, 3000)
				: base.noteDurationMs;

	return {
		version: 1,
		...base,
		noteDurationMs,
	};
}

export function totalPrescriptionRepetitions(
	prescription: ExercisePrescription,
): number {
	return prescription.sets * prescription.repetitionsPerSet;
}

export function calculatePrescriptionDurationMs(
	prescription: ExercisePrescription,
): number {
	const repetitions = totalPrescriptionRepetitions(prescription);
	const repetitionWork = repetitions * prescription.noteDurationMs;
	const withinSetRest =
		prescription.sets *
		Math.max(0, prescription.repetitionsPerSet - 1) *
		prescription.restBetweenRepsMs;
	const betweenSetRest =
		Math.max(0, prescription.sets - 1) * prescription.restBetweenSetsMs;

	return repetitionWork + withinSetRest + betweenSetRest;
}

export function prescriptionPosition(
	completedRepetitions: number,
	prescription: ExercisePrescription,
): { set: number; repetition: number; complete: boolean } {
	const total = totalPrescriptionRepetitions(prescription);
	const clamped = Math.max(0, Math.min(completedRepetitions, total));
	if (clamped >= total) {
		return {
			set: prescription.sets,
			repetition: prescription.repetitionsPerSet,
			complete: true,
		};
	}

	return {
		set: Math.floor(clamped / prescription.repetitionsPerSet) + 1,
		repetition: (clamped % prescription.repetitionsPerSet) + 1,
		complete: false,
	};
}
