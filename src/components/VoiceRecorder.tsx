import { Mic, Square, Trash2 } from "lucide-react";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

export function VoiceRecorder() {
	const {
		recording,
		audioUrl,
		error,
		startRecording,
		stopRecording,
		clearRecording,
	} = useVoiceRecorder();

	return (
		<div className="glass-panel rounded-xl p-4 border border-border space-y-4">
			<div className="flex items-center justify-between">
				<span className="text-xs font-medium text-text-muted uppercase tracking-wider">
					Grabadora de voz
				</span>
				{recording && (
					<span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose">
						<span
							className="w-2 h-2 rounded-full bg-rose animate-pulse"
							aria-hidden="true"
						/>
						Grabando
					</span>
				)}
			</div>

			{error && (
				<p className="text-sm text-rose bg-rose/10 border border-rose/20 rounded-lg p-3">
					{error}
				</p>
			)}

			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
				{recording ? (
					<button
						type="button"
						onClick={stopRecording}
						className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose/15 text-rose border border-rose/30 hover:bg-rose/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose"
						aria-label="Detener grabación"
					>
						<Square className="w-4 h-4 fill-current" aria-hidden="true" />
						Detener
					</button>
				) : (
					<button
						type="button"
						onClick={startRecording}
						className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald/15 text-emerald border border-emerald/30 hover:bg-emerald/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
						aria-label="Iniciar grabación"
					>
						<Mic className="w-4 h-4" aria-hidden="true" />
						Grabar
					</button>
				)}

				{audioUrl && (
					<>
						<audio
							src={audioUrl}
							controls
							className="flex-1 h-10 rounded-lg"
							aria-label="Reproducir grabación"
						/>
						<button
							type="button"
							onClick={clearRecording}
							className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface text-text-muted border border-border hover:text-rose hover:border-rose/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							aria-label="Borrar grabación"
						>
							<Trash2 className="w-4 h-4" aria-hidden="true" />
							Borrar
						</button>
					</>
				)}
			</div>

			<p className="text-xs text-text-subtle">
				El audio se guarda solo en la memoria de este dispositivo. No se sube ni
				se persiste.
			</p>
		</div>
	);
}
