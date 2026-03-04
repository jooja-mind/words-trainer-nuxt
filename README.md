# words-trainer-nuxt

Adaptive English trainer (Nuxt + Prisma + PostgreSQL) with vocabulary and speaking/interview/fluency practice.

Public URL (Cloudflare Tunnel):
- `https://jooja-words-trainer.leverton.dev`

Build story (Jooja + [@powerdot](https://github.com/powerdot)):
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
- **Fluency (MVP)** - short speaking prompts + STT + instant feedback loop
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
- `app/pages/settings.vue` - vocabulary management
- `app/pages/trainer.vue` - adaptive quiz
- `app/pages/marathon.vue` - weak-words mode
- `app/pages/stats.vue` - training stats
- `app/pages/recap.vue` - recap practice
- `app/pages/interview.vue` - interview practice
- `app/pages/fluency/index.vue` - fluency mode UI
- `app/components/recorder/*` - mic/volume/controls for speaking flows

- `server/api/auth/*` - login/logout
- `server/api/words/*` - CRUD + review
- `server/api/quiz/*` - next/answer/stats/marathon
- `server/api/recap/*` - recap generation/submission
- `server/api/interview/*` - interview random question/submission
- `server/api/fluency/*` - fluency skill list, question fetch, answer submit
- `server/api/token/elevenlabs.get.ts` - ephemeral token endpoint for ElevenLabs
- `server/utils/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - DB schema

- `fluency/about_mvp.md` - fluency spec and behavior
- `fluency/fillDB.ts` - one-time fluency seed script

- `deploy/systemd/words-trainer.service` - production systemd user service

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
OPENAI_API_KEY="..."           # AI-powered routes
ELEVENLABS_API_KEY="..."       # fluency realtime token endpoint
NATIVE_LANGUAGE="Russian"      # translation language for imported words
```

3) Apply migrations:

```bash
npx prisma migrate deploy
```

4) One-time fluency seed (after fluency rollout):

```bash
npm run fluency:filldb
```

5) Start dev:

```bash
npm run dev
```

6) Production build:

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

## API summary

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Words
- `GET /api/words?status=NEW|HARD|EASY`
- `POST /api/words/batch`
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

### Fluency
- `GET /api/fluency/skill/list`
- `GET /api/fluency/question`
- `POST /api/fluency/question/submitAnswer`
- `GET /api/token/elevenlabs` (protected)

---

## Deploy checklist (short)

1. `git fetch && git pull --rebase`
2. `set -a && source .env && set +a`
3. `npx prisma migrate deploy`
4. `npm ci`
5. `npm run build`
6. `systemctl --user restart words-trainer.service`
7. If first fluency rollout: `npm run fluency:filldb`
8. health checks
