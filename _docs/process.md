# Process

How work is organised in this repo.

## Backlog

- GitHub issues are the only backlog (`_docs/tasks.md` is historical).
- Issues in the MVP have the label `mvp`; ideas for later have the label `later`.
- Work on **one issue at a time**, in issue-number order unless a dependency says otherwise.
- Read the issue's acceptance criteria before starting and again before closing.
- Commit regularly; every commit message references the issue, e.g. `Add groups API (#3)`.

## Roles

| Role | File | Does | Never |
|---|---|---|---|
| Orchestrator | this file | picks the next issue, dispatches roles, closes issues | grooms, implements or tests |
| Product Manager | `team/pm.md` | grooms an issue into the template | writes code |
| Software Engineer | `team/software-engineer.md` | implements one groomed issue | changes acceptance criteria, closes issues |
| QA Engineer | `team/qa-engineer.md` | verifies every criterion against running code | fixes code |

Each role runs as a separate subagent with only its role file, `AGENTS.md` and the issue as context.

## Orchestrator lifecycle (per issue)

1. **Pick** the lowest-numbered open `mvp` issue whose dependencies are closed.
2. **Groom** — dispatch the PM. The PM rewrites the issue body using `task-template.md` and leaves a grooming comment. The issue must have Goal, Acceptance criteria, Out of scope and Constraints filled.
3. **Implement** — dispatch the Software Engineer with the issue number. The engineer implements, commits, and leaves an implementation comment (commit hash, what was done, test results, anything flagged). The engineer does not close the issue.
4. **Verify** — dispatch the QA Engineer. QA posts a comment that starts with `QA: PASS` or `QA: FAIL`, with a verdict per acceptance criterion.
5. On **FAIL** → back to step 3 with the QA comment as input; then step 4 again.
6. On **PASS** → the orchestrator ticks the acceptance-criteria checkboxes, posts a short closing comment (merged commit, test count) and closes the issue as completed.
7. Repeat until there are no open `mvp` issues. Stop condition: *"`gh issue list --label mvp --state open` is empty."*

## Follow-ups

Anything found out of scope is never silently dropped: the PM files a new issue (label `later`) and links it from the "Out of scope" section.
