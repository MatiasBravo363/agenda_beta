# Agenda_BETA

Aplicación web para gestionar **actividades de técnicos en terreno** de Bermann S.A.

- **Frontend:** Angular 21 (standalone, signals) + Tailwind CSS + FullCalendar
- **Backend:** Supabase (Postgres + Auth email/password + RLS)
- **Deploy:** Vercel (SPA)

---

## 1. Setup inicial

```bash
cd agenda-beta
npm install
```

### Configurar Supabase

1. Crea un proyecto en https://supabase.com.
2. En el **SQL Editor** ejecuta el contenido de `supabase/migrations/001_init.sql`.
3. (Opcional) Ejecuta `supabase/seed.sql` para datos de prueba.
4. En **Authentication → Providers** confirma que "Email" está habilitado (por defecto lo está). Para desarrollo puedes desactivar "Confirm email".
5. Copia `Project URL` y `anon public key` desde **Project Settings → API**.
6. Pégalas en `src/environments/environment.ts` y `environment.prod.ts`:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://xxx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...'
};
```

---

## 2. Desarrollo

```bash
npm start          # http://localhost:4200
```

Crea una cuenta en `/register`, inicia sesión y carga datos desde los mantenedores.

---

## 3. Build / Deploy

```bash
npm run build      # genera dist/agenda-beta/browser
```

### Deploy en Vercel

1. Sube el repo a GitHub.
2. En Vercel, "New Project" → importa el repo → **Root directory: `agenda-beta`**.
3. El `vercel.json` ya está configurado (build command, output y rewrites SPA).
4. Agrega las variables de entorno si después integras `process.env` (actualmente se configuran en `environment.prod.ts`).

---

## 4. Estructura

```
src/app/
├── core/                # supabase, auth, models, utils, services
├── shared/              # layouts, componentes reutilizables
└── features/
    ├── auth/            # login, register
    ├── activities/      # lista, calendario, formulario (clonar ticket)
    ├── technicians/
    ├── activity-types/
    ├── users/
    └── history/
```

## 5. Reglas de negocio

### Estados y colores

| Estado | Color |
|---|---|
| En cola | 🔵 Azul |
| Coordinado con cliente | 🔴 Rojo |
| Agendado con técnico (técnico externo/regional fuera Santiago) | 🟠 Naranjo |
| Agendado con técnico (externo en Santiago) | 🟢 Verde |
| Visita fallida | ⚪ Gris |

El color se deriva en el frontend (`core/utils/estado.util.ts`) a partir de `estado` + `tecnico.tecnico_bermann` + `tecnico.region`.

### Clonar ticket

Cuando una actividad cae en "Visita fallida", el botón **Clonar** crea una nueva actividad manteniendo `parent_activity_id` del original y reinicia el estado a "Coordinado con cliente", sin técnico ni fechas.
