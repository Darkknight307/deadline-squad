# Task template

The PM grooms every issue into exactly these four sections.

```markdown
**Goal:** <one or two sentences: what is true when this issue is done>

**Acceptance criteria**

<group criteria under short bold headings when there are many>

- [ ] <checkable statement — something QA can verify against running code>
- [ ] <include the awkward edge cases: empty input, wrong user, duplicates, not found, …>
- [ ] Tests cover <the risky cases>; `uv run pytest` / `npm test` pass.

**Out of scope**

- <thing that is NOT done here> → #<follow-up issue>

**Constraints**

- <files/modules to stay within>
- <libraries to use or avoid; "no new dependencies" unless stated>
- <decisions/guidelines to follow, e.g. `_docs/decisions.md` item 3>

---
Refs: `_docs/plan.md` decision <n>, `_docs/tasks.md` task <n>
```

## Rules

- Every criterion is checkable — no "works well", "looks nice".
- Each criterion names the observable behaviour (status code, field, text on screen).
- Out-of-scope items link to an issue; if none exists, the PM creates it.
- An engineer must be able to implement the issue from the issue alone.
