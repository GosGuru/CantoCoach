import { useMemo, useState } from "react";
import {
	Award,
	Calendar,
	Clock,
	Dumbbell,
	Flame,
	RotateCcw,
	Sparkles,
	TrendingUp,
	User,
} from "lucide-react";
import { vocalExerciseById } from "../data/vocalExercises";
import {
	calculateCurrentStreak,
	calculateWeeklyMinutes,
} from "../domain/progress/sessionStats";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
	analyzeDailyReport,
	DEFAULT_PROFILE,
	generateRoutine,
} from "../services/coachAgent";
import type { Exercise as VocalExercise } from "../types/vocal";
import type {
	CoachFeedback,
	DailyReportInput,
	DailyRoutine,
	SessionRecord,
	VocalProfile,
} from "../types/vocalgym";
import { DailyReportForm } from "./DailyReportForm";
import { FocusPlayer } from "./FocusPlayer";
import { KnowledgeSearch } from "./KnowledgeSearch";
import { ProgressView } from "./ProgressView";
import { RoutineCard } from "./RoutineCard";
import { VocalProfileForm } from "./VocalProfileForm";

const DEFAULT_ROUTINE = generateRoutine(DEFAULT_PROFILE, "balanced", 30);

function MetricCard({
	icon: Icon,
	label,
	value,
	accent,
}: {
	icon: React.ElementType;
	label: string;
	value: React.ReactNode;
	accent: string;
}) {
	return (
		<article className="glass-panel card-gradient rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
			<div className="flex items-center justify-between mb-3">
				<div className={`w-9 h-9 rounded-lg ${accent}/15 flex items-center justify-center`}>
					<Icon className={`w-5 h-5 ${accent}`} aria-hidden="true" />
				</div>
				<span className="text-xs text-text-subtle uppercase tracking-wider">
					{label}
				</span>
			</div>
			<p className="text-2xl font-bold font-display">{value}</p>
		</article>
	);
}

export function Dashboard() {
	const [profile, setProfile] = useLocalStorage<VocalProfile | null>(
		"vocalgym-profile",
		null,
	);
	const [routine, setRoutine] = useLocalStorage<DailyRoutine>(
		"vocalgym-routine",
		DEFAULT_ROUTINE,
	);
	const [completedIds, setCompletedIds] = useLocalStorage<string[]>(
		"vocalgym-completed",
		[],
	);
	const [sessions, setSessions] = useLocalStorage<SessionRecord[]>(
		"vocalgym-sessions",
		[],
	);
	const [activeExercise, setActiveExercise] = useState<VocalExercise | null>(null);
	const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
	const [activeView, setActiveView] = useState<"routine" | "progress">(
		"routine",
	);

	const routineExercises = useMemo(
		() =>
			routine.exercises
				.map((id) => vocalExerciseById(id))
				.filter((exercise): exercise is VocalExercise => exercise !== undefined),
		[routine],
	);

	const completionRate = useMemo(() => {
		if (routineExercises.length === 0) return 0;
		const completed = routineExercises.filter((exercise) =>
			completedIds.includes(exercise.id),
		).length;
		return Math.round((completed / routineExercises.length) * 100);
	}, [routineExercises, completedIds]);

	const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
	const weeklyMinutes = useMemo(() => calculateWeeklyMinutes(sessions), [sessions]);

	const handleComplete = (exercise: VocalExercise) => {
		if (!completedIds.includes(exercise.id)) {
			setCompletedIds((previous) => [...previous, exercise.id]);
		}
		setActiveExercise(null);
	};

	const handleToggleComplete = (exerciseId: string) => {
		if (!vocalExerciseById(exerciseId)) return;
		setCompletedIds((previous) =>
			previous.includes(exerciseId)
				? previous.filter((id) => id !== exerciseId)
				: [...previous, exerciseId],
		);
	};

	const handleProfileSubmit = (newProfile: VocalProfile) => {
		setProfile(newProfile);
		setRoutine(generateRoutine(newProfile, "balanced", 30, sessions));
		setCompletedIds([]);
	};

	const handleEditProfile = () => {
		setProfile(null);
		setCompletedIds([]);
	};

	const handleReportSubmit = (report: DailyReportInput) => {
		const activeProfile = profile ?? DEFAULT_PROFILE;
		const result = analyzeDailyReport(report, activeProfile, sessions);
		const totalMinutes = completedIds.reduce((sum, id) => {
			return sum + (vocalExerciseById(id)?.durationMinutes ?? 0);
		}, 0);

		const newSession: SessionRecord = {
			id: crypto.randomUUID(),
			date: report.date,
			routine,
			completedExerciseIds: [...completedIds],
			report,
			feedback: result,
			totalMinutes,
		};

		setSessions((previous) => {
			const otherDays = previous.filter((session) => session.date !== report.date);
			return [...otherDays, newSession];
		});
		setFeedback(result);
		setRoutine(result.nextRoutine);
		setCompletedIds([]);
	};

	return (
		<div className="min-h-svh text-text">
			{activeExercise && (
				<FocusPlayer
					exercise={activeExercise}
					onClose={() => setActiveExercise(null)}
					onComplete={handleComplete}
				/>
			)}

			<header className="sticky top-0 z-40 border-b border-border glass-panel">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-gold flex items-center justify-center shadow-lg shadow-accent/20">
								<Sparkles className="w-5 h-5 text-accent-foreground" aria-hidden="true" />
							</div>
							<div>
								<h1 className="text-xl font-bold text-gradient">CantoCoach</h1>
								<p className="text-xs text-text-subtle">Entrenador vocal personal</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="flex items-center gap-3 rounded-xl bg-surface/60 border border-border px-3 py-2">
								<div className="flex items-center gap-1.5 text-gold">
									<Flame className="w-4 h-4" aria-hidden="true" />
									<span className="font-bold text-sm">{streak}</span>
								</div>
								<div className="w-px h-5 bg-divider" />
								<div className="flex items-center gap-1.5 text-emerald">
									<Clock className="w-4 h-4" aria-hidden="true" />
									<span className="font-bold text-sm">{weeklyMinutes} min</span>
								</div>
							</div>

							{profile && (
								<button
									type="button"
									onClick={handleEditProfile}
									className="hidden sm:flex items-center gap-2 rounded-xl bg-surface/60 border border-border px-3 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-elevated transition-colors"
								>
									<User className="w-4 h-4 text-accent" aria-hidden="true" />
									<span className="capitalize">{profile.voiceType}</span>
								</button>
							)}
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
				<nav
					aria-label="Vistas principales"
					className="inline-flex p-1 rounded-xl bg-surface/70 border border-border"
				>
					<button
						type="button"
						onClick={() => setActiveView("routine")}
						className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
							activeView === "routine"
								? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
								: "text-text-muted hover:text-text"
						}`}
					>
						<Calendar className="w-4 h-4" aria-hidden="true" />
						Rutina
					</button>
					<button
						type="button"
						onClick={() => setActiveView("progress")}
						className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
							activeView === "progress"
								? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
								: "text-text-muted hover:text-text"
						}`}
					>
						<TrendingUp className="w-4 h-4" aria-hidden="true" />
						Progreso
					</button>
				</nav>

				{activeView === "progress" ? (
					<ProgressView sessions={sessions} />
				) : profile ? (
					<>
						<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							<MetricCard
								icon={Calendar}
								label="Hoy"
								value={<>{routine.totalMinutes} <span className="text-base text-text-muted">min</span></>}
								accent="text-accent"
							/>
							<MetricCard
								icon={Dumbbell}
								label="Rutina"
								value={routineExercises.length}
								accent="text-sky"
							/>
							<MetricCard
								icon={TrendingUp}
								label="Completado"
								value={`${completionRate}%`}
								accent="text-emerald"
							/>
							<MetricCard
								icon={Flame}
								label="Racha"
								value={`${streak} días`}
								accent="text-gold"
							/>
						</section>

						<section className="glass-panel rounded-xl p-5 sm:p-6">
							<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-3 mb-2">
										<h2 className="section-title">Rutina del día</h2>
										<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium border border-accent/20">
											<User className="w-3 h-3" aria-hidden="true" />
											{profile.voiceType} · {profile.level}
										</span>
									</div>
									<p className="section-subtitle max-w-2xl">{routine.focus}</p>
									{routine.adaptationReason && (
										<p className="mt-2 text-xs text-text-subtle">
											<span className="font-medium text-text-muted">Adaptación:</span>{" "}
											{routine.adaptationReason}
										</p>
									)}
								</div>
								<button
									type="button"
									onClick={() => {
										setCompletedIds([]);
										setRoutine(generateRoutine(profile, "balanced", 30, sessions));
									}}
									className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-text-muted text-sm font-medium border border-border hover:text-text"
								>
									<RotateCcw className="w-4 h-4" aria-hidden="true" />
									Restablecer
								</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{routineExercises.map((exercise) => (
									<RoutineCard
										key={exercise.id}
										exercise={exercise}
										onStart={setActiveExercise}
										onToggleComplete={handleToggleComplete}
										isCompleted={completedIds.includes(exercise.id)}
									/>
								))}
							</div>

							{routineExercises.length === 0 && (
								<div className="text-center py-10">
									<Award className="w-7 h-7 text-text-subtle mx-auto mb-3" aria-hidden="true" />
									<p className="text-sm text-text-muted">No hay ejercicios vocales asignados.</p>
								</div>
							)}
						</section>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<DailyReportForm onSubmit={handleReportSubmit} />
							<KnowledgeSearch />
						</div>

						{feedback && (
							<section className="glass-panel rounded-xl p-5 sm:p-6 border-l-4 border-accent">
								<h2 className="section-title mb-2">Feedback del coach</h2>
								<p className="text-sm text-text-muted leading-relaxed">{feedback.summary}</p>
								<p className="text-sm text-text mt-3 font-medium p-3 rounded-lg bg-surface/60 border border-border">
									{feedback.recommendation}
								</p>
								<p className="text-sm text-accent mt-4 italic">{feedback.closingPhrase}</p>
							</section>
						)}
					</>
				) : (
					<VocalProfileForm onSubmit={handleProfileSubmit} />
				)}
			</main>
		</div>
	);
}
