# CantoCoach — SDD del MVP técnico

**Versión:** 1.1  
**Estado:** fuente de verdad para la implementación  
**Estrategia:** spec-anchored sobre la aplicación existente  
**Objetivo:** convertir la guía actual de ejercicios en un entrenador vocal que escucha, mide, corrige y demuestra progreso técnico.

## 1. Contrato del producto

CantoCoach debe ejecutar este ciclo:

> escuchar referencia → cantar → medir → elegir una corrección → repetir → adaptar.

El éxito del MVP no se mide por ejercicios marcados como completados. Se mide por poder demostrar, con confianza suficiente, que el usuario entra en la nota con mayor precisión, tarda menos en estabilizarla, la sostiene mejor y termina la frase con más control que en su línea base.

## 2. Constitución

1. **Seguridad antes que adherencia.** Una señal crítica bloquea el entrenamiento.
2. **No diagnosticar.** La app no diagnostica lesiones, constricción, posición laríngea ni participación de cuerdas falsas.
3. **Medir antes de adaptar.** Las reglas distinguen datos acústicos de autopercepción.
4. **Una corrección principal.** Cada intento recibe un único foco prioritario.
5. **El rango se mide.** El tipo de voz declarado no decide por sí solo las frecuencias.
6. **Progreso derivado.** Racha, minutos y avance se calculan desde sesiones e intentos.
7. **Privacidad local-first.** El audio se procesa en el dispositivo y no se conserva por defecto.
8. **Explicabilidad.** Cada ejercicio declara habilidad, motivo, medición, avance y señales para parar.
9. **Técnica al servicio de la interpretación.** Los recursos expresivos deliberados no se penalizan como errores automáticos.
10. **No fingir precisión.** Si la captura no es confiable, la app se niega a puntuar.

## 3. Alcance del MVP

### Incluido

- Modalidad inicial optimizada para barítono.
- Chequeo de seguridad estructurado antes de cada sesión.
- Calibración de micrófono y ruido ambiente.
- Evaluación inicial reproducible.
- Plan de ocho semanas.
- Sesiones de 15–25 minutos.
- Reproducción correcta de sostenidos, staccatos, legatos, escalas, slides y sirenas.
- Captura monofónica.
- Detección de pitch con confianza.
- Métricas de ataque, afinación, estabilidad, final, cobertura, ritmo y continuidad.
- Feedback inmediato y reintento.
- Progresión basada en intentos válidos.
- Transferencia a una frase de repertorio.
- Historial local, reevaluación y exportación JSON.

### Fuera del MVP

- Diagnóstico o tratamiento médico.
- Clasificación automática de tipo vocal.
- Detección fiable de voz de pecho, mixta o cabeza.
- Evaluación objetiva de belleza o emoción.
- Backend, cuentas, pagos o sincronización.
- Coach generativo mediante LLM.
- Análisis con pista sonando por altavoz.
- Soporte pedagógico completo para todos los tipos vocales.

## 4. Seguridad

Antes de entrenar se preguntará explícitamente por:

- dolor al hablar;
- dolor al cantar;
- pérdida súbita de voz;
- sangre o sangrado;
- dificultad para respirar;
- dificultad para tragar;
- afonía completa;
- molestia severa;
- fatiga vocal.

Estados:

```ts
type SafetyState = "safe" | "caution" | "blocked";
```

Cuando el estado es `blocked`:

- no se genera ni reproduce una rutina vocal;
- no se abre el micrófono;
- no se suman minutos ni racha;
- se registra el bloqueo;
- se recomienda evaluación profesional sin emitir diagnóstico.

Cada ejercicio debe ofrecer **Parar por molestia**. Un intento interrumpido no recibe puntaje ni habilita progresión.

## 5. Evaluación inicial

La línea base contiene:

1. cinco ataques sobre una nota central;
2. tres notas sostenidas;
3. escala de cinco notas;
4. deslizamiento por la zona alta;
5. frase breve de repertorio.

Debe guardar versión del protocolo, dispositivo, frecuencia de muestreo y condiciones de captura.

## 6. Perfil inicial

El MVP es barítono-first. El perfil almacena:

```ts
interface MeasuredRange {
  comfortableLowHz: number;
  comfortableHighHz: number;
  cautionLowHz: number;
  cautionHighHz: number;
  measuredAt: string;
  confidence: number;
}
```

Prioridades iniciales para el usuario primario:

- ataques y cierre eficiente: 35 %;
- estabilidad y final de frase: 25 %;
- passaggio y zona alta: 25 %;
- transferencia a repertorio: 15 %.

Los objetivos son pesos, no una lista booleana decorativa.

## 7. Audio

Se utilizará una única `AudioSession` para contexto, micrófono, síntesis, captura, pausa y limpieza.

Requisitos:

- utilizar el BPM predeterminado del ejercicio;
- reprogramar audio e indicador al cambiar BPM;
- usar un renderer real por patrón;
- reproducir la referencia antes de capturar la voz;
- calibrar ruido, nivel y clipping;
- calcular la duración desde series, repeticiones y descansos.

```ts
interface ExercisePrescription {
  sets: number;
  repetitionsPerSet: number;
  noteDurationMs: number;
  restBetweenRepsMs: number;
  restBetweenSetsMs: number;
}
```

Marcar manualmente un ejercicio produce `manual-unscored` y no cuenta como evidencia técnica.

## 8. Pitch y métricas

El detector inicial es YIN. El MVP actual ya permite seleccionar una nota, calibrar el ambiente, ejecutar una cuenta regresiva, capturar un intento y producir métricas locales.

```ts
interface PitchFrame {
  timestampMs: number;
  frequencyHz: number | null;
  midiNote: number | null;
  centsFromTarget: number | null;
  confidence: number;
  rms: number;
  voiced: boolean;
}
```

Métricas implementadas para intentos sostenidos:

- mediana del error absoluto en cents;
- error inicial del ataque;
- entrada desde abajo, arriba o directa;
- tiempo de estabilización;
- dispersión durante tono recto;
- deriva al final;
- cobertura de voz confiable;
- confianza global de medición.

Pendientes para patrones completos:

- error rítmico de onset;
- continuidad en sirenas y slides;
- comparación de secuencias de varias notas.

No todos los ejercicios usan todas las métricas. El vibrato de repertorio no se evalúa como un tono recto.

## 9. Feedback

Formato obligatorio:

1. **Qué ocurrió.**
2. **Evidencia medible.**
3. **Una acción.**
4. **Objetivo del siguiente intento.**

Ejemplo:

> Entraste 34 cents por debajo y tardaste 410 ms en centrarte. Escuchá la referencia, esperá medio segundo y atacá con “mum” sin deslizar. Buscamos entrar dentro de ±25 cents antes de 250 ms.

El feedback no convierte datos acústicos en afirmaciones anatómicas.

El selector actual prioriza, en este orden:

1. calidad de captura;
2. ataque;
3. afinación central;
4. estabilidad;
5. final de nota;
6. confirmación positiva.

## 10. Reintentos

Un intento medido se persiste localmente junto con:

- nota objetivo;
- trayectoria reducida;
- métricas;
- calidad de captura;
- feedback;
- referencia al intento anterior.

Al repetir la misma nota dentro del mismo ejercicio, el sistema compara:

- error central;
- tiempo de estabilización;
- estabilidad;
- deriva final.

Una mejora se muestra como diferencia respecto del propio intento anterior, no contra una voz universal ideal.

## 11. Progresión

Macroplan inicial:

- Semana 0: línea base.
- Semanas 1–2: ataques.
- Semanas 3–4: estabilidad y finales.
- Semanas 5–6: continuidad en zona alta.
- Semanas 7–8: repertorio y reevaluación.

La rutina conserva un núcleo estable durante varias sesiones para poder medir aprendizaje.

Un ejercicio avanza cuando existen varios intentos válidos, confianza suficiente, ausencia de molestias y consistencia. Dos sesiones con degradación, fatiga o baja calidad reducen rango, repeticiones o dificultad.

Los días de descanso planificados cuentan como adherencia y no rompen la racha.

## 12. Datos

Entidades principales:

```ts
interface PracticeSession {
  id: string;
  localDate: string;
  startedAt: string;
  endedAt?: string;
  attemptIds: string[];
  status: "active" | "partial" | "completed" | "interrupted";
}

interface ExerciseAttempt {
  id: string;
  practiceSessionId?: string;
  exerciseId: string;
  createdAt: string;
  durationMs: number;
  measurementConfidence: number;
  completionMode: "measured" | "manual-unscored";
  interruptionReason?: "pain" | "fatigue" | "technical" | "user";
}
```

Reglas:

- las fechas de dominio son locales, no UTC;
- `America/Montevideo` es la zona inicial;
- racha y minutos se derivan de sesiones;
- los intentos guardan métricas y trayectoria reducida;
- el audio completo no se conserva por defecto;
- todos los esquemas, ejercicios y protocolos tienen versión;
- se ofrecerá exportación JSON.

## 13. Arquitectura

```text
src/
  app/
  domain/
    safety/
    profile/
    routine/
    attempts/
    metrics/
    progression/
  audio/
    input/
    synthesis/
    pitch/
    analysis/
  features/
    onboarding/
    baseline/
    practice/
    progress/
  infrastructure/
    persistence/
    notifications/
    export/
```

React coordina UI. La detección de pitch, seguridad, scoring y progresión no viven dentro de componentes.

## 14. Uso de AREH

AREH se utiliza como inspiración pedagógica:

- lenguaje práctico;
- cues sensoriales;
- una modificación principal por vez;
- técnica aplicada al repertorio;
- identidad artística por encima de la imitación.

Los cues se redactan de forma propia y se etiquetan como acción, sensación, metáfora o anatomía. “Máscara”, “twang”, “embudo” o “laringe baja” se presentan como herramientas pedagógicas, no como hechos diagnosticados por el micrófono.

## 15. Milestones

### M0 — Saneamiento

- documentación SDD;
- README real;
- CI, lint, test, typecheck y build;
- fechas locales;
- racha y minutos derivados;
- migraciones;
- corrección de notificaciones y rutas.

### M1 — Seguridad y sesión

- chequeo estructurado;
- estados safe/caution/blocked;
- bloqueo duro;
- parada por molestia;
- `PracticeSession` y `ExerciseAttempt`;
- separación entre completado medido y manual.

### M2 — Motor de audio

- BPM por ejercicio;
- resincronización;
- renderers por patrón;
- series, repeticiones y descansos;
- call-and-response automático;
- unificación futura bajo `AudioSession`.

### M3 — Micrófono y pitch

- permisos y calibración;
- YIN;
- confianza y cents;
- rechazo de ruido y señal débil;
- afinador en vivo;
- intento medido;
- pruebas en Chrome y Safari iPhone.

### M4 — Métricas y feedback

- onset;
- estabilización;
- afinación;
- estabilidad;
- final;
- selector de problema principal;
- plantillas de feedback;
- reintentos comparativos.

### M5 — Línea base y adaptación

- rango medido;
- objetivos ponderados;
- macroplan de ocho semanas;
- reglas de avance y regresión;
- explicación de la rutina.

### M6 — Progreso y repertorio

- vistas objetivas y subjetivas;
- frase sin adornos, técnica e interpretativa;
- reevaluación;
- exportación.

### M7 — Hardening

- accesibilidad;
- rendimiento;
- privacidad;
- recuperación;
- revisión pedagógica;
- pruebas reales y ajuste de umbrales.

## 16. Criterios críticos

```gherkin
Dado que el usuario marca dolor al cantar
Cuando intenta comenzar
Entonces no se reproduce ningún ejercicio
Y no se suman minutos ni racha
```

```gherkin
Dado un usuario en America/Montevideo a las 22:30
Cuando completa una sesión
Entonces se guarda el día local correcto
```

```gherkin
Dado que no hay voz confiable
Cuando termina el intento
Entonces no se genera un puntaje técnico
```

```gherkin
Dado un segundo intento sobre la misma nota
Cuando finaliza con métricas válidas
Entonces se compara contra el intento anterior
Y se muestra qué mejoró o empeoró
```

```gherkin
Dado un ejercicio completado manualmente
Cuando se evalúa el siguiente nivel
Entonces no cuenta como evidencia técnica
```

## 17. Definition of Done

El MVP está terminado cuando seguridad, fechas, progreso, patrones de audio, calibración, detección, métricas, feedback, progresión, línea base, repertorio y reevaluación funcionan en Chrome de escritorio y Safari móvil; lint, tests, typecheck y build pasan; y ningún texto presenta la app como diagnóstico o terapia.
