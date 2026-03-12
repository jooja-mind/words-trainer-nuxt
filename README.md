# words-trainer-nuxt

Adaptive English trainer (Nuxt + Prisma + PostgreSQL) with vocabulary, recap, interview, daily, and fluency practice.

Public URL (Cloudflare Tunnel):
- `https://jooja-words-trainer.leverton.dev`

Build story (Jooja + [@powerdot](https://github.com/powerdot)):
- https://medium.com/@power_dot/from-chatbot-to-teammate-building-in-public-with-an-ai-agent-e7ec23f784ed

---

## Current features

- **Vocab Trainer** - adaptive multiple-choice quiz
- **Vocab Settings** - batch add/edit/delete/filter vocabulary
- **Mistakes Marathon** - drill weak words only
- **Vocab Stats** - aggregate vocabulary metrics
- **Recap** - short speaking/writing recap flow
- **Recap Topics** - reusable topic bank with CRUD + auto-fill helper
- **Interview** - AI-assisted interview practice
- **Interview Stats** - history/metrics for interview answers
- **Daily** - one daily workout composed from multiple sections (vocab / recap / interview / fluency)
- **Fluency** - short speaking prompts + STT + instant feedback loop
- **Login/Auth** - password-based access for protected routes

---

## Tech stack

- Nuxt 4 (Vue 3)
- Vue 3
- Nitro server API routes
- Prisma ORM
- PostgreSQL
- Nuxt UI + Tailwind
- vite-pwa

---

## Project structure

### App pages

- `app/pages/index.vue` - main landing / router entry
- `app/pages/login.vue` - auth page
- `app/pages/daily/index.vue` - daily workout flow
- `app/pages/recap/index.vue` - recap practice
- `app/pages/interview/index.vue` - interview trainer
- `app/pages/interview/stats.vue` - interview stats page
- `app/pages/fluency/index.vue` - fluency mode UI
- `app/pages/vocab/trainer.vue` - adaptive vocab quiz
- `app/pages/vocab/marathon.vue` - weak-words mode
- `app/pages/vocab/settings.vue` - vocabulary management
- `app/pages/vocab/stats.vue` - vocabulary stats

### App components

- `app/components/fluency/trainer.vue` - fluency trainer UI
- `app/components/recorder/*` - mic/volume/controls for speaking flows

### Server API

- `server/api/auth/*` - login/logout
- `server/api/words/*` - CRUD + review
- `server/api/quiz/*` - next/answer/stats/marathon
- `server/api/recap/generate.post.ts` - generate recap prompt/content
- `server/api/recap/submit.post.ts` - submit recap answer
- `server/api/recap/topic/*` - recap topic CRUD + auto-fill
- `server/api/interview/index.get.ts` - fetch interview question
- `server/api/interview/submit.post.ts` - submit interview answer
- `server/api/interview/stats.get.ts` - interview stats/history
- `server/api/daily/index.get.ts` - fetch daily sections/progress
- `server/api/daily/submit.post.ts` - submit completed daily section
- `server/api/fluency/skill/list.get.ts` - list fluency skills
- `server/api/fluency/question/index.get.ts` - get fluency question
- `server/api/fluency/question/submitAnswer.post.ts` - submit fluency answer
- `server/api/token/elevenlabs.get.ts` - ephemeral token endpoint for ElevenLabs

### Data / seeds / schema

- `prisma/schema.prisma` - DB schema
- `fluency/fillDB.ts` - fluency seed script
- `fluency/questions/*_500_questions.txt` - question banks
- `fluency/skills/*_prompt.txt` - evaluator prompts for fluency skills
- `fluency/about_mvp.md` - fluency spec and behavior

### Deployment

- `deploy/systemd/words-trainer.service` - production systemd user service
- `docs/words-trainer-create-fluency-skill.md` - canonical fluency skill runbook

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

4) Seed fluency skills/questions when needed:

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

## Useful scripts

```bash
npm run fluency:filldb
npm run test:daily-contract
```

Notes:
- `fluency:filldb` loads `.env` and seeds fluency skills/questions
- `test:daily-contract` checks daily payload shape / contract assumptions

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
- Service reads env from `.env` via `EnvironmentFile=...`
- App listens on `127.0.0.1:3018`
- For autostart after reboot without login, enable lingering once:

```bash
sudo loginctl enable-linger powerdot
```

---

## API summary

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Words / quiz
- `GET /api/words?status=NEW|HARD|EASY`
- `POST /api/words/batch`
- `PATCH /api/words/:id`
- `DELETE /api/words/:id`
- `POST /api/words/:id/review`
- `GET /api/quiz/next?limit=20`
- `POST /api/quiz/answer`
- `GET /api/quiz/stats`
- `GET /api/quiz/marathon?limit=50`

### Recap
- `POST /api/recap/generate`
- `POST /api/recap/submit`
- `GET /api/recap/topic/list`
- `POST /api/recap/topic`
- `DELETE /api/recap/topic`
- `POST /api/recap/topic/auto-fill`

### Interview
- `GET /api/interview`
- `POST /api/interview/submit`
- `GET /api/interview/stats`

### Daily
- `GET /api/daily`
- `POST /api/daily/submit`

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
7. If fluency content changed and needs DB update: `npm run fluency:filldb`
8. health checks
9. report deploy result back to chat (`pulled / deployed commit / migrations / pushed`)
