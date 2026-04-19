# Iteración: Usuarios — Reset de contraseña desde edición
Fecha: 2026-04-18
Estado: esperando revisión

## Requerimiento
El usuario pidió "visualizar la contraseña" en la edición de un usuario. Técnicamente no es posible (Supabase almacena hash, no plano). Alternativa acordada: **enviar link de reset al email** del usuario desde el modal de edición.

## Criterios de aceptación
- [ ] En el modal de edición de usuario, botón "Enviar link de reset".
- [ ] Al hacer click, llama `supabase.auth.resetPasswordForEmail(email)`.
- [ ] Feedback visible: "Enlace enviado a {email}" o error.
- [ ] No se muestra ni se almacena ninguna contraseña en claro.

## Notas visuales / referencias
Botón `btn-secondary` junto al botón Guardar/Cancelar. Reuso del patrón de feedback (`flash`) ya implementado en la iteración anterior.

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/core/services/users.service.ts` (método `sendPasswordReset`)
- `agenda-beta/src/app/features/users/users.component.ts` (botón + signal `resetting` + método `sendReset`, email disabled en modal)

## Mejora aplicada (tras revisión)
_(se completa en Fase 3)_
