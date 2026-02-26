# words-trainer-nuxt

Adaptive English trainer (Nuxt + Prisma + PostgreSQL) with vocabulary and speaking/interview practice.

Public URL (Cloudflare Tunnel):
- `https://jooja-words-trainer.leverton.dev`

Build story (Jooja + Илья):
- https://medium.com/@power_dot/from-chatbot-to-teammate-building-in-public-with-an-ai-agent-e7ec23f784ed

---

## Current features

- **Settings** - batch add/edit/delete/filter vocabulary
- **Quick Add Widget** - floating add-word panel on non-login/non-settings pages
- **Trainer** - adaptive multiple-choice quiz
- **Mistakes Marathon** - drill weak words only
- **Stats** - aggregate training metrics
- **Recap** - short speaking/writing recap flow
- **Interview** - AI-assisted interview practice
- **Login/Auth** - password-based access for protected routes

---

## Tech stack

- Nuxt 4 (Vue 3)
- Nitro server API routes
- Prisma ORM
- PostgreSQL
- Nuxt UI + Tailwind
- vite-pwa

---

## Project structure

- `app/app.vue` - top navigation + layout
- `app/pages/login.vue` - auth page
- `app/pages/settings.vue` - vocabulary management (batch import + list)
- `app/components/addWord.vue` - floating quick-add widget
- `app/pages/trainer.vue` - adaptive quiz
- `app/pages/marathon.vue` - weak-words mode
- `app/pages/stats.vue` - training stats
- `app/pages/recap.vue` - recap practice
- `app/pages/interview.vue` - interview practice
- `app/composables/useQuizDisplayMode.ts` - quiz display mode (term/translation) persisted in localStorage

- `server/api/auth/*` - login/logout
- `server/api/words/*` - CRUD + review
- `server/api/quiz/*` - next/answer/stats/marathon
- `server/api/recap/*` - recap generation/submission
- `server/api/interview/*` - interview random question/submission
- `server/utils/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - DB schema

- `deploy/systemd/words-trainer.service` - production systemd user service
- `data/imports/` - raw import files
- `scripts/` - import/maintenance scripts

---

## Local run

1) Install deps:

```bash
npm ci
```

2) Configure `.env` (minimum):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
PASSWORD="..."                 # app login password
OPENAI_API_KEY="..."           # for AI-powered routes
NATIVE_LANGUAGE="Russian"      # target translation language for imported words
```

3) Apply migrations:

```bash
npx prisma migrate deploy
```

4) Start dev:

```bash
npm run dev
```

5) Production build:

```bash
npm run build
```

---

## Production service (systemd user)

Service file is tracked in repo:
- `deploy/systemd/words-trainer.service`

Install/update on host:

```bash
cp deploy/systemd/words-trainer.service ~/.config/systemd/user/words-trainer.service
systemctl --user daemon-reload
systemctl --user enable --now words-trainer.service
```

Useful commands:

```bash
systemctl --user status words-trainer.service
systemctl --user restart words-trainer.service
journalctl --user -u words-trainer.service -n 80 --no-pager
```

Notes:
- Service reads env from `.env` via `EnvironmentFile=...`.
- App listens on `127.0.0.1:3018`.
- For autostart after reboot without login, enable lingering once:

```bash
sudo loginctl enable-linger powerdot
```

---

## Adaptive methodology

### Trainer (`/trainer`)
`GET /api/quiz/next` ranks words by blended priority:
- recent mistake pressure
- time since last seen
- low repetition count
- status bonus (`HARD` > `NEW` > `EASY`)

Question format: **term -> 4 definition options**.

Display mode switch is available (term/translation) and persisted client-side.

On answer (`POST /api/quiz/answer`):
- wrong -> `HARD`
- correct with enough history -> `EASY`
- otherwise -> `NEW`

### Mistakes Marathon (`/marathon`)
`GET /api/quiz/marathon` selects words with mistakes and sorts by KPI:
- KPI = `correct / wrong`
- lower KPI first, then higher wrong count

---

## API summary

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Words
- `GET /api/words?status=NEW|HARD|EASY`
- `POST /api/words/batch` (GPT parsing + dedupe + create)
- `PATCH /api/words/:id`
- `DELETE /api/words/:id`
- `POST /api/words/:id/review`

### Quiz
- `GET /api/quiz/next?limit=20`
- `POST /api/quiz/answer`
- `GET /api/quiz/stats`
- `GET /api/quiz/marathon?limit=50`

### Recap
- `POST /api/recap/generate`
- `POST /api/recap/submit`

### Interview
- `GET /api/interview/random`
- `POST /api/interview/submit`

---

## Deploy checklist (short)

1. `git fetch && git pull --rebase`
2. `set -a && source .env && set +a`
3. `npx prisma migrate deploy`
4. `npm ci`
5. `npm run build`
6. `systemctl --user restart words-trainer.service`
7. health checks
