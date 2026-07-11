import { config } from "./config.js";
import { sendImmediateNotification, startScheduler } from "./scheduler.js";

async function main() {
  console.log("🎙️ CantoCoach WhatsApp Notifier iniciado");
  console.log(`🔗 APP_URL: ${config.APP_URL}`);

  if (config.SEND_STARTUP_TEST) {
    try {
      await sendImmediateNotification();
      console.log("[Startup] Notificación de prueba enviada correctamente.");
    } catch (error) {
      console.error("[Startup] La notificación de prueba falló. Revisá tu configuración.", error);
    }
  } else {
    console.log("[Startup] Prueba inmediata desactivada.");
  }

  startScheduler();
}

main().catch((error) => {
  console.error("[Fatal] Error no controlado:", error);
  process.exit(1);
});
