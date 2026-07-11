import { useEffect } from "react";
import { Headphones, Mic2, Radio, Square } from "lucide-react";
import { usePitchMonitor } from "../hooks/usePitchMonitor";

interface LivePitchPanelProps {
	referencePlaying: boolean;
}

function centsLabel(cents: number): string {
	const rounded = Math.round(cents);
	if (rounded === 0) return "centrada";
	return rounded > 0 ? `+${rounded} cents` : `${rounded} cents`;
}

function centsClass(cents: number): string {
	const absolute = Math.abs(cents);
	if (absolute <= 15) return "text-emerald";
	if (absolute <= 35) return "text-gold";
	return "text-rose";
}

export function LivePitchPanel({ referencePlaying }: LivePitchPanelProps) {
	const {
		status,
		reading,
		errorMessage,
		isSupported,
		start,
		stop,
	} = usePitchMonitor();

	useEffect(() => {
		if (referencePlaying && status === "listening") stop();
	}, [referencePlaying, status, stop]);

	const listening = status === "listening";

	return (
		<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border">
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<Radio className="w-5 h-5 text-emerald" aria-hidden="true" />
						<h2 className="section-title">Afinador en vivo</h2>
					</div>
					<p className="text-sm text-text-muted mt-2 leading-relaxed">
						Escuchá primero la referencia y después activá el micrófono. Usá auriculares
						para que la app no confunda el patrón con tu voz.
					</p>
				</div>

				<button
					type="button"
					onClick={() => (listening ? stop() : void start())}
					disabled={!isSupported || status === "requesting" || referencePlaying}
					className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
						listening
							? "border border-rose/40 bg-rose/10 text-rose"
							: "btn-primary"
					} disabled:opacity-50 disabled:cursor-not-allowed`}
				>
					{listening ? (
						<><Square className="w-4 h-4" aria-hidden="true" />Detener escucha</>
					) : (
						<><Mic2 className="w-4 h-4" aria-hidden="true" />{status === "requesting" ? "Solicitando…" : "Escuchar mi voz"}</>
					)}
				</button>
			</div>

			{!isSupported && (
				<p className="mt-4 text-sm text-rose">
					Este navegador no ofrece acceso compatible al micrófono y Web Audio.
				</p>
			)}
			{errorMessage && <p className="mt-4 text-sm text-rose">{errorMessage}</p>}

			<div className="mt-5 rounded-xl border border-border bg-surface/60 p-5 min-h-32 flex items-center justify-center">
				{listening ? (
					reading ? (
						<div className="text-center">
							<p className="text-4xl font-bold font-display text-text">{reading.noteName}</p>
							<p className={`text-lg font-semibold mt-1 ${centsClass(reading.cents)}`}>
								{centsLabel(reading.cents)}
							</p>
							<p className="text-xs text-text-subtle mt-2">
								{reading.frequencyHz.toFixed(1)} Hz · confianza {Math.round(reading.confidence * 100)}%
							</p>
						</div>
					) : (
						<div className="text-center">
							<Mic2 className="w-7 h-7 text-text-subtle mx-auto" aria-hidden="true" />
							<p className="text-sm text-text-muted mt-2">Esperando una nota estable…</p>
						</div>
					)
				) : (
					<div className="text-center">
						<Headphones className="w-7 h-7 text-text-subtle mx-auto" aria-hidden="true" />
						<p className="text-sm text-text-muted mt-2">
							La medición ocurre en tu dispositivo y no guarda el audio.
						</p>
					</div>
				)}
			</div>

			<p className="mt-3 text-xs text-text-subtle">
				Este panel mide frecuencia fundamental. No determina registro, tensión, apoyo ni
				estado anatómico de la voz.
			</p>
		</section>
	);
}
