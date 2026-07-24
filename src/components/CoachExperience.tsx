import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
	ArrowRight,
	BarChart3,
	Check,
	ChevronDown,
	ChevronUp,
	Headphones,
	Mic2,
	RotateCcw,
	Sparkles,
	Target,
	Trophy,
} from "lucide-react";
import { vocalExerciseById } from "../data/vocalExercises.ts";
import {
	deriveMeasuredCoachSnapshot,
	type CoachStage,
} from "../domain/coach/measuredCoach.ts";
import type { ExerciseAttemptRecord } from "../types/attempt.ts";
import type {
	DailyRoutine,
	SessionRecord,
	VocalProfile,
} from "../types/vocalgym.ts";
import { getLocalDateKey } from "../utils/localDate.ts";

const ROUTINE_KEY = "vocalgym-routine";
const COMPLETED_KEY = "vocalgym-completed";
const ATTEMPTS_KEY = "vocalgym-attempts-v1";
const SESSIONS_KEY = "vocalgym-sessions";
const PROFILE_KEY = "vocalgym-profile";
const PANEL_KEY = "canto-coach-measured-coach-panel-v1";

const STEP_LABELS = ["Escuchar", "Cantar", "Corregir", "Repetir"] as const;

const STAGE_COPY: Record<CoachStage, { eyebrow: string; title: string }> = {
	listen: {
		eyebrow: "Paso 1 · Escuchar",
		title: "Primero construí una referencia clara",
	},
	correct: {
		eyebrow: "Paso 3 · Corregir",
		title: "Aplicá una sola corrección y repetí",
	},
	advance: {
		eyebrow: "Paso 4 · Repetir",
		title: "Confirmá el resultado antes de avanzar",
	},
	complete: {
		eyebrow: "Sesión completa",
		title: "Cerrá el día con evidencia y sensaciones",
	},
};

function readStored<T>(key: string, fallback: T): T {
	try {
		const raw = window.localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function activeStep(stage: CoachStage): number {
	switch (stage) {
		case "listen":
			return 0;
		case "correct":
			return 2;
		case "advance":
			return 3;
		case "complete":
			return 4;
	}
}

function detectFocusPlayer(): boolean {
	return [...document.querySelectorAll("button")].some((button) =>
		button.textContent?.includes("Cerrar sesión"),
	);
}

function CoachSteps({ stage }: { stage: CoachStage }) {
	const current = activeStep(stage);
	return (
		<div className="grid grid-cols-4 gap-1.5" aria-label="Flujo guiado de práctica">
			{STEP_LABELS.map((label, index) => {
				const reached = index <= current || stage === "complete";
				return (
					<div
						key={label}
						className={`rounded-lg border px-2 py-2 text-center text-[10px] sm:text-xs font-medium transition-colors ${
							reached
								? "border-accent/45 bg-accent/12 text-text"
								: "border-border bg-surface/55 text-text-subtle"
						}`}
					>
						<span className="block text-[9px] opacity-70">{index + 1}</span>
						{label}
					</div>
				);
			})}
		</div>
	);
}

function scrollToRoutine(): void {
	const heading = [...document.querySelectorAll("h2")].find((element) =>
		element.textContent?.includes("Rutina del día"),
	);
	heading?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CoachExperience({ children }: { children: ReactNode }) {
	const [revision, setRevision] = useState(0);
	const [focusPlayerOpen, setFocusPlayerOpen] = useState(false);
	const [expanded, setExpanded] = useState(() => {
		if (typeof window === "undefined") return true;
		return window.localStorage.getItem(PANEL_KEY) !== "collapsed";
	});

	useEffect(() => {
		const refresh = () => {
			setRevision((current) => current + 1);
			setFocusPlayerOpen(detectFocusPlayer());
		};
		const timer = window.setInterval(refresh, 900);
		const observer = new MutationObserver(refresh);
		observer.observe(document.body, { childList: true, subtree: true });
		window.addEventListener("focus", refresh);
		window.addEventListener("storage", refresh);
		document.addEventListener("visibilitychange", refresh);
		refresh();
		return () => {
			window.clearInterval(timer);
			observer.disconnect();
			window.removeEventListener("focus", refresh);
			window.removeEventListener("storage", refresh);
			document.removeEventListener("visibilitychange", refresh);
		};
	}, []);

	const coachState = useMemo(() => {
		if (typeof window === "undefined") return null;
		const profile = readStored<VocalProfile | null>(PROFILE_KEY, null);
		if (!profile) return null;
		const routine = readStored<DailyRoutine | null>(ROUTINE_KEY, null);
		const completedIds = readStored<string[]>(COMPLETED_KEY, []);
		const attempts = readStored<ExerciseAttemptRecord[]>(ATTEMPTS_KEY, []);
		const sessions = readStored<SessionRecord[]>(SESSIONS_KEY, []);
		const snapshot = deriveMeasuredCoachSnapshot({
			routine,
			completedIds,
			attempts,
			sessions,
			today: getLocalDateKey(),
		});
		return {
			snapshot,
			nextExercise: snapshot.nextExerciseId
				? vocalExerciseById(snapshot.nextExerciseId)
				: undefined,
		};
	}, [revision]);

	const toggleExpanded = () => {
		setExpanded((current) => {
			const next = !current;
			window.localStorage.setItem(PANEL_KEY, next ? "expanded" : "collapsed");
			return next;
		});
	};

	if (!coachState) return <>{children}</>;

	const { snapshot, nextExercise } = coachState;
	const stageCopy = STAGE_COPY[snapshot.stage];
	const pitchLabel =
		snapshot.bestPitchErrorCents === null
			? "—"
			: `${Math.round(snapshot.bestPitchErrorCents)} cents`;
	const confidenceLabel =
		snapshot.averageConfidence === null
			? "—"
			: `${Math.round(snapshot.averageConfidence * 100)}%`;

	return (
		<>
			{children}

			{expanded ? (
				focusPlayerOpen ? (
					<aside
						className="fixed left-1/2 bottom-24 z-[80] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-accent/35 bg-canvas/95 p-3 shadow-2xl backdrop-blur-xl"
						aria-live="polite"
					>
						<div className="flex items-start gap-3">
							<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
								<Sparkles className="h-5 w-5" aria-hidden="true" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
									{stageCopy.eyebrow}
								</p>
								<p className="mt-1 text-sm font-semibold text-text">{snapshot.primaryAction}</p>
								<p className="mt-1 text-xs text-text-subtle">Objetivo: {snapshot.nextTarget}</p>
							</div>
							<button
								type="button"
								onClick={toggleExpanded}
								className="rounded-lg border border-border bg-surface p-2 text-text-muted hover:text-text"
								aria-label="Minimizar coach"
							>
								<ChevronDown className="h-4 w-4" aria-hidden="true" />
							</button>
						</div>
						<div className="mt-3">
							<CoachSteps stage={snapshot.stage} />
						</div>
					</aside>
				) : (
					<aside
						className="fixed bottom-4 right-4 z-[70] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-accent/30 bg-canvas/95 shadow-2xl backdrop-blur-xl"
						aria-live="polite"
					>
						<div className="border-b border-border bg-gradient-to-r from-accent/12 to-gold/8 p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="flex min-w-0 items-start gap-3">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
										<Sparkles className="h-5 w-5" aria-hidden="true" />
									</div>
									<div className="min-w-0">
										<p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
											Coach de hoy
										</p>
										<h2 className="mt-1 text-base font-semibold text-text">{stageCopy.title}</h2>
									</div>
								</div>
								<button
									type="button"
									onClick={toggleExpanded}
									className="rounded-lg border border-border bg-surface/70 p-2 text-text-muted hover:text-text"
									aria-label="Minimizar coach"
								>
									<ChevronDown className="h-4 w-4" aria-hidden="true" />
								</button>
							</div>

							<div className="mt-4">
								<CoachSteps stage={snapshot.stage} />
							</div>
						</div>

						<div className="space-y-4 p-4">
							<section className="rounded-xl border border-border bg-surface/65 p-3">
								<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-subtle">
									<Target className="h-4 w-4 text-accent" aria-hidden="true" /> Ahora
								</div>
								<p className="mt-2 text-sm font-medium leading-relaxed text-text">
									{snapshot.primaryAction}
								</p>
								<p className="mt-2 text-xs leading-relaxed text-text-subtle">
									Objetivo medible: {snapshot.nextTarget}
								</p>
							</section>

							{nextExercise && (
								<section className="rounded-xl border border-sky/25 bg-sky/8 p-3">
									<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky">
										<ArrowRight className="h-4 w-4" aria-hidden="true" /> Siguiente ejercicio
									</div>
									<p className="mt-2 text-sm font-semibold text-text">{nextExercise.name}</p>
									<p className="mt-1 text-xs text-text-subtle">
										{nextExercise.durationMinutes} min · {nextExercise.block}
									</p>
								</section>
							)}

							<div>
								<div className="flex items-center justify-between text-xs text-text-muted">
									<span>Rutina de hoy</span>
									<span className="font-semibold text-text">
										{snapshot.completedExercises}/{snapshot.totalExercises}
									</span>
								</div>
								<div className="mt-2 h-2 overflow-hidden rounded-full border border-border bg-surface">
									<div
										className="h-full bg-accent transition-[width] duration-300"
										style={{ width: `${snapshot.completionPercent}%` }}
									/>
								</div>
							</div>

							{snapshot.todayAttemptCount > 0 && (
								<div className="grid grid-cols-3 gap-2">
									<div className="rounded-xl border border-border bg-surface/55 p-2 text-center">
										<Mic2 className="mx-auto h-4 w-4 text-sky" aria-hidden="true" />
										<p className="mt-1 text-sm font-semibold text-text">{snapshot.todayAttemptCount}</p>
										<p className="text-[10px] text-text-subtle">intentos</p>
									</div>
									<div className="rounded-xl border border-border bg-surface/55 p-2 text-center">
										<BarChart3 className="mx-auto h-4 w-4 text-emerald" aria-hidden="true" />
										<p className="mt-1 text-sm font-semibold text-text">{pitchLabel}</p>
										<p className="text-[10px] text-text-subtle">mejor error</p>
									</div>
									<div className="rounded-xl border border-border bg-surface/55 p-2 text-center">
										<Headphones className="mx-auto h-4 w-4 text-gold" aria-hidden="true" />
										<p className="mt-1 text-sm font-semibold text-text">{confidenceLabel}</p>
										<p className="text-[10px] text-text-subtle">confianza</p>
									</div>
								</div>
							)}

							<section className="rounded-xl border border-gold/20 bg-gold/6 p-3">
								<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
									<RotateCcw className="h-4 w-4" aria-hidden="true" /> Por qué se adapta
								</div>
								<p className="mt-2 text-xs leading-relaxed text-text-muted">
									{snapshot.adaptationReason}
								</p>
							</section>

							{snapshot.stage === "complete" && (
								<section className="rounded-xl border border-emerald/30 bg-emerald/8 p-3">
									<div className="flex items-center gap-2 text-sm font-semibold text-emerald">
										<Trophy className="h-4 w-4" aria-hidden="true" /> Resumen del entrenamiento
									</div>
									<p className="mt-2 text-xs leading-relaxed text-text-muted">
										Completaste {snapshot.completedExercises} ejercicios y registraste {snapshot.evaluableAttemptCount} intentos evaluables. Enviá el reporte diario para preparar el próximo entrenamiento.
									</p>
								</section>
							)}

							<button
								type="button"
								onClick={() => {
									setExpanded(false);
									window.localStorage.setItem(PANEL_KEY, "collapsed");
									scrollToRoutine();
								}}
								className="inline-flex w-full items-center justify-center gap-2 rounded-xl btn-primary px-4 py-3 text-sm font-semibold"
							>
								{snapshot.stage === "complete" ? (
									<Check className="h-4 w-4" aria-hidden="true" />
								) : (
									<ArrowRight className="h-4 w-4" aria-hidden="true" />
								)}
								{snapshot.stage === "complete" ? "Ir al reporte diario" : "Ir a la rutina"}
							</button>
						</div>
					</aside>
				)
			) : (
				<button
					type="button"
					onClick={toggleExpanded}
					className={`fixed right-4 z-[80] inline-flex items-center gap-2 rounded-full border border-accent/35 bg-canvas/95 px-4 py-3 text-sm font-semibold text-text shadow-xl backdrop-blur-xl hover:border-accent ${
						focusPlayerOpen ? "bottom-24" : "bottom-4"
					}`}
				>
					{snapshot.stage === "complete" ? (
						<Trophy className="h-4 w-4 text-emerald" aria-hidden="true" />
					) : (
						<Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
					)}
					Coach · {snapshot.completedExercises}/{snapshot.totalExercises}
					<ChevronUp className="h-4 w-4 text-text-subtle" aria-hidden="true" />
				</button>
			)}
		</>
	);
}
