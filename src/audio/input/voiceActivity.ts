export interface CalibrationProfile {
	noiseFloorRms: number;
	ambientRms: number;
	voiceThresholdRms: number;
	highNoise: boolean;
}

export interface VoiceActivityInput {
	rms: number;
	peak: number;
	pitchConfidence?: number;
}

export interface VoiceActivityResult {
	active: boolean;
	score: number;
	levelRatio: number;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function percentile(values: number[], ratio: number): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((left, right) => left - right);
	const position = clamp(ratio, 0, 1) * (sorted.length - 1);
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	if (lower === upper) return sorted[lower];
	const weight = position - lower;
	return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function buildCalibrationProfile(samples: number[]): CalibrationProfile {
	const usable = samples.filter((sample) => Number.isFinite(sample) && sample >= 0);
	const fallback = 0.004;
	const noiseFloorRms = Math.max(0.0008, percentile(usable, 0.25) || fallback);
	const ambientRms = Math.max(noiseFloorRms, percentile(usable, 0.5) || fallback);
	const additiveMargin = noiseFloorRms < 0.01 ? 0.0022 : noiseFloorRms * 0.45;
	const voiceThresholdRms = clamp(
		Math.max(noiseFloorRms * 1.55, noiseFloorRms + additiveMargin),
		0.0032,
		0.07,
	);

	return {
		noiseFloorRms,
		ambientRms,
		voiceThresholdRms,
		highNoise: ambientRms >= 0.035,
	};
}

export function evaluateVoiceActivity(
	input: VoiceActivityInput,
	profile: CalibrationProfile,
): VoiceActivityResult {
	const safeNoiseFloor = Math.max(profile.noiseFloorRms, 0.0008);
	const levelRatio = input.rms / safeNoiseFloor;
	const energyScore = clamp(
		(input.rms - safeNoiseFloor) /
			Math.max(profile.voiceThresholdRms - safeNoiseFloor, 0.001),
		0,
		1.5,
	);
	const peakThreshold = Math.max(0.018, profile.voiceThresholdRms * 2.6);
	const peakScore = clamp(input.peak / peakThreshold, 0, 1.3);
	const pitchScore = clamp((input.pitchConfidence ?? 0) / 0.55, 0, 1.2);
	const score = energyScore * 0.55 + peakScore * 0.2 + pitchScore * 0.25;

	const energyBacked = input.rms >= profile.voiceThresholdRms && input.peak >= 0.012;
	const pitchBacked =
		(input.pitchConfidence ?? 0) >= 0.42 &&
		input.rms >= Math.max(0.0025, safeNoiseFloor * 1.12);
	const transientBacked =
		input.peak >= peakThreshold && input.rms >= Math.max(0.0028, safeNoiseFloor * 1.25);

	return {
		active: energyBacked || pitchBacked || transientBacked || score >= 0.82,
		score,
		levelRatio,
	};
}

export function smoothNoiseFloor(
	current: CalibrationProfile,
	rms: number,
): CalibrationProfile {
	if (!Number.isFinite(rms) || rms < 0 || rms > current.voiceThresholdRms) {
		return current;
	}
	const nextFloor = current.noiseFloorRms * 0.96 + rms * 0.04;
	const additiveMargin = nextFloor < 0.01 ? 0.0022 : nextFloor * 0.45;
	return {
		...current,
		noiseFloorRms: nextFloor,
		voiceThresholdRms: clamp(
			Math.max(nextFloor * 1.55, nextFloor + additiveMargin),
			0.0032,
			0.07,
		),
	};
}
