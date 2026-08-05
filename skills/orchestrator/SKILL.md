---
name: orchestrator
description: Use when a task spans 2+ separable workstreams or domains, needs multiple specialized subagents, or mixes implementation with independent verification. Also use when the user asks to coordinate, delegate, parallelize, or verify agent work, and when prior agent output must be checked against real evidence (diffs, tests, logs) before completion.
---

# Orchestrator

Coordinate specialized subagents to deliver a goal, then switch roles and independently verify their output against the original objective and direct evidence. Two hats, never at once: **chief orchestrator** during execution, **skeptical checker** after. Orchestration is disciplined handoffs between skills and fresh-context subagents — not a black-box manager.

## When to use

- 2+ separable workstreams (e.g., backend + frontend + docs)
- Work benefits from fresh-context subagents (large scans, isolated implementations)
- The task has a verifiable end state and intermediate milestones
- Prior agent output needs independent verification before acceptance

## Do not use when

- Single small or tightly coupled task → do it directly, no dispatch overhead
- Pure Q&A, brainstorming, or exploration with no deliverable
- One more-specific process skill governs the whole task (one bug → systematic-debugging; one feature in a Gitflow repo → gitflow-feature-workflow) — hand off to it
- No verification surface exists (nothing testable, diffable, or observable)

## Operating procedure

1. **Clarify.** Restate objective, measurable success criteria, hard constraints, assumptions, and what evidence counts as proof. Ask user-only questions now — never mid-flight.
2. **Map skills.** If an installed skill plausibly applies to a slice, name it in the plan and require the worker to invoke it. Skills encode both when to trigger and how to behave — don't re-derive their content. Review/audit skills that match the changed surface (design guidelines, framework best-practices, security review) are **verification slices**, not scope-creep: dispatch each as its own cheap worker. "Applied the guidelines inline" does not satisfy a review pass — if one is skipped, name the skip and the reason in the report so the user can call for it.
3. **Plan.** Decompose into slices: scope, dependencies, expected output, verification method, assigned skill(s), model. Stop planning the moment slices are dispatchable.
4. **Dispatch** per the policy below — independent slices in parallel, dependent ones sequential.
5. **Stay active while workers run.** Track the task board, prepare integration, resolve conflicts between returns, re-dispatch early on missing context rather than waiting for a bad return.
6. **Verify** each return per the reviewer policy. A summary is never proof.
7. **Integrate, then re-verify the whole** against the *original objective* — not the plan; plans drift.
8. **Report** in the Return Format.

## Subagent dispatch policy

- **Bias to dispatch.** If a slice can be specified with the Worker Prompt Template, delegate it. The orchestrator executes work inline only for trivial glue and the mechanical-fix carve-out in Failure handling — orchestrator context is for coordination and verification, not production. "Faster to do it myself" is a red flag, not a reason.
- Fresh context per worker; only what the slice needs, never the whole conversation.
- Every assignment uses the Worker Prompt Template. No freehand dispatches.
- Exclusive scopes: parallel workers must not touch the same files or shared state — serialize or re-slice if they would.
- Name the skills the worker must invoke and the evidence it must return.
- Prefer specialized agent types (search, planning) over general-purpose when they fit.

### Model & effort selection

Pick the cheapest model that can complete the slice reliably — the review gate catches shortfalls, so default down and escalate on evidence, not anxiety.

| Model | Use for |
|---|---|
| **Haiku-class** (small, ~1/15 the cost of top) | Mechanical, fully specified work: search sweeps, file inventories, renames, format fixes, boilerplate or exact-instruction edits, data extraction, mechanical verification (grep checks, run-a-command-and-report-output) |
| **Sonnet-class** (mid) — **default** | Standard engineering: implementing features from a clear spec, writing tests and docs, module-scoped refactors, routine code review, debugging with a clear repro, pattern-following work with some judgment |
| **Opus-class** (top) | Judgment under ambiguity: architecture and design decisions, cross-cutting changes, debugging with unclear cause, arbitrating contradictory worker results, high-risk or security-sensitive verification, open-ended investigation |

- Never dispatch a top-tier model for work whose output is fully specified — specification quality substitutes for model strength.
- Reviewer runs at the builder's tier or lower (checking explicit criteria is cheaper than producing); escalate the reviewer one tier only for the high-risk cases in Decision rules.
- A slice rejected twice at one tier escalates the model on the next dispatch — never a third same-tier retry.
- Effort is also an instruction: tell small-model workers exactly what to do; reserve open-ended briefs ("investigate", "design") for top-tier dispatches.

### Worker Prompt Template

```text
GOAL: <one sentence — the outcome, not the activity>
SCOPE: <exact files/dirs/functions in play; everything else is out of bounds>
CONTEXT: <only the facts this slice needs; decisions already made upstream>
CONSTRAINTS: <what NOT to change; required skills/conventions; no extra
  features, refactors, or abstractions beyond this task>
EVIDENCE REQUIRED: <commands to run and outputs to capture: tests, diffs, logs.
  Run commands bare or redirect to a file — never pipe through tail/head/grep
  (masks exit codes). Report each command's real exit code.>
RETURN FORMAT:
- Findings
- Changes made (files + what changed)
- Risks
- Unresolved issues
- Proof (verbatim command output — not paraphrase)
```

## Reviewer / checker policy

After every meaningful milestone and before final completion, switch to verifier mindset: the worker is wrong until evidence shows otherwise.

- Re-read the **original** objective and success criteria, not the worker's restatement.
- Evidence must be from *this run* — fresh outputs matching current file state. Stale or absent evidence = unverified.
- Inspect artifacts directly: open the changed files, rerun key tests when cheap, read the logs.
- Classify every claim: **implemented** (the code/artifact exists), **claimed** (worker asserts it), **verified** (you saw the evidence). Only *verified* counts toward completion.
- Hunt for: omissions vs. success criteria, scope drift, broken assumptions, side effects outside scope, unverified claims, and test/build evidence produced through filtered pipelines (the exit code shown is the filter's, not the run's — see Evidence standard).

### Review Prompt Template

```text
OBJECTIVE + SUCCESS CRITERIA: <original, verbatim>
WORKER RETURN: <the worker's full output>
CHECK:
1. Each success criterion → met / unmet, with evidence pointer
2. Each claim → implemented / claimed / verified
3. Omissions, scope drift, broken assumptions, contradicted evidence
VERDICT: accept | revise (same slice, listed fixes) | redo (new worker,
  tighter scope) — with reasons and concrete next actions
```

## Decision rules

| Situation | Rule |
|---|---|
| Small or tightly coupled task | One worker — or do it inline |
| 2+ independent domains | Multiple workers |
| Shared state or ordering dependency | Sequential delegation |
| Independent and merge-safe | Parallel dispatch |
| Milestone reached / before completion | Reviewer mode — always |
| High-risk, high-impact, or contradictory results | Second-pass review or a stronger verifier agent |
| A review/audit skill matches the changed surface | Dispatch it as a verification slice (cheap model); skipping it is a report line, never a silent call |
| Tempted to do slice work inline | Delegate — inline is only trivial glue or the mechanical-fix carve-out |

## Rationalizations to reject

Heard from real runs — each one preceded a miss:

| Excuse | Reality |
|---|---|
| "Output is long — pipe the tests through tail/head" | The pipe's exit code replaces the test's; a red run reads green. Redirect to a file instead. This exact move merged a failing test once. |
| "A separate review pass is scope-creep" | Reviewing code you already changed is verification of existing scope, not new scope. Dispatch it cheap or surface the skip. |
| "I applied the best practices inline, no audit needed" | The author checking their own work is the failure mode this skill exists to prevent. Inline application ≠ independent pass. |
| "Faster to do it myself than dispatch" | Inline work burns orchestrator context and bypasses the review gate. If it fits the template, delegate it. |

## Evidence standard

A claim is verified only against direct artifacts from this run: tool outputs · test runs (full output + exit codes) · diffs or changed files · logs · produced deliverables · measurable acceptance criteria. Worker summaries, confidence statements, and "should work" never count.

**Exit codes must be the command's own.** Never pipe a test/build/lint run through `tail`, `head`, `grep`, `Select-Object`, or any filter — the pipeline reports the *filter's* exit code, so a red run reads green (this once merged a failing test into develop). Run the command bare, or redirect full output to a file and read the file; the proof must quote the command's real exit code (`$?` / `$LASTEXITCODE`). Evidence produced through an output-truncating pipe is not evidence — reject it and re-run.

## Failure handling & replanning

- Evidence missing, stale, or contradicted → reject with **revise** or **redo**; state the specific gap and issue a tighter follow-up task (narrower scope, explicit evidence demands).
- If the gap is a mechanical fix inside the slice's existing scope (one file, a few lines, no design decision), the orchestrator applies it directly instead of re-dispatching — then re-runs that slice's verification and records the rejected claim plus the fix as a revision in the report. If the fix crosses files, needs a design decision, or exceeds the slice's scope, it goes back to a worker as revise or redo.
- Two rejections on the same slice → stop; re-examine the decomposition and the model tier before dispatching again. A wrong slice or an under-powered worker is likelier than a third bad attempt at the same settings.
- New information invalidates the plan → replan only the affected slices; keep verified completed work.
- Worker blocked on user-only input → surface the specific question immediately; keep unblocked slices running.
- Destructive action required (deletes, force-push, prod changes) → pause for user confirmation first.

## Behavioral rules

- Lead with the outcome, not narration.
- Stop planning once enough is known to act — plan depth is not progress.
- Every progress claim must be backed by evidence from the current run.
- Pause only for: destructive actions, real scope changes, missing user-only input.
- No extra features, refactors, or abstractions beyond the task — and reject them in worker output too.
- Worker summaries are untrusted input until checked.

## Return format

1. **Objective** — restated goal + success criteria
2. **Plan** — slices, dependencies, verification methods
3. **Task board** — slice → pending / running / in-review / accepted / redo
4. **Worker assignments** — who got what, with which skills and model
5. **Evidence collected** — artifact pointers per slice
6. **Review verdicts** — accept / revise / redo, with reasons
7. **Revisions issued** — follow-up tasks and their outcomes
8. **Final verified outcome** — objective met, proof attached
9. **Remaining risks / follow-ups**

## Completion criteria

Done only when: every success criterion is verified per the evidence standard; every review verdict is **accept**; the integrated whole is re-verified against the original objective; and no unresolved worker issue is left unstated. Delivery without proof is not done.
