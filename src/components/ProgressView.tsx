import { useMemo } from "react";
import {
	Calendar,
	Clock,
	Dumbbell,
	Flame,
	TrendingUp,
	Activity,
	Music,
	CheckCircle2,
} from "lucide-react";
import type { SessionRecord } from "../types/vocalgym";

interface ProgressViewProps {
	sessions: SessionRecord[];
}

const ISSUE_LABELS: Record<SessionRecord["feedback"]["primaryIssue"], string> =
	{
		constricción: "Constricción",
		passaggio: "Passaggio",
		fatiga: "Fatiga",
		equilibrio: "Equilibrio",
		dolor: "Dolor / alerta",
	};

const ISSUE_COLORS: Record<SessionRecord["feedback"]["primaryIssue"], string> =
	{
		constricción: "text-rose",
		passaggio: "text-sky",
		fatiga: "text-gold",
		equilibrio: "text-emerald",
		dolor: "text-rose",
	};

function formatShortDate(dateString: string) {
	const date = new Date(dateString);
	return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function computeStreakFromSessions(sessions: SessionRecord[]) {
	if (sessions.length === 0) return 0;

	const today = new Date().toISOString().split("T")[0];
	const sessionDates = new Set(sessions.map((s) => s.date));
	const sortedDates = Array.from(sessionDates).sort();
	const mostRecent = sortedDates[sortedDates.length - 1];

	let current =
		mostRecent === today
			? today
			: new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
	let streak = 0;

	while (sessionDates.has(current)) {
		streak += 1;
		const previous = new Date(new Date(current).getTime() - 86_400_000)
			.toISOString()
			.split("T")[0];
		current = previous;
	}

	return streak;
}

function resolveStreak(sessions: SessionRecord[]) {
	if (typeof window === "undefined") return 0;
	const raw = window.localStorage.getItem("vocalgym-streak");
	if (raw !== null) {
		const parsed = Number.parseInt(raw, 10);
		if (!Number.isNaN(parsed)) return parsed;
	}
	return computeStreakFromSessions(sessions);
}

function MetricCard({
	icon: Icon,
	label,
	value,
	accent,
	gradient,
}: {
	icon: React.ElementType;
	label: string;
	value: string;
	accent: string;
	gradient: string;
}) {
	return (
		<article className="glass-panel card-gradient rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
			<div className="flex items-center justify-between mb-3">
				<div
					className={`w-9 h-9 rounded-lg ${gradient} flex items-center justify-center`}
				>
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

function TrendChart({ sessions }: { sessions: SessionRecord[] }) {
	const lastSeven = useMemo(() => {
		const uniqueDates = [...sessions].sort((a, b) =>
			a.date.localeCompare(b.date),
		);
		const seen = new Set<string>();
		const deduped: SessionRecord[] = [];
		for (const session of uniqueDates) {
			if (!seen.has(session.date)) {
				seen.add(session.date);
				deduped.push(session);
			}
		}
		return deduped.slice(-7);
	}, [sessions]);

	if (lastSeven.length === 0) return null;

	const chartHeight = 120;
	const groupWidth = 80;
	const barWidth = 16;
	const gap = 4;
	const chartWidth = lastSeven.length * groupWidth;
	const maxValue = 3;

	return (
		<section
			className="glass-panel rounded-xl p-5 sm:p-6"
			aria-label="Tendencias de las últimas sesiones"
		>
			<div className="flex items-center gap-2 mb-4">
				<Activity className="w-5 h-5 text-accent" aria-hidden="true" />
				<h3 className="section-title">Tendencias de las últimas sesiones</h3>
			</div>
			<div className="overflow-x-auto scrollbar-thin">
				<svg
					role="img"
					aria-label="Gráfico de constricción, control del passaggio y energía de las últimas sesiones"
					width={chartWidth}
					height={chartHeight + 40}
					viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
					className="mx-auto"
				>
					{[0, 1, 2, 3].map((value) => {
						const y = chartHeight - (value / maxValue) * chartHeight;
						return (
							<g key={value}>
								<line
									x1={0}
									y1={y}
									x2={chartWidth}
									y2={y}
									stroke="currentColor"
									className="text-text-subtle opacity-15"
									strokeWidth={1}
									strokeDasharray="3 3"
								/>
								<text
									x={4}
									y={y - 4}
									fill="currentColor"
									className="text-text-subtle text-xs"
									fontSize={10}
								>
									{value}
								</text>
							</g>
						);
					})}

					{lastSeven.map((session, index) => {
						const groupX = index * groupWidth + groupWidth / 2;
						const values = [
							{
								key: "constriction",
								value: session.report.constriction,
								color: "text-rose",
								bg: "bg-rose",
							},
							{
								key: "passaggioControl",
								value: session.report.passaggioControl,
								color: "text-sky",
								bg: "bg-sky",
							},
							{
								key: "energy",
								value: session.report.energy,
								color: "text-gold",
								bg: "bg-gold",
							},
						] as const;

						return (
							<g key={session.date}>
								{values.map((metric, metricIndex) => {
									const height = (metric.value / maxValue) * chartHeight;
									const x =
										groupX -
										(barWidth * 1.5 + gap) +
										metricIndex * (barWidth + gap);
									const y = chartHeight - height;
									return (
										<rect
											key={metric.key}
											x={x}
											y={y}
											width={barWidth}
											height={height}
											rx={4}
											fill="currentColor"
											className={metric.color}
										/>
									);
								})}
								<text
									x={groupX}
									y={chartHeight + 16}
									textAnchor="middle"
									fill="currentColor"
									className="text-text-subtle text-xs"
									fontSize={10}
								>
									{formatShortDate(session.date)}
								</text>
							</g>
						);
					})}
				</svg>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-text-muted">
				<span className="inline-flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-rose" />
					Constricción
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-sky" />
					Passaggio
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="w-2.5 h-2.5 rounded-full bg-gold" />
					Energía
				</span>
			</div>
		</section>
	);
}

export function ProgressView({ sessions }: ProgressViewProps) {
	const totalSessions = sessions.length;
	const totalMinutes = useMemo(
		() => sessions.reduce((sum, session) => sum + session.totalMinutes, 0),
		[sessions],
	);
	const streak = resolveStreak(sessions);
	const recentSessions = useMemo(
		() =>
			[...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
		[sessions],
	);

	if (totalSessions === 0) {
		return (
			<section className="glass-panel rounded-2xl p-8 sm:p-12 text-center">
				<div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
					<TrendingUp className="w-7 h-7 text-accent" aria-hidden="true" />
				</div>
				<h2 className="text-xl font-semibold mb-2">
					Todavía no hay sesiones guardadas
				</h2>
				<p className="text-text-muted max-w-md mx-auto leading-relaxed">
					Completá tu rutina de hoy y enviá el reporte al agente. Tu progreso
					aparecerá acá.
				</p>
			</section>
		);
	}

	return (
		<div className="space-y-8">
			<section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<MetricCard
					icon={Dumbbell}
					label="Sesiones"
					value={String(totalSessions)}
					accent="text-accent"
					gradient="bg-accent/15"
				/>
				<MetricCard
					icon={Clock}
					label="Minutos entrenados"
					value={`${totalMinutes} min`}
					accent="text-emerald"
					gradient="bg-emerald/15"
				/>
				<MetricCard
					icon={Flame}
					label="Racha actual"
					value={`${streak} días`}
					accent="text-gold"
					gradient="bg-gold/15"
				/>
			</section>

			<TrendChart sessions={sessions} />

			<section className="glass-panel rounded-xl p-5 sm:p-6">
				<div className="flex items-center gap-2 mb-4">
					<Music className="w-5 h-5 text-accent" aria-hidden="true" />
					<h3 className="section-title">Sesiones recientes</h3>
				</div>
				<ul className="space-y-3">
					{recentSessions.map((session) => (
						<li
							key={session.id}
							className="group flex items-center justify-between gap-4 p-3 rounded-xl bg-surface/60 border border-border hover:border-accent/30 transition-colors"
						>
							<div className="flex items-center gap-3 min-w-0">
								<div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
									<Calendar
										className="w-4 h-4 text-accent"
										aria-hidden="true"
									/>
								</div>
								<div className="min-w-0">
									<p className="text-sm font-medium text-text truncate">
										{formatShortDate(session.date)}
									</p>
									<p className="text-xs text-text-muted">
										Tema principal:{" "}
										<span
											className={ISSUE_COLORS[session.feedback.primaryIssue]}
										>
											{ISSUE_LABELS[session.feedback.primaryIssue]}
										</span>
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2 shrink-0">
								{session.completedExerciseIds.length > 0 && (
									<span className="inline-flex items-center gap-1 text-xs text-emerald">
										<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
										{session.completedExerciseIds.length}
									</span>
								)}
								<span className="text-xs font-semibold text-emerald bg-emerald/10 px-2 py-1 rounded-md">
									{session.totalMinutes} min
								</span>
							</div>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
