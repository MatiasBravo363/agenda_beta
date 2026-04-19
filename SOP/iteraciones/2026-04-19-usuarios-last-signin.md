# Iteración: Usuarios — Columna "Última sesión"
Fecha: 2026-04-19
Estado: esperando revisión

## Requerimiento
Agregar columna "Última sesión" (fecha y hora) en la tabla de usuarios. El dato vive en `auth.users.last_sign_in_at`; se espeja a `public.usuarios` vía trigger.

## Criterios de aceptación
- [ ] Migración `004_usuarios_last_sign_in.sql` agrega columna y crea trigger.
- [ ] Modelo `Usuario` incluye `last_sign_in_at?: string`.
- [ ] Tabla muestra columna "Última sesión" formateada `dd-MM-yyyy HH:mm` (o `—` si null), sortable.

## Backfill (manual tras migración)
```sql
update public.usuarios u
  set last_sign_in_at = (select last_sign_in_at from auth.users where id = u.id);
```

## Prioridad
obligatoria

## Archivos modificados
- `agenda-beta/supabase/migrations/004_usuarios_last_sign_in.sql` (nuevo)
- `agenda-beta/src/app/core/models/index.ts` (campo `last_sign_in_at`)
- `agenda-beta/src/app/features/users/users.component.ts` (columna "Última sesión" sortable + `formatDateTime`)
