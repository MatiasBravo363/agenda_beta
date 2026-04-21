# Iteración: Actividades — Borrar desde lista/cola/edición + textarea descripción
Fecha: 2026-04-21
Estado: esperando revisión

## Requerimiento
Permitir eliminar una actividad con un click desde cualquier vista (lista, tarjetas en cola del calendario, modal de edición) y ampliar el textarea de descripción para mejor legibilidad, especialmente dentro del modal.

## Criterios de aceptación
- [x] Botón "Borrar" en la tabla de lista, a la derecha de "Clonar", con confirmación.
- [x] Botón borrar (🗑) en tarjetas "En cola" del calendario, junto al botón × de multiplicar, con stopPropagation para no disparar drag.
- [x] El botón "Eliminar" existente en el form funciona en modal (cierra y refresca) — cubierto por refactor previo.
- [x] Textarea de descripción `min-h-[220px]` y `resize-y` (se puede estirar).

## Notas visuales / referencias
- Rojo coherente con `text-red-600` / `border-red-200`.
- Mismo patrón de `confirm()` nativo que usa `clone()` en la lista.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/activities/activities-list.component.ts` — botón "Borrar" en acciones + método `remove(a)`.
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` — botón 🗑 en tarjeta en-cola + método `removeFromCola(a, ev)` con flash de resultado.
- `agenda-beta/src/app/features/activities/activity-form.component.ts` — textarea descripción `min-h-[220px] resize-y`.

## Trabajo diferido (no se toca en esta iteración)
- Iteración 2: módulo Log (trigger SQL sobre tablas clave).
- Iteración 3: tipos de usuarios + permisos (UI-only, sin RLS).

## Mejora aplicada (tras revisión)
_(pendiente)_
