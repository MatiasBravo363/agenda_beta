#!/usr/bin/env sh
# Sube source maps a Sentry para el release actual.
#
# Vars necesarias (en CI/Vercel):
#   SENTRY_AUTH_TOKEN  (secret) — Settings → Account → Auth Tokens, scope project:releases
#   SENTRY_ORG=bermann
#   SENTRY_PROJECT=agenda-beta
#
# Si SENTRY_AUTH_TOKEN no está, el script termina silenciosamente para no
# romper builds locales o de devs que no tengan acceso a Sentry.
#
# IMPORTANTE: NO usa `set -e`. Si la API de Sentry rechaza (token expirado,
# rate limit, red caída, etc.), logueamos el error pero **no bloqueamos el
# deploy**. Los source maps son nice-to-have; un deploy de producción no
# debería caer porque Sentry tenga problemas.
#
# Lee la versión desde package.json (no requiere bash builtin).

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "[upload-sourcemaps] SENTRY_AUTH_TOKEN no configurado, skip."
  exit 0
fi

VERSION=$(node -p "require('./package.json').version")
RELEASE="agenda-beta@${VERSION}"

echo "[upload-sourcemaps] Subiendo source maps para ${RELEASE}…"

# Bloque tolerante a errores: si cualquier paso falla, logueamos warning
# y salimos 0 para no bloquear el build de producción.
{
  npx @sentry/cli releases new "$RELEASE" && \
  npx @sentry/cli releases files "$RELEASE" upload-sourcemaps dist/agenda-beta/browser \
    --url-prefix '~/' \
    --validate && \
  npx @sentry/cli releases finalize "$RELEASE"
  RESULT=$?
} || RESULT=$?

if [ "$RESULT" != "0" ]; then
  echo "[upload-sourcemaps] WARNING: subida a Sentry falló (exit $RESULT). El build sigue. Revisar SENTRY_AUTH_TOKEN."
  exit 0
fi

# Asociar el commit al release (si está disponible en CI). Tolerante a fallas.
if [ -n "$VERCEL_GIT_COMMIT_SHA" ]; then
  npx @sentry/cli releases set-commits "$RELEASE" --commit "MatiasBravo363/agenda_beta@${VERCEL_GIT_COMMIT_SHA}" || \
    echo "[upload-sourcemaps] WARNING: no se pudo asociar commit al release."
fi

echo "[upload-sourcemaps] Done."
