# SDD — Referencia sonora interactiva

## 1. Problema

La referencia sonora reproduce el patrón completo en orden y permite pausar o detener, pero el usuario no puede elegir de forma directa desde qué nota comenzar ni saltar a otro punto durante la reproducción. Esto vuelve pasiva una herramienta que debería permitir explorar y repetir fragmentos concretos.

## 2. Objetivo

Convertir la visualización de notas en un controlador interactivo sin alterar la prescripción técnica del ejercicio:

- cada nota del patrón funciona como punto de inicio;
- tocar una nota detiene la reproducción previa y continúa el patrón desde esa posición;
- pausa conserva la posición;
- detener corta el audio, pero conserva la nota elegida para la próxima reproducción;
- el patrón ascendente/descendente original sigue siendo la fuente de verdad.

## 3. No objetivos

Esta iteración no incorpora:

- edición libre o reordenamiento de notas;
- creación de escalas personalizadas;
- loop entre dos marcadores;
- transposición automática de toda la escala;
- cambios en medición, prescripción, progresión o seguridad vocal.

Esas funciones requieren validar primero que el control por punto de inicio resuelve el problema real sin añadir complejidad innecesaria.

## 4. Experiencia de usuario

### Estado inicial

- La primera nota aparece marcada como punto de inicio.
- El CTA principal reproduce el patrón desde esa nota.
- Un texto breve explica: “Tocá una nota para saltar ahí y continuar desde ese punto”.

### Selección de una nota

Al tocar cualquier nota:

1. se cancela cualquier audio programado o activo;
2. la nota queda marcada como inicio seleccionado;
3. el patrón comienza inmediatamente desde esa posición;
4. la nota que suena se distingue del inicio seleccionado.

### Pausa y reanudación

- Pausar corta el audio activo y conserva el cursor.
- Reanudar continúa desde el siguiente paso pendiente del patrón recortado.

### Detener

- Detener corta audio, timers y nodos activos.
- La nota seleccionada permanece visible.
- Al volver a reproducir, se comienza desde la nota seleccionada.

### Finalización natural

- Al terminar el patrón, el cursor de reproducción se limpia.
- El punto de inicio elegido no cambia.

## 5. Modelo de estado

La interfaz separa dos conceptos que antes estaban implícitamente mezclados:

- `selectedStartIndex`: nota elegida por el usuario para la próxima reproducción;
- `playbackStartIndex`: índice original desde el que se construyó el patrón actualmente cargado;
- `currentNoteIndex`: índice relativo informado por el sintetizador para el patrón cargado;
- `displayCurrentNoteIndex`: índice absoluto mostrado en la interfaz.

Fórmula:

```ts
displayCurrentNoteIndex =
  playbackStartIndex >= 0 && currentNoteIndex >= 0
    ? playbackStartIndex + currentNoteIndex
    : -1;
```

## 6. Diseño técnico

No se modifica el motor de audio en esta iteración. Se construye un `ScalePattern` derivado antes de llamar a `startScale`:

```ts
{
  ...sourcePattern,
  frequencies: sourcePattern.frequencies.slice(startIndex),
  noteNames: sourcePattern.noteNames?.slice(startIndex),
}
```

Esto reutiliza la cancelación, pausa, reanudación, carga de piano y limpieza de nodos ya existentes, reduciendo riesgo de regresión.

Las referencias de una sola nota usadas por el panel de medición se mantienen aisladas del cursor visual del patrón principal mediante `playbackStartIndex = -1`.

## 7. Accesibilidad

- Las notas pasan de contenedores visuales a botones reales.
- Cada botón incluye un nombre accesible con nota y posición.
- La nota activa usa `aria-current`.
- La nota seleccionada usa `aria-pressed`.
- El foco de teclado conserva un indicador visible.
- Los controles de reproducción deshabilitados comunican su estado visualmente.

## 8. Criterios de aceptación

1. El usuario puede tocar cualquiera de las notas visibles.
2. Al tocarla, la reproducción anterior se cancela y el patrón comienza desde esa nota.
3. La nota seleccionada y la nota actualmente activa se distinguen visualmente.
4. Pausar y reanudar conservan la continuidad del patrón recortado.
5. Detener corta el audio y conserva el punto de inicio elegido.
6. El CTA principal comienza desde el punto de inicio elegido después de detener o finalizar.
7. No quedan audios superpuestos al saltar repetidamente entre notas.
8. Los modos de escucha/grabación, la evaluación y la progresión no cambian.
9. La interacción funciona con mouse, tacto y teclado.
10. `npm run check` debe finalizar sin errores.

## 9. Riesgos y mitigaciones

- **Audio superpuesto al saltar rápido:** `startScale` ya invalida la programación anterior mediante token, limpia nodos y resuelve timers.
- **Índice visual incorrecto al usar un patrón recortado:** se mantiene el offset absoluto en `playbackStartIndex`.
- **Confusión entre inicio y nota activa:** se usan estilos y atributos accesibles separados.
- **Regresión en objetivos de medición:** las referencias de objetivo se marcan como reproducción externa al patrón principal.

## 10. Validación manual

1. Abrir un ejercicio de cinco notas ascendente/descendente.
2. Reproducir desde el inicio.
3. Tocar una nota intermedia mientras suena y confirmar que salta sin superposición.
4. Pausar, reanudar y verificar continuidad.
5. Detener, volver a reproducir y confirmar que usa la última nota elegida.
6. Repetir con piano real y guía sostenida.
7. Probar un ejercicio de sirena/slide.
8. Ejecutar una grabación medida y confirmar que la referencia objetivo sigue funcionando.
9. Recorrer todos los botones solo con teclado.
