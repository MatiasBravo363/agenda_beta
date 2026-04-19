# Iteración: Layout — Fix botón sidebar + versión del sistema
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
1. El botón toggle de la sidebar se ve cortado; arreglarlo.
2. Mostrar la versión del sistema en el header del sidebar. Declarar `1.0.0` en `package.json` y leerla desde ahí.

## Criterios de aceptación
- [ ] Botón toggle visible completo (círculo con chevron) al colapsar/expandir.
- [ ] `package.json.version = "1.0.0"`.
- [ ] Sidebar expandida muestra `v1.0.0` bajo "Bermann S.A.". Colapsada lo oculta.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/package.json` (version = 1.0.0)
- `agenda-beta/src/app/shared/layouts/main-layout.component.ts` (quitado overflow-hidden del aside, botón toggle más grande z-20, versión importada de package.json)
