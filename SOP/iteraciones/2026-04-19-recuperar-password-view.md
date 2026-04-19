# Iteración: Auth — Vista pública /reset-password
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
El email de reset no llega a ninguna pantalla en la app — no hay forma de setear la nueva contraseña. Crear:
1. Componente público `/reset-password` que detecta la sesión de recuperación (`PASSWORD_RECOVERY`) y presenta un form para nueva contraseña.
2. Pasar `redirectTo` al llamar `resetPasswordForEmail` apuntando a `${origin}/reset-password`.

## Criterios de aceptación
- [ ] Ruta `/reset-password` accesible sin login (sin guards).
- [ ] Al abrir con hash de recovery, el componente escucha `onAuthStateChange` → evento `PASSWORD_RECOVERY` → habilita form.
- [ ] Form: nueva contraseña + confirmación (mínimo 6 chars, deben coincidir).
- [ ] Al enviar, `auth.updateUser({ password })` → mensaje éxito → redirect a `/login` tras 2s.
- [ ] `UsersService.sendPasswordReset` envía `redirectTo` correcto.
- [ ] Link desde login hacia `/reset-password` con texto "¿Olvidaste tu contraseña?" (opcional pero recomendado).

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/src/app/features/auth/reset-password.component.ts` (nuevo)
- `agenda-beta/src/app/app.routes.ts` (ruta pública `/reset-password`)
- `agenda-beta/src/app/features/auth/login.component.ts` (link "¿Olvidaste tu contraseña?")
- `agenda-beta/src/app/core/services/users.service.ts` (redirectTo apuntando a `/reset-password`)
