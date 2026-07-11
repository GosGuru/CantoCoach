import { useCallback, useEffect, useRef, useState } from "react";
import { frequencyToNearestNote } from "../audio/pitch/pitchMath";
import { detectPitchYin } from "../audio/pitch/yin";

export type PitchMonitorStatus =
	| "idle"
	| "requesting"
	| "listening"
	| "error";

export interface LivePitchReading {
	frequencyHz: number;
	noteName: string;
	cents: number;
	confidence: number;
	rms: number;
	timestampMs: number;
}

interface UsePitchMonitorReturn {
	status: PitchMonitorStatus;
	reading: LivePitchReading | null;
	errorMessage: string | null;
	isSupported: boolean;
	start: () => Promise<void>;
	stop: () => void;
}

const FFT_SIZE = 4096;
const ANALYSIS_INTERVAL_MS = 45;

export function usePitchMonitor(): UsePitchMonitorReturn {
	const [status, setStatus] = useState<PitchMonitorStatus>("idle");
	const [reading, setReading] = useState<LivePitchReading | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const contextRef = useRef<AudioContext | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const frameRef = useRef<number | null>(null);
	const lastAnalysisRef = useRef(0);
	const missingFramesRef = useRef(0);
	const statusRef = useRef<PitchMonitorStatus>("idle");

	const isSupported =
		typeof navigator !== "undefined" &&
		Boolean(navigator.mediaDevices?.getUserMedia) &&
		typeof window !== "undefined" &&
		Boolean(
			window.AudioContext ||
				(
					window as unknown as {
						webkitAudioContext?: typeof AudioContext;
					}
				).webkitAudioContext,
		);

	const updateStatus = useCallback((nextStatus: PitchMonitorStatus) => {
		statusRef.current = nextStatus;
		setStatus(nextStatus);
	}, []);

	const stop = useCallback(() => {
		if (frameRef.current !== null) {
			cancelAnimationFrame(frameRef.current);
			frameRef.current = null;
		}

		try {
			sourceRef.current?.disconnect();
			analyserRef.current?.disconnect();
		} catch {
			// Nodes may already be disconnected.
		}

		for (const track of streamRef.current?.getTracks() ?? []) track.stop();
		if (contextRef.current) void contextRef.current.close();

		contextRef.current = null;
		streamRef.current = null;
		sourceRef.current = null;
		analyserRef.current = null;
		missingFramesRef.current = 0;
		setReading(null);
		updateStatus("idle");
	}, [updateStatus]);

	const analyze = useCallback(() => {
		if (statusRef.current !== "listening") return;
		const analyser = analyserRef.current;
		const context = contextRef.current;
		if (!analyser || !context) return;

		const now = performance.now();
		if (now - lastAnalysisRef.current >= ANALYSIS_INTERVAL_MS) {
			lastAnalysisRef.current = now;
			const samples = new Float32Array(analyser.fftSize);
			analyser.getFloatTimeDomainData(samples);
			const detection = detectPitchYin(samples, context.sampleRate, {
				minFrequencyHz: 70,
				maxFrequencyHz: 800,
				minConfidence: 0.72,
			});

			if (detection) {
				missingFramesRef.current = 0;
				const note = frequencyToNearestNote(detection.frequencyHz);
				setReading({
					frequencyHz: detection.frequencyHz,
					noteName: note.noteName,
					cents: note.cents,
					confidence: detection.confidence,
					rms: detection.rms,
					timestampMs: now,
				});
			} else {
				missingFramesRef.current += 1;
				if (missingFramesRef.current >= 4) setReading(null);
			}
		}

		frameRef.current = requestAnimationFrame(analyze);
	}, []);

	const start = useCallback(async () => {
		if (!isSupported || statusRef.current === "requesting") return;
		stop();
		updateStatus("requesting");
		setErrorMessage(null);

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: false,
				audio: {
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
					channelCount: 1,
				},
			});

			const AudioContextClass =
				window.AudioContext ||
				(
					window as unknown as {
						webkitAudioContext?: typeof AudioContext;
					}
				).webkitAudioContext;
			if (!AudioContextClass) throw new Error("Web Audio no está disponible.");

			const context = new AudioContextClass();
			if (context.state === "suspended") await context.resume();
			const source = context.createMediaStreamSource(stream);
			const analyser = context.createAnalyser();
			analyser.fftSize = FFT_SIZE;
			analyser.smoothingTimeConstant = 0;
			source.connect(analyser);

			streamRef.current = stream;
			contextRef.current = context;
			sourceRef.current = source;
			analyserRef.current = analyser;
			lastAnalysisRef.current = 0;
			updateStatus("listening");
			frameRef.current = requestAnimationFrame(analyze);
		} catch (error) {
			stop();
			updateStatus("error");
			setErrorMessage(
				error instanceof DOMException && error.name === "NotAllowedError"
					? "No se concedió permiso para usar el micrófono."
					: "No se pudo iniciar la escucha del micrófono.",
			);
		}
	}, [analyze, isSupported, stop, updateStatus]);

	useEffect(() => stop, [stop]);

	return {
		status,
		reading,
		errorMessage,
		isSupported,
		start,
		stop,
	};
}
