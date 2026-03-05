# words-trainer-create-fluency-skill - canonical instructions

This file is the single source of truth for creating and updating the `words-trainer-create-fluency-skill` skill.

## Purpose

This skill supports English fluency practice based on a user's vocabulary set: exercises, short dialogs, micro-drills, and daily practice tasks.

## Skill location

- Folder: `skills/words-trainer-create-fluency-skill/`
- Main file: `skills/words-trainer-create-fluency-skill/SKILL.md`

## Update workflow

1. Update this file first if the process changes.
2. Update the skill `SKILL.md` (keep it short and practical).
3. Add extra resources if needed:
   - `references/*.md` for detailed rules/templates
   - `scripts/*` for repeatable deterministic steps
4. Ensure `SKILL.md` links to this file.
5. Validate with 1-2 real usage scenarios.
6. Commit and push to `main`.

## Minimum requirements for SKILL.md

- Valid frontmatter:
  - `name: words-trainer-create-fluency-skill`
  - `description: ...` (what it does + when to use)
- Short step-by-step body
- Explicit link to this file

## Pre-commit checklist

- [ ] Skill name matches folder name
- [ ] Description covers real trigger cases
- [ ] No clutter files (README/CHANGELOG/etc.)
- [ ] Link to this instruction file is correct
- [ ] Changes are committed and pushed to `main`

## Note

If a stable exercise-generation pipeline appears, move it into `scripts/` and call it from the skill instead of doing manual steps.