import {
	centsBetween,
	median,
	medianAbsoluteDeviation,
} from "../pitch/pitchMath";

export interface PitchObservation {
	timestampMs: number;
	frequencyHz: number | null;
	confidence: number;
	rms: number;
}

export type OnsetDirection = "below" | "above" | "direct";

export interface PitchAttemptMetrics {
	evaluable: boolean;
	reason?: "not-enough-voice" | "low-confidence";
	measurementConfidence: number;
	voicedFrameRatio: number;
	initialErrorCents: number | null;
	onsetDirection: OnsetDirection | null;
	stabilizationTimeMs: number | null;
	medianAbsolutePitchErrorCents: number | null;
	pitchStabilityMadCents: number | null;
	phraseEndDriftCents: number | null;
}

const MIN_FRAME_CONFIDENCE = 0.7;
const TARGET_TOLERANCE_CENTS = 25;
const STABLE_FRAME_COUNT = 3;

function directionFromCents(cents: number): OnsetDirection {
	if (cents < -15) return "below";
	if (cents > 15) return "above";
	return "direct";
}

function average(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function analyzePitchAttempt(
	observations: PitchObservation[],
	targetFrequencyHz: number,
): PitchAttemptMetrics {
	if (observations.length === 0) {
		return {
			evaluable: false,
			reason: "not-enough-voice",
			measurementConfidence: 0,
			voicedFrameRatio: 0,
			initialErrorCents: null,
			onsetDirection: null,
			stabilizationTimeMs: null,
			medianAbsolutePitchErrorCents: null,
			pitchStabilityMadCents: null,
			phraseEndDriftCents: null,
		};
	}

	const voiced = observations
		.map((observation, index) => ({ observation, index }))
		.filter(
			({ observation }) =>
				observation.frequencyHz !== null &&
				observation.frequencyHz > 0 &&
				observation.confidence >= MIN_FRAME_CONFIDENCE,
		)
		.map(({ observation, index }) => ({
			...observation,
			index,
			frequencyHz: observation.frequencyHz as number,
			cents: centsBetween(observation.frequencyHz as number, targetFrequencyHz),
		}));

	const voicedFrameRatio = voiced.length / observations.length;
	const confidenceAverage = average(voiced.map((frame) => frame.confidence));
	const measurementConfidence = confidenceAverage * voicedFrameRatio;

	if (voiced.length < 5 || voicedFrameRatio < 0.35) {
		return {
			evaluable: false,
			reason: "not-enough-voice",
			measurementConfidence,
			voicedFrameRatio,
			initialErrorCents: voiced[0]?.cents ?? null,
			onsetDirection: voiced[0] ? directionFromCents(voiced[0].cents) : null,
			stabilizationTimeMs: null,
			medianAbsolutePitchErrorCents: null,
			pitchStabilityMadCents: null,
			phraseEndDriftCents: null,
		};
	}

	if (measurementConfidence < 0.45) {
		return {
			evaluable: false,
			reason: "low-confidence",
			measurementConfidence,
			voicedFrameRatio,
			initialErrorCents: voiced[0].cents,
			onsetDirection: directionFromCents(voiced[0].cents),
			stabilizationTimeMs: null,
			medianAbsolutePitchErrorCents: null,
			pitchStabilityMadCents: null,
			phraseEndDriftCents: null,
		};
	}

	let stableStart = -1;
	for (let index = 0; index <= voiced.length - STABLE_FRAME_COUNT; index += 1) {
		const window = voiced.slice(index, index + STABLE_FRAME_COUNT);
		if (window.every((frame) => Math.abs(frame.cents) <= TARGET_TOLERANCE_CENTS)) {
			stableStart = index;
			break;
		}
	}

	const firstTimestamp = voiced[0].timestampMs;
	const stabilizationTimeMs =
		stableStart >= 0 ? voiced[stableStart].timestampMs - firstTimestamp : null;
	const analysisFrames = stableStart >= 0 ? voiced.slice(stableStart) : voiced;
	const centsValues = analysisFrames.map((frame) => frame.cents);
	const absoluteErrors = centsValues.map(Math.abs);
	const center = median(centsValues);
	const tailLength = Math.max(3, Math.ceil(centsValues.length * 0.2));
	const tailCenter = median(centsValues.slice(-tailLength));

	return {
		evaluable: true,
		measurementConfidence,
		voicedFrameRatio,
		initialErrorCents: voiced[0].cents,
		onsetDirection: directionFromCents(voiced[0].cents),
		stabilizationTimeMs,
		medianAbsolutePitchErrorCents: median(absoluteErrors),
		pitchStabilityMadCents: medianAbsoluteDeviation(centsValues),
		phraseEndDriftCents:
			center !== null && tailCenter !== null ? tailCenter - center : null,
	};
}
