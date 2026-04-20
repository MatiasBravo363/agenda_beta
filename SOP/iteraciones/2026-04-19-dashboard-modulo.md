# Iteración: Nuevo módulo Dashboard
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
Nuevo módulo accesible desde la sidebar (`/dashboard`). Contiene:
1. **Card "Global"** con total de actividades en el rango, % diff vs periodo anterior equivalente, y barra horizontal con distribución porcentual por tipo de actividad (excluye `en_cola`).
2. **Gráfico de líneas** (ECharts) con conteo de actividades por `fecha_inicio`, una línea por estado (5 estados = 5 líneas).
3. **Filtros globales**: rango de fechas, técnico, cliente, tipo de actividad.

## Criterios de aceptación
- [ ] Ruta `/dashboard` con `authGuard`.
- [ ] Link "📊 Dashboard" en la sidebar, arriba de Actividades.
- [ ] Card Global: total correcto; % diff vs periodo anterior (N días previos al rango activo); barra con segmentos coloreados por tipo.
- [ ] Gráfico ECharts líneas multi-serie con eje X = día, eje Y = conteo, tooltip unificado, legend interactivo.
- [ ] Filtros (rango, técnico, cliente, tipo) impactan ambas vistas.

## Decisiones
- Periodo de comparación = rango activo (N días previos).
- Librería gráfica = `ngx-echarts` (+ `echarts`).

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/package.json` (deps `echarts`, `ngx-echarts`)
- `agenda-beta/src/app/app.config.ts` (`provideEchartsCore` con LineChart y componentes básicos)
- `agenda-beta/src/app/app.routes.ts` (ruta `/dashboard`)
- `agenda-beta/src/app/shared/layouts/main-layout.component.ts` (link 📊 Dashboard arriba de Actividades)
- `agenda-beta/src/app/features/dashboard/dashboard.component.ts` (nuevo: filtros, Global card con total + diff% + barra distrib. por tipo, gráfico líneas multi-serie ECharts)
