import { useState } from "react";
import { Mic, AlertCircle, Send, ThumbsUp } from "lucide-react";
import type { DailyReportInput } from "../types/vocalgym";

const RATING_LABELS: Record<string, string[]> = {
	constriction: ["Ninguna", "Leve", "Moderada", "Severa o dolorosa"],
	passaggioControl: ["Sin transición", "Dificultad", "Aceptable", "Fluida"],
	energy: ["Muy fatigado", "Cansado", "Bien", "Óptimo"],
};

const GROUP_ICONS: Record<string, React.ElementType> = {
	constriction: Mic,
	passaggioControl: ThumbsUp,
	energy: ThumbsUp,
};

const GROUP_TITLES: Record<string, string> = {
	constriction: "Constricción laringea",
	passaggioControl: "Control del passaggio (C4–F#4)",
	energy: "Energía / fatiga vocal",
};

interface DailyReportFormProps {
	onSubmit: (report: DailyReportInput) => void;
}

export function DailyReportForm({ onSubmit }: DailyReportFormProps) {
	const [constriction, setConstriction] = useState<0 | 1 | 2 | 3>(1);
	const [passaggioControl, setPassaggioControl] = useState<0 | 1 | 2 | 3>(1);
	const [energy, setEnergy] = useState<0 | 1 | 2 | 3>(2);
	const [sensations, setSensations] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit({
			date: new Date().toISOString().split("T")[0],
			constriction,
			passaggioControl,
			energy,
			sensations,
		});
	};

	const groups = [
		{
			name: "constriction" as const,
			value: constriction,
			onChange: setConstriction,
		},
		{
			name: "passaggioControl" as const,
			value: passaggioControl,
			onChange: setPassaggioControl,
		},
		{
			name: "energy" as const,
			value: energy,
			onChange: setEnergy,
		},
	];

	return (
		<form
			onSubmit={handleSubmit}
			className="glass-panel rounded-2xl p-5 sm:p-6 space-y-6"
		>
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
					<Mic className="w-5 h-5 text-accent" aria-hidden="true" />
				</div>
				<div>
					<h2 className="section-title">Reporte diario</h2>
					<p className="text-xs text-text-subtle">
						Contanos cómo estuvo tu voz hoy para adaptar la próxima rutina.
					</p>
				</div>
			</div>

			<div className="p-4 rounded-xl bg-gold/8 border border-gold/20 flex gap-3">
				<AlertCircle
					className="w-5 h-5 text-gold shrink-0 mt-0.5"
					aria-hidden="true"
				/>
				<p className="text-sm text-text-muted leading-relaxed">
					Si sentiste dolor, afonía o sangrado, escribilo en sensaciones. El
					agente suspenderá el entrenamiento y te derivará a un profesional.
				</p>
			</div>

			{groups.map((group) => {
				const GroupIcon = GROUP_ICONS[group.name];
				return (
					<div key={group.name} className="space-y-3">
						<div className="flex items-center gap-2">
							<GroupIcon className="w-4 h-4 text-accent" aria-hidden="true" />
							<span className="text-sm font-semibold text-text">
								{GROUP_TITLES[group.name]}
							</span>
						</div>
						<div className="grid grid-cols-4 gap-2">
							{[0, 1, 2, 3].map((n) => (
								<label
									key={n}
									className={`
										cursor-pointer rounded-xl border px-2 py-3 text-center transition-all duration-200
										${
											group.value === n
												? "border-accent bg-accent/10 text-text shadow-md shadow-accent/10"
												: "border-border bg-surface text-text-muted hover:border-text-subtle hover:bg-elevated"
										}
									`}
								>
									<input
										type="radio"
										name={group.name}
										value={n}
										checked={group.value === n}
										onChange={() => group.onChange(n as 0 | 1 | 2 | 3)}
										className="sr-only"
									/>
									<span className="block text-lg font-bold">{n}</span>
									<span className="block text-[10px] leading-tight mt-1">
										{RATING_LABELS[group.name][n]}
									</span>
								</label>
							))}
						</div>
					</div>
				);
			})}

			<div className="space-y-2">
				<label htmlFor="sensations" className="text-sm font-semibold text-text">
					¿Qué sentiste hoy?
				</label>
				<textarea
					id="sensations"
					value={sensations}
					onChange={(e) => setSensations(e.target.value)}
					placeholder="Ej: 'Sentí opresión al subir al Mi4. La voz se sentía pesada en el cierre.'"
					rows={3}
					className="input-field resize-none"
				/>
			</div>

			<button
				type="submit"
				className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl btn-primary text-base"
				aria-label="Enviar reporte diario al agente"
			>
				<Send className="w-5 h-5" aria-hidden="true" />
				Enviar reporte al agente
			</button>
		</form>
	);
}
