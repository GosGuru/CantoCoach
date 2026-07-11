# CantoCoach

CantoCoach es un entrenador vocal web local-first. La aplicación organiza rutinas, reproduce referencias, registra sesiones y ya incluye un primer flujo de intentos vocales medidos.

El núcleo del producto es:

> escuchar referencia → cantar → medir → corregir → repetir → adaptar.

## Estado

La aplicación se encuentra en desarrollo activo. La especificación que gobierna la evolución está en [`docs/sdd/README.md`](docs/sdd/README.md).

La primera modalidad soportada está optimizada para barítono. El producto no realiza diagnósticos médicos ni sustituye a un profesor, foniatra u otorrinolaringólogo.

## Funcionalidad disponible en la rama SDD

- Chequeo diario de seguridad vocal.
- Bloqueo ante señales críticas.
- Referencias con BPM configurable.
- Patrones diferenciados de staccato, legato, sostenido, slide y sirena.
- Micrófono local con detector YIN monofónico.
- Selección de una nota objetivo.
- Calibración breve de ruido ambiente.
- Cuenta regresiva y captura de un intento completo.
- Medición de ataque, afinación central, estabilidad y deriva final.
- Una corrección técnica prioritaria.
- Reintento con comparación contra el intento anterior.
- Persistencia local de métricas sin guardar el audio.

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

La batería actual contiene pruebas de seguridad, fechas locales, conversión de pitch, detección YIN, análisis técnico y comparación de reintentos.

## Estructura actual

```text
src/
  audio/            detección, análisis y síntesis
  components/       interfaz
  data/             ejercicios y base de conocimiento
  domain/           reglas puras de seguridad, progreso y comparación
  hooks/            estado, captura y sesiones
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

1. Terminar el modelo de sesiones e intentos.
2. Añadir series, repeticiones, descansos y call-and-response automático.
3. Mover el análisis a AudioWorklet o Worker.
4. Construir la evaluación de línea base.
5. Crear el plan adaptativo de ocho semanas.
6. Transferir las métricas a repertorio y reevaluación.

## Privacidad

El audio se procesa en el dispositivo. Los intentos guardan una trayectoria reducida y métricas; no conservan la grabación completa por defecto.

## Inspiración pedagógica

El producto toma inspiración de enfoques prácticos de técnica vocal, incluido el contenido de AREH, pero redacta su propio material y trata los cues como herramientas pedagógicas, no como diagnósticos anatómicos.
