import { CheckCircle2, LockKeyhole, TrendingUp } from "lucide-react";
import type { ProgressionGateResult } from "../domain/progression/evaluateExerciseProgression.ts";

interface ProgressionSummaryProps {
	result: ProgressionGateResult;
}

const STATE_STYLES: Record<
	ProgressionGateResult["state"],
	{ label: string; border: string; icon: string }
> = {
	"no-evidence": {
		label: "Sin evidencia",
		border: "border-border bg-surface/60",
		icon: "text-text-subtle",
	},
	building: {
		label: "Construyendo evidencia",
		border: "border-sky/25 bg-sky/8",
		icon: "text-sky",
	},
	hold: {
		label: "Mantener nivel",
		border: "border-gold/25 bg-gold/8",
		icon: "text-gold",
	},
	ready: {
		label: "Listo para progresar",
		border: "border-emerald/30 bg-emerald/8",
		icon: "text-emerald",
	},
};

export function ProgressionSummary({ result }: ProgressionSummaryProps) {
	const style = STATE_STYLES[result.state];
	const Icon = result.state === "ready" ? CheckCircle2 : result.state === "hold" ? LockKeyhole : TrendingUp;

	return (
		<section className={`rounded-2xl border p-5 ${style.border}`}>
			<div className="flex items-start gap-3">
				<Icon className={`w-5 h-5 mt-0.5 shrink-0 ${style.icon}`} aria-hidden="true" />
				<div>
					<p className="text-xs uppercase tracking-wider text-text-subtle">
						Progresión técnica
					</p>
					<h2 className="text-base font-semibold text-text mt-1">{style.label}</h2>
					<p className="text-sm text-text-muted mt-2 leading-relaxed">
						{result.summary}
					</p>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">
				<span className="rounded-md bg-canvas/50 border border-border px-2 py-1">
					Intentos válidos: {result.evaluableAttempts}/{result.requiredAttempts}
				</span>
				{result.state === "ready" || result.state === "hold" ? (
					<span className="rounded-md bg-canvas/50 border border-border px-2 py-1">
						Criterios: {result.passedCriteria}/{result.totalCriteria}
					</span>
				) : null}
			</div>

			<ul className="mt-4 space-y-1.5 text-xs text-text-muted">
				{result.reasons.map((reason) => (
					<li key={reason}>{reason}</li>
				))}
			</ul>
		</section>
	);
}
