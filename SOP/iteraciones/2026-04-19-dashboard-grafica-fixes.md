# Iteración: Dashboard — fixes gráfico y barra
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
1. En la barra de distribución porcentual por tipo, asegurar que todos los tipos presentes (excepto en_cola) se vean — segmentos muy chicos con `min-width` visible.
2. En el gráfico de líneas, **remover la línea de `en_cola`** (4 series, no 5).
3. El eje X del gráfico debe mostrar **todos los días del rango** filtrado, con `0` en días sin registros.

## Criterios de aceptación
- [ ] Barra: segmentos con pct<2 tienen ancho mínimo visible.
- [ ] Gráfico: 4 líneas (sin en_cola).
- [ ] Eje X: días consecutivos desde `fDesde` hasta `fHasta`; días vacíos = 0.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/dashboard/dashboard.component.ts` (chartOptions: excluye `en_cola` de las series; `xDays` se arma con bucle por día del rango si hay `fDesde+fHasta`; barra de tipos con `flex: 0 0 Xmin%` para que segmentos chicos sigan visibles)
