export interface YinOptions {
	minFrequencyHz?: number;
	maxFrequencyHz?: number;
	threshold?: number;
	minConfidence?: number;
	minRms?: number;
}

export interface PitchDetection {
	frequencyHz: number;
	confidence: number;
	rms: number;
	periodSamples: number;
}

const DEFAULT_OPTIONS: Required<YinOptions> = {
	minFrequencyHz: 70,
	maxFrequencyHz: 1000,
	threshold: 0.15,
	minConfidence: 0.72,
	minRms: 0.008,
};

function calculateRms(buffer: Float32Array): number {
	if (buffer.length === 0) return 0;
	let sum = 0;
	for (const sample of buffer) sum += sample * sample;
	return Math.sqrt(sum / buffer.length);
}

function parabolicInterpolation(
	values: Float64Array,
	index: number,
): number {
	if (index <= 0 || index >= values.length - 1) return index;

	const left = values[index - 1];
	const center = values[index];
	const right = values[index + 1];
	const denominator = left - 2 * center + right;
	if (Math.abs(denominator) < Number.EPSILON) return index;

	const offset = 0.5 * (left - right) / denominator;
	return index + Math.max(-1, Math.min(1, offset));
}

export function detectPitchYin(
	buffer: Float32Array,
	sampleRate: number,
	options: YinOptions = {},
): PitchDetection | null {
	const config = { ...DEFAULT_OPTIONS, ...options };
	if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
		throw new Error(`Sample rate inválido: ${sampleRate}`);
	}
	if (buffer.length < 256) return null;

	const rms = calculateRms(buffer);
	if (rms < config.minRms) return null;

	const minTau = Math.max(2, Math.floor(sampleRate / config.maxFrequencyHz));
	const maxTau = Math.min(
		Math.floor(sampleRate / config.minFrequencyHz),
		Math.floor(buffer.length / 2),
	);
	if (minTau >= maxTau) return null;

	const analysisLength = buffer.length - maxTau;
	if (analysisLength < 64) return null;

	const difference = new Float64Array(maxTau + 1);
	for (let tau = 1; tau <= maxTau; tau += 1) {
		let sum = 0;
		for (let index = 0; index < analysisLength; index += 1) {
			const delta = buffer[index] - buffer[index + tau];
			sum += delta * delta;
		}
		difference[tau] = sum;
	}

	const normalized = new Float64Array(maxTau + 1);
	normalized[0] = 1;
	let runningSum = 0;
	for (let tau = 1; tau <= maxTau; tau += 1) {
		runningSum += difference[tau];
		normalized[tau] =
			runningSum === 0 ? 1 : (difference[tau] * tau) / runningSum;
	}

	let candidate = -1;
	for (let tau = minTau; tau <= maxTau; tau += 1) {
		if (normalized[tau] >= config.threshold) continue;
		candidate = tau;
		while (
			candidate + 1 <= maxTau &&
			normalized[candidate + 1] < normalized[candidate]
		) {
			candidate += 1;
		}
		break;
	}

	if (candidate === -1) {
		let bestValue = Number.POSITIVE_INFINITY;
		for (let tau = minTau; tau <= maxTau; tau += 1) {
			if (normalized[tau] < bestValue) {
				bestValue = normalized[tau];
				candidate = tau;
			}
		}
	}

	if (candidate < minTau) return null;
	const confidence = Math.max(0, Math.min(1, 1 - normalized[candidate]));
	if (confidence < config.minConfidence) return null;

	const refinedPeriod = parabolicInterpolation(normalized, candidate);
	if (!Number.isFinite(refinedPeriod) || refinedPeriod <= 0) return null;

	const frequencyHz = sampleRate / refinedPeriod;
	if (
		frequencyHz < config.minFrequencyHz ||
		frequencyHz > config.maxFrequencyHz
	) {
		return null;
	}

	return {
		frequencyHz,
		confidence,
		rms,
		periodSamples: refinedPeriod,
	};
}
