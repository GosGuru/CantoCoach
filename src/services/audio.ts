let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (audioCtx) return audioCtx;
	const AudioContextClass =
		window.AudioContext ||
		// Safari legacy fallback
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	if (!AudioContextClass) return null;
	audioCtx = new AudioContextClass();
	return audioCtx;
}

export function initAudioContext(): AudioContext | null {
	const ctx = getAudioContext();
	if (ctx && ctx.state === "suspended") {
		ctx.resume().catch(() => {
			// Ignore resume errors; the browser will keep the context suspended
			// until the next user gesture.
		});
	}
	return ctx;
}

function playTone(
	ctx: AudioContext,
	frequency: number,
	durationSeconds: number,
	type: OscillatorType = "sine",
	when: number = ctx.currentTime,
) {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = type;
	osc.frequency.setValueAtTime(frequency, when);

	gain.gain.setValueAtTime(0.0001, when);
	gain.gain.exponentialRampToValueAtTime(0.3, when + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.0001, when + durationSeconds);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start(when);
	osc.stop(when + durationSeconds + 0.05);
}

export function playStartCue() {
	const ctx = initAudioContext();
	if (!ctx) return;
	const t = ctx.currentTime;
	playTone(ctx, 440, 0.18, "sine", t); // A4
	playTone(ctx, 659, 0.22, "sine", t + 0.2); // E5
}

export function playFinishCue() {
	const ctx = initAudioContext();
	if (!ctx) return;
	const t = ctx.currentTime;
	playTone(ctx, 659, 0.18, "sine", t); // E5
	playTone(ctx, 440, 0.22, "sine", t + 0.2); // A4
}

export function playNextStepCue() {
	const ctx = initAudioContext();
	if (!ctx) return;
	playTone(ctx, 523, 0.25, "sine", ctx.currentTime); // C5
}

export function closeAudioContext() {
	if (audioCtx) {
		audioCtx.close();
		audioCtx = null;
	}
}
