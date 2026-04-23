# Iteración: Visitas — Clonar con fechas
Fecha: 2026-04-23
Estado: esperando revisión

## Requerimiento
Al apretar "Clonar" (desde la tabla de la lista o desde el modal de edición que se abre desde calendario), mostrar un modal que pida `fecha_inicio` y `fecha_fin` del clon. El resto de los datos del clon se copian tal cual del original (técnicos, actividades, estado, ubicación, descripción, cliente). Único campo que cambia: las fechas elegidas.

## Criterios de aceptación
- [ ] Al clickear "Clonar" desde la tabla de la lista, abre un modal con dos inputs `datetime-local` (inicio + fin) y botones Cancelar / Confirmar.
- [ ] Al clickear "Clonar" desde el modal de edición (abierto desde la lista o el calendario), mismo comportamiento.
- [ ] Los inputs vienen pre-cargados: inicio = ahora (redondeado a próximo slot), fin = inicio + duración original (o +60 min si la original no tenía fechas).
- [ ] Valida que fin > inicio; muestra error si no.
- [ ] Al confirmar, se crea una visita nueva con: `parent_visita_id = original.id`, todos los campos del original (técnicos, actividades, estado, cliente, ubicación, descripción) + las fechas elegidas.
- [ ] La lista se recarga al volver.

## Notas visuales / referencias
- Modal con backdrop semi-transparente, estilo igual al modal de drop del calendario (`fixed inset-0 bg-slate-900/50 z-50 ...`).
- Usar clases globales `card`, `input`, `label`, `btn-primary`, `btn-secondary`.

## Prioridad
obligatoria

## Archivos modificados

**Creados:**
- [agenda-beta/src/app/shared/components/visita-clonar-modal.component.ts](../../agenda-beta/src/app/shared/components/visita-clonar-modal.component.ts)

**Editados:**
- [agenda-beta/src/app/core/services/visitas.service.ts](../../agenda-beta/src/app/core/services/visitas.service.ts) — `clone()` ahora requiere `fechaInicio` y `fechaFin`, y conserva técnicos/estado/actividades/ubicación/descripción del original.
- [agenda-beta/src/app/features/visitas/visitas-list.component.ts](../../agenda-beta/src/app/features/visitas/visitas-list.component.ts) — botón "Clonar" abre el modal nuevo.
- [agenda-beta/src/app/features/visitas/visita-form.component.ts](../../agenda-beta/src/app/features/visitas/visita-form.component.ts) — botón "Clonar" abre el modal nuevo (funciona desde el modal de edición que se dispara en lista y calendario).

## Cómo probar

1. `npm start` desde `agenda-beta/` → http://localhost:4200/visitas/lista.
2. En la fila de una visita con datos cargados (técnico, tipos, ubicación, estado), click **"Clonar"**.
3. Debe abrir un modal con inicio = próximo bloque de 30 min y fin = inicio + duración original (o +60 min si no tenía fechas).
4. Confirmar → la lista se recarga y aparece una visita nueva con parent_visita_id = original, y todos los datos copiados salvo las fechas elegidas.
5. Repetir desde el calendario: click en un evento → modal de edición → "Clonar" → mismo comportamiento.
6. Validaciones: dejar fin ≤ inicio → muestra error y bloquea.

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
