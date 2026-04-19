---
name: git
description: Ejecuta operaciones de git (commit, branch, push, pull, PR) en el repo Agenda_BETA usando siempre las credenciales del usuario para evitar commits con autor incorrecto. Invocá como `/git <acción>` — ejemplos: `/git commit "mensaje"`, `/git nueva-rama <slug>`, `/git push`, `/git pr`, `/git sync`, `/git estado`.
---

# Skill: git

Sos el encargado de las operaciones git en **Agenda_BETA**. Todas las acciones deben ejecutarse con las credenciales del usuario para que el autor de cada commit sea él, no el ambiente por defecto.

## Identidad fija

- `user.name` = `Matias Bravo`
- `user.email` = `matias.bravo.informatica@gmail.com`

**Antes de CUALQUIER commit**, verificá la identidad del repo local con:
```bash
git config user.name; git config user.email
```
Si no coincide exactamente con los valores de arriba, ejecutá:
```bash
git config user.name "Matias Bravo"
git config user.email "matias.bravo.informatica@gmail.com"
```
Nunca toques `--global`; la identidad es por-repo.

## Reglas invariables

- **Nunca hagas `git push --force`** salvo que el usuario lo pida textualmente.
- **Nunca uses `--no-verify`** ni `--no-gpg-sign`.
- Las ramas de iteración usan el formato `iter/YYYY-MM-DD-<slug>`.
- Todo commit incluye el trailer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- **No commites** archivos sensibles: `.env`, credenciales, dumps, etc. Si aparecen en `git status`, detené el flujo y avisá al usuario.
- Si `gh` no está disponible para crear PR, fallbackeá al URL que imprime `git push` (`https://github.com/MatiasBravo363/agenda_beta/pull/new/<rama>`).

## Acciones soportadas

### `/git estado`
Corré `git status --short` + `git branch --show-current` y reportá: rama actual, archivos modificados, untracked.

### `/git nueva-rama <slug>`
1. Verificá identidad.
2. Chequeá que el working tree esté limpio o que los cambios sean parte de la iteración (preguntá si hay dudas).
3. `git checkout -b iter/<YYYY-MM-DD>-<slug>`.

### `/git commit "<mensaje>"`
1. Verificá identidad.
2. Si hay archivos sensibles en `git status`, aborta y pedí confirmación.
3. `git add` de paths relevantes (no uses `-A` a menos que el usuario lo pida — preferí agregar archivos por nombre).
4. Commit con HEREDOC incluyendo el trailer Co-Authored-By.
5. Reportá `git status` post-commit.

### `/git push`
1. Verificá la rama actual.
2. `git push` (o `-u origin <rama>` si es la primera vez).
3. Si la rama no es `main` y no hay PR aún, imprimí la URL `https://github.com/MatiasBravo363/agenda_beta/pull/new/<rama>`.

### `/git pr`
Si `gh` está disponible (`gh --version`), crealo con `gh pr create --title "…" --body "…"`. Si no, imprimí la URL y un bloque sugerido de title/body para que el usuario lo pegue en GitHub.

### `/git sync`
Alias de: `git checkout main && git pull origin main`. Útil después de mergear un PR.

### `/git log`
`git log --oneline -n 20 --decorate` de la rama actual para inspección rápida.

## Flujo típico por iteración

1. `/git nueva-rama <slug>` (del SOP de la iteración).
2. (Se implementa la iteración vía `/modulo`.)
3. `/git estado` para validar que sólo hay cambios esperados.
4. `/git commit "feat(modulo): …"`.
5. `/git push` → link de PR.
6. Usuario mergea en GitHub.
7. `/git sync` para traer main actualizado.

## Señales de alerta

- `git status` muestra `.env` o `*.key` → **detener** y avisar.
- `git push` rechazado por conflictos → NO forzar. Hacer `git pull --rebase origin <rama>`, resolver conflictos, continuar.
- Identidad diferente a la fija → re-setear antes de commitear. Si hay commits previos con autor incorrecto en la rama actual, avisá al usuario (ofrecer `git commit --amend --reset-author` sólo si el commit NO fue empujado todavía).
