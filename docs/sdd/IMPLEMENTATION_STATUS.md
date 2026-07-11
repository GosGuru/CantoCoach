# Estado de implementación

## Integrado en `main`

La PR #1 incorporó la base SDD, seguridad vocal, fechas locales, progreso derivado, motor de audio, detector YIN y afinador en vivo.

## En la segunda entrega

- selección de nota objetivo;
- calibración breve del ruido ambiente;
- cuenta regresiva;
- captura completa de un intento sostenido;
- trayectoria reducida sin guardar audio;
- ataque inicial y dirección;
- tiempo de estabilización;
- error central;
- estabilidad tonal;
- deriva final;
- feedback con un único foco;
- persistencia local;
- reintento comparado;
- contratos de `ExerciseAttempt` y `PracticeSession`;
- 17 pruebas del núcleo.

## Pendiente

- comprobar lint, typecheck y build completos en CI;
- enlazar atómicamente `PracticeSession` con los intentos;
- diferenciar completado manual de evidencia técnica en el generador;
- series, repeticiones y descansos;
- call-and-response automático;
- AudioWorklet o Worker;
- línea base y plan de ocho semanas;
- Safari iPhone y Chrome con micrófono real.
