# AGENTS.md template

`AGENTS.md` is both the agent instruction file and the project's deep reference. Use this structure when creating it from scratch, and preserve it when updating. Consistency is what makes the file machine-skimmable — it is the context-loading mechanism for every task in this repo, so an outdated one poisons all future work.

```markdown
# <Project Name>

## Project overview
2–4 paragraphs: what the project does, who uses it, its main entry points.

## Tech stack
- Language(s) and versions
- Frameworks and major libraries
- Test runner, lint/format tools, build/deploy tooling (exact invocations go in Common commands)

## Common commands
Exact, verified commands — copy-paste runnable. Record the command as it actually
succeeded in this repo, including flags, working directory, and env vars if needed.

| Task | Command | Notes |
|---|---|---|
| Run full test suite | `npm test` | must pass before any merge |
| Lint | `npm run lint` | |
| Start dev server | `npm run dev` | port 3000 |
| Seed database | `npm run seed` | requires captcha disabled |

## Project conventions
Repo-specific rules an agent must follow: branching/workflow notes (e.g. remote
name, merge flags), commit style, i18n rules, naming conventions, review
expectations — anything the user has established that isn't derivable from code.

## Architecture notes
How the pieces fit together: layers, data flow, key patterns and conventions,
anything surprising a newcomer would trip over.

## File reference

| Path | Purpose | Key exports / dependencies |
|---|---|---|
| `src/app.py` | Application entry point; wires routes to handlers | `create_app()`; depends on `src/config.py` |
| `src/models/user.py` | User model and validation | `User`, `validate_email()`; SQLAlchemy |
| `tests/test_user.py` | Unit tests for the User model | pytest |

## Gotchas and lessons learned
Dated entries, newest first. Each entry: what went wrong (or nearly did) and the
correct approach, in 1–3 lines. Written for the next agent, not as a diary.

- **2026-07-19** — Piping test output through `tail`/`head` hides the runner's
  exit code; a red suite looked green and got merged. Run the suite bare and
  check the exit code directly.
- **2026-07-18** — `npm run seed` fails silently when captcha is enabled; set
  `CAPTCHA_DISABLED=true` first.
```

Rules for maintaining the file:

- Keep the File reference focused on key files, key directories, and task-touched files that future agents need to locate or understand. Summarize generated artifacts, vendored dependencies, and repetitive directories as one directory row; do not expand an exhaustive inventory that bloats every session.
- When a task adds, changes, moves, or deletes a meaningful source, config, test, or documentation file, update its row in the same branch.
- Common commands holds the command that actually worked, verbatim. When a recorded command stops working, replace it in the same task that discovered the breakage.
- Gotchas entries are deduplicated: if a new mistake matches an existing entry, sharpen that entry instead of appending a duplicate. Delete entries that no longer apply to the current codebase.
- Keep entries terse. The file is loaded into every session, so each line must earn its tokens — detail that helps future tasks stays, narrative does not.
