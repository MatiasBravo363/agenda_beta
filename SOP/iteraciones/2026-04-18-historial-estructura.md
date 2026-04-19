# Iteración: Historial — Nueva estructura, filtros dropdown, sort
Fecha: 2026-04-18
Estado: esperando revisión

## Requerimiento
Reestructurar la tabla de historial. Nueva columna `id` visible, sort por columnas, filtros dropdown por cada entidad. Columnas pedidas:
`id`, `usuario creador`, `cliente`, `actividad`, `técnico`, `tipo actividad`.

## Supuestos (a validar en revisión)
- **cliente** = `actividad.nombre_cliente`.
- **actividad** = referencia corta a la actividad (primeros 8 chars del id + link).
- **técnico** = `actividad.tecnico.nombre + apellidos`.
- **tipo actividad** = `actividad.tipo_actividad.nombre`.
- **usuario creador** = `usuario.nombre + apellido` (el que registró el cambio).
- `id` mostrado = primeros 8 chars del uuid de `actividades_historial`.

## Criterios de aceptación
- [ ] Tabla con columnas: id, usuario, cliente, actividad, técnico, tipo actividad.
- [ ] Sort asc/desc al clicar encabezados.
- [ ] Dropdown filtro por cada una de las 5 entidades (no por id). Valores únicos derivados del dataset.
- [ ] Los filtros son combinables (AND) y resetean con botón "Limpiar".
- [ ] Servicio de historial trae `actividad.tecnico(*)` y `actividad.tipo_actividad(*)` además de lo actual.

## Notas visuales / referencias
Estilo igual al panel de usuarios (encabezados clicables, dropdowns nativos `<select>` con opción "Todos").

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/core/services/history.service.ts` (JOIN extendido a `tecnico` y `tipo_actividad`)
- `agenda-beta/src/app/features/history/history.component.ts` (reescrito: 6 columnas nuevas, sort, 5 filtros dropdown con valores únicos dinámicos)

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
