# Matriz de pruebas del núcleo

La suite se ejecuta con:

```bash
npm run test
```

Actualmente cubre 30 casos:

- conversión frecuencia, MIDI y cents;
- detección YIN de A4 y G3;
- rechazo de silencio y señal débil;
- estados safe, caution y blocked;
- combinación de señales críticas;
- fecha local nocturna de Montevideo;
- entrada desde abajo y tiempo de estabilización;
- rechazo de intentos sin voz suficiente;
- prioridad del feedback de ataque;
- confirmación de un intento estable;
- comparación de reintentos;
- rechazo de comparaciones entre notas diferentes;
- prescripciones por bloque y cálculo de duración;
- posición de serie y repetición;
- creación y finalización de sesiones;
- intentos evaluables versus no evaluables;
- separación entre cierre manual y medido;
- interrupción por molestia;
- gates de progresión por cantidad y calidad;
- retención de nivel cuando el ataque no cumple;
- rechazo de capturas con clipping, baja confianza o poca voz;
- nivel inicial desbloqueado por defecto;
- práctica manual incapaz de desbloquear niveles;
- evidencia medida habilitando el nivel siguiente.

Estas pruebas validan funciones puras y señales sintéticas. No sustituyen las pruebas manuales del micrófono real, Safari iPhone ni el build completo de la aplicación.
