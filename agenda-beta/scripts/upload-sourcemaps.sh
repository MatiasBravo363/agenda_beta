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
# Lee la versión desde package.json (no requiere bash builtin).

set -e

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "[upload-sourcemaps] SENTRY_AUTH_TOKEN no configurado, skip."
  exit 0
fi

VERSION=$(node -p "require('./package.json').version")
RELEASE="agenda-beta@${VERSION}"

echo "[upload-sourcemaps] Subiendo source maps para ${RELEASE}…"

npx @sentry/cli releases new "$RELEASE"
npx @sentry/cli releases files "$RELEASE" upload-sourcemaps dist/agenda-beta/browser \
  --url-prefix '~/' \
  --validate
npx @sentry/cli releases finalize "$RELEASE"

# Asociar el commit al release (si está disponible en CI)
if [ -n "$VERCEL_GIT_COMMIT_SHA" ]; then
  npx @sentry/cli releases set-commits "$RELEASE" --commit "MatiasBravo363/agenda_beta@${VERCEL_GIT_COMMIT_SHA}" || true
fi

echo "[upload-sourcemaps] Done."
