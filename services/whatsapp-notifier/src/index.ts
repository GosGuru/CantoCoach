import { config } from "./config.js";
import { startScheduler, sendImmediateNotification } from "./scheduler.js";

async function main() {
  console.log("🎙️ VocalGym WhatsApp Notifier iniciado");
  console.log(`🔗 APP_URL: ${config.APP_URL}`);

  // Envía una notificación inmediata al arrancar (útil para validar la configuración).
  try {
    await sendImmediateNotification();
    console.log("[Startup] Notificación de prueba enviada correctamente.");
  } catch (error) {
    console.error("[Startup] La notificación de prueba falló. Revisá tu configuración.");
  }

  startScheduler();
}

main().catch((error) => {
  console.error("[Fatal] Error no controlado:", error);
  process.exit(1);
});
