# SDD — Coach medido y sesión visible

## Problema

Las capacidades técnicas existentes estaban implementadas, pero el usuario debía descubrirlas por separado. La experiencia se sentía como una colección de ejercicios y métricas, no como un entrenador que conduce la sesión.

## Objetivo

Hacer visible un ciclo único y accionable:

`escuchar → cantar → corregir → repetir`

La interfaz debe indicar qué hacer ahora, por qué se adapta y qué resultado quedó registrado al terminar.

## Alcance implementado

- panel persistente “Coach de hoy” sobre el dashboard;
- guía compacta durante el reproductor de enfoque;
- próximo ejercicio y avance real de la rutina;
- una sola corrección prioritaria tomada del último intento medido;
- objetivo técnico siguiente tomado del analizador acústico;
- explicación de adaptación basada en evidencia reciente;
- resumen de intentos, mejor error de afinación y confianza media;
- cierre específico al completar todos los ejercicios;
- estado minimizable y persistente;
- actualización automática al grabar, completar o enviar una sesión;
- pruebas unitarias del estado del coach.

## Fuente de datos

El coach usa los contratos locales existentes:

- `DailyRoutine`;
- `ExerciseAttemptRecord`;
- `SessionRecord`;
- IDs de ejercicios completados.

No guarda audio ni añade servicios externos. La prioridad técnica procede del `TechnicalFeedback` generado localmente.

## Estados

1. `listen`: todavía no hay evidencia del día; solicita escuchar la referencia.
2. `correct`: el último intento requiere una corrección concreta.
3. `advance`: el intento fue exitoso; solicita confirmarlo y avanzar.
4. `complete`: la rutina está completa; solicita el reporte diario y muestra resumen.

## Seguridad y límites

- El panel no sustituye el chequeo de seguridad ni diagnostica causas.
- Una medición no evaluable se trata como problema de captura o estabilidad, no como fallo vocal.
- La adaptación visible usa evidencia local reciente; no afirma que exista una evaluación clínica ni perceptual humana.
