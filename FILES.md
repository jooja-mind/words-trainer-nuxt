# FILES.md - quick map

## Frontend pages
- `app/pages/login.vue` - password login
- `app/pages/settings.vue` - words management
- `app/pages/trainer.vue` - adaptive quiz
- `app/pages/marathon.vue` - mistakes marathon
- `app/pages/stats.vue` - training metrics
- `app/pages/recap.vue` - recap practice
- `app/pages/interview.vue` - interview practice

## Frontend support
- `app/composables/useQuizDisplayMode.ts` - quiz display mode and persistence
- `app/assets/css/main.css` - global styles
- `app/assets/css/quiz.css` - quiz-related styles

## API
### auth
- `server/api/auth/login.post.ts`
- `server/api/auth/logout.post.ts`

### words
- `server/api/words/index.get.ts`
- `server/api/words/index.post.ts`
- `server/api/words/[id].patch.ts`
- `server/api/words/[id].delete.ts`
- `server/api/words/[id]/review.post.ts`

### quiz
- `server/api/quiz/next.get.ts`
- `server/api/quiz/answer.post.ts`
- `server/api/quiz/stats.get.ts`
- `server/api/quiz/marathon.get.ts`

### recap
- `server/api/recap/generate.post.ts`
- `server/api/recap/submit.post.ts`

### interview
- `server/api/interview/random.get.ts`
- `server/api/interview/submit.post.ts`

## Database
- `prisma/schema.prisma`
- `prisma/migrations/`
- `server/utils/prisma.ts`

## Ops / deploy
- `deploy/systemd/words-trainer.service` - systemd user unit

## Data / scripts
- `data/imports/` - raw import files
- `scripts/` - import + helper scripts
