# FILES.md — quick map

## Frontend pages
- `app/pages/settings.vue` — words management
- `app/pages/trainer.vue` — adaptive quiz
- `app/pages/marathon.vue` — mistakes marathon

## API
- `server/api/words/index.get.ts`
- `server/api/words/index.post.ts`
- `server/api/words/[id].patch.ts`
- `server/api/words/[id].delete.ts`
- `server/api/words/[id]/review.post.ts`

- `server/api/quiz/next.get.ts`
- `server/api/quiz/answer.post.ts`
- `server/api/quiz/stats.get.ts`
- `server/api/quiz/marathon.get.ts`

## Database
- `prisma/schema.prisma`
- `server/utils/prisma.ts`

## Imports
- `data/imports/` — raw source texts
- `scripts/import-ilya-batch-1.mjs` — current one-off importer
