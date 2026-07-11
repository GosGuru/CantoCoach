import { AlertTriangle, RotateCcw, ShieldAlert } from "lucide-react";
import { Dashboard } from "./Dashboard";
import { SafetyCheckForm } from "./SafetyCheckForm";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
	isSafetyCheckCurrent,
	type DailySafetyCheck,
} from "../domain/safety/safety";

const STORAGE_KEY = "vocalgym-daily-safety-v1";

function BlockedView({
	check,
	onReview,
}: {
	check: DailySafetyCheck;
	onReview: () => void;
}) {
	return (
		<main className="min-h-svh flex items-center justify-center px-4 py-10 text-text">
			<section className="w-full max-w-2xl glass-panel rounded-2xl p-6 sm:p-9 border border-rose/30">
				<div className="w-14 h-14 rounded-2xl bg-rose/15 flex items-center justify-center mb-5">
					<ShieldAlert className="w-7 h-7 text-rose" aria-hidden="true" />
				</div>
				<p className="text-xs uppercase tracking-wider text-rose font-semibold">
					Entrenamiento bloqueado
				</p>
				<h1 className="text-2xl font-semibold mt-2">Hoy no corresponde entrenar la voz</h1>
				<p className="text-sm text-text-muted mt-3 leading-relaxed">
					Marcaste una o más señales que hacen inseguro continuar desde una app.
					CantoCoach no puede determinar la causa. Evitá forzar la voz y buscá
					evaluación de un profesional de salud vocal, especialmente si la señal es
					súbita, intensa o persiste.
				</p>

				<div className="mt-5 rounded-xl bg-surface/70 border border-border p-4">
					<p className="text-sm font-semibold">Señales registradas</p>
					<ul className="mt-2 space-y-1 text-sm text-text-muted">
						{check.reasons.map((reason) => (
							<li key={reason}>• {reason}</li>
						))}
					</ul>
				</div>

				<div className="mt-5 flex gap-3 rounded-xl border border-gold/25 bg-gold/8 p-4">
					<AlertTriangle className="w-5 h-5 text-gold shrink-0" aria-hidden="true" />
					<p className="text-xs text-text-muted leading-relaxed">
						Este aviso no es un diagnóstico ni una indicación terapéutica. Si hubo
						dificultad respiratoria, sangre, pérdida súbita de voz o dolor importante,
						priorizá atención profesional.
					</p>
				</div>

				<button
					type="button"
					onClick={onReview}
					className="mt-6 inline-flex items-center gap-2 px-4 py-3 rounded-xl btn-secondary"
				>
					<RotateCcw className="w-4 h-4" aria-hidden="true" />
					Revisar respuestas
				</button>
			</section>
		</main>
	);
}

export function SafetyGate() {
	const [storedCheck, setStoredCheck] = useLocalStorage<DailySafetyCheck | null>(
		STORAGE_KEY,
		null,
	);

	const currentCheck = isSafetyCheckCurrent(storedCheck) ? storedCheck : null;

	if (!currentCheck) {
		return <SafetyCheckForm onComplete={setStoredCheck} />;
	}

	if (currentCheck.state === "blocked") {
		return <BlockedView check={currentCheck} onReview={() => setStoredCheck(null)} />;
	}

	return (
		<>
			{currentCheck.state === "caution" && (
				<div className="sticky top-0 z-[60] border-b border-gold/30 bg-canvas/95 px-4 py-3 backdrop-blur">
					<div className="max-w-6xl mx-auto flex items-start gap-3 text-sm">
						<AlertTriangle className="w-5 h-5 text-gold shrink-0" aria-hidden="true" />
						<p className="text-text-muted">
							Reportaste {currentCheck.reasons.join(", ")}. Mantené la sesión suave,
							reducí rango o volumen y detenete ante cualquier molestia.
						</p>
					</div>
				</div>
			)}
			<Dashboard />
		</>
	);
}
