# SKILLS.md — project-specific operational playbooks

## 1) Shared Postgres onboarding for this app

When reconnecting DB:

1. Read `.env` and confirm `DATABASE_URL` has `schema=words_trainer`.
2. Run:
   - `npx prisma db push`
   - `npx prisma generate`
3. Verify with:
   - `GET /api/quiz/stats`

## 2) Cloudflare + nginx publishing playbook

1. App process on `127.0.0.1:3018`.
2. nginx vhost on `127.0.0.1:3000`, server_name `jooja-words-trainer.ilyich.ru`.
3. Cloudflare DNS CNAME:
   - `jooja-words-trainer.ilyich.ru -> <tunnel-id>.cfargotunnel.com`
4. Tunnel ingress contains hostname route to `http://localhost:3000`.
5. Verify URL responds over HTTPS.

## 3) Import words playbook

Current fast path:

- Drop teacher file into `data/imports/`
- Update/extend importer script in `scripts/`
- Run importer
- Verify words count + trainer options

Target (future): one generic parser endpoint for txt/csv/json.
