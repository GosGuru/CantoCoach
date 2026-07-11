import { centsBetween, median } from "./pitchMath.ts";

export interface PitchContinuityState {
	recentFrequencies: number[];
}

export function createPitchContinuityState(): PitchContinuityState {
	return { recentFrequencies: [] };
}

function candidatesFor(frequencyHz: number): number[] {
	return [frequencyHz / 2, frequencyHz, frequencyHz * 2].filter(
		(candidate) => candidate >= 65 && candidate <= 800,
	);
}

export function stabilizePitchFrequency(
	frequencyHz: number,
	targetFrequencyHz: number,
	state: PitchContinuityState,
): number {
	const candidates = candidatesFor(frequencyHz);
	const previous = median(state.recentFrequencies.slice(-4));
	let selected = frequencyHz;

	if (previous !== null) {
		selected = candidates.reduce((closest, candidate) =>
			Math.abs(centsBetween(candidate, previous)) <
			Math.abs(centsBetween(closest, previous))
				? candidate
				: closest,
		);
	} else {
		const rawDistance = Math.abs(centsBetween(frequencyHz, targetFrequencyHz));
		const targetClosest = candidates.reduce((closest, candidate) =>
			Math.abs(centsBetween(candidate, targetFrequencyHz)) <
			Math.abs(centsBetween(closest, targetFrequencyHz))
				? candidate
				: closest,
		);
		const correctedDistance = Math.abs(
			centsBetween(targetClosest, targetFrequencyHz),
		);
		if (rawDistance > 900 && correctedDistance + 250 < rawDistance) {
			selected = targetClosest;
		}
	}

	state.recentFrequencies.push(selected);
	if (state.recentFrequencies.length > 6) state.recentFrequencies.shift();
	return median(state.recentFrequencies.slice(-3)) ?? selected;
}
