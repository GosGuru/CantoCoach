const SAMPLE_BASE_URL = "https://tonejs.github.io/audio/salamander/";

interface PianoSampleDefinition {
	noteName: string;
	fileName: string;
	frequencyHz: number;
}

const PIANO_SAMPLES: PianoSampleDefinition[] = [
	{ noteName: "C2", fileName: "C2.mp3", frequencyHz: 65.4064 },
	{ noteName: "D#2", fileName: "Ds2.mp3", frequencyHz: 77.7817 },
	{ noteName: "F#2", fileName: "Fs2.mp3", frequencyHz: 92.4986 },
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
	{ noteName: "D#5", fileName: "Ds5.mp3", frequencyHz: 622.254 },
	{ noteName: "F#5", fileName: "Fs5.mp3", frequencyHz: 739.9888 },
];

const decodedBufferCache = new Map<string, Promise<AudioBuffer>>();
const pianoBusCache = new WeakMap<AudioContext, PianoBus>();

interface PianoBus {
	input: GainNode;
}

export interface PianoPlayback {
	nodes: AudioNode[];
	source: AudioBufferSourceNode;
	endTime: number;
	sampleName: string;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
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

function createRoomImpulse(context: AudioContext): AudioBuffer {
	const durationSeconds = 1.35;
	const length = Math.ceil(context.sampleRate * durationSeconds);
	const impulse = context.createBuffer(2, length, context.sampleRate);
	for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
		const data = impulse.getChannelData(channel);
		for (let index = 0; index < length; index += 1) {
			const time = index / context.sampleRate;
			const decay = Math.exp(-time * 4.6);
			const earlyReflection =
				index === Math.round(context.sampleRate * (channel === 0 ? 0.019 : 0.027))
					? 0.32
					: 0;
			data[index] = (Math.random() * 2 - 1) * decay * 0.23 + earlyReflection;
		}
	}
	return impulse;
}

function getPianoBus(
	context: AudioContext,
	destination: AudioNode,
): PianoBus {
	const existing = pianoBusCache.get(context);
	if (existing) return existing;

	const input = context.createGain();
	const highpass = context.createBiquadFilter();
	const presence = context.createBiquadFilter();
	const dry = context.createGain();
	const convolver = context.createConvolver();
	const wet = context.createGain();
	const compressor = context.createDynamicsCompressor();

	highpass.type = "highpass";
	highpass.frequency.value = 34;
	highpass.Q.value = 0.55;
	presence.type = "peaking";
	presence.frequency.value = 2600;
	presence.Q.value = 0.7;
	presence.gain.value = 1.4;
	dry.gain.value = 0.94;
	convolver.buffer = createRoomImpulse(context);
	wet.gain.value = 0.105;
	compressor.threshold.value = -8;
	compressor.knee.value = 12;
	compressor.ratio.value = 1.35;
	compressor.attack.value = 0.018;
	compressor.release.value = 0.32;

	input.connect(highpass);
	highpass.connect(presence);
	presence.connect(dry);
	dry.connect(compressor);
	presence.connect(convolver);
	convolver.connect(wet);
	wet.connect(compressor);
	compressor.connect(destination);

	const bus = { input };
	pianoBusCache.set(context, bus);
	return bus;
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
	const noteGain = context.createGain();
	const panner = context.createStereoPanner();
	const bus = getPianoBus(context, destination);
	const playbackRate = frequencyHz / sample.frequencyHz;

	source.buffer = buffer;
	source.playbackRate.setValueAtTime(playbackRate, when);
	panner.pan.setValueAtTime(
		clamp(Math.log2(frequencyHz / 220) * 0.16, -0.22, 0.22),
		when,
	);

	const naturalAvailableSeconds = buffer.duration / playbackRate;
	const keyDuration = Math.max(0.32, durationSeconds);
	const releaseTailSeconds = clamp(0.85 + keyDuration * 0.2, 0.95, 1.55);
	const playableDuration = Math.min(
		Math.max(0.45, naturalAvailableSeconds - 0.04),
		keyDuration + releaseTailSeconds,
	);
	const endTime = when + playableDuration;
	const fadeStart = Math.max(when + 0.18, endTime - 0.28);
	const velocityVariation = ((Math.round(frequencyHz * 10) % 7) - 3) * 0.012;
	const velocity = clamp(0.74 + velocityVariation, 0.66, 0.82);

	// Preserve the recorded hammer transient instead of fading it in slowly.
	noteGain.gain.setValueAtTime(velocity, when);
	noteGain.gain.setValueAtTime(velocity, fadeStart);
	noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

	source.connect(noteGain);
	noteGain.connect(panner);
	panner.connect(bus.input);
	source.start(when);
	source.stop(endTime + 0.035);

	return {
		nodes: [source, noteGain, panner],
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
