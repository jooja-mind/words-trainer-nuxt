# FILES.md - quick map

## Frontend pages
- `app/pages/login.vue` - password login
- `app/pages/settings.vue` - words management
- `app/pages/trainer.vue` - adaptive quiz
- `app/pages/marathon.vue` - mistakes marathon
- `app/pages/stats.vue` - training metrics
- `app/pages/recap.vue` - recap practice
- `app/pages/interview.vue` - interview practice
- `app/pages/fluency/index.vue` - fluency speaking mode

## Frontend support
- `app/composables/useQuizDisplayMode.ts` - quiz display mode and persistence
- `app/composables/stt/*` - STT / ElevenLabs realtime helpers
- `app/components/addWord.vue` - floating quick-add widget
- `app/components/recorder/*` - mic + controls + volume track
- `app/assets/css/main.css` - global styles
- `app/assets/css/shimmer.css` - loader/skeleton effects

## API
### auth
- `server/api/auth/login.post.ts`
- `server/api/auth/logout.post.ts`

### words
- `server/api/words/index.get.ts`
- `server/api/words/batch.post.ts`
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

### fluency
- `server/api/fluency/skill/list.get.ts`
- `server/api/fluency/question/index.get.ts`
- `server/api/fluency/question/submitAnswer.post.ts`
- `server/api/token/elevenlabs.get.ts`

### telemetry
- `server/api/telemetry/event.post.ts`

## Database
- `prisma/schema.prisma`
- `prisma/migrations/`
- `server/utils/prisma.ts`

## Fluency content
- `fluency/about_mvp.md`
- `fluency/fillDB.ts`
- `fluency/questions/*`
- `fluency/skills/*`

## Ops / deploy
- `deploy/systemd/words-trainer.service` - systemd user unit

## Data / scripts
- `data/imports/` - raw import files
- `scripts/` - import + helper scripts
