# How to create and ship a new Fluency skill

This is the canonical runbook for adding a new Fluency skill in `words-trainer-nuxt`.

## Scope

Use this when you need to add a new grammar/speaking skill to Fluency mode, including:
- a new skill name in DB (`FluencySkill`)
- a new evaluation prompt
- a new question set
- app-level validation and deploy-ready checks

Out of scope:
- changing GPT evaluation schema in API
- redesigning UI flows
- bulk migration of old skills

## Inputs you must prepare

For each new skill, prepare 3 things:

1. **Skill display name**
   - Example: `Present Perfect`

2. **Evaluation prompt file**
   - Path pattern: `fluency/skills/<slug>_prompt.txt`
   - Must instruct model how to judge user answer correctness for this skill.

3. **Questions file**
   - Path pattern: `fluency/questions/<slug>_500_questions.txt`
   - Format expected by `fluency/fillDB.ts`:
     - one question block = one or more non-empty lines
     - blocks are separated by an empty line

Optional:
- Markdown companion with task design notes: `fluency/questions/<slug>_500_questions.md`

## Canonical workflow

### 1) Create prompt + question files

Add files:
- `fluency/skills/<slug>_prompt.txt`
- `fluency/questions/<slug>_500_questions.txt`

Quick sanity checks:
- prompt file is non-empty
- questions file has multiple blocks separated by blank lines

### 2) Register the skill in `fluency/fillDB.ts`

Edit the `toFill` map in `fluency/fillDB.ts` and add an entry:

```ts
'<slug>_500_questions.txt': {
  skillName: '<Skill Display Name>',
  evaluationPromptPath: 'skills/<slug>_prompt.txt'
}
```

Important behavior:
- `fillDB.ts` skips a skill if `FluencySkill` with the same `name` already exists.
- So `skillName` is effectively idempotency key.

### 3) Seed DB

From repo root:

```bash
set -a && source .env && set +a
npm run fluency:filldb
```

Expected result:
- new row in `FluencySkill`
- multiple rows in `FluencyQuestion`

### 4) Validate API behavior

Check skill list endpoint includes the new skill:

```bash
curl -s http://127.0.0.1:3018/api/fluency/skill/list
```

Fetch question for this skill (`<id>` from previous response):

```bash
curl -s "http://127.0.0.1:3018/api/fluency/question?skillId=<id>"
```

Submit a sample answer:

```bash
curl -s -X POST http://127.0.0.1:3018/api/fluency/question/submitAnswer \
  -H 'content-type: application/json' \
  -d '{"questionId":1,"answer":"My sample answer.","speechDurationMs":1200,"reactionDelayMs":500}'
```

Expected:
- response contains `evaluation` object
- `FluencyAnswer` row is created

### 5) Build-level checks

```bash
npm run build
```

If app is running via systemd service:

```bash
systemctl --user restart words-trainer.service
systemctl --user status words-trainer.service
journalctl --user -u words-trainer.service -n 80 --no-pager
```

## Output contract (done criteria)

A change is complete only if all are true:
- `fluency/fillDB.ts` includes the new skill mapping
- prompt file exists under `fluency/skills/`
- question file exists under `fluency/questions/`
- seeding completed without runtime errors
- new skill appears in `/api/fluency/skill/list`
- question retrieval + answer submission work
- `npm run build` passes

## Troubleshooting

### Skill is not added after `fluency:filldb`

Reason:
- same `skillName` already exists in DB

Fix:
- either use a new `skillName`
- or remove old DB row manually and run seed again

### Seed logs "Evaluation prompt ... not found"

Reason:
- wrong `evaluationPromptPath` in `toFill`

Fix:
- path is relative to `fluency/` script dir
- correct format: `skills/<file>.txt`

### Question endpoint returns 404 "No question found"

Reason:
- no rows were inserted for selected skill
- question file not parsed into blocks (missing blank line separators)

Fix:
- verify question file format and reseed

### `submitAnswer` fails with 400 "Skill does not have evaluation prompt"

Reason:
- DB skill row has empty prompt

Fix:
- ensure prompt file is non-empty, then recreate or update skill row

## Commit and push policy

From repo root:

```bash
git add fluency/fillDB.ts fluency/skills/ fluency/questions/ docs/words-trainer-create-fluency-skill.md
git commit -m "Add fluency skill: <Skill Display Name>"
git push origin main
```

## Related files

- `fluency/fillDB.ts`
- `server/api/fluency/skill/list.get.ts`
- `server/api/fluency/question/index.get.ts`
- `server/api/fluency/question/submitAnswer.post.ts`
- `prisma/schema.prisma`
