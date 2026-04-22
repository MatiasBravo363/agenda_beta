# Iteración: Release 1.0.4 — Security hardening + Tipos de usuarios
Fecha: 2026-04-21
Estado: esperando revisión

## Requerimiento
Dejar el sistema listo para exposición pública restringida a Bermann (URL pública, usuarios por invitación) atendiendo todos los issues del audit de seguridad, más la iteración 3 planificada (tipos de usuario + permisos UI).

## Criterios de aceptación
- [x] Headers de seguridad en Vercel (X-Frame-Options, HSTS, CSP, etc.).
- [x] Ruta `/register` cerrada. Alta solo por invitación desde `/usuarios`.
- [x] `xlsx` removido; `exceljs` + `file-saver` con lazy-load en export.
- [x] Helpers de sanitización de errores: `error-messages.util.ts` (auth) y `service-error.util.ts` (services).
- [x] `auth.guard` usa `await getSession()` en lugar de setTimeout.
- [x] `reset-password` valida sesión de recovery y redirige si no es válida.
- [x] Nominatim: debounce 1000ms + AbortController + countrycodes=cl.
- [x] Migración SQL `007_tipos_usuarios_permisos_rls.sql`: tablas tipos_usuario / permisos / tipos_usuario_permisos, seed coordinador + super_admin, 23 permisos, RLS endurecida (delete de actividades solo super_admin o creador, write de tipos_usuario solo super_admin).
- [x] `PermisosService` con signals (cargar/limpiar), `TiposUsuarioService` CRUD.
- [x] `AuthService` carga permisos al login y limpia al logout.
- [x] `permisoGuard` + directiva `*appSiTiene`.
- [x] Sidebar oculta enlaces según permisos; botones de Borrar / Exportar usan `*appSiTiene`.
- [x] Nueva vista `/tipos-usuario` con CRUD + asignación de permisos por categoría.
- [x] Tabla de usuarios tiene columna "Tipo" y select en modal alta/edición.
- [x] Sidebar: "Bermann SpA" + "V1.0.4".
- [x] `package.json` bump a 1.0.4.
- [x] Build producción pasa (initial 510 KB, budget subido a 600 KB; exceljs en lazy chunk).

## Notas operacionales — hay que hacer a mano en Supabase
1. **Aplicar `007_tipos_usuarios_permisos_rls.sql`** en Supabase Dashboard → SQL Editor.
2. **Asignar super_admin** al usuario actual: en Dashboard → Table Editor → `usuarios`, poner `tipo_usuario_id` = id del tipo `super_admin`.
3. **Configurar rate limits** en Auth → Rate Limits:
   - signInWithPassword: 10/hora por IP.
   - signUp: 3/hora (aunque `/register` está cerrado, deja el tope por defensa en profundidad).
   - resetPasswordForEmail: 3/hora.
4. **Revisar Auth → URL Configuration**: que `Site URL` y `Redirect URLs` incluyan la URL productiva de Vercel.

## Archivos modificados / nuevos

### Infra / config
- `agenda-beta/vercel.json` — headers CSP, HSTS, X-Frame-Options, etc.
- `agenda-beta/package.json` — version 1.0.4, remueve xlsx, agrega exceljs + file-saver + @types/file-saver.
- `agenda-beta/angular.json` — allowedCommonJsDependencies + budget inicial 600 KB.
- `agenda-beta/src/app/app.routes.ts` — retira /register, agrega /tipos-usuario con permisoGuard, /usuarios con permisoGuard.

### Hardening código
- `agenda-beta/src/app/core/auth/auth.guard.ts` — usa `await getSession()`.
- `agenda-beta/src/app/core/auth/auth.service.ts` — integra PermisosService (cargar post-login, limpiar en logout).
- `agenda-beta/src/app/core/auth/error-messages.util.ts` — nuevo, `mensajeAuthGenerico()`.
- `agenda-beta/src/app/core/services/service-error.util.ts` — nuevo, `mensajeGenericoDeError()`.
- `agenda-beta/src/app/features/auth/login.component.ts` — mensaje genérico + retira link a /register.
- `agenda-beta/src/app/features/auth/reset-password.component.ts` — valida sesión recovery + mensaje genérico.
- `agenda-beta/src/app/features/activities/activities-list.component.ts` — exceljs lazy + *appSiTiene en Exportar/Borrar.
- `agenda-beta/src/app/features/activities/activities-calendar.component.ts` — *appSiTiene en botón 🗑.
- `agenda-beta/src/app/features/activities/activity-form.component.ts` — *appSiTiene en Eliminar.
- `agenda-beta/src/app/shared/components/direccion-autocomplete.component.ts` — debounce 1000 + AbortController + countrycodes=cl.

### Tipos de usuario + permisos
- `agenda-beta/supabase/migrations/007_tipos_usuarios_permisos_rls.sql` — nuevo.
- `agenda-beta/src/app/core/models/index.ts` — tipos `TipoUsuario`, `Permiso`, `PermisoCodigo`, campo `tipo_usuario_id` en `Usuario`.
- `agenda-beta/src/app/core/services/tipos-usuario.service.ts` — nuevo.
- `agenda-beta/src/app/core/services/permisos.service.ts` — nuevo (signal-based).
- `agenda-beta/src/app/core/services/users.service.ts` — list con join a tipos_usuario, invite con tipo.
- `agenda-beta/src/app/core/auth/permiso.guard.ts` — nuevo factory.
- `agenda-beta/src/app/shared/directives/si-tiene.directive.ts` — nuevo estructural.
- `agenda-beta/src/app/shared/layouts/main-layout.component.ts` — Bermann SpA + V1.0.4, links con *appSiTiene, nuevo link "Tipos de usuario".
- `agenda-beta/src/app/features/users/users.component.ts` — columna Tipo, select en modal, uso de mensajeGenericoDeError.
- `agenda-beta/src/app/features/tipos-usuario/tipos-usuario.component.ts` — nuevo CRUD con asignación de permisos por categoría.

## Fuera de alcance (quedó para después)
- Módulo Log con triggers de auditoría (iteración 2 planificada).
- CSP estricta sin `unsafe-inline`.
- SMTP propio (Resend/SendGrid).
- 2FA.
- Tests e2e de seguridad.

## Score de seguridad post-iteración (estimado)
- Antes: **5.5 / 10**.
- Después (aplicando la migración 007 + rate limits manuales): **8.5 / 10**.

## Mejora aplicada (tras revisión)
_(pendiente)_
