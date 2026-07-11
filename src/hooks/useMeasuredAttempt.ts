import { useCallback, useEffect, useRef, useState } from "react";
import {
	analyzePitchAttempt,
	type PitchObservation,
} from "../audio/analysis/attemptMetrics.ts";
import { buildTechnicalFeedback } from "../audio/analysis/technicalFeedback.ts";
import { frequencyToNearestNote, median } from "../audio/pitch/pitchMath.ts";
import { detectPitchYin } from "../audio/pitch/yin.ts";
import type { AttemptTarget, ExerciseAttemptRecord } from "../types/attempt.ts";
import { getLocalDateKey } from "../utils/localDate.ts";

export type MeasuredAttemptStatus =
	| "idle"
	| "requesting"
	| "calibrating"
	| "countdown"
	| "recording"
	| "analyzing"
	| "complete"
	| "error";

export interface LiveAttemptReading {
	frequencyHz: number;
	noteName: string;
	cents: number;
	confidence: number;
}

interface StartAttemptOptions {
	target: AttemptTarget;
	previousAttemptId?: string;
}

interface UseMeasuredAttemptReturn {
	status: MeasuredAttemptStatus;
	countdown: number | null;
	progress: number;
	hasVoiceStarted: boolean;
	reading: LiveAttemptReading | null;
	result: ExerciseAttemptRecord | null;
	errorMessage: string | null;
	isSupported: boolean;
	start: (options: StartAttemptOptions) => Promise<void>;
	cancel: () => void;
	reset: () => void;
}

const FFT_SIZE = 4096;
const ANALYSIS_INTERVAL_MS = 45;
const CALIBRATION_DURATION_MS = 1100;
const COUNTDOWN_SECONDS = 2;
const MAX_VOICE_START_WAIT_MS = 3500;

function calculateRms(buffer: Float32Array): number {
	if (buffer.length === 0) return 0;
	let sum = 0;
	for (const sample of buffer) sum += sample * sample;
	return Math.sqrt(sum / buffer.length);
}

function isClipped(buffer: Float32Array): boolean {
	for (const sample of buffer) {
		if (Math.abs(sample) >= 0.985) return true;
	}
	return false;
}

export function useMeasuredAttempt(
	exerciseId: string,
	practiceSessionId: string,
	durationMs = 6000,
): UseMeasuredAttemptReturn {
	const [status, setStatus] = useState<MeasuredAttemptStatus>("idle");
	const [countdown, setCountdown] = useState<number | null>(null);
	const [progress, setProgress] = useState(0);
	const [hasVoiceStarted, setHasVoiceStarted] = useState(false);
	const [reading, setReading] = useState<LiveAttemptReading | null>(null);
	const [result, setResult] = useState<ExerciseAttemptRecord | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const statusRef = useRef<MeasuredAttemptStatus>("idle");
	const streamRef = useRef<MediaStream | null>(null);
	const contextRef = useRef<AudioContext | null>(null);
	const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const sampleTimerRef = useRef<number | null>(null);
	const phaseTimerRef = useRef<number | null>(null);
	const countdownTimerRef = useRef<number | null>(null);
	const runTokenRef = useRef(0);

	const isSupported =
		typeof navigator !== "undefined" &&
		Boolean(navigator.mediaDevices?.getUserMedia) &&
		typeof window !== "undefined" &&
		Boolean(
			window.AudioContext ||
				(window as unknown as { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext,
		);

	const updateStatus = useCallback((next: MeasuredAttemptStatus) => {
		statusRef.current = next;
		setStatus(next);
	}, []);

	const releaseResources = useCallback(() => {
		if (sampleTimerRef.current !== null) {
			window.clearInterval(sampleTimerRef.current);
			sampleTimerRef.current = null;
		}
		if (phaseTimerRef.current !== null) {
			window.clearTimeout(phaseTimerRef.current);
			phaseTimerRef.current = null;
		}
		if (countdownTimerRef.current !== null) {
			window.clearInterval(countdownTimerRef.current);
			countdownTimerRef.current = null;
		}

		try {
			sourceRef.current?.disconnect();
			analyserRef.current?.disconnect();
		} catch {
			// Nodes may already be disconnected.
		}

		for (const track of streamRef.current?.getTracks() ?? []) track.stop();
		if (contextRef.current) void contextRef.current.close();

		streamRef.current = null;
		contextRef.current = null;
		sourceRef.current = null;
		analyserRef.current = null;
	}, []);

	const cancel = useCallback(() => {
		runTokenRef.current += 1;
		releaseResources();
		setCountdown(null);
		setProgress(0);
		setHasVoiceStarted(false);
		setReading(null);
		setErrorMessage(null);
		updateStatus("idle");
	}, [releaseResources, updateStatus]);

	const reset = useCallback(() => {
		cancel();
		setResult(null);
	}, [cancel]);

	const start = useCallback(
		async ({ target, previousAttemptId }: StartAttemptOptions) => {
			if (!isSupported || statusRef.current === "requesting") return;

			const token = runTokenRef.current + 1;
			runTokenRef.current = token;
			releaseResources();
			setResult(null);
			setReading(null);
			setProgress(0);
			setHasVoiceStarted(false);
			setCountdown(null);
			setErrorMessage(null);
			updateStatus("requesting");

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

				if (runTokenRef.current !== token) {
					for (const track of stream.getTracks()) track.stop();
					return;
				}

				const AudioContextClass =
					window.AudioContext ||
					(window as unknown as { webkitAudioContext?: typeof AudioContext })
						.webkitAudioContext;
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

				const calibrationSamples: number[] = [];
				const observations: PitchObservation[] = [];
				let noiseFloorRms = 0.006;
				let recordingWindowOpenedAt = 0;
				let voiceStartedAt: number | null = null;
				let totalFrames = 0;
				let clippedFrames = 0;

				const finalize = () => {
					if (statusRef.current !== "recording") return;
					updateStatus("analyzing");
					const metrics = analyzePitchAttempt(observations, target.frequencyHz);
					const feedback = buildTechnicalFeedback(metrics);
					const actualDurationMs = voiceStartedAt
						? Math.min(durationMs, performance.now() - voiceStartedAt)
						: 0;
					const record: ExerciseAttemptRecord = {
						id: crypto.randomUUID(),
						version: 1,
						practiceSessionId,
						exerciseId,
						localDate: getLocalDateKey(),
						createdAt: new Date().toISOString(),
						durationMs: actualDurationMs,
						target,
						observations,
						metrics,
						feedback,
						captureQuality: {
							noiseFloorRms,
							clippedFrameRatio:
								totalFrames === 0 ? 0 : clippedFrames / totalFrames,
							sampleRate: context.sampleRate,
							analysisIntervalMs: ANALYSIS_INTERVAL_MS,
						},
						completionMode: "measured",
						previousAttemptId,
					};

					releaseResources();
					setProgress(voiceStartedAt ? 1 : 0);
					setCountdown(null);
					setReading(null);
					setResult(record);
					updateStatus("complete");
				};

				const beginRecording = () => {
					if (runTokenRef.current !== token) return;
					setCountdown(null);
					setProgress(0);
					setHasVoiceStarted(false);
					setReading(null);
					recordingWindowOpenedAt = performance.now();
					voiceStartedAt = null;
					updateStatus("recording");
				};

				const beginCountdown = () => {
					if (runTokenRef.current !== token) return;
					noiseFloorRms = Math.max(0.001, median(calibrationSamples) ?? 0.006);
					updateStatus("countdown");
					let remaining = COUNTDOWN_SECONDS;
					setCountdown(remaining);
					countdownTimerRef.current = window.setInterval(() => {
						remaining -= 1;
						if (remaining <= 0) {
							if (countdownTimerRef.current !== null) {
								window.clearInterval(countdownTimerRef.current);
								countdownTimerRef.current = null;
							}
							beginRecording();
							return;
						}
						setCountdown(remaining);
					}, 1000);
				};

				updateStatus("calibrating");
				phaseTimerRef.current = window.setTimeout(
					beginCountdown,
					CALIBRATION_DURATION_MS,
				);

				sampleTimerRef.current = window.setInterval(() => {
					const activeAnalyser = analyserRef.current;
					if (!activeAnalyser || runTokenRef.current !== token) return;
					const samples = new Float32Array(activeAnalyser.fftSize);
					activeAnalyser.getFloatTimeDomainData(samples);
					const rms = calculateRms(samples);

					if (statusRef.current === "calibrating") {
						calibrationSamples.push(rms);
						return;
					}
					if (statusRef.current !== "recording") return;

					const now = performance.now();
					const detection = detectPitchYin(samples, context.sampleRate, {
						minFrequencyHz: 70,
						maxFrequencyHz: 800,
						minConfidence: 0.68,
						minRms: Math.max(0.0045, noiseFloorRms * 1.9),
					});

					if (voiceStartedAt === null) {
						if (detection) {
							voiceStartedAt = now;
							setHasVoiceStarted(true);
						} else if (now - recordingWindowOpenedAt >= MAX_VOICE_START_WAIT_MS) {
							finalize();
							return;
						} else {
							setProgress(0);
							setReading(null);
							return;
						}
					}

					const timestampMs = now - voiceStartedAt;
					totalFrames += 1;
					if (isClipped(samples)) clippedFrames += 1;
					observations.push({
						timestampMs,
						frequencyHz: detection?.frequencyHz ?? null,
						confidence: detection?.confidence ?? 0,
						rms,
					});

					if (detection) {
						const nearest = frequencyToNearestNote(detection.frequencyHz);
						setReading({
							frequencyHz: detection.frequencyHz,
							noteName: nearest.noteName,
							cents: nearest.cents,
							confidence: detection.confidence,
						});
					} else {
						setReading(null);
					}

					setProgress(Math.min(1, timestampMs / durationMs));
					if (timestampMs >= durationMs) finalize();
				}, ANALYSIS_INTERVAL_MS);
			} catch (error) {
				releaseResources();
				updateStatus("error");
				setErrorMessage(
					error instanceof DOMException && error.name === "NotAllowedError"
						? "No se concedió permiso para usar el micrófono."
						: "No se pudo iniciar la captura del intento.",
				);
			}
		},
		[
			durationMs,
			exerciseId,
			isSupported,
			practiceSessionId,
			releaseResources,
			updateStatus,
		],
	);

	useEffect(() => {
		return () => {
			runTokenRef.current += 1;
			releaseResources();
		};
	}, [releaseResources]);

	return {
		status,
		countdown,
		progress,
		hasVoiceStarted,
		reading,
		result,
		errorMessage,
		isSupported,
		start,
		cancel,
		reset,
	};
}
