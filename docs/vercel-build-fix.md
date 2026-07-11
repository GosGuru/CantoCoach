# Vercel build compatibility

The microphone request intentionally avoids the optional `latency` media constraint because the TypeScript DOM definitions used by the production build do not consistently expose it. Echo cancellation, automatic gain control, channel preference and the fallback capture path remain enabled.
