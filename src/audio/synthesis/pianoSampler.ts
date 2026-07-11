const SAMPLE_BASE_URL = "https://tonejs.github.io/audio/salamander/";

interface PianoSampleDefinition {
	noteName: string;
	fileName: string;
	frequencyHz: number;
}

const PIANO_SAMPLES: PianoSampleDefinition[] = [
	{ noteName: "A2", fileName: "A2.mp3", frequencyHz: 110 },
	{ noteName: "C3", fileName: "C3.mp3", frequencyHz: 130.8128 },
	{ noteName: "D#3", fileName: "Ds3.mp3", frequencyHz: 155.5635 },
	{ noteName: "F#3", fileName: "Fs3.mp3", frequencyHz: 184.9972 },
	{ noteName: "A3", fileName: "A3.mp3", frequencyHz: 220 },
	{ noteName: "C4", fileName: "C4.mp3", frequencyHz: 261.6256 },
	{ noteName: "D#4", fileName: "Ds4.mp3", frequencyHz: 311.127 },
	{ noteName: "F#4", fileName: "Fs4.mp3", frequencyHz: 369.9944 },
	{ noteName: "A4", fileName: "A4.mp3", frequencyHz: 440 },
	{ noteName: "C5", fileName: "C5.mp3", frequencyHz: 523.2511 },
];

const decodedBufferCache = new Map<string, Promise<AudioBuffer>>();

export interface PianoPlayback {
	nodes: AudioNode[];
	source: AudioBufferSourceNode;
	endTime: number;
	sampleName: string;
}

function nearestSample(frequencyHz: number): PianoSampleDefinition {
	return PIANO_SAMPLES.reduce((closest, candidate) => {
		const closestDistance = Math.abs(
			1200 * Math.log2(frequencyHz / closest.frequencyHz),
		);
		const candidateDistance = Math.abs(
			1200 * Math.log2(frequencyHz / candidate.frequencyHz),
		);
		return candidateDistance < closestDistance ? candidate : closest;
	});
}

async function loadSample(
	context: AudioContext,
	sample: PianoSampleDefinition,
): Promise<AudioBuffer> {
	const url = `${SAMPLE_BASE_URL}${sample.fileName}`;
	const cacheKey = `${context.sampleRate}:${url}`;
	const existing = decodedBufferCache.get(cacheKey);
	if (existing) return existing;

	const promise = fetch(url, { mode: "cors", cache: "force-cache" })
		.then((response) => {
			if (!response.ok) {
				throw new Error(`No se pudo cargar la muestra ${sample.noteName}.`);
			}
			return response.arrayBuffer();
		})
		.then((arrayBuffer) => context.decodeAudioData(arrayBuffer.slice(0)));

	decodedBufferCache.set(cacheKey, promise);
	try {
		return await promise;
	} catch (error) {
		decodedBufferCache.delete(cacheKey);
		throw error;
	}
}

export async function preloadPianoForFrequencies(
	context: AudioContext,
	frequencies: number[],
): Promise<void> {
	const samples = new Map<string, PianoSampleDefinition>();
	for (const frequency of frequencies) {
		const sample = nearestSample(frequency);
		samples.set(sample.fileName, sample);
	}
	await Promise.all([...samples.values()].map((sample) => loadSample(context, sample)));
}

export async function playPianoNote(
	context: AudioContext,
	frequencyHz: number,
	when: number,
	durationSeconds: number,
	destination: AudioNode = context.destination,
): Promise<PianoPlayback> {
	const sample = nearestSample(frequencyHz);
	const buffer = await loadSample(context, sample);
	const source = context.createBufferSource();
	const gain = context.createGain();
	const filter = context.createBiquadFilter();
	const compressor = context.createDynamicsCompressor();

	source.buffer = buffer;
	source.playbackRate.setValueAtTime(frequencyHz / sample.frequencyHz, when);

	filter.type = "lowpass";
	filter.frequency.setValueAtTime(5200, when);
	filter.Q.setValueAtTime(0.35, when);

	compressor.threshold.setValueAtTime(-20, when);
	compressor.knee.setValueAtTime(18, when);
	compressor.ratio.setValueAtTime(2.2, when);
	compressor.attack.setValueAtTime(0.008, when);
	compressor.release.setValueAtTime(0.18, when);

	const playableDuration = Math.max(0.35, durationSeconds);
	const fadeStart = Math.max(when + 0.08, when + playableDuration - 0.12);
	const endTime = when + playableDuration;
	gain.gain.setValueAtTime(0.0001, when);
	gain.gain.exponentialRampToValueAtTime(0.7, when + 0.008);
	gain.gain.setValueAtTime(0.7, fadeStart);
	gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

	source.connect(filter);
	filter.connect(gain);
	gain.connect(compressor);
	compressor.connect(destination);
	source.start(when);
	source.stop(endTime + 0.03);

	return {
		nodes: [source, filter, gain, compressor],
		source,
		endTime,
		sampleName: sample.noteName,
	};
}

export const PIANO_SAMPLE_ATTRIBUTION = {
	instrument: "Salamander Grand Piano",
	license: "CC BY 3.0",
	sourceUrl: "https://github.com/sfzinstruments/SalamanderGrandPiano",
	sampleHost: SAMPLE_BASE_URL,
};
