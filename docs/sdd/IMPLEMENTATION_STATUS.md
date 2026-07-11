# Estado de implementación

## Integrado en `main`

La PR #1 incorporó la base SDD, seguridad vocal, fechas locales, progreso derivado, motor de audio, detector YIN y afinador en vivo.

## PR #3 — Intento medido

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
- contratos iniciales de `ExerciseAttempt` y `PracticeSession`;
- 17 pruebas del núcleo;
- lint, typecheck y build validados en CI.

## PR #4 — Sesiones prescritas y progresión

- `PracticeSession` versionada y enlazada a cada intento;
- series, repeticiones, duración y descansos derivados por bloque;
- solo los intentos evaluables avanzan la prescripción;
- call-and-response por repetición con `Escuchar y grabar`;
- cierre parcial, interrupción, finalización manual y finalización medida;
- dashboard con estados `Manual`, `Medido` y `Habilita progresión`;
- gates por afinación, estabilidad, ataque, confianza, cobertura y clipping;
- evidencia de progresión separada de la adherencia;
- práctica manual incapaz de desbloquear ejercicios;
- cada nivel superior requiere evidencia medida del nivel anterior en su bloque;
- 30 pruebas del núcleo.

## Pendiente

- prueba manual de call-and-response con micrófono real;
- Chrome de escritorio;
- Safari iPhone;
- migración explícita de sesiones históricas de versión 1;
- descanso automático entre repeticiones y series completas sin interacción;
- AudioWorklet o Worker;
- línea base y rango cómodo;
- plan adaptativo de ocho semanas;
- repertorio y reevaluación.
