# Iteración: Actividades — paquete (modal drop con técnico, filtros cliente, geocoding, multiplicador N, KPIs spotlight)
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
1. Modal drop del calendario: técnico obligatorio si estado ∈ {agendado_con_tecnico, visita_fallida, completada}; opcional si coordinado_con_cliente.
2. Filtro dropdown de Cliente en lista.
3. Filtro dropdown de Cliente en calendario.
4. Autocomplete de dirección con Nominatim (OSM, gratis sin key). Guardar `ubicacion` + `ubicacion_lat` + `ubicacion_lng`.
5. Botón X en el expand de la card en_cola → modal pide N → counter visual en memoria.
6. Counter > 1 muestra `×N`. Drag clona mientras counter > 1; cuando counter = 1 hace update del original.
7. Dos tarjetas KPI estilo spotlight arriba de lista y calendario:
   - KPI-A: "Coordinadas sin técnico" (estado=coordinado_con_cliente AND tecnico_id IS NULL).
   - KPI-B: "Sin técnico faltando <24hrs" (tecnico_id IS NULL AND fecha_inicio entre ahora y ahora+24h AND estado NO en completada/visita_fallida).

## Criterios de aceptación
- [ ] Modal drop: bloquea confirmar si estado requiere técnico y no se eligió. Preselecciona el técnico del original si existe.
- [ ] Dropdown Cliente en lista y calendario con opción "Todos" y valores únicos.
- [ ] `direccion-autocomplete` muestra sugerencias al tipear (>=3 chars) con debounce 500ms; al seleccionar dispara evento con `display_name`, `lat`, `lng`.
- [ ] Migración 005 agrega `ubicacion_lat` y `ubicacion_lng`.
- [ ] X en expand abre modal de N; card muestra ×N.
- [ ] Drag: clona si counter>1, update si counter=1, reload de items.
- [ ] Dos cards spotlight arriba (efecto glow al mover mouse) con count correcto.

## Decisiones
- Counter N: solo memoria de sesión (signal con Map).
- Geocoding: texto + lat/lng (migración 005).

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/supabase/migrations/005_actividades_geo.sql` (nuevo — columnas `ubicacion_lat`, `ubicacion_lng`)
- `agenda-beta/src/app/core/models/index.ts` (campos `ubicacion_lat`, `ubicacion_lng` en `Actividad`)
- `agenda-beta/src/app/core/services/activities.service.ts` (UPDATABLE_FIELDS con geo)
- `agenda-beta/src/app/shared/components/direccion-autocomplete.component.ts` (nuevo — Nominatim/OSM)
- `agenda-beta/src/app/shared/components/spotlight-card.component.ts` (nuevo — card con glow radial siguiendo mouse)
- `agenda-beta/src/app/features/activities/activity-form.component.ts` (autocomplete en ubicación)
- `agenda-beta/src/app/features/activities/activities-list.component.ts` (filtro cliente dropdown, búsqueda libre, 2 KPIs spotlight)
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (filtro cliente, 2 KPIs, modal drop con select técnico + regla según estado, autocomplete en form inline, botón × multiplicar + modal N, drag con lógica de counter: clona si >1, update si =1)
