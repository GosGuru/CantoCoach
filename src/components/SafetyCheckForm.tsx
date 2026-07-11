import { useState } from "react";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import {
	createDailySafetyCheck,
	type DailySafetyCheck,
	type SafetyCheckInput,
} from "../domain/safety/safety";

interface SafetyCheckFormProps {
	onComplete: (check: DailySafetyCheck) => void;
}

type CriticalField = Exclude<keyof SafetyCheckInput, "fatigue">;

const CRITICAL_QUESTIONS: Array<{
	field: CriticalField;
	label: string;
	description: string;
}> = [
	{
		field: "painWhileSpeaking",
		label: "Dolor al hablar",
		description: "Dolor, ardor o molestia clara durante la voz hablada.",
	},
	{
		field: "painWhileSinging",
		label: "Dolor al cantar",
		description: "Dolor o molestia que aparece al fonar o al subir de tono.",
	},
	{
		field: "suddenVoiceLoss",
		label: "Pérdida súbita de voz",
		description: "La voz desapareció o cambió bruscamente.",
	},
	{
		field: "bloodPresent",
		label: "Sangre o sangrado",
		description: "Presencia de sangre al toser o una señal equivalente.",
	},
	{
		field: "breathingDifficulty",
		label: "Dificultad para respirar",
		description: "Sensación de falta de aire o bloqueo respiratorio.",
	},
	{
		field: "swallowingDifficulty",
		label: "Dificultad para tragar",
		description: "Dolor o dificultad significativa al tragar.",
	},
	{
		field: "completeAphonia",
		label: "Afonía completa",
		description: "No podés producir voz de forma normal.",
	},
	{
		field: "severeDiscomfort",
		label: "Molestia severa",
		description: "Una sensación intensa que hace inseguro entrenar.",
	},
];

const INITIAL_VALUES: SafetyCheckInput = {
	painWhileSpeaking: false,
	painWhileSinging: false,
	suddenVoiceLoss: false,
	bloodPresent: false,
	breathingDifficulty: false,
	swallowingDifficulty: false,
	completeAphonia: false,
	severeDiscomfort: false,
	fatigue: 0,
};

const FATIGUE_LABELS = ["Sin fatiga", "Leve", "Moderada", "Alta"];

export function SafetyCheckForm({ onComplete }: SafetyCheckFormProps) {
	const [values, setValues] = useState<SafetyCheckInput>(INITIAL_VALUES);

	const toggleCritical = (field: CriticalField) => {
		setValues((current) => ({ ...current, [field]: !current[field] }));
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		onComplete(createDailySafetyCheck(values));
	};

	return (
		<main className="min-h-svh flex items-center justify-center px-4 py-10 text-text">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-3xl glass-panel rounded-2xl p-5 sm:p-8 space-y-7"
			>
				<header className="flex items-start gap-4">
					<div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald/15 flex items-center justify-center">
						<ShieldCheck className="w-6 h-6 text-emerald" aria-hidden="true" />
					</div>
					<div>
						<p className="text-xs uppercase tracking-wider text-emerald font-semibold">
							Antes de entrenar
						</p>
						<h1 className="text-2xl font-semibold mt-1">Chequeo de seguridad vocal</h1>
						<p className="text-sm text-text-muted mt-2 leading-relaxed">
							Marcá únicamente lo que estés sintiendo hoy. CantoCoach no realiza
							diagnósticos; este chequeo evita proponerte práctica cuando existen
							señales que merecen descanso o evaluación profesional.
						</p>
					</div>
				</header>

				<section className="space-y-3">
					<h2 className="text-sm font-semibold">¿Presentás alguna de estas señales?</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{CRITICAL_QUESTIONS.map((question) => {
							const selected = values[question.field];
							return (
								<label
									key={question.field}
									className={`cursor-pointer rounded-xl border p-4 transition-colors ${
										selected
											? "border-rose/50 bg-rose/10"
											: "border-border bg-surface/50 hover:border-text-subtle"
									}`}
								>
									<div className="flex items-start gap-3">
										<input
											type="checkbox"
											checked={selected}
											onChange={() => toggleCritical(question.field)}
											className="mt-1 h-4 w-4 accent-current"
										/>
										<div>
											<p className="text-sm font-semibold text-text">{question.label}</p>
											<p className="text-xs text-text-muted mt-1 leading-relaxed">
												{question.description}
											</p>
										</div>
									</div>
								</label>
							);
						})}
					</div>
				</section>

				<section className="space-y-3">
					<h2 className="text-sm font-semibold">Fatiga vocal percibida</h2>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
						{([0, 1, 2, 3] as const).map((level) => (
							<button
								key={level}
								type="button"
								onClick={() => setValues((current) => ({ ...current, fatigue: level }))}
								className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
									values.fatigue === level
										? "border-accent bg-accent/10 text-text"
										: "border-border bg-surface text-text-muted hover:text-text"
								}`}
								aria-pressed={values.fatigue === level}
							>
								<span className="block text-lg font-bold">{level}</span>
								<span className="block text-xs mt-1">{FATIGUE_LABELS[level]}</span>
							</button>
						))}
					</div>
				</section>

				<div className="rounded-xl border border-gold/25 bg-gold/8 p-4 flex gap-3">
					<AlertTriangle className="w-5 h-5 text-gold shrink-0" aria-hidden="true" />
					<p className="text-xs text-text-muted leading-relaxed">
						Si marcás una señal crítica, la aplicación bloqueará la práctica vocal de
						hoy. Podrás revisar las respuestas si cometiste un error.
					</p>
				</div>

				<button
					type="submit"
					className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl btn-primary text-base"
				>
					Evaluar y continuar
					<ArrowRight className="w-5 h-5" aria-hidden="true" />
				</button>
			</form>
		</main>
	);
}
