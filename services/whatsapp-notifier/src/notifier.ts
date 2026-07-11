import { config } from "./config.js";
import { getDailyQuote } from "./quotes.js";

const ALLOWED_HOSTS = new Set([
  "api.openwa.com",
  "api.twilio.com",
  "api.wati.io",
  "api.callmebot.com",
  "graph.facebook.com",
]);

export interface WhatsAppPayload {
  phone: string;
  message: string;
}

function validateOutboundUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`URL de WhatsApp inválida: ${url}`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Solo se permiten conexiones HTTPS para la API de WhatsApp.");
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(`Host no permitido para la API de WhatsApp: ${parsed.hostname}`);
  }
  return url;
}

export function buildDailyMessage(routineUrl: string): string {
  const quote = getDailyQuote();
  return `🎙️ VocalGym — Recordatorio de entrenamiento

"${quote.text}"
— ${quote.author}

Hoy tu voz necesita su rutina. Ingresá y empezá el calentamiento:
${routineUrl}

Escuchá a tu cuerpo. La técnica existe para servirte, no para dominarte.`;
}

export async function sendWhatsAppMessage(
  payload: WhatsAppPayload
): Promise<void> {
  const safeUrl = validateOutboundUrl(config.WHATSAPP_API_URL);
  try {
    const response = await fetch(safeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.WHATSAPP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: payload.phone,
        body: payload.message,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    console.log(
      `[WhatsApp] Mensaje enviado a ${payload.phone}`,
      response.status
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[WhatsApp] Error al enviar mensaje:`, error.message);
    } else {
      console.error(`[WhatsApp] Error inesperado:`, error);
    }
    throw error;
  }
}
