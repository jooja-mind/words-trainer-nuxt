# FLUENCY_CONTENT_GUIDE.md

Owner: Jooja
Purpose: how to curate Fluency content (A/B/C/D blocks) for words-trainer-nuxt.

## Scope

This guide defines how new Fluency content is added/updated while the feature is evolving.

## Content principles

1. Keep prompts practical for spoken English (work, interview, daily life).
2. Prefer short, high-signal tasks over long theoretical exercises.
3. Avoid ambiguous grammar tasks where multiple answers are equally valid.
4. Keep CEFR-ish progression from easier to harder.

## A - Pattern Drills content rules

- Each pattern should have:
  - `pattern_key`
  - short description
  - 8-20 prompts
  - 2-3 valid answer examples
- Prioritize patterns that affect spoken fluency:
  - articles
  - tense choice
  - verb form consistency
  - prepositions

## B - Minimal Pairs content rules

- Each pair should isolate one grammar contrast only.
- Include explanation in one sentence.
- Add 10-30 items per pair before enabling in Daily.

## C - Mistake Bank mapping rules

- Allowed error types only:
  - ARTICLE
  - TENSE
  - VERB_FORM
  - PREPOSITION
  - WORD_CHOICE
- Every extracted error must store:
  - `wrong_fragment`
  - `suggested_fragment`
  - `error_type`
- Do not invent broad/subjective categories.

## D - Pressure Mode prompt rules

- Keep prompts answerable in 20-40 seconds.
- Use clear context and concrete task.
- Avoid trivia and obscure topics.

## QA checklist before shipping new content

- [ ] prompts are clear and non-ambiguous
- [ ] no duplicated items
- [ ] difficulty tag exists (easy/medium/hard)
- [ ] all strings are clean English
- [ ] mobile layout sanity checked

## Delivery workflow

1. Add/adjust content in feature branch.
2. Run quick local check (build + basic screen smoke).
3. Share sample tasks with Илья for sanity feedback.
4. Merge only after approval.
