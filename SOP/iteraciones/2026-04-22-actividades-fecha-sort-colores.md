# Iteración: Actividades — fecha fin obligatoria + sort por horario + reorden columnas + paleta pastel
Fecha: 2026-04-22
Estado: esperando revisión

## Requerimiento
Cuatro mejoras sobre el módulo actividades:

1. **Fecha fin obligatoria para bloques agendados**: todo bloque con estado distinto a `en_cola` debe tener `fecha_inicio` **y** `fecha_fin`. Al editar (desde lista o calendario) ambos campos deben cargarse bien. Hoy se reportó que al editar una tarea no se tomaba la fecha y hora de término.
2. **Sort default**: en la lista, los registros de cada día deben ordenarse por horario de menor a mayor (respetando el orden cronológico de los días ya existente).
3. **Reorden columnas**: mover "Fecha creación" al final de la tabla. Agregar columna "Técnicos" a la derecha de "Cliente".
4. **Colores de estado más pastel**: tonalidad más rica visualmente, respetando el hue de cada color actual (rojo, azul, marrón, verde, gris).

## Criterios de aceptación
- [ ] Al guardar una actividad con estado ≠ `en_cola` sin `fecha_fin`, el form muestra error y bloquea el guardado.
- [ ] Al editar una actividad agendada (por lista o calendario), `fecha_inicio` y `fecha_fin` aparecen cargadas en los inputs.
- [ ] La lista, por defecto, muestra los registros ordenados por horario ascendente dentro de cada día.
- [ ] La tabla tiene columnas en este orden: ID · Usuario creador · Horario · Estado · Cliente · **Técnicos** · Tipo actividad · Ubicación · **Fecha creación** · (acciones).
- [ ] Los chips de estado muestran colores más suaves / pastel pero mantienen el hue actual (gris, rojo, azul, marrón, verde) y texto blanco legible.
- [ ] Compila limpio (`npx ng build --configuration=development`).

## Notas visuales / referencias
- Estilo chips: mid-tone + texto blanco (no badge con texto oscuro).
- Paleta pastel propuesta (todos con texto blanco):
  - `en_cola`: `#94a3b8` (slate-400)
  - `coordinado_con_cliente`: `#ef4444` (red-500) — menos intenso que red-600 actual
  - `agendado_con_tecnico`: `#38bdf8` (sky-400) — más suave que sky-500 actual
  - `visita_fallida`: `#a16207` (amber-700) — marrón más cálido que saddle-brown
  - `completada`: `#22c55e` (green-500) — verde estándar, un toque más saturado que el actual

## Prioridad
obligatoria

## Archivos modificados

**Editados:**
- [agenda-beta/src/app/core/utils/estado.util.ts](../../agenda-beta/src/app/core/utils/estado.util.ts) — nueva paleta pastel mid-tone (slate-400, red-500, sky-400, amber-700, green-500).
- [agenda-beta/src/app/features/activities/activity-form.component.ts](../../agenda-beta/src/app/features/activities/activity-form.component.ts) — validación `fecha_fin` obligatoria cuando `estado ≠ en_cola`; auto-default `fecha_fin = fecha_inicio + 60min` al cargar una actividad agendada legacy sin fecha fin.
- [agenda-beta/src/app/features/activities/activities-list.component.ts](../../agenda-beta/src/app/features/activities/activities-list.component.ts) — sort default `horario asc`; nuevo orden de columnas (ID · Creador · Horario · Estado · Cliente · Técnicos · Tipo · Ubicación · Fecha creación · acciones); colspan 9 → 10; columna Técnicos nueva con chips.

## Cómo probar

1. Dev server (`npm start` desde `agenda-beta/`). Recargar http://localhost:4200/actividades/lista.
2. **Colores**: los chips de estado deben verse en los nuevos tonos pastel pero con texto blanco legible. Los spotlight cards de KPIs también los toman.
3. **Sort**: por defecto, las actividades dentro de cada día aparecen ordenadas por horario de menor a mayor.
4. **Columnas**: verificar orden: ID, Usuario creador, Horario, Estado, Cliente, **Técnicos**, Tipo actividad, Ubicación, **Fecha creación**, acciones.
5. **Fecha fin obligatoria**:
   - Editar una actividad agendada sin fecha_fin → al abrir el form debe autocompletarse con `fecha_inicio + 60min`.
   - Cambiar el estado a `Agendado con técnico` y borrar `fecha_fin` → al guardar debe mostrar error y bloquear.
   - Estado `En cola` sin fechas → permite guardar.

## Scope no incluido
- No se agregó validación a nivel DB (check constraint). La regla sigue siendo del front.
- No se tocó el calendario (`activities-calendar.component.ts`) — ya pasaba `start` y `end` correctamente en todas las acciones de creación/movimiento.

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
