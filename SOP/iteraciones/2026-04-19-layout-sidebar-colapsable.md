# Iteración: Layout — Sidebar colapsable con animación
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
La barra lateral izquierda debe poder ocultarse/colapsarse con una animación suave (estilo 21st.dev modern-side-bar). Colapsada muestra solo íconos.

## Criterios de aceptación
- [ ] Botón toggle (chevron) visible en la intersección sidebar/main.
- [ ] Colapsada: `w-16`, solo íconos centrados, labels ocultos.
- [ ] Expandida: `w-64`, íconos + labels.
- [ ] Transición de 300ms ease-in-out en `width`.
- [ ] Estado persiste durante la sesión (signal local; opcional: localStorage).

## Prioridad
deseable

## Archivos modificados
- `agenda-beta/src/app/shared/layouts/main-layout.component.ts` (signal `collapsed`, botón toggle chevron, transición `width` 300ms, labels ocultos en modo colapsado, persistencia en localStorage)
