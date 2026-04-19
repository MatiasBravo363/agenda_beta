# Iteración: Usuarios — Panel admin (buscador, sort, alta por invitación, estado, fecha)
Fecha: 2026-04-18
Estado: esperando revisión

## Requerimiento
Elevar el módulo `usuarios` existente a un panel tipo admin. Agregar:
- Alta de usuarios desde el panel (invitación por email / magic link).
- Buscador en la tabla (nombre/apellido/email).
- Ordenamiento por columnas.
- Columnas visibles de estado (activo/inactivo) y fecha de creación.

## Criterios de aceptación
- [ ] Botón "Invitar usuario" abre formulario (email + nombre + apellido) y envía magic link vía `signInWithOtp` con metadata.
- [ ] Buscador filtra en vivo por nombre, apellido o email.
- [ ] Encabezados de tabla (Nombre, Email, Creado) alternan orden asc/desc al clicar.
- [ ] Tabla muestra columnas Estado (chip activo/inactivo clicable) y Creado (fecha formateada).
- [ ] Toggle de estado persiste en DB (columna nueva `usuarios.activo`).

## Notas visuales / referencias
Tabla densa tipo admin. Clases utilitarias existentes (`card`, `input`, `btn-primary`, `btn-secondary`, `chip`). Sin app móvil.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/supabase/migrations/002_usuarios_activo.sql` (nuevo)
- `agenda-beta/src/app/core/models/index.ts` (campo `activo` en `Usuario`)
- `agenda-beta/src/app/core/services/users.service.ts` (métodos `invite`, `setActivo`)
- `agenda-beta/src/app/features/users/users.component.ts` (reescrito: buscador, sort, estado, fecha, alta)

## Build
`npx ng build --configuration=development` → OK (13.9s).

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
