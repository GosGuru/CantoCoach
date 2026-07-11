# CantoCoach

CantoCoach es un entrenador vocal web local-first. La aplicación actual organiza rutinas, reproduce referencias, registra sesiones y adapta el trabajo según el perfil y el reporte del usuario.

El objetivo del MVP técnico es evolucionar ese flujo hacia:

> escuchar referencia → cantar → medir → corregir → repetir → adaptar.

## Estado

La aplicación se encuentra en desarrollo activo. La especificación que gobierna la evolución está en [`docs/sdd/README.md`](docs/sdd/README.md).

La primera modalidad soportada está optimizada para barítono. El producto no realiza diagnósticos médicos ni sustituye a un profesor, foniatra u otorrinolaringólogo.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Web Audio API
- Persistencia local en el navegador

## Requisitos

- Node.js 22 o una versión compatible con Vite 8
- npm
- Navegador moderno

## Desarrollo

```bash
npm install
npm run dev
```

## Verificaciones

```bash
npm run lint
npm run typecheck
npm run build
```

## Estructura actual

```text
src/
  components/       interfaz existente
  data/             ejercicios y base de conocimiento
  domain/           reglas puras de seguridad y progreso
  hooks/            estado y audio
  services/         generación de rutina y feedback
  types/            contratos centrales
  utils/            fechas y utilidades compartidas

docs/sdd/           especificación del producto
services/           servicios opcionales, como notificaciones
```

## Principios

- Seguridad antes que adherencia.
- No diagnosticar.
- Separar métricas acústicas de autopercepción.
- Dar una corrección principal por intento.
- Derivar progreso desde sesiones reales.
- Procesar audio localmente por defecto.
- Negarse a puntuar cuando la señal no sea confiable.

## Roadmap resumido

1. Saneamiento, seguridad, fechas y progreso.
2. Motor de audio correcto.
3. Micrófono y detección monofónica de pitch.
4. Métricas de ataque, afinación, estabilidad y final.
5. Línea base y plan adaptativo de ocho semanas.
6. Transferencia a repertorio y reevaluación.

## Privacidad

El MVP se diseña para procesar audio en el dispositivo. Guardar grabaciones será opcional; las métricas podrán persistirse sin conservar el audio completo.

## Inspiración pedagógica

El producto toma inspiración de enfoques prácticos de técnica vocal, incluido el contenido de AREH, pero redacta su propio material y trata los cues como herramientas pedagógicas, no como diagnósticos anatómicos.
