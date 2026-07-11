import type { PitchAttemptMetrics } from "./attemptMetrics.ts";

export type TechnicalFeedbackFocus =
	| "capture"
	| "onset"
	| "pitch"
	| "stability"
	| "phrase-end"
	| "success";

export interface TechnicalFeedback {
	focus: TechnicalFeedbackFocus;
	observation: string;
	evidence: string;
	action: string;
	nextTarget: string;
}

function rounded(value: number | null): number {
	return Math.round(value ?? 0);
}

export function buildTechnicalFeedback(
	metrics: PitchAttemptMetrics,
): TechnicalFeedback {
	if (!metrics.evaluable) {
		return {
			focus: "capture",
			observation: "No pude medir el intento con suficiente confianza.",
			evidence:
				metrics.reason === "not-enough-voice"
					? `Solo hubo voz confiable en ${Math.round(metrics.voicedFrameRatio * 100)}% del intento.`
					: `La confianza global fue de ${Math.round(metrics.measurementConfidence * 100)}%.`,
			action:
				"Acercate un poco al micrófono, reducí el ruido y usá auriculares antes de repetir.",
			nextTarget: "Conseguir una captura evaluable antes de corregir la técnica.",
		};
	}

	const initialError = Math.abs(metrics.initialErrorCents ?? 0);
	if (
		initialError > 35 ||
		metrics.stabilizationTimeMs === null ||
		metrics.stabilizationTimeMs > 320
	) {
		const direction =
			metrics.onsetDirection === "below"
				? "por debajo"
				: metrics.onsetDirection === "above"
					? "por encima"
					: "cerca del centro";
		return {
			focus: "onset",
			observation: `La entrada comenzó ${direction} de la nota objetivo.`,
			evidence:
				metrics.stabilizationTimeMs === null
					? `El ataque empezó a ${rounded(metrics.initialErrorCents)} cents y no llegó a estabilizarse dentro de la tolerancia.`
					: `El ataque empezó a ${rounded(metrics.initialErrorCents)} cents y tardó ${Math.round(metrics.stabilizationTimeMs)} ms en estabilizarse.`,
			action:
				"Escuchá la referencia, dejá un instante de silencio y atacá con ‘mum’ sin deslizar.",
			nextTarget: "Entrar dentro de ±25 cents antes de 250 ms.",
		};
	}

	if ((metrics.medianAbsolutePitchErrorCents ?? 0) > 28) {
		return {
			focus: "pitch",
			observation: "La nota se sostuvo lejos del centro objetivo.",
			evidence: `El error central mediano fue de ${rounded(metrics.medianAbsolutePitchErrorCents)} cents.`,
			action:
				"Reducí el volumen y repetí sobre una vocal cómoda, escuchando mentalmente el centro antes de fonar.",
			nextTarget: "Mantener el error mediano por debajo de 25 cents.",
		};
	}

	if ((metrics.pitchStabilityMadCents ?? 0) > 18) {
		return {
			focus: "stability",
			observation: "La altura osciló más de lo esperado para un tono recto.",
			evidence: `La dispersión mediana fue de ${rounded(metrics.pitchStabilityMadCents)} cents.`,
			action:
				"Acortá la nota, mantené un volumen medio y buscá una emisión estable antes de aumentar duración.",
			nextTarget: "Reducir la dispersión por debajo de 18 cents.",
		};
	}

	if (Math.abs(metrics.phraseEndDriftCents ?? 0) > 22) {
		const direction = (metrics.phraseEndDriftCents ?? 0) < 0 ? "cayó" : "subió";
		return {
			focus: "phrase-end",
			observation: `La afinación ${direction} al final de la nota.`,
			evidence: `La deriva final fue de ${rounded(metrics.phraseEndDriftCents)} cents.`,
			action:
				"Planificá el final antes de empezar y terminá la nota mientras todavía queda aire cómodo.",
			nextTarget: "Cerrar con una deriva menor a ±20 cents.",
		};
	}

	return {
		focus: "success",
		observation: "El intento fue estable dentro de los criterios actuales.",
		evidence: `Error central ${rounded(metrics.medianAbsolutePitchErrorCents)} cents, estabilidad ${rounded(metrics.pitchStabilityMadCents)} cents y confianza ${Math.round(metrics.measurementConfidence * 100)}%.`,
		action: "Repetí una vez más sin aumentar volumen para confirmar que fue consistente.",
		nextTarget: "Repetir el resultado antes de subir dificultad.",
	};
}
