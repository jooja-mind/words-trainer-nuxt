# AGENTS.md - maintainer guide for this repo

## Core goal
Build and iterate on an adaptive English trainer for Илья with:
- vocabulary drilling
- weak-word reinforcement
- recap/interview practice

## Non-negotiables

1. Use Russian in operator/user communication unless explicitly asked otherwise.
2. Keep public hostname convention: `jooja-<name>.ilyich.ru`.
3. Do not break other projects on shared PostgreSQL.
4. Deploy with the standard flow (pull -> migrate -> ci -> build -> restart).

## Database policy

- PostgreSQL instance is shared with other apps.
- This project must use dedicated schema (`words_trainer`) in `DATABASE_URL`.
- If Prisma attempts unsafe operations in wrong schema, stop and fix env first.
- Prefer `prisma migrate deploy` in runtime/deploy flows.

## Service policy

- Production process is `words-trainer.service` (systemd user).
- Unit file path in repo: `deploy/systemd/words-trainer.service`.
- Env must come from `.env` via `EnvironmentFile`.
- Target bind: `127.0.0.1:3018`.
- Autostart after reboot requires lingering enabled for `powerdot`.

## Deploy policy (must follow)

1. `git fetch origin`
2. `git pull --rebase origin <current-branch>`
3. `set -a && source .env && set +a`
4. `npx prisma migrate deploy`
5. `npm ci`
6. `npm run build`
7. `systemctl --user restart words-trainer.service`
8. Health checks (`/` + key API endpoint)

Final report format is mandatory:
- pulled: yes/no
- deployed commit: <sha>
- migrations applied: yes/no (+ names)
- pushed: yes/no

## Git policy

- Commit clear checkpoints.
- Push to `github.com/jooja-mind/words-trainer-nuxt`.
- If push is rejected: fetch + pull --rebase + push.

## Current product notes

- Quiz supports display mode toggle (term/translation).
- Protected routes use auth middleware.
- Recap and Interview features rely on OpenAI key.
