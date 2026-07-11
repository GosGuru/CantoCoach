import { useState } from "react";
import {
	ArrowRight,
	Check,
	Info,
	Mic2,
	Music,
	SlidersHorizontal,
	Target,
	User,
	WandSparkles,
} from "lucide-react";
import type { VoiceBlock } from "../types/vocal";
import type { VocalProfile } from "../types/vocalgym";

interface VocalProfileFormProps {
	onSubmit: (profile: VocalProfile) => void;
}

const LEVEL_LABELS: Record<VocalProfile["level"], string> = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
};

const BLOCK_LABELS: Record<VoiceBlock, string> = {
	Warmup: "Calentamiento / TVSO",
	Closure: "Ataques y cierre",
	Resonancia: "Resonancia",
	Passaggio: "Zona alta / Passaggio",
	Repertorio: "Repertorio",
};

const BLOCK_DESCRIPTIONS: Record<VoiceBlock, string> = {
	Warmup: "Preparación de baja carga antes del trabajo principal.",
	Closure: "Entradas limpias, continuidad y uso eficiente del aire.",
	Resonancia: "Exploración de claridad y proyección sin empuje.",
	Passaggio: "Continuidad al atravesar la zona alta dentro de un rango cómodo.",
	Repertorio: "Transferencia de la habilidad técnica a una frase musical.",
};

const BLOCK_ICONS: Record<VoiceBlock, React.ElementType> = {
	Warmup: Mic2,
	Closure: SlidersHorizontal,
	Resonancia: Music,
	Passaggio: Target,
	Repertorio: WandSparkles,
};

const BLOCKS: VoiceBlock[] = [
	"Warmup",
	"Closure",
	"Resonancia",
	"Passaggio",
	"Repertorio",
];

export function VocalProfileForm({ onSubmit }: VocalProfileFormProps) {
	const [level, setLevel] = useState<VocalProfile["level"]>("intermediate");
	const [goals, setGoals] = useState<VoiceBlock[]>([
		"Warmup",
		"Closure",
		"Resonancia",
		"Passaggio",
		"Repertorio",
	]);

	const toggleGoal = (block: VoiceBlock) => {
		setGoals((previous) =>
			previous.includes(block)
				? previous.filter((goal) => goal !== block)
				: [...previous, block],
		);
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		onSubmit({
			voiceType: "baritone",
			level,
			goals: goals.length > 0 ? goals : BLOCKS,
		});
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="glass-panel rounded-2xl p-5 sm:p-8 space-y-8"
		>
			<header className="flex items-start gap-4">
				<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-gold flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
					<User className="w-6 h-6 text-accent-foreground" aria-hidden="true" />
				</div>
				<div>
					<p className="text-xs uppercase tracking-wider text-accent font-semibold">
						Configuración inicial
					</p>
					<h2 className="text-xl sm:text-2xl font-semibold text-text mt-1">
						Creá tu perfil de entrenamiento
					</h2>
					<p className="text-sm text-text-muted mt-2 leading-relaxed max-w-xl">
						Esta versión está optimizada para barítono. La personalización por rango
						medido y el soporte de otras voces se incorporarán con el módulo de
						evaluación inicial.
					</p>
				</div>
			</header>

			<section className="rounded-xl bg-sky/8 border border-sky/20 p-4 flex gap-3">
				<Info className="w-5 h-5 text-sky shrink-0 mt-0.5" aria-hidden="true" />
				<div>
					<p className="text-sm font-semibold text-text">Modalidad soportada: Barítono MVP</p>
					<p className="text-xs text-text-muted mt-1 leading-relaxed">
						La etiqueta no sustituye una evaluación vocal. Por ahora evita prometer
						transposiciones que la app todavía no realiza.
					</p>
				</div>
			</section>

			<section className="space-y-3">
				<label htmlFor="level" className="text-sm font-semibold text-text flex items-center gap-2">
					<SlidersHorizontal className="w-4 h-4 text-accent" aria-hidden="true" />
					Experiencia técnica
				</label>
				<select
					id="level"
					value={level}
					onChange={(event) =>
						setLevel(event.target.value as VocalProfile["level"])
					}
					className="input-field"
				>
					{(Object.keys(LEVEL_LABELS) as VocalProfile["level"][]).map((item) => (
						<option key={item} value={item}>
							{LEVEL_LABELS[item]}
						</option>
					))}
				</select>
				<p className="text-xs text-text-subtle leading-relaxed">
					El nivel limita la dificultad disponible, pero la progresión futura dependerá
					de intentos medidos, no de esta selección.
				</p>
			</section>

			<section className="space-y-4">
				<span className="text-sm font-semibold text-text flex items-center gap-2">
					<Target className="w-4 h-4 text-accent" aria-hidden="true" />
					Áreas que querés trabajar
				</span>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{BLOCKS.map((block) => {
						const selected = goals.includes(block);
						const BlockIcon = BLOCK_ICONS[block];
						return (
							<button
								key={block}
								type="button"
								onClick={() => toggleGoal(block)}
								className={`group flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
									selected
										? "border-accent bg-accent/10"
										: "border-border bg-surface hover:border-text-subtle"
								}`}
								aria-pressed={selected}
							>
								<div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-accent text-accent-foreground" : "bg-surface text-text-subtle"}`}>
									{selected ? (
										<Check className="w-4 h-4" aria-hidden="true" />
									) : (
										<BlockIcon className="w-4 h-4" aria-hidden="true" />
									)}
								</div>
								<div>
									<p className="text-sm font-semibold text-text">{BLOCK_LABELS[block]}</p>
									<p className="text-xs leading-relaxed mt-1 text-text-muted">
										{BLOCK_DESCRIPTIONS[block]}
									</p>
								</div>
							</button>
						);
					})}
				</div>
			</section>

			<button
				type="submit"
				className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl btn-primary text-base"
			>
				Crear perfil y generar rutina
				<ArrowRight className="w-5 h-5" aria-hidden="true" />
			</button>
		</form>
	);
}
