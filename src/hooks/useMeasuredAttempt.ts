import { useCallback, useEffect, useRef, useState } from "react";
import {
	analyzePitchAttempt,
	type PitchObservation,
} from "../audio/analysis/attemptMetrics.ts";
import { buildTechnicalFeedback } from "../audio/analysis/technicalFeedback.ts";
import {
	buildCalibrationProfile,
	evaluateVoiceActivity,
	smoothNoiseFloor,
	type CalibrationProfile,
} from "../audio/input/voiceActivity.ts";
import {
	createPitchContinuityState,
	stabilizePitchFrequency,
} from "../audio/pitch/pitchContinuity.ts";
import { frequencyToNearestNote } from "../audio/pitch/pitchMath.ts";
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

export type InputSignalState =
	| "idle"
	| "quiet"
	| "low"
	| "voice"
	| "noisy"
	| "clipping";

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
	inputLevel: number;
	inputState: InputSignalState;
	reading: LiveAttemptReading | null;
	result: ExerciseAttemptRecord | null;
	errorMessage: string | null;
	isSupported: boolean;
	start: (options: StartAttemptOptions) => Promise<void>;
	cancel: () => void;
	reset: () => void;
}

interface BufferedObservation {
	capturedAt: number;
	observation: PitchObservation;
	clipped: boolean;
}

const FFT_SIZE = 4096;
const ANALYSIS_INTERVAL_MS = 35;
const CALIBRATION_DURATION_MS = 900;
const COUNTDOWN_SECONDS = 2;
const MAX_VOICE_START_WAIT_MS = 6000;
const PRE_ROLL_MS = 320;
const REQUIRED_ACTIVE_FRAMES = 2;

function calculateRms(buffer: Float32Array): number {
	if (buffer.length === 0) return 0;
	let sum = 0;
	for (const sample of buffer) sum += sample * sample;
	return Math.sqrt(sum / buffer.length);
}

function calculatePeak(buffer: Float32Array): number {
	let peak = 0;
	for (const sample of buffer) peak = Math.max(peak, Math.abs(sample));
	return peak;
}

function signalLevel(rms: number, profile: CalibrationProfile): number {
	return Math.max(
		0,
		Math.min(1, rms / Math.max(profile.voiceThresholdRms * 2.6, 0.018)),
	);
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
	const [inputLevel, setInputLevel] = useState(0);
	const [inputState, setInputState] = useState<InputSignalState>("idle");
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
		setInputLevel(0);
		setInputState("idle");
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
			setInputLevel(0);
			setInputState("quiet");
			setCountdown(null);
			setErrorMessage(null);
			updateStatus("requesting");

			try {
				let stream: MediaStream;
				try {
					stream = await navigator.mediaDevices.getUserMedia({
						video: false,
						audio: {
							echoCancellation: { ideal: true },
							noiseSuppression: { ideal: false },
							autoGainControl: { ideal: true },
							channelCount: { ideal: 1 },
						},
					});
				} catch (constraintError) {
					if (
						constraintError instanceof DOMException &&
						constraintError.name === "NotAllowedError"
					) {
						throw constraintError;
					}
					stream = await navigator.mediaDevices.getUserMedia({
						video: false,
						audio: true,
					});
				}

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
				const preRoll: BufferedObservation[] = [];
				const pitchContinuity = createPitchContinuityState();
				let profile = buildCalibrationProfile([]);
				let recordingWindowOpenedAt = 0;
				let voiceStartedAt: number | null = null;
				let activeFrameStreak = 0;
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
							noiseFloorRms: profile.noiseFloorRms,
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
					setInputLevel(0);
					setInputState("idle");
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
					activeFrameStreak = 0;
					preRoll.length = 0;
					updateStatus("recording");
				};

				const beginCountdown = () => {
					if (runTokenRef.current !== token) return;
					profile = buildCalibrationProfile(calibrationSamples);
					setInputState(profile.highNoise ? "noisy" : "quiet");
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
					const peak = calculatePeak(samples);
					const clipped = peak >= 0.985;

					if (statusRef.current === "calibrating") {
						calibrationSamples.push(rms);
						const provisional = buildCalibrationProfile(calibrationSamples);
						setInputLevel(signalLevel(rms, provisional));
						setInputState(clipped ? "clipping" : provisional.highNoise ? "noisy" : "quiet");
						return;
					}

					setInputLevel(signalLevel(rms, profile));
					if (statusRef.current === "countdown") {
						setInputState(clipped ? "clipping" : profile.highNoise ? "noisy" : "quiet");
						return;
					}
					if (statusRef.current !== "recording") return;

					const now = performance.now();
					const rawDetection = detectPitchYin(samples, context.sampleRate, {
						minFrequencyHz: 65,
						maxFrequencyHz: 800,
						threshold: 0.22,
						minConfidence: 0.44,
						minRms: Math.max(0.0022, profile.noiseFloorRms * 1.05),
					});
					const stabilizedFrequency = rawDetection
						? stabilizePitchFrequency(
								rawDetection.frequencyHz,
								target.frequencyHz,
								pitchContinuity,
							)
						: null;
					const activity = evaluateVoiceActivity(
						{
							rms,
							peak,
							pitchConfidence: rawDetection?.confidence,
						},
						profile,
					);
					const observation: PitchObservation = {
						timestampMs: 0,
						frequencyHz: stabilizedFrequency,
						confidence: rawDetection?.confidence ?? 0,
						rms,
						voiceActive: activity.active,
					};

					setInputState(
						clipped
							? "clipping"
							: activity.active
								? "voice"
								: rms >= profile.noiseFloorRms * 1.15
									? "low"
									: profile.highNoise
										? "noisy"
										: "quiet",
					);

					if (voiceStartedAt === null) {
						if (!activity.active) profile = smoothNoiseFloor(profile, rms);
						preRoll.push({ capturedAt: now, observation, clipped });
						while (
							preRoll.length > 0 &&
							now - preRoll[0].capturedAt > PRE_ROLL_MS
						) {
							preRoll.shift();
						}
						activeFrameStreak = activity.active
							? activeFrameStreak + 1
							: Math.max(0, activeFrameStreak - 1);

						if (activeFrameStreak >= REQUIRED_ACTIVE_FRAMES) {
							const firstActiveIndex = Math.max(0, preRoll.length - 6);
							const selectedPreRoll = preRoll.slice(firstActiveIndex);
							voiceStartedAt = selectedPreRoll[0]?.capturedAt ?? now;
							for (const buffered of selectedPreRoll) {
								observations.push({
									...buffered.observation,
									timestampMs: buffered.capturedAt - voiceStartedAt,
								});
								totalFrames += 1;
								if (buffered.clipped) clippedFrames += 1;
							}
							setHasVoiceStarted(true);
						} else if (now - recordingWindowOpenedAt >= MAX_VOICE_START_WAIT_MS) {
							finalize();
							return;
						} else {
							setProgress(0);
							setReading(null);
							return;
						}
					} else {
						const timestampMs = now - voiceStartedAt;
						observations.push({ ...observation, timestampMs });
						totalFrames += 1;
						if (clipped) clippedFrames += 1;
					}

					if (stabilizedFrequency !== null && rawDetection) {
						const nearest = frequencyToNearestNote(stabilizedFrequency);
						setReading({
							frequencyHz: stabilizedFrequency,
							noteName: nearest.noteName,
							cents: nearest.cents,
							confidence: rawDetection.confidence,
						});
					} else {
						setReading(null);
					}

					const timestampMs = voiceStartedAt === null ? 0 : now - voiceStartedAt;
					setProgress(Math.min(1, timestampMs / durationMs));
					if (timestampMs >= durationMs) finalize();
				}, ANALYSIS_INTERVAL_MS);
			} catch (error) {
				releaseResources();
				updateStatus("error");
				setInputState("idle");
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
		inputLevel,
		inputState,
		reading,
		result,
		errorMessage,
		isSupported,
		start,
		cancel,
		reset,
	};
}
