import { useMemo } from "react";
import {
	Activity,
	Calendar,
	CheckCircle2,
	Clock,
	Dumbbell,
	Flame,
	Music,
	TrendingUp,
} from "lucide-react";
import { calculateCurrentStreak } from "../domain/progress/sessionStats";
import type { SessionRecord } from "../types/vocalgym";
import { formatLocalDate } from "../utils/localDate";

interface ProgressViewProps {
	sessions: SessionRecord[];
}

const ISSUE_LABELS: Record<SessionRecord["feedback"]["primaryIssue"], string> = {
	constricción: "Tensión percibida",
	passaggio: "Passaggio",
	fatiga: "Fatiga",
	equilibrio: "Equilibrio",
	dolor: "Alerta de seguridad",
};

const ISSUE_COLORS: Record<SessionRecord["feedback"]["primaryIssue"], string> = {
	constricción: "text-rose",
	passaggio: "text-sky",
	fatiga: "text-gold",
	equilibrio: "text-emerald",
	dolor: "text-rose",
};

function MetricCard({
	icon: Icon,
	label,
	value,
	accent,
	background,
}: {
	icon: React.ElementType;
	label: string;
	value: string;
	accent: string;
	background: string;
}) {
	return (
		<article className="glass-panel card-gradient rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
			<div className="flex items-center justify-between mb-3">
				<div className={`w-9 h-9 rounded-lg ${background} flex items-center justify-center`}>
					<Icon className={`w-5 h-5 ${accent}`} aria-hidden="true" />
				</div>
				<span className="text-xs text-text-subtle uppercase tracking-wider">{label}</span>
			</div>
			<p className="text-2xl font-bold font-display">{value}</p>
		</article>
	);
}

function TrendChart({ sessions }: { sessions: SessionRecord[] }) {
	const lastSeven = useMemo(() => {
		const byDate = new Map<string, SessionRecord>();
		for (const session of [...sessions].sort((a, b) => a.date.localeCompare(b.date))) {
			byDate.set(session.date, session);
		}
		return [...byDate.values()].slice(-7);
	}, [sessions]);

	if (lastSeven.length === 0) return null;

	const chartHeight = 120;
	const groupWidth = 82;
	const barWidth = 16;
	const gap = 4;
	const chartWidth = Math.max(lastSeven.length * groupWidth, 320);

	return (
		<section className="glass-panel rounded-xl p-5 sm:p-6" aria-label="Tendencias subjetivas">
			<div className="flex items-center gap-2 mb-2">
				<Activity className="w-5 h-5 text-accent" aria-hidden="true" />
				<h3 className="section-title">Tendencias del autoinforme</h3>
			</div>
			<p className="text-xs text-text-subtle mb-5">
				Estos valores reflejan tu percepción. No son mediciones acústicas ni diagnósticos.
			</p>

			<div className="overflow-x-auto scrollbar-thin">
				<svg
					role="img"
					aria-label="Tensión percibida, control del passaggio y energía"
					width={chartWidth}
					height={chartHeight + 42}
					viewBox={`0 0 ${chartWidth} ${chartHeight + 42}`}
					className="mx-auto"
				>
					{[0, 1, 2, 3].map((value) => {
						const y = chartHeight - (value / 3) * chartHeight;
						return (
							<g key={value}>
								<line
									x1={0}
									y1={y}
									x2={chartWidth}
									y2={y}
									stroke="currentColor"
									className="text-text-subtle opacity-15"
									strokeDasharray="3 3"
								/>
								<text x={4} y={Math.max(10, y - 4)} fill="currentColor" className="text-text-subtle" fontSize={10}>
									{value}
								</text>
							</g>
						);
					})}

					{lastSeven.map((session, index) => {
						const center = index * groupWidth + groupWidth / 2;
						const metrics = [
							{ key: "tension", value: session.report.constriction, className: "text-rose" },
							{ key: "passaggio", value: session.report.passaggioControl, className: "text-sky" },
							{ key: "energy", value: session.report.energy, className: "text-gold" },
						] as const;

						return (
							<g key={session.date}>
								{metrics.map((metric, metricIndex) => {
									const height = (metric.value / 3) * chartHeight;
									const x = center - (barWidth * 1.5 + gap) + metricIndex * (barWidth + gap);
									return (
										<rect
											key={metric.key}
											x={x}
											y={chartHeight - height}
											width={barWidth}
											height={height}
											rx={4}
											fill="currentColor"
											className={metric.className}
										/>
									);
								})}
								<text
									x={center}
									y={chartHeight + 18}
									textAnchor="middle"
									fill="currentColor"
									className="text-text-subtle"
									fontSize={10}
								>
									{formatLocalDate(session.date)}
								</text>
							</g>
						);
					})}
				</svg>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-text-muted">
				<span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose" />Tensión</span>
				<span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky" />Passaggio</span>
				<span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gold" />Energía</span>
			</div>
		</section>
	);
}

export function ProgressView({ sessions }: ProgressViewProps) {
	const totalSessions = sessions.length;
	const totalMinutes = useMemo(
		() => sessions.reduce((total, session) => total + session.totalMinutes, 0),
		[sessions],
	);
	const streak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
	const recentSessions = useMemo(
		() => [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
		[sessions],
	);

	if (totalSessions === 0) {
		return (
			<section className="glass-panel rounded-2xl p-8 sm:p-12 text-center">
				<div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
					<TrendingUp className="w-7 h-7 text-accent" aria-hidden="true" />
				</div>
				<h2 className="text-xl font-semibold mb-2">Todavía no hay sesiones guardadas</h2>
				<p className="text-text-muted max-w-md mx-auto leading-relaxed">
					Completá una rutina y guardá el reporte. Las métricas acústicas aparecerán cuando se implemente el módulo de escucha.
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
					background="bg-accent/15"
				/>
				<MetricCard
					icon={Clock}
					label="Minutos guardados"
					value={`${totalMinutes} min`}
					accent="text-emerald"
					background="bg-emerald/15"
				/>
				<MetricCard
					icon={Flame}
					label="Racha derivada"
					value={`${streak} días`}
					accent="text-gold"
					background="bg-gold/15"
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
							className="flex items-center justify-between gap-4 p-3 rounded-xl bg-surface/60 border border-border"
						>
							<div className="flex items-center gap-3 min-w-0">
								<div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
									<Calendar className="w-4 h-4 text-accent" aria-hidden="true" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-medium text-text">{formatLocalDate(session.date)}</p>
									<p className="text-xs text-text-muted truncate">
										Tema principal:{" "}
										<span className={ISSUE_COLORS[session.feedback.primaryIssue]}>
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
