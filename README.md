# words-trainer-nuxt

Adaptive vocabulary trainer (Nuxt + Prisma + PostgreSQL) with 3 pages:

- **Settings** — manage words
- **Trainer** — multiple-choice session (adaptive)
- **Mistakes Marathon** — focus on weak words only

Public URL (Cloudflare Tunnel):
- `https://jooja-words-trainer.ilyich.ru`

---

## Tech stack

- Nuxt 4 (Vue 3)
- Nitro server API routes
- Prisma ORM
- PostgreSQL (shared DB, separate schema)

---

## Project structure

- `app/app.vue` — top navigation
- `app/pages/settings.vue` — add/filter/delete words
- `app/pages/trainer.vue` — adaptive quiz
- `app/pages/marathon.vue` — weak-words marathon
- `server/api/words/*` — CRUD + review endpoints
- `server/api/quiz/*` — adaptive selection, answer check, stats, marathon list
- `server/utils/prisma.ts` — Prisma client singleton
- `prisma/schema.prisma` — DB schema
- `scripts/import-ilya-batch-1.mjs` — current import script for teacher batch
- `data/imports/` — raw import files

---

## Local run

```bash
npm install
npm run build
```

Set DB URL in `.env` (important: use dedicated schema):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=words_trainer"
```

Apply schema and generate client:

```bash
npx prisma db push
npx prisma generate
```

Run dev:

```bash
npm run dev
```

Run production build output:

```bash
PORT=3018 HOST=127.0.0.1 node .output/server/index.mjs
```

---

## Adaptive methodology (current)

### Trainer (`/trainer`)
`GET /api/quiz/next` ranks words by a blended priority:

- recent mistake pressure (wrong rate)
- time since last seen
- low repetition count
- status bonus (`HARD` > `NEW` > `EASY`)

Each question is: **term → 4 definition options** (1 correct + 3 distractors).

On answer (`POST /api/quiz/answer`):

- wrong → `HARD`
- correct and 2 previous correct → `EASY`
- otherwise → `NEW`

### Mistakes Marathon (`/marathon`)
`GET /api/quiz/marathon` selects only words with mistakes and sorts by KPI:

- KPI = `correct / wrong`
- lower KPI first, then higher wrong count

This gives “drill where I fail” behavior similar to the original PTE approach.

---

## API summary

### Words
- `GET /api/words?status=NEW|HARD|EASY`
- `POST /api/words`
- `PATCH /api/words/:id`
- `DELETE /api/words/:id`
- `POST /api/words/:id/review`

### Quiz
- `GET /api/quiz/next?limit=20`
- `POST /api/quiz/answer`
- `GET /api/quiz/stats`
- `GET /api/quiz/marathon?limit=50`

---

## Notes for future work

- Add robust bulk import endpoint (`txt/csv/json`) and parser with dedupe.
- Add explicit training modes (repeat, rare, hardest KPI, mixed).
- Add session history UI + per-day stats charts.
- Add service autostart (systemd) for port `3018`.
