# SKILLS.md - project operational playbooks

## 1) DB + Prisma flow

Use migrations, not db push, for normal deploys.

1. Ensure `.env` has correct `DATABASE_URL` (schema `public`).
2. Load env for shell session:
   - `set -a && source .env && set +a`
3. Run:
   - `npx prisma migrate deploy`
4. Optional checks:
   - `npx prisma migrate status`
   - `GET /api/quiz/stats`

## 2) Nuxt deploy flow

1. `git fetch origin`
2. `git pull --rebase origin <branch>`
3. `set -a && source .env && set +a`
4. `npx prisma migrate deploy`
5. `npm ci`
6. `npm run build`
7. `systemctl --user restart words-trainer.service`
8. Verify health:
   - local home (`/`) expected 200/302
   - protected API may return 401 without auth (expected)

Report always:
- pulled: yes/no
- deployed commit: <sha>
- migrations applied: yes/no
- pushed: yes/no

## 3) Hosting topology

- App process: `127.0.0.1:3018`
- nginx upstream entrypoint: `127.0.0.1:3000`
- Public hostname: `jooja-words-trainer.ilyich.ru`
- Cloudflare Tunnel routes hostname -> local nginx

## 4) Auth + AI routes

- App uses password login via `/api/auth/login`.
- AI-assisted routes require `OPENAI_API_KEY` in `.env`:
  - `POST /api/words/batch` (batch parser/import)
  - recap/interview routes
- If AI routes fail, first check env in service context (`EnvironmentFile=.env`) and service restart.

## 5) Content import

Fast path:
- Put source file into `data/imports/`
- Use script in `scripts/`
- Verify added words in Settings + Trainer
