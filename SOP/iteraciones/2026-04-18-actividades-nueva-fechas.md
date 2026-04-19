# Iteración: Actividades/Nueva — Mejora selector fechas + atajo duración
Fecha: 2026-04-18
Estado: esperando revisión

## Requerimiento
Mejorar el componente de selección de fecha de inicio y fecha de fin en el formulario de actividades. Agregar:
1. Validación: fecha_fin debe ser posterior a fecha_inicio (consecutivas).
2. Mejora visual: layout claro con labels, feedback inline de error.
3. Modo atajo: toggle que reemplaza "fecha fin" por un input "duración (minutos)" con botones rápidos (30, 60, 120, 240). Al guardar, calcula `fecha_fin = fecha_inicio + duración`.

## Criterios de aceptación
- [ ] Si `fecha_fin < fecha_inicio`, mostrar mensaje inline y bloquear guardado.
- [ ] Toggle "Usar duración" cambia el segundo input por un selector de duración.
- [ ] Botones rápidos 30/60/120/240 min ajustan la duración con un click.
- [ ] Al guardar en modo duración, `fecha_fin` se calcula y se envía igual que antes.
- [ ] Si `fecha_inicio` está vacío, el modo duración desactiva el campo duración.

## Notas visuales / referencias
Mantener `input type="datetime-local"` (nativo, sin nueva librería). Botones rápidos como `chip`. Error inline en rojo debajo del input.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/activities/activity-form.component.ts` (bloque "Programación" con toggle duración, botones rápidos, `fechaError` computed, cálculo de `fecha_fin` en `save()`)

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
