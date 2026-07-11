const A4_FREQUENCY = 440;
const A4_MIDI = 69;
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function frequencyToMidi(frequencyHz: number): number {
	if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
		throw new Error(`Frecuencia inválida: ${frequencyHz}`);
	}
	return A4_MIDI + 12 * Math.log2(frequencyHz / A4_FREQUENCY);
}

export function midiToFrequency(midiNote: number): number {
	if (!Number.isFinite(midiNote)) {
		throw new Error(`Nota MIDI inválida: ${midiNote}`);
	}
	return A4_FREQUENCY * 2 ** ((midiNote - A4_MIDI) / 12);
}

export function centsBetween(frequencyHz: number, targetFrequencyHz: number): number {
	if (frequencyHz <= 0 || targetFrequencyHz <= 0) {
		throw new Error("Las frecuencias deben ser mayores que cero.");
	}
	return 1200 * Math.log2(frequencyHz / targetFrequencyHz);
}

export function frequencyToNearestNote(frequencyHz: number): {
	midi: number;
	noteName: string;
	frequencyHz: number;
	cents: number;
} {
	const exactMidi = frequencyToMidi(frequencyHz);
	const midi = Math.round(exactMidi);
	const noteIndex = ((midi % 12) + 12) % 12;
	const octave = Math.floor(midi / 12) - 1;
	const targetFrequencyHz = midiToFrequency(midi);

	return {
		midi,
		noteName: `${NOTE_NAMES[noteIndex]}${octave}`,
		frequencyHz: targetFrequencyHz,
		cents: centsBetween(frequencyHz, targetFrequencyHz),
	};
}

export function median(values: number[]): number | null {
	const finite = values.filter(Number.isFinite).sort((left, right) => left - right);
	if (finite.length === 0) return null;
	const middle = Math.floor(finite.length / 2);
	return finite.length % 2 === 0
		? (finite[middle - 1] + finite[middle]) / 2
		: finite[middle];
}

export function medianAbsoluteDeviation(values: number[]): number | null {
	const center = median(values);
	if (center === null) return null;
	return median(values.map((value) => Math.abs(value - center)));
}
