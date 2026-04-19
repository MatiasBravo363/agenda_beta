# Iteración: Actividades — paquete mejoras lista/calendario (v1.0.1)
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
Mejoras transversales sobre actividades (lista y calendario) + fix de bug.

## Criterios de aceptación
- [ ] Spotlight cards (Coordinadas sin técnico / Sin técnico <24hrs) con glow `#5ccb5f`.
- [ ] Columna ID en lista = correlativo numérico de la DB (migración 006 agrega `numero BIGSERIAL UNIQUE`).
- [ ] Botón "Buscar" en lista: los filtros se aplican solo al click; los inputs acumulan valores pendientes.
- [ ] Tabla lista con columnas: ID (numero), Usuario creador, Fecha creación, Estado, Cliente, Tipo actividad, Ubicación, Abrir/Clonar.
- [ ] Autocomplete de dirección guarda solo `calle + número, comuna` (parseado desde `address` de Nominatim). Coordenadas igual se guardan.
- [ ] Bloques del calendario: hora arriba pequeña y abajo Cliente + Técnico (eventContent custom).
- [ ] Bloques en estado `coordinado_con_cliente` tienen pulso heartbeat animado (CSS keyframes).
- [ ] Multiplicador N persistente: migración 006 agrega `cantidad_pendiente INT DEFAULT 1`. Click × hace update DB; drag decrementa en DB.
- [ ] `package.json.version = "1.0.1"`; sidebar muestra `v1.0.1`.

## Decisiones
- ID correlativo: BIGSERIAL UNIQUE en DB (migración 006).
- Persistencia N: columna DB (cross-device).
- Pulso heartbeat: CSS `@keyframes` unificado para puntos 7 y 9.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/package.json` (version 1.0.1)
- `agenda-beta/supabase/migrations/006_actividades_numero_cantidad.sql` (nuevo — BIGSERIAL `numero` + `cantidad_pendiente`)
- `agenda-beta/src/app/core/models/index.ts` (campos `numero`, `cantidad_pendiente`, `creado_por` en `Actividad`)
- `agenda-beta/src/app/core/services/activities.service.ts` (SELECT con `creado_por`, UPDATABLE con `cantidad_pendiente`, método `setCantidadPendiente`)
- `agenda-beta/src/app/shared/components/spotlight-card.component.ts` (tone `green` = `#5ccb5f`)
- `agenda-beta/src/app/shared/components/direccion-autocomplete.component.ts` (parsea `address` a `calle + numero, comuna`; label corto + display_name secundario)
- `agenda-beta/src/app/features/activities/activities-list.component.ts` (reestructura: ID correlativo, usuario creador, fecha creación, estado, cliente, tipo actividad, ubicación; filtros "pendientes" vs "aplicados" con botón Buscar/Limpiar; spotlight `green`)
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` (spotlight `green`; `eventContent` custom con hora arriba/cliente/técnico; `eventClassNames` aplica `pulse-coordinado`; keyframes `heartbeat-pulse` en styles; counter N leído de DB; `openMultiplicar` y drag hacen UPDATE en DB vía `setCantidadPendiente`)
