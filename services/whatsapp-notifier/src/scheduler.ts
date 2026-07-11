import cron from "node-cron";
import { config } from "./config.js";
import { buildDailyMessage, sendWhatsAppMessage } from "./notifier.js";

function resolveRoutineUrl(): string {
  return config.APP_URL.replace(/\/$/, "");
}

export function startScheduler(): void {
  const routineUrl = resolveRoutineUrl();

  if (!cron.validate(config.CRON_SCHEDULE)) {
    throw new Error(`CRON_SCHEDULE inválida: ${config.CRON_SCHEDULE}`);
  }

  console.log(`[Scheduler] Notificaciones programadas con: ${config.CRON_SCHEDULE}`);
  console.log(`[Scheduler] Zona horaria: ${config.TIMEZONE}`);
  console.log(`[Scheduler] Destinatario: ${config.RECIPIENT_PHONE}`);
  console.log(`[Scheduler] Enlace a rutina: ${routineUrl}`);

  cron.schedule(
    config.CRON_SCHEDULE,
    async () => {
      const message = buildDailyMessage(routineUrl);
      try {
        await sendWhatsAppMessage({
          phone: config.RECIPIENT_PHONE,
          message,
        });
      } catch (error) {
        console.error("[Scheduler] Falló el envío programado:", error);
      }
    },
    {
      timezone: config.TIMEZONE,
    },
  );
}

export async function sendImmediateNotification(): Promise<void> {
  const routineUrl = resolveRoutineUrl();
  const message = buildDailyMessage(routineUrl);
  await sendWhatsAppMessage({
    phone: config.RECIPIENT_PHONE,
    message,
  });
}
