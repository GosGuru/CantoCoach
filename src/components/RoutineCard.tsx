import {
	BadgeCheck,
	CheckCircle2,
	Circle,
	Play,
	Volume2,
} from "lucide-react";
import type { ExerciseCompletionMode } from "../types/attempt.ts";
import type { Exercise } from "../types/vocal";

interface RoutineCardProps {
	exercise: Exercise;
	onStart: (exercise: Exercise) => void;
	onToggleComplete: (exerciseId: string) => void;
	isCompleted?: boolean;
	completionMode?: ExerciseCompletionMode;
	progressionEligible?: boolean;
	isCompact?: boolean;
}

const BLOCK_LABELS: Record<Exercise["block"], string> = {
	Warmup: "Calentamiento / TVSO",
	Closure: "Cierre Cordal",
	Resonancia: "Resonancia",
	Passaggio: "Voz Mixta / Passaggio",
	Repertorio: "Repertorio",
};

const BLOCK_ACCENT: Record<Exercise["block"], string> = {
	Warmup: "bg-rose/15 text-rose border-rose/25",
	Closure: "bg-sky/15 text-sky border-sky/25",
	Resonancia: "bg-accent/15 text-accent border-accent/25",
	Passaggio: "bg-gold/15 text-gold border-gold/25",
	Repertorio: "bg-emerald/15 text-emerald border-emerald/25",
};

const DIFFICULTY_BADGE: Record<NonNullable<Exercise["difficulty"]>, string> = {
	beginner: "bg-emerald/15 text-emerald",
	intermediate: "bg-sky/15 text-sky",
	advanced: "bg-gold/15 text-gold-muted",
};

const DIFFICULTY_LABELS: Record<NonNullable<Exercise["difficulty"]>, string> = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
};

const SCALE_LABELS: Record<Exercise["scalePattern"]["type"], string> = {
	"5-note-ascending-descending": "5 notas",
	"octave-slide": "Octava",
	sirens: "Sirena",
	sustained: "Sostenido",
	staccato: "Staccato",
	arpeggio: "Arpegio",
	legato: "Legato",
};

export function RoutineCard({
	exercise,
	onStart,
	onToggleComplete,
	isCompleted = false,
	completionMode,
	progressionEligible = false,
	isCompact,
}: RoutineCardProps) {
	const measured = completionMode === "measured";

	return (
		<article
			className={`group relative glass-panel card-border-gradient rounded-xl p-4 transition-all duration-200 hover:border-accent/40 hover:shadow-elevated hover:-translate-y-1 focus-within:ring-2 focus-within:ring-accent/60 ${
				isCompleted ? "border-emerald/40 bg-emerald/[0.05]" : ""
			} ${isCompact ? "flex items-center gap-4" : "flex flex-col gap-3"}`}
		>
			{isCompleted && (
				<div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-xl pointer-events-none">
					<div className={`absolute top-2.5 right-[-28px] w-[100px] rotate-45 text-ink text-[9px] font-bold uppercase tracking-wider text-center py-0.5 shadow-sm ${measured ? "bg-emerald/90" : "bg-gold/90"}`}>
						{measured ? "Medido" : "Manual"}
					</div>
				</div>
			)}

			<div className={isCompact ? "flex-1 min-w-0" : undefined}>
				<div className="flex flex-wrap items-center gap-2 mb-2">
					<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${BLOCK_ACCENT[exercise.block]}`}>
						<Volume2 className="w-3 h-3" aria-hidden="true" />
						{BLOCK_LABELS[exercise.block]}
					</span>
					{exercise.difficulty && (
						<span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-semibold ${DIFFICULTY_BADGE[exercise.difficulty]}`}>
							{DIFFICULTY_LABELS[exercise.difficulty]}
						</span>
					)}
					{isCompleted && (
						<span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${measured ? "text-emerald bg-emerald/10" : "text-gold bg-gold/10"}`}>
							{measured ? (
								<BadgeCheck className="w-3 h-3" aria-hidden="true" />
							) : (
								<CheckCircle2 className="w-3 h-3" aria-hidden="true" />
							)}
							{measured ? "Evidencia medida" : "Práctica manual"}
						</span>
					)}
					{progressionEligible && (
						<span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded-md">
							Habilita progresión
						</span>
					)}
				</div>

				<h3 className="text-base font-semibold text-text group-hover:text-accent transition-colors truncate">
					{exercise.name}
				</h3>
				<p className="text-sm text-text-muted mt-1 line-clamp-2 leading-relaxed">
					{exercise.instructions[0]}
				</p>

				{!isCompact && (
					<div className="flex flex-wrap items-center gap-2 mt-3">
						<div className="flex items-center gap-1 text-xs text-text-subtle mr-1">
							<Play className="w-3 h-3" aria-hidden="true" />
							{exercise.durationMinutes} min
						</div>
						<span className="text-xs px-2 py-1 rounded-md bg-surface text-text-muted font-mono border border-border">
							{SCALE_LABELS[exercise.scalePattern.type]}
						</span>
						{exercise.scalePattern.noteNames && (
							<span className="text-xs px-2 py-1 rounded-md bg-surface text-text-muted font-mono border border-border truncate max-w-[120px]">
								{exercise.scalePattern.noteNames[0]} →{" "}
								{
									exercise.scalePattern.noteNames[
										Math.floor(exercise.scalePattern.noteNames.length / 2)
									]
								}
							</span>
						)}
					</div>
				)}
			</div>

			<div className="flex items-center gap-2 pt-2 sm:pt-0">
				<button
					type="button"
					onClick={() => onToggleComplete(exercise.id)}
					className={`shrink-0 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
						isCompleted
							? "btn-secondary text-text-muted"
							: "btn-secondary text-text-muted hover:text-gold hover:border-gold/40"
					}`}
					aria-pressed={isCompleted}
				>
					{isCompleted ? (
						<>
							<Circle className="w-4 h-4" aria-hidden="true" /> Desmarcar
						</>
					) : (
						<>
							<CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Marcar manual
						</>
					)}
				</button>
				<button
					type="button"
					onClick={() => onStart(exercise)}
					className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg btn-primary text-sm"
				>
					<Play className="w-4 h-4" aria-hidden="true" /> Iniciar
				</button>
			</div>
		</article>
	);
}
