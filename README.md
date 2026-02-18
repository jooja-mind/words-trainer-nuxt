# words-trainer-nuxt

Nuxt 3 + Prisma + PostgreSQL trainer for words.

## Stack
- Nuxt 3
- Prisma ORM
- PostgreSQL

## Setup
```bash
npm install
```

Set database URL in `.env`:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
```

## Prisma
Create/update schema in DB:
```bash
npx prisma migrate dev --name init
```

(If DB already exists and you want to introspect, use `npx prisma db pull`.)

Generate client:
```bash
npx prisma generate
```

## Run
```bash
npm run dev
```

Open: `http://localhost:3000`

## API
- `GET /api/words?status=NEW|HARD|EASY`
- `POST /api/words`
- `PATCH /api/words/:id`
- `DELETE /api/words/:id`
- `POST /api/words/:id/review` with `{ result: "good" | "hard" | "later" }`

## Next
1. Add import endpoint for your word list (CSV/JSON).
2. Add spaced-repetition scheduling fields.
3. Expose online via Cloudflare Tunnel.
