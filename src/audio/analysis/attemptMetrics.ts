import {
	centsBetween,
	median,
	medianAbsoluteDeviation,
} from "../pitch/pitchMath.ts";

export interface PitchObservation {
	timestampMs: number;
	frequencyHz: number | null;
	confidence: number;
	rms: number;
	voiceActive?: boolean;
}

export type OnsetDirection = "below" | "above" | "direct";

export interface PitchAttemptMetrics {
	evaluable: boolean;
	reason?: "not-enough-voice" | "pitch-unavailable" | "low-confidence";
	measurementConfidence: number;
	voicedFrameRatio: number;
	voiceActivityRatio?: number;
	pitchFrameRatio?: number;
	initialErrorCents: number | null;
	onsetDirection: OnsetDirection | null;
	stabilizationTimeMs: number | null;
	medianAbsolutePitchErrorCents: number | null;
	pitchStabilityMadCents: number | null;
	phraseEndDriftCents: number | null;
}

const MIN_FRAME_CONFIDENCE = 0.55;
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

function emptyMetrics(
	reason: PitchAttemptMetrics["reason"],
	overrides: Partial<PitchAttemptMetrics> = {},
): PitchAttemptMetrics {
	return {
		evaluable: false,
		reason,
		measurementConfidence: 0,
		voicedFrameRatio: 0,
		voiceActivityRatio: 0,
		pitchFrameRatio: 0,
		initialErrorCents: null,
		onsetDirection: null,
		stabilizationTimeMs: null,
		medianAbsolutePitchErrorCents: null,
		pitchStabilityMadCents: null,
		phraseEndDriftCents: null,
		...overrides,
	};
}

export function analyzePitchAttempt(
	observations: PitchObservation[],
	targetFrequencyHz: number,
): PitchAttemptMetrics {
	if (observations.length === 0) return emptyMetrics("not-enough-voice");

	const activeFrames = observations.filter(
		(observation) =>
			observation.voiceActive ??
			(observation.frequencyHz !== null && observation.frequencyHz > 0),
	);
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

	const voiceActivityRatio = activeFrames.length / observations.length;
	const voicedFrameRatio = voiced.length / observations.length;
	const pitchFrameRatio =
		activeFrames.length === 0 ? 0 : voiced.length / activeFrames.length;
	const confidenceAverage = average(voiced.map((frame) => frame.confidence));
	const measurementConfidence =
		confidenceAverage * Math.min(1, pitchFrameRatio / 0.65);
	const firstVoiced = voiced[0];

	if (activeFrames.length < 5 || voiceActivityRatio < 0.22) {
		return emptyMetrics("not-enough-voice", {
			measurementConfidence,
			voicedFrameRatio,
			voiceActivityRatio,
			pitchFrameRatio,
			initialErrorCents: firstVoiced?.cents ?? null,
			onsetDirection: firstVoiced
				? directionFromCents(firstVoiced.cents)
				: null,
		});
	}

	if (voiced.length < 5 || pitchFrameRatio < 0.22) {
		return emptyMetrics("pitch-unavailable", {
			measurementConfidence,
			voicedFrameRatio,
			voiceActivityRatio,
			pitchFrameRatio,
			initialErrorCents: firstVoiced?.cents ?? null,
			onsetDirection: firstVoiced
				? directionFromCents(firstVoiced.cents)
				: null,
		});
	}

	if (measurementConfidence < 0.38) {
		return emptyMetrics("low-confidence", {
			measurementConfidence,
			voicedFrameRatio,
			voiceActivityRatio,
			pitchFrameRatio,
			initialErrorCents: firstVoiced.cents,
			onsetDirection: directionFromCents(firstVoiced.cents),
		});
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
		voiceActivityRatio,
		pitchFrameRatio,
		initialErrorCents: voiced[0].cents,
		onsetDirection: directionFromCents(voiced[0].cents),
		stabilizationTimeMs,
		medianAbsolutePitchErrorCents: median(absoluteErrors),
		pitchStabilityMadCents: medianAbsoluteDeviation(centsValues),
		phraseEndDriftCents:
			center !== null && tailCenter !== null ? tailCenter - center : null,
	};
}
