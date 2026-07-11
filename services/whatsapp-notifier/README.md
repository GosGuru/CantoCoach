# WhatsApp Notifier for VocalGym

Servicio de notificaciones programadas para VocalGym. Envía recordatorios de entrenamiento por WhatsApp con frases inspiradoras de maestros que inspiran a Areh.

## Variables de entorno

Crear un archivo `.env` en la raíz de `services/whatsapp-notifier` con:

```bash
WHATSAPP_API_URL=https://api.openwa.com/v1/messages
WHATSAPP_API_KEY=tu_api_key_aqui
RECIPIENT_PHONE=5491112345678
APP_URL=https://vocalgym.app
CRON_SCHEDULE=0 10 * * *
TIMEZONE=America/Argentina/Buenos_Aires
```

### Descripción de variables

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `WHATSAPP_API_URL` | Endpoint HTTPS de la pasarela de WhatsApp. | `https://api.openwa.com/v1/messages` |
| `WHATSAPP_API_KEY` | API key de la pasarela. | `Bearer ...` |
| `RECIPIENT_PHONE` | Número destinatario en formato internacional. | `5491112345678` |
| `APP_URL` | URL base de la app para generar el enlace a la rutina. | `https://vocalgym.app` |
| `CRON_SCHEDULE` | Expresión cron de la notificación diaria. | `0 10 * * *` (10:00 hs) |
| `TIMEZONE` | Zona horaria para cron. | `America/Argentina/Buenos_Aires` |

## Instalación

```bash
cd services/whatsapp-notifier
npm install
npm run dev
```

## Producción

```bash
npm run build
npm start
```

## Nota sobre pasarelas

Este servicio está diseñado para funcionar con cualquier pasarela que exponga una API REST de envío de WhatsApp. Ejemplos: OpenWa, Twilio, WATI, CallMeBot, Meta Cloud API, etc. Solo se necesita configurar `WHATSAPP_API_URL` y `WHATSAPP_API_KEY`.

Por seguridad, el servicio valida que el host de `WHATSAPP_API_URL` pertenezca a una lista de hosts permitidos. Si usás otra pasarela, agregala al allowlist en `src/notifier.ts`.

## Seguridad

- Nunca commitear `.env`.
- Rotar la API key periódicamente.
- Limitar el número de destinatarios y frecuencia para evitar spam.
- Solo se permiten conexiones HTTPS.
