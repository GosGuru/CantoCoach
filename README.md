# CantoCoach

CantoCoach es un entrenador vocal web local-first. La aplicación organiza rutinas, reproduce referencias, registra sesiones y ya incluye un flujo de intentos vocales medidos.

El núcleo del producto es:

> escuchar referencia → cantar → medir → corregir → repetir → adaptar.

## Estado

La aplicación se encuentra en desarrollo activo. La especificación que gobierna la evolución está en [`docs/sdd/README.md`](docs/sdd/README.md).

La primera modalidad soportada está optimizada para barítono. El producto no realiza diagnósticos médicos ni sustituye a un profesor, foniatra u otorrinolaringólogo.

## Funcionalidad disponible

- Chequeo diario de seguridad vocal.
- Bloqueo ante señales críticas.
- Referencias con BPM configurable.
- Piano muestreado para notas y escalas discretas.
- Guía sostenida para notas largas, sirenas y slides.
- Patrones diferenciados de staccato, legato, sostenido, slide y sirena.
- Micrófono local con detector YIN monofónico.
- Selección de una nota objetivo.
- Calibración breve de ruido ambiente.
- Cuenta regresiva y captura de un intento completo.
- Inicio de la duración al detectar la voz, no al abrir el micrófono.
- Duración de captura elegible: 4, 6 u 8 segundos.
- Medición de ataque, afinación central, estabilidad y deriva final.
- Una corrección técnica prioritaria.
- Reintento con comparación contra el intento anterior.
- Persistencia local de métricas sin guardar el audio.
- Guías prácticas con preparación, pasos, errores frecuentes y recursos externos.

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
npm run test
npm run typecheck
npm run build
```

La batería actual contiene pruebas de seguridad, fechas locales, conversión de pitch, detección YIN, análisis técnico, prescripciones, progresión y comparación de reintentos.

## Estructura actual

```text
src/
  audio/            detección, análisis y síntesis
  components/       interfaz
  data/             ejercicios, guías y base de conocimiento
  domain/           reglas puras de seguridad, progreso y comparación
  hooks/            estado, captura y sesiones
  services/         generación de rutina y feedback
  types/            contratos centrales
  utils/            fechas y utilidades compartidas

docs/sdd/           especificación del producto
services/           servicios opcionales, como notificaciones
```

## Referencias de audio

Las notas discretas usan un sampler liviano de Web Audio con muestras de **Salamander Grand Piano**, alojadas por el proyecto Tone.js. Las muestras originales se distribuyen bajo **Creative Commons Attribution 3.0**.

- Fuente del instrumento: `sfzinstruments/SalamanderGrandPiano`.
- Host de muestras: `tonejs.github.io/audio/salamander/`.
- Si la carga externa falla, CantoCoach cambia automáticamente a una guía sostenida generada localmente.

## Principios

- Seguridad antes que adherencia.
- No diagnosticar.
- Separar métricas acústicas de autopercepción.
- Dar una corrección principal por intento.
- Derivar progreso desde sesiones reales.
- Procesar audio localmente por defecto.
- Negarse a puntuar cuando la señal no sea confiable.

## Roadmap resumido

1. Validar las muestras y la captura con micrófonos reales en Chrome y Safari.
2. Mover el análisis a AudioWorklet o Worker.
3. Construir la evaluación de línea base.
4. Crear el plan adaptativo de ocho semanas.
5. Transferir las métricas a repertorio y reevaluación.

## Privacidad

El audio se procesa en el dispositivo. Los intentos guardan una trayectoria reducida y métricas; no conservan la grabación completa por defecto.

Las muestras de piano sí se descargan desde un host público la primera vez que se necesitan. No contienen ni transmiten audio del usuario.

## Inspiración pedagógica

El producto toma inspiración de enfoques prácticos de técnica vocal, incluido el contenido de AREH, pero redacta su propio material y trata los cues como herramientas pedagógicas, no como diagnósticos anatómicos.
