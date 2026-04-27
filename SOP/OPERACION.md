# SOP/OPERACION.md — Runbook operativo Agenda_BETA

Procedimientos para mantener Agenda_BETA en producción. Complementa [SOP/CLAUDE.md](CLAUDE.md) (rol senior dev) y [SOP/iteraciones/](iteraciones/) (historial de cambios funcionales).

**Audiencia:** persona de guardia / responsable técnico (hoy: Matías Bravo).
**Stack en prod:** Vercel (frontend Angular SPA) + Supabase (Postgres + Auth + Storage) + Sentry (errores).

---

## 1. Contactos y accesos

| Rol | Persona | Cómo contactar |
|---|---|---|
| Owner técnico | Matías Bravo | matias.bravo.informatica@gmail.com |
| Hosting | Vercel — proyecto `agenda-beta` | https://vercel.com/dashboard |
| BD | Supabase — proyecto `kqroycdiumrowrbbqdmu` | https://supabase.com/dashboard |
| Errores | Sentry — `bermann/agenda-beta` | https://bermann.sentry.io |

---

## 2. Diagnóstico inicial: "la app no funciona"

Ejecutar en este orden y parar al primer hallazgo:

1. **¿Vercel está caído?** → https://www.vercel-status.com
2. **¿Supabase está caído?** → https://status.supabase.com — si `kqroycdiumrowrbbqdmu` aparece degradado, esperar y comunicar al usuario.
3. **¿Errores recientes en Sentry?** → https://bermann.sentry.io/issues/?project=4511283740672000 — filtrar últimas 24h, ordenar por "events". Si hay un spike, ir al issue → ver stack trace + breadcrumbs + user.
4. **¿El último deploy rompió algo?** → Vercel → Deployments → revisar el último `Production`. Si fue ahora y los errores empezaron después → §4 Rollback.
5. **¿RLS rompió algún flujo?** → Supabase Dashboard → Logs → Postgres logs, filtrar por `permission denied` o `42501`. Si aparecen muchos rechazos, alguna policy está mal.

---

## 3. Incidentes comunes

### 3.1 "Failed to fetch dynamically imported module" (chunk error)

**Causa:** deploy nuevo invalidó hashes de chunks del deploy anterior; usuarios con la SPA abierta no encuentran el chunk.

**Diagnóstico:** error masivo en Sentry tras un deploy. El `ChunkReloadErrorHandler` ya lo maneja: detecta el patrón y recarga la página. Si el error sigue después del reload, está roto el deploy.

**Acción:**
- Si el reload no soluciona → §4 Rollback al deploy previo.
- Si los usuarios reportan ver pantalla en blanco → forzar `Ctrl+Shift+R` (hard reload) o purgar cache de Vercel desde el dashboard.

### 3.2 "permission denied for table X" / código 42501

**Causa:** alguna RLS policy está rechazando una operación que el front intenta hacer.

**Diagnóstico:** Sentry → buscar issue con mensaje similar; los breadcrumbs muestran qué endpoint disparó. Cruzar con la migración relevante (`007_*` o `012_*` para pivotes).

**Acción:**
- Si la operación es legítima y la policy es muy restrictiva → crear migración correctiva.
- Si la operación es ilegítima → cerrar el issue y monitorear (ataque o usuario probando).

### 3.3 Usuario invitado no puede entrar / no ve nada

**Causa probable:** falta `tipo_usuario_id` (resuelto en migración `011`, pero usuarios creados antes pueden estar sin tipo).

**Acción:**
1. En Supabase Dashboard → SQL editor:
   ```sql
   select id, email, tipo_usuario_id from public.usuarios where email = 'X';
   ```
2. Si `tipo_usuario_id is null`:
   ```sql
   update public.usuarios
   set tipo_usuario_id = (select id from public.tipos_usuario where nombre = 'coordinador')
   where email = 'X';
   ```
3. Pedirle que cierre sesión y vuelva a entrar (refresca permisos).

### 3.4 Visitas no se guardan / cambio de estado rechazado

**Causa probable:** trigger `validar_transicion_visita` (migración `013`) bloqueó una transición no permitida (`en_cola → completada` o salida de `completada`).

**Diagnóstico:** Sentry → mensaje "Transición no permitida" + código `22023`.

**Acción:** validar con el usuario qué intentó hacer. Si la transición debería ser legítima, ajustar el trigger en una nueva migración. Si fue error humano, explicar el flujo correcto.

### 3.5 Sentry no recibe errores

**Diagnóstico:**
1. Abrir devtools en producción → Console: ¿hay errores `Refused to connect to https://*.ingest.us.sentry.io`? → revisar CSP en [vercel.json](../agenda-beta/vercel.json).
2. Network tab: filtrar por `sentry`. ¿Hay POST a `*.ingest.us.sentry.io` con status 2xx? Si no, problema de DSN o de CORS.
3. ¿La env var `sentryDsn` en `environment.prod.ts` está correcta? Vercel debe haber rebuildeado con el valor.

---

## 4. Rollback

### 4.1 Rollback de frontend (Vercel)

1. Vercel Dashboard → Deployments → buscar el último deploy estable (status `Ready`, antes del bug).
2. Click `...` → `Promote to Production`. Toma ~30s.
3. Comunicar al usuario "se revirtió a la versión anterior" + crear issue para investigar.

### 4.2 Rollback de migración SQL

**Crítico:** las migraciones se aplican manualmente en el dashboard de Supabase y **no tienen `down`** explícito por defecto.

Pasos:
1. Identificar la migración que rompió algo. Cruzar con `select * from public.schema_version order by applied_at desc limit 5;` (a partir de `014`).
2. Escribir el SQL inverso a mano. Para drop de policies/triggers/funciones es directo. Para `alter table` que cambió tipos o renombró columnas, requiere reverso simétrico.
3. Aplicar en SQL editor de Supabase.
4. Borrar la fila correspondiente: `delete from public.schema_version where version = NNN;`.
5. Si el rollback falla o corrompe datos → restaurar backup automático de Supabase (Settings → Database → Backups; retención de 7 días en plan free).

**Prevención:** desde la migración `015` en adelante, incluir comentario `-- Down: <SQL inverso>` al pie del archivo.

---

## 5. Aplicación de migraciones nuevas

1. Pull de `main`, leer migraciones nuevas en [agenda-beta/supabase/migrations/](../agenda-beta/supabase/migrations/) ordenadas por número.
2. **Antes de aplicar:**
   - Leer el comentario de cabecera (alcance + idempotencia).
   - Si tiene backfill destructivo → verificar backups recientes.
3. Supabase Dashboard → SQL editor → pegar el archivo completo → Run.
4. Verificar `select * from public.schema_version order by version desc limit 3;` — la migración debe figurar.
5. Smoke test del flujo afectado en producción inmediatamente.

---

## 6. Pre-deploy checklist (cada release)

Antes de mergear a `main` (que dispara deploy a producción):

- [ ] `npm run build` local pasa sin warnings de budget.
- [ ] Si hay migraciones SQL nuevas → ya aplicadas en prod **antes** del deploy del frontend (así evitamos que el código nuevo apunte a esquema viejo).
- [ ] CHANGELOG / release notes en commit message.
- [ ] Bump de `package.json` version + tag git.
- [ ] Source maps subidos a Sentry (ver §7).

---

## 7. Sentry — gestión

### Source maps automáticos (desde 1.0.13)

El upload se ejecuta automáticamente como `postbuild` cuando `SENTRY_AUTH_TOKEN` está seteado en el entorno (Vercel productivo, CI). Si la var no está, el script termina con exit 0 sin romper.

**Setup inicial (una sola vez):**

1. **Generar `SENTRY_AUTH_TOKEN`**: Sentry → Settings → Account → Auth Tokens → Create New Token con scope `project:releases` (recomendado también `project:read` y `org:read`). Copiar el token (solo se muestra una vez).
2. **Configurar en Vercel**: Vercel Dashboard → proyecto agenda-beta → Settings → Environment Variables → agregar (scope Production):
   - `SENTRY_AUTH_TOKEN` = el token generado
   - `SENTRY_ORG` = `bermann`
   - `SENTRY_PROJECT` = `agenda-beta`
3. Próximo deploy productivo → el postbuild sube automáticamente los source maps a Sentry para `agenda-beta@<package.json.version>`.

**Verificación:** después de un deploy productivo, ir a un issue en Sentry → el stack trace debe mostrar nombres legibles de archivos TS y líneas originales (no `t.bind` minificado).

### Upload manual (si auto-upload falla o queremos hacerlo desde local)

```bash
cd agenda-beta
export SENTRY_AUTH_TOKEN=<token>
export SENTRY_ORG=bermann
export SENTRY_PROJECT=agenda-beta
npm run build  # postbuild dispara el upload
```

### Configurar alertas

Sentry → Alerts → Create Alert → "Issue Alert":
- Trigger: "A new issue is created" OR "an issue affects more than 10 users in 1 hour".
- Action: email a `matias.bravo.informatica@gmail.com`.

---

## 8. Backups y restore

- **Supabase backups:** automáticos diarios, retención 7 días en plan free. Restore manual desde Dashboard → Database → Backups.
- **Frontend:** Git es el backup. Cada commit en `main` es un release reproducible vía Vercel.
- **No hay backup separado de auth.users** — viven en Supabase; si se pierde el proyecto Supabase entero, los usuarios deben reinvitarse.

---

## 9. TODO operativo (próximas iteraciones)

- Configurar webhook Vercel → Slack/email para deploy failures.
- Automatizar upload de source maps a Sentry desde GitHub Action.
- Página `/status` con heartbeat a Supabase (P1).
- Tabla `feature_flags` para toggles sin redeploy (P2).
