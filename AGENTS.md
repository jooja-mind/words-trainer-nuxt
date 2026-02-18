# AGENTS.md — maintainer guide for this repo

This file is for future assistant runs so project context is not lost.

## Core goal
Build and iterate on an adaptive English words trainer for Илья.

## Non-negotiables

1. Keep user communication in Russian unless explicitly requested otherwise.
2. UI language can be English (current preference).
3. Keep public hostname convention: `jooja-<name>.ilyich.ru`.
4. Do not break other projects using the same PostgreSQL instance.

## Database policy

- PostgreSQL is shared with other apps (e.g. vacancy-scraper).
- Always use dedicated schema here: `words_trainer`.
- If Prisma warns about dropping tables in `public`, stop and fix `DATABASE_URL` schema.

## Deploy policy

- App runs locally on `127.0.0.1:3018` (prod build output).
- nginx listens on `127.0.0.1:3000`, routes by `server_name`.
- Cloudflare Tunnel maps `jooja-words-trainer.ilyich.ru` to `http://localhost:3000`.

## Git policy

- Commit meaningful checkpoints.
- Push to: `github.com/jooja-mind/words-trainer-nuxt`.
- Keep repo private unless Илья explicitly says otherwise.

## Next requested direction

- Keep methodology close to original pte-test:
  - options-based quiz,
  - mistake-driven repetition,
  - marathon for weak items.
