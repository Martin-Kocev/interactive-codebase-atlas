# Final report template

One message after every create, update, or audit. Concise and scannable. **Never paste generated files or successful logs.** Failures get their actual output; successes get one line.

## Template

```markdown
**Codebase Atlas — <mode>**

Location: `../<repo>-codebase-atlas/`
Start: `node scripts/serve-atlas.mjs .` → http://localhost:4173 (or open `index.html`)

**Repository**
- Documented commit: `a1b2c3d` — "Add reservation conflict handling"
- Current HEAD: `a1b2c3d` (up to date)
- Working tree: clean
- Git tracking: verified not tracked — atlas is outside the repository

**Contents**
- World: 7 islands · 11 routes · 18 areas · 32 key-file buildings
- Learning paths: Quick overview · Follow one action · Explore · What changed?
- Workflows: place a reservation · sign in · nightly availability rebuild
- Subsystems: availability engine · realtime table sync
- Sections: architecture · data model · communication · auth · testing & delivery · where to change · glossary

**Changes** <!-- update mode only -->
- `workflow-place-reservation` — step 4 now emits `reservation.created`
- `entity-reservation` — new `holdExpiresAt` column
- 3 source references repointed after `src/orders/` moved
- Progress preserved: 12/12 items kept their ids; 2 flagged as updated
- Change review: 3 conceptual groups added; prior reviewed groups and island coordinates preserved

**Verification**
- Atlas files created/changed: 14
- Validation: passed (41/41 source references resolve, no secrets found)
- Tests: 9 interaction tests passed
- Screenshots: `screenshots/` — 9 captured and reviewed
- Layouts checked: 1440 / 834 / 390 · map/list parity · keyboard nav · reduced motion · `file://`

**Worth knowing**
- Uncertain: the retry limit of 3 in `src/mail/send.ts` has no stated reason (marked `unknown`)
- Conflict: `README.md` describes uploads as synchronous; `src/upload/queue.ts` enqueues them
- Next additions: billing workflow, the reporting read models
```

## Rules

**Mode** — name it in the first line.

**Location and start command** — always, even on update. The reader may have forgotten.

**Commits** — both the documented commit and current `HEAD`, with the subject line. If they differ, say how far apart and why.

**Working tree** — clean, or the count of uncommitted files with the note that the atlas documents committed `HEAD`.

**Git tracking** — the result of `check-untracked.mjs`, stated as a verified fact, never assumed. If the atlas had to go inside the repository, say so and say how it is excluded.

**Contents** — island/route/area/key-file counts, paths, workflows, subsystems, and sections. Names only; the atlas has the detail.

**Changes** (update/audit) — what *meaningfully* moved, not a commit list. Summarize conceptual change groups and include stable-ID, coordinate, and progress/review preservation results.

**Verification** — file count, validation result, tests, screenshot location, layouts, `file://`, map/list parity, keyboard, reduced motion, and Git isolation. One line each. List skipped checks with the reason—never omit them.

**Worth knowing** — uncertain claims, documentation conflicts, and recommended next additions. This section is what makes the report trustworthy; do not drop it because everything went well.

## Audit variant

Lead with a one-line verdict, then findings by severity:

```markdown
**Codebase Atlas — audit**

**Stale.** Repository is 14 commits ahead of the documented version.

Errors
- `src/orders/place.ts` no longer exists — referenced by `workflow-place-reservation` step 3
- Auth section states sessions expire in 7 days; `src/auth/session.ts:22` sets 14

Warnings
- 6 line ranges have drifted (files still correct)
- `subsystem-availability` deep-dive excerpt no longer matches source

Observations
- Git isolation verified — atlas is not tracked
- All 9 views render; reduced motion and keyboard navigation pass

Fixed in place: 4 moved file paths, `lastValidatedAt`.
Recommended: run update mode to bring content to `f7e8d9a`.
```

## Length

Aim for under 40 lines. If it is longer, detail belongs in the atlas, not the report.
