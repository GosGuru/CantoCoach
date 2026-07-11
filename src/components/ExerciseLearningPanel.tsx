import {
	AlertTriangle,
	BookOpen,
	CircleHelp,
	ExternalLink,
	PlayCircle,
} from "lucide-react";
import { exerciseGuidanceById } from "../data/exerciseGuidance.ts";
import type { Exercise } from "../types/vocal.ts";

interface ExerciseLearningPanelProps {
	exercise: Exercise;
	focusInstruction: number;
}

export function ExerciseLearningPanel({
	exercise,
	focusInstruction,
}: ExerciseLearningPanelProps) {
	const fallback = exerciseGuidanceById[exercise.id];
	const guidance = exercise.guidance ?? fallback?.guidance;
	const resources = exercise.resources ?? fallback?.resources ?? [];

	return (
		<section className="glass-panel rounded-2xl p-5 sm:p-6 border border-border space-y-6">
			<header className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-xl bg-sky/15 flex items-center justify-center shrink-0">
					<CircleHelp className="w-5 h-5 text-sky" aria-hidden="true" />
				</div>
				<div>
					<h2 className="section-title">Cómo hacer el ejercicio</h2>
					<p className="text-sm text-text-muted mt-1 leading-relaxed">
						{guidance?.objective ??
							"Seguí las indicaciones con poco volumen y sin fabricar sensaciones mediante fuerza."}
					</p>
				</div>
			</header>

			{guidance ? (
				<div className="grid gap-5">
					<div>
						<h3 className="text-sm font-semibold text-text mb-2">1. Preparación</h3>
						<ul className="space-y-2">
							{guidance.setup.map((step) => (
								<li
									key={step}
									className="rounded-xl border border-border bg-surface/40 p-3 text-sm text-text-muted leading-relaxed"
								>
									{step}
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="text-sm font-semibold text-text mb-2">2. Ejecución</h3>
						<ol className="space-y-2">
							{guidance.execution.map((step, index) => (
								<li
									key={step}
									className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/6 p-3"
								>
									<span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
										{index + 1}
									</span>
									<span className="text-sm text-text leading-relaxed">{step}</span>
								</li>
							))}
						</ol>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="rounded-xl border border-gold/25 bg-gold/7 p-4">
							<h3 className="text-sm font-semibold text-text">Errores comunes</h3>
							<ul className="mt-2 space-y-1.5 text-xs text-text-muted leading-relaxed">
								{guidance.commonMistakes.map((mistake) => (
									<li key={mistake}>• {mistake}</li>
								))}
							</ul>
						</div>
						{guidance.stopSignals && guidance.stopSignals.length > 0 && (
							<div className="rounded-xl border border-rose/25 bg-rose/7 p-4">
								<h3 className="text-sm font-semibold text-text flex items-center gap-2">
									<AlertTriangle className="w-4 h-4 text-rose" aria-hidden="true" />
									Pará si aparece
								</h3>
								<ul className="mt-2 space-y-1.5 text-xs text-text-muted leading-relaxed">
									{guidance.stopSignals.map((signal) => (
										<li key={signal}>• {signal}</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
			) : (
				<div>
					<h3 className="text-sm font-semibold text-text mb-3">Indicaciones</h3>
					<ul className="space-y-3">
						{exercise.instructions.map((instruction, index) => (
							<li
								key={instruction}
								className={`p-4 rounded-xl border ${
									index === focusInstruction
										? "bg-accent/8 border-accent/30"
										: "bg-surface/40 border-border"
								}`}
							>
								<p className="text-sm sm:text-base text-text leading-relaxed">
									{instruction}
								</p>
							</li>
						))}
					</ul>
				</div>
			)}

			{resources.length > 0 && (
				<div className="border-t border-divider pt-5">
					<div className="flex items-center gap-2 mb-3">
						<BookOpen className="w-4 h-4 text-accent" aria-hidden="true" />
						<h3 className="text-sm font-semibold text-text">Demostraciones y fuentes</h3>
					</div>
					<div className="grid gap-2 sm:grid-cols-2">
						{resources.map((resource) => (
							<a
								key={`${resource.url}-${resource.title}`}
								href={resource.url}
								target="_blank"
								rel="noreferrer"
								className="flex items-start gap-3 rounded-xl border border-border bg-surface/50 p-3 hover:border-accent/40 hover:bg-elevated transition-colors"
							>
								{resource.kind === "video" ? (
									<PlayCircle className="w-5 h-5 text-rose shrink-0" aria-hidden="true" />
								) : (
									<BookOpen className="w-5 h-5 text-sky shrink-0" aria-hidden="true" />
								)}
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-medium text-text leading-snug">
										{resource.title}
									</span>
									<span className="block text-xs text-text-subtle mt-1">
										{resource.sourceLabel}
									</span>
								</span>
								<ExternalLink className="w-4 h-4 text-text-subtle shrink-0" aria-hidden="true" />
							</a>
						))}
					</div>
				</div>
			)}
		</section>
	);
}
