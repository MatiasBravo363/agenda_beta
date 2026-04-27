# Iteración: Visitas/Calendario responsive + Dashboard rework gráficos
Fecha: 2026-04-27
Estado: esperando revisión

## Requerimiento

Dos sub-módulos en una sola iteración (release 1.0.14):

**Visitas/Calendario** — el calendario hoy no aprovecha bien el espacio en distintos viewports. Hay altura fija (520 mobile / 680 desktop) y no escucha resize en vivo. En monitores grandes desperdicia ~30-40% del alto. Sumar además sidebar "En cola" plegable con animación que resalte cuando está plegado.

**Dashboard** — reemplazar el line chart actual (visitas por día por estado) por uno de tipos de actividad agendados por día. Sumar donut de estados, barras horizontales de % por técnico, y 3 visualizaciones extras: heatmap día×hora, tasa de fallo por actividad, funnel de estados.

## Criterios de aceptación

### Calendario
- [ ] Al redimensionar la ventana entre 320/768/1280/1920 px, el calendario ajusta altura y vista en vivo (debounce 100 ms).
- [ ] En desktop (≥1024 px) el calendario llena el viewport sin doble scroll y sin huecos vacíos abajo.
- [ ] Tablet (640-1023 px) tiene su propia vista intermedia (`timeGridWeek` por defecto).
- [ ] Sidebar "En cola" colapsa con animación de 250 ms al hacer click en el toggle.
- [ ] El estado plegado/expandido del sidebar se persiste en `localStorage`.
- [ ] Cuando el sidebar está plegado y hay visitas en cola, pulsa suavemente cada ~4s.
- [ ] Al expandir/plegar, FullCalendar invoca `updateSize()` y aprovecha el ancho ganado.

### Dashboard
- [ ] Line chart muestra series por **actividad** (multi-asignación vía `actividades[]`), una serie por actividad.
- [ ] Donut central muestra distribución por estado con `colorDeEstado` y total en el centro.
- [ ] Barras horizontales muestran % de visitas por técnico, con técnicos Bermann destacados con color secundario.
- [ ] Funnel muestra `en_cola → coordinado → agendado → completada` (cumulativo si hay historial; snapshot como fallback documentado).
- [ ] Tasa de fallo por actividad: barras horizontales con gradiente verde→rojo, filtrando actividades con <3 visitas.
- [ ] Heatmap día×hora con cantidad de visitas por slot.
- [ ] KPIs adicionales: tasa de cumplimiento, visitas en cola, reagendadas.
- [ ] Todos los charts reaccionan a cambios de filtros sin re-fetch.
- [ ] Bundle inicial sigue bajo 700 kB.

## Notas visuales / referencias

- Calendario: imitar comportamiento de Google Calendar (llena viewport, sidebar colapsable).
- Dashboard: layout grid 3 cols en lg+, todos los charts dentro de cards `card p-4` ya definidas en `styles.css`.
- Animación pulse del sidebar plegado: ring sutil tipo notificación, no invasivo (cada 4s).
- Reusar `colorDeEstado()` y `TIPO_PALETTE` de [estado.util.ts](../../agenda-beta/src/app/core/utils/estado.util.ts).

## Prioridad

obligatoria

## Archivos modificados

### Calendario
- [agenda-beta/src/app/features/visitas/visitas-calendar.component.ts](../../agenda-beta/src/app/features/visitas/visitas-calendar.component.ts) — `viewportSize` signal con `@HostListener('window:resize')` debounceado a 100 ms; `viewMode` computed (`mobile|tablet|desktop`); `colaPlegada` signal persistido en `localStorage`; toggle button + animación pulse en sidebar plegado; `effect` que llama `calendarApi.updateSize()` 270 ms post-toggle; `options()` reescrito con height dinámico + `expandRows: true` y nuevo modo tablet con `timeGridWeek` por defecto.
- [agenda-beta/src/styles.css](../../agenda-beta/src/styles.css) — clamp del `.fc-toolbar-title`, `.fc-button` con padding/font ajustados, mobile media query con `flex-wrap` para que la toolbar no rompa en breakpoints intermedios.

### Dashboard
- [agenda-beta/src/app/features/dashboard/dashboard.component.ts](../../agenda-beta/src/app/features/dashboard/dashboard.component.ts) — reescrito con 6 charts:
  - `chartActividadesPorDia` (line, B.1) — agrupa por día y por actividad usando el array `actividades[]` para reflejar multi-asignación; top 7 + "Otras".
  - `chartDonutEstados` (B.2) — donut con `colorDeEstado`, total al centro vía `graphic`.
  - `chartBarrasTecnicos` (B.3) — barras horizontales con técnicos Bermann en azul (`#3b5bdb`), externos en gris.
  - `chartFunnel` (B.4) — funnel snapshot (sin historial; documentado como tal en subtítulo).
  - `chartFallosPorActividad` (B.5) — barras con gradiente verde→rojo, filtra actividades con <3 visitas.
  - `chartHeatmap` (B.6) — heatmap día×hora con `visualMap` continuo.
  - KPIs nuevos: `tasaCumplimiento`, `enColaCount`, `reagendadasCount`.
  - Layout reorganizado a `grid lg:grid-cols-3` (line+donut) y `grid lg:grid-cols-2` (técnicos+funnel) + heatmap y fallos full width.
- [agenda-beta/src/app/features/dashboard/charts.util.ts](../../agenda-beta/src/app/features/dashboard/charts.util.ts) (nuevo) — helper compartido con `baseOptions(themeDark)`, `paletteColor(i)`, `gradientColorByRate(rate)` y export de `TIPO_PALETTE`.
- [agenda-beta/src/app/features/dashboard/charts.util.spec.ts](../../agenda-beta/src/app/features/dashboard/charts.util.spec.ts) (nuevo) — 6 tests del helper.

### Versionado
- [agenda-beta/package.json](../../agenda-beta/package.json) — bump 1.0.13 → 1.0.14.
- [agenda-beta/src/app/core/error/sentry.init.ts](../../agenda-beta/src/app/core/error/sentry.init.ts) — `APP_VERSION` 1.0.13 → 1.0.14.

### Validación
- `npm test`: 37/37 pasan (31 previos + 6 nuevos de `charts.util.spec`).
- `npm run lint`: 0 errors, 103 warnings (sin regresiones vs main).
- `npm run build` (prod): bundle inicial 615.33 kB (límite 650 kB).

## Mejora aplicada (tras revisión)

_(se completa en Fase 3)_
