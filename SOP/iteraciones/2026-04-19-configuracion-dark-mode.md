# Iteración: Configuración — módulo + Dark mode
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
Agregar en la sidebar un link "⚙️ Configuración" que lleva a una nueva ruta `/configuracion`. La primera opción es un toggle para activar/desactivar **Dark mode** en toda la aplicación. Default: OFF.

## Criterios de aceptación
- [ ] Link "Configuración" visible en la sidebar (collapsed y expanded).
- [ ] Ruta `/configuracion` con `authGuard`.
- [ ] `ThemeService` con signal `isDark`, persistencia en localStorage, aplica `dark` class en `<html>`.
- [ ] Toggle en la página invierte el tema al instante.
- [ ] Clases `dark:` aplicadas en layout, cards, formularios, tablas y calendario para que el cambio sea visible en todo el sistema.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/tailwind.config.js` (darkMode: 'class')
- `agenda-beta/src/styles.css` (clases utilitarias `card/input/btn-secondary/label` con variantes `dark:`; overrides globales para FullCalendar en dark; `body.dark`)
- `agenda-beta/src/app/core/theme/theme.service.ts` (nuevo — signal isDark + localStorage + toggle class 'dark' en <html>)
- `agenda-beta/src/app/features/configuracion/configuracion.component.ts` (nuevo — toggle switch)
- `agenda-beta/src/app/app.routes.ts` (ruta `/configuracion`)
- `agenda-beta/src/app/shared/layouts/main-layout.component.ts` (link ⚙️ Configuración + clases `dark:` en sidebar y main)
- `agenda-beta/src/app/shared/components/page-header.component.ts` (dark:)
- `agenda-beta/src/app/shared/components/spotlight-card.component.ts` (dark: en borde/fondo + bgStyle usa sólo gradient sin white)
