import { useState } from "react";
import {
	User,
	Music,
	Target,
	SlidersHorizontal,
	Check,
	Info,
	Mic2,
	ArrowRight,
	WandSparkles,
} from "lucide-react";
import type { VoiceBlock } from "../types/vocal";
import type { VocalProfile, VoiceType } from "../types/vocalgym";

interface VocalProfileFormProps {
	onSubmit: (profile: VocalProfile) => void;
}

const VOICE_TYPE_LABELS: Record<VoiceType, string> = {
	baritone: "Barítono",
	tenor: "Tenor",
	bass: "Bajo",
	contralto: "Contralto",
	mezzo: "Mezzosoprano",
	soprano: "Soprano",
};

const LEVEL_LABELS: Record<VocalProfile["level"], string> = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
};

const BLOCK_LABELS: Record<VoiceBlock, string> = {
	Warmup: "Calentamiento / TVSO",
	Closure: "Cierre Cordal",
	Resonancia: "Resonancia",
	Passaggio: "Voz Mixta / Passaggio",
	Repertorio: "Repertorio",
};

const BLOCK_DESCRIPTIONS: Record<VoiceBlock, string> = {
	Warmup: "Prepará tus cuerdas vocales sin presión.",
	Closure: "Mejorá el cierre cordal limpio y sostenido.",
	Resonancia: "Ampliá el espacio y la proyección del sonido.",
	Passaggio: "Suavizá el paso entre registros.",
	Repertorio: "Llevá la técnica a una canción.",
};

const BLOCK_ICONS: Record<VoiceBlock, React.ElementType> = {
	Warmup: Mic2,
	Closure: SlidersHorizontal,
	Resonancia: Music,
	Passaggio: Target,
	Repertorio: WandSparkles,
};

const VOICE_TYPES: VoiceType[] = [
	"bass",
	"baritone",
	"tenor",
	"contralto",
	"mezzo",
	"soprano",
];

const BLOCKS: VoiceBlock[] = [
	"Warmup",
	"Closure",
	"Resonancia",
	"Passaggio",
	"Repertorio",
];

export function VocalProfileForm({ onSubmit }: VocalProfileFormProps) {
	const [voiceType, setVoiceType] = useState<VoiceType>("baritone");
	const [level, setLevel] = useState<VocalProfile["level"]>("beginner");
	const [goals, setGoals] = useState<VoiceBlock[]>([
		"Warmup",
		"Closure",
		"Resonancia",
		"Passaggio",
		"Repertorio",
	]);

	const toggleGoal = (block: VoiceBlock) => {
		setGoals((prev) =>
			prev.includes(block) ? prev.filter((g) => g !== block) : [...prev, block],
		);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const profile: VocalProfile = {
			voiceType,
			level,
			goals: goals.length > 0 ? goals : BLOCKS,
		};

		onSubmit(profile);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="glass-panel rounded-2xl p-5 sm:p-8 space-y-8"
		>
			<div className="flex items-start gap-4">
				<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-gold flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
					<User className="w-6 h-6 text-accent-foreground" aria-hidden="true" />
				</div>
				<div>
					<h2 className="text-xl sm:text-2xl font-semibold text-text">
						Bienvenido a VocalGym
					</h2>
					<p className="text-sm text-text-muted mt-1 leading-relaxed max-w-xl">
						Configurá tu perfil para que el agente elija ejercicios y bloques
						acordes a tu voz. Todos los ejercicios están pensados para barítono.
						Podés ajustarlo cuando quieras.
					</p>
				</div>
			</div>

			<div className="p-4 rounded-xl bg-sky/8 border border-sky/20 flex gap-3">
				<Info className="w-5 h-5 text-sky shrink-0 mt-0.5" aria-hidden="true" />
				<p className="text-sm text-text-muted leading-relaxed">
					Seleccioná tu tipo de voz y nivel. El agente generará una rutina
					personalizada con los bloques que elijas.
				</p>
			</div>

			<section className="space-y-3">
				<label
					htmlFor="voiceType"
					className="text-sm font-semibold text-text flex items-center gap-2"
				>
					<Music className="w-4 h-4 text-accent" aria-hidden="true" />
					Tipo de voz
				</label>
				<select
					id="voiceType"
					value={voiceType}
					onChange={(e) => setVoiceType(e.target.value as VoiceType)}
					className="input-field"
				>
					{VOICE_TYPES.map((vt) => (
						<option key={vt} value={vt}>
							{VOICE_TYPE_LABELS[vt]}
						</option>
					))}
				</select>
			</section>

			<section className="space-y-3">
				<label
					htmlFor="level"
					className="text-sm font-semibold text-text flex items-center gap-2"
				>
					<SlidersHorizontal
						className="w-4 h-4 text-accent"
						aria-hidden="true"
					/>
					Nivel de entrenamiento
				</label>
				<select
					id="level"
					value={level}
					onChange={(e) => setLevel(e.target.value as VocalProfile["level"])}
					className="input-field"
				>
					{(Object.keys(LEVEL_LABELS) as VocalProfile["level"][]).map((l) => (
						<option key={l} value={l}>
							{LEVEL_LABELS[l]}
						</option>
					))}
				</select>
				<p className="text-xs text-text-subtle leading-relaxed">
					El nivel limita la progresión de los ejercicios: principiante hasta
					nivel 2, intermedio hasta 3, avanzado hasta 5.
				</p>
			</section>

			<section className="space-y-4">
				<span className="text-sm font-semibold text-text flex items-center gap-2">
					<Target className="w-4 h-4 text-accent" aria-hidden="true" />
					Objetivos principales
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
								className={`group flex items-start gap-3 p-4 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
									${selected ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-text-subtle"}
								`}
								aria-pressed={selected}
								aria-label={BLOCK_LABELS[block]}
							>
								<div
									className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
										${selected ? "bg-accent text-accent-foreground" : "bg-surface text-text-subtle group-hover:text-text"}
									`}
								>
									{selected ? (
										<Check className="w-4 h-4" aria-hidden="true" />
									) : (
										<BlockIcon className="w-4 h-4" aria-hidden="true" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<span
											className={`text-sm font-semibold ${selected ? "text-text" : "text-text-muted group-hover:text-text"}`}
										>
											{BLOCK_LABELS[block]}
										</span>
										{selected && (
											<Check
												className="w-4 h-4 text-accent shrink-0"
												aria-hidden="true"
											/>
										)}
									</div>
									<p
										className={`text-xs leading-relaxed mt-1 ${selected ? "text-text-muted" : "text-text-subtle"}`}
									>
										{BLOCK_DESCRIPTIONS[block]}
									</p>
								</div>
							</button>
						);
					})}
				</div>
				{goals.length === 0 && (
					<p className="text-xs text-rose">
						Elegí al menos un objetivo para continuar.
					</p>
				)}
			</section>

			<button
				type="submit"
				className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl btn-primary text-base"
				aria-label="Crear perfil vocal y generar rutina personalizada"
			>
				Crear mi perfil y generar rutina
				<ArrowRight className="w-5 h-5" aria-hidden="true" />
			</button>
		</form>
	);
}
