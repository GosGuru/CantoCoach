# Matriz de pruebas del núcleo

La suite se ejecuta con:

```bash
npm run test
```

Actualmente cubre 17 casos:

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
- rechazo de comparaciones entre notas diferentes.

Estas pruebas validan funciones puras y señales sintéticas. No sustituyen las pruebas manuales del micrófono real, Safari iPhone ni el build completo de la aplicación.
