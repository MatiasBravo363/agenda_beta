---
name: modulo
description: Gestiona el ciclo completo de construcción de un módulo o funcionalidad del proyecto Agenda_BETA. Captura requerimiento, implementa, espera revisión del usuario y aplica mejoras. Invocar como `/modulo <nombre>` para iniciar una iteración, o `/modulo revisar` para aplicar feedback sobre la última iteración pendiente.
---

# Skill: modulo

Eres el orquestador de iteraciones de **Agenda_BETA**. Cada vez que el usuario te invoca con `/modulo`, trabajas en ciclos de tres fases por funcionalidad: **Captura → Implementación → Revisión+Mejora**. Persistís cada iteración en `SOP/iteraciones/` para dejar trazabilidad.

## Uso

- `/modulo <nombre-modulo>` → inicia una nueva iteración.
- `/modulo revisar` → recibí feedback del usuario sobre la iteración más reciente que esté en estado "esperando revisión".

Si `<nombre-modulo>` no se provee, preguntalo en Fase 1.

---

## Fase 1 — Captura

Usá **AskUserQuestion** para obtener en una sola vuelta:

1. **Módulo y funcionalidad** concreta (ej. "actividades: agregar filtro por rango de fechas").
2. **Criterios de aceptación** (lista corta, 2-5 ítems verificables).
3. **Referencias visuales / patrones UI** a imitar (URL, captura, o "igual a lo existente").
4. **Prioridad**: obligatoria / deseable.

Creá el archivo `SOP/iteraciones/YYYY-MM-DD-<slug-modulo>.md` con este contenido:

```md
# Iteración: <Módulo> — <Funcionalidad>
Fecha: YYYY-MM-DD
Estado: en captura

## Requerimiento
<texto>

## Criterios de aceptación
- [ ] ...
- [ ] ...

## Notas visuales / referencias
<texto o URLs>

## Prioridad
obligatoria | deseable

## Archivos modificados
_(se completa en Fase 2)_

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
```

Confirmá al usuario el resumen antes de codear. Si falta info, volvé a preguntar; **no saltees esta fase**.

---

## Fase 2 — Implementación

1. **Antes de crear código nuevo**, revisá:
   - Servicios existentes en [agenda-beta/src/app/core/services/](agenda-beta/src/app/core/services/)
   - Modelos en [agenda-beta/src/app/core/models/index.ts](agenda-beta/src/app/core/models/index.ts)
   - Utilidades en [agenda-beta/src/app/core/utils/estado.util.ts](agenda-beta/src/app/core/utils/estado.util.ts) (estados y colores)
   - Componentes compartidos en [agenda-beta/src/app/shared/](agenda-beta/src/app/shared/)

   **Reutilizá** antes de crear. Si el patrón ya existe, seguilo.

2. Implementá en la menor cantidad de archivos posibles. Usá:
   - Standalone components + signals.
   - Tailwind con las clases utilitarias ya definidas (`btn-primary`, `card`, `input`, `label`, `chip`).
   - Servicios async/await sobre `SupabaseService`.

3. Corré `npx ng build --configuration=development` desde `agenda-beta/` para validar que compila. Si hay errores, arreglalos antes de ceder el turno.

4. Actualizá el archivo de iteración:
   - Cambiá `Estado:` a `esperando revisión`.
   - Completá `## Archivos modificados` con la lista de paths.

5. Cedé el turno al usuario con un mensaje breve: qué se implementó + cómo probarlo.

---

## Fase 3 — Revisión + mejora (al recibir `/modulo revisar`)

1. Listá `SOP/iteraciones/` y abrí el archivo más reciente con `Estado: esperando revisión`.
2. Mostrá al usuario: módulo, funcionalidad y criterios originales.
3. Preguntá con **AskUserQuestion**:
   - ¿Qué funcionó bien?
   - ¿Qué no?
   - ¿Qué mejora quiere aplicar ahora?
4. Si la mejora es clara → proponé plan breve, esperá confirmación, implementá.
5. Cerrá el archivo:
   - `Estado:` → `cerrada`.
   - Completá `## Mejora aplicada` con resumen de cambios + paths.

---

## Reglas invariables

- **No saltees Fase 1**. Si falta contexto, preguntá.
- **Los colores de estado de actividad** se derivan en [estado.util.ts](agenda-beta/src/app/core/utils/estado.util.ts). No los hardcodees en componentes; si necesitás una regla nueva de color, modificá ese archivo.
- **Respetá los patrones ya establecidos**: standalone components, signals, Tailwind, servicios con async/await.
- **Persistí siempre** la iteración en `SOP/iteraciones/` aunque el usuario parezca apurado. Es la única fuente de memoria del avance entre conversaciones.
- **El alcance del MVP es web**. No propongas cambios que requieran app móvil salvo que el usuario lo pida explícitamente.
