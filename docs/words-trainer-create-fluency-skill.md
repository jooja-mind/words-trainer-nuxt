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
- never generate final question sets with blind template combinatorics / Cartesian products (`verb × object × wh-word × subject`)
- for question-building skills, write prompts thoughtfully or use high-reasoning sub-agents to draft them, then review before seeding
- if a generated prompt sounds non-native, semantically broken, or mechanically inflected, discard it instead of patching around it

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

## 7) Done criteria

A mode is considered done only if all are true:
- approved design exists (response format, criteria, feedback policy, examples)
- approved prompt exists
- questions file exists and satisfies parser format
- questions count is >= 500 and unique
- `fillDB.ts` contains mode mapping
- seed completed without breaking existing data

## 8) Commit and push

```bash
git add fluency/fillDB.ts fluency/skills/ fluency/questions/ docs/words-trainer-create-fluency-skill.md
git commit -m "Add fluency skill: <Skill Display Name>"
git push origin main
```

## 9) Lesson learned: how not to screw up Fluency question-building skills

This section is based on a real failure while adding RU -> EN question-translation skills.

### 9.1 Never trust mass generation without file review

For question-building / translation skills, do **not**:
- generate 3 skills at once and seed them blindly
- trust template combinatorics / Cartesian products like `verb × object × wh-word × subject`
- assume DB contents are correct just because a seed command finished
- claim that a skill was updated unless the source file actually changed

Why:
- this creates broken Russian, bad semantics, fake confidence, and DB pollution
- typical failures look like:
  - bad morphology: `Он завтра попробуешь...`
  - nonsense collocations: `Как ты попробуешь логи?`
  - broken wh-frequency combos: `Когда ты часто...`, `Как ты часто...`

### 9.2 Preferred workflow for risky Fluency skills

Golden path:

1. Rewrite **one file only**
2. Review the raw `.txt` file directly
3. Check:
   - natural Russian
   - no broken morphology
   - no semantic garbage
   - correct block format
   - good grammar coverage
4. Commit that file first
5. Let Илья review the diff in GitHub if needed
6. Only after approval, run `fillDB.ts`
7. Seed **one skill at a time**
8. Verify in DB that the new records match the reviewed file

Short version:

`rewrite file -> review file -> commit -> approve -> fillDB -> verify DB`

### 9.3 Use sub-agents the right way

If the content is large or quality-sensitive:
- prefer a high-reasoning sub-agent
- give it a narrow task: rewrite **one target file only**
- require a short completion message instead of a giant dump
- inspect the produced file before touching DB

Do not ask a sub-agent to change many skills at once unless the work is already proven safe.

### 9.4 Hard rule for Fluency question files

For Fluency question sets, the main agent should **not** author the final 500-question file directly.

Use this rule:
- question files are drafted or rewritten by a **high-reasoning sub-agent**
- the main agent acts as reviewer/operator
- the main agent may inspect, validate, commit, and seed
- but should not be the primary writer of large final question sets

Reason:
- this reduces drift
- this protects main-session context
- this improves quality for long-form question authoring work
- this makes the workflow reproducible: `sub-agent -> review -> commit -> fillDB`

### 9.5 Operator prompts that work well

These user instructions proved especially effective and should shape future workflow:

- `Давай начнем с малого.`
  - forces the task into a narrow, testable scope
- point to a **specific DB id** and inspect it
  - turns vague quality concerns into concrete facts
- `стой, делай как я говорю`
  - useful when the agent starts drifting into explanations instead of controlled execution
- ask the sub-agent to return only a short `готово`-style summary
  - protects main-session context and keeps the process controllable

### 9.6 Practical rule

For Fluency question-building skills, quality comes from:
- careful writing
- narrow scope
- visible review
- DB verification

Not from:
- speed
- bulk generation
- optimistic assumptions
- post-hoc patching in the database

## Current examples in repo

- `Present Question Translation`
- `Past Question Translation`
- `Future Question Translation`

These are useful references for future RU -> EN question-building skills.

## Related files

- `fluency/fillDB.ts`
- `fluency/skills/*.txt`
- `fluency/questions/*_500_questions.txt`
- `prisma/schema.prisma`
