#!/usr/bin/env node
// =============================================================
// Genera src/environments/environment.ts y environment.prod.ts
// a partir de variables de entorno (process.env) o .env local.
//
// Se ejecuta automáticamente en `npm install` (postinstall),
// `npm start` (prestart) y `npm run build` (prebuild).
//
// Vars usadas:
//   - SUPABASE_URL        (requerida)
//   - SUPABASE_ANON_KEY   (requerida)
//   - SENTRY_DSN          (opcional; si vacía, dev/prod sin Sentry)
//
// En local: las lee de agenda-beta/.env (gitignored).
// En CI/Vercel: las lee de process.env (configuradas en Vercel
// Dashboard → Settings → Environment Variables).
// =============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');
const envFile = path.join(projectDir, '.env');
const envDir = path.join(projectDir, 'src', 'environments');

// 1) Cargar .env si existe (sin sobreescribir process.env existente)
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf-8');
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SENTRY_DSN = process.env.SENTRY_DSN || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '\n[generate-env] ERROR: SUPABASE_URL y SUPABASE_ANON_KEY son requeridas.\n' +
    '  - Local: definí en agenda-beta/.env (ver .env.example).\n' +
    '  - Vercel: Settings → Environment Variables.\n'
  );
  process.exit(1);
}

const dev = `// AUTO-GENERADO por scripts/generate-env.mjs — NO EDITAR.
// Valores cargados de .env (local) o process.env (CI/Vercel).
export const environment = {
  production: false,
  supabaseUrl: '${SUPABASE_URL}',
  supabaseAnonKey: '${SUPABASE_ANON_KEY}',
  sentryDsn: '',
};
`;

const prod = `// AUTO-GENERADO por scripts/generate-env.mjs — NO EDITAR.
// Valores cargados de .env (local) o process.env (CI/Vercel).
export const environment = {
  production: true,
  supabaseUrl: '${SUPABASE_URL}',
  supabaseAnonKey: '${SUPABASE_ANON_KEY}',
  sentryDsn: '${SENTRY_DSN}',
};
`;

fs.mkdirSync(envDir, { recursive: true });
fs.writeFileSync(path.join(envDir, 'environment.ts'), dev);
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), prod);

// public/version.json — usado por VersionCheckService (1.0.24+) para detectar
// que un cliente está corriendo código antiguo y forzar reload.
const pkgJson = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
const publicDir = path.join(projectDir, 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(
  path.join(publicDir, 'version.json'),
  JSON.stringify({ version: pkgJson.version }) + '\n',
);

console.log('[generate-env] ✓ environment.ts, environment.prod.ts y public/version.json generados.');
