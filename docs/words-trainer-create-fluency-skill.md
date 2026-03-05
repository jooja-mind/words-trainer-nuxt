# How to create and ship a new Fluency skill

This is the canonical runbook for adding a new Fluency skill in `words-trainer-nuxt`.

## Hard rules

- Do not delete or modify existing Fluency skills/questions.
- Add only a new skill and its new questions.
- No API validation step is required for this workflow.
- Prompt must be approved by Илья before seeding.

## 1) Mode design phase (Илья designs, agent proposes and gets approval)

Before generating final content, prepare and present a design draft for approval.

### 1.1 Response format

Define:
- expected answer length
- one-step or two-step response format
- mandatory elements in learner response

### 1.2 Evaluation criteria

Define:
- what is considered correct
- what is a critical error
- what is acceptable/forgivable

### 1.3 Feedback policy

Define:
- strict vs soft style
- short vs detailed feedback
- when to show hints and when not

### 1.4 Examples set

Provide:
- good examples
- bad examples
- edge/borderline cases

Only continue after explicit approval.

## 2) Content format - strictly compatible with current seeder

Current parser logic in `fluency/fillDB.ts`:
- reads `.txt` from `fluency/questions/`
- reads file fully, then `.split('\n')`
- empty line closes current question block
- non-empty lines are accumulated into `writeBuffer`
- on empty line, `writeBuffer.join('\n')` is written into `FluencyQuestion.text`

### Mandatory questions file format

- one question = one text block (one or more non-empty lines)
- one empty line between questions (required)
- file must be valid for this exact parsing behavior
- no noise that can produce accidental empty/duplicate questions

### Mandatory content constraints

- minimum 500 questions
- all questions must be unique

## 3) What must be created in project

For a new mode, create/update exactly these items:

1. Questions file:
- `fluency/questions/<slug>_500_questions.txt`

2. Evaluation prompt:
- `fluency/skills/<slug>_prompt.txt`

3. Seeder registration in `fluency/fillDB.ts`:
- add a new key in `toFill` with:
  - `skillName`
  - `evaluationPromptPath`

## 4) DB safety policy (hard rule)

Always follow these rules:

1. Existing data is never removed:
- no deletion of existing `FluencySkill`
- no deletion of existing `FluencyQuestion`

2. Add only new data:
- only new skill and new questions for that skill

3. Rollback scope is only new data from current run:
- if something fails while adding a new mode,
- remove only records created for this new mode in this run
- never touch old skills/questions

4. Idempotency:
- rerun must not duplicate an already created mode
- `skillName` in `fillDB.ts` is treated as idempotency key

If needed, enforce via one-mode transaction/update strategy in code.

## 5) Prompt workflow (mandatory before release)

Before seeding, do this in order:

1. Prepare `fluency/skills/<slug>_prompt.txt`
2. Show full prompt text to Илья
3. Get explicit approval or requested edits
4. Seed only after approval

## 6) Seeding flow

From repo root:

```bash
set -a && source .env && set +a
npm run fluency:filldb
```

## 7) Build and release checks (without API validation)

```bash
npm run build
```

If service is used:

```bash
systemctl --user restart words-trainer.service
systemctl --user status words-trainer.service
journalctl --user -u words-trainer.service -n 80 --no-pager
```

## 8) Done criteria

A mode is considered done only if all are true:
- approved design exists (response format, criteria, feedback policy, examples)
- approved prompt exists
- questions file exists and satisfies parser format
- questions count is >= 500 and unique
- `fillDB.ts` contains mode mapping
- seed completed without breaking existing data
- build passes

## 9) Commit and push

```bash
git add fluency/fillDB.ts fluency/skills/ fluency/questions/ docs/words-trainer-create-fluency-skill.md
git commit -m "Add fluency skill: <Skill Display Name>"
git push origin main
```

## Related files

- `fluency/fillDB.ts`
- `fluency/skills/*.txt`
- `fluency/questions/*_500_questions.txt`
- `prisma/schema.prisma`
