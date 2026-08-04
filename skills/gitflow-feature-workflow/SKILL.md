---
name: gitflow-feature-workflow
description: Use when making code or versioning changes in a repository that uses master and develop branches, including features, non-urgent bug fixes, production hotfixes, releases, or semver bumps.
---

# Gitflow Feature Workflow

Use strict Gitflow for the complete lifecycle of repository changes. Protect `master`, integrate through `develop`, verify before merging, and leave the repository and remote in a clear final state.

## Execution contract

1. Read `AGENTS.md` and inspect Git state before changing files.
2. Select and read the exact playbook below.
3. Post a checklist for that playbook and execute it in order.
4. Mark a step N/A only when an observable predicate proves it absent, such as no remote, no CI config, no formatter, or no testable behavior.
5. Finish only after every applicable check passes and all authorized remote work is pushed. When work remains local or awaits review, state exactly what remains and why.

| Change | Branch | Required playbook |
|---|---|---|
| Feature or non-urgent bug fix | `feature/<short-name>` from `develop` | `references/feature.md` |
| Urgent production hotfix | `hotfix/<version>` from `master` | `references/hotfix.md` |
| Release stabilization | `release/<version>` from `develop` | `references/release.md` |

Read the selected reference completely before branching.

## Load project context

`AGENTS.md` in the repository root is the project instruction and deep-reference file. Read it first or confirm that the harness already loaded it. Use its file reference, verified commands, architecture notes, and gotchas instead of rediscovering recorded context.

If `AGENTS.md` is missing or lacks the sections in `references/agents-md-template.md`, offer to generate or extend it by scanning the project once. If existing entries are stale, correct them in the task branch and report the discrepancy.

## Branching model

| Branch | Role | Created from | Merges into |
|---|---|---|---|
| `master` | Production code | — | — |
| `develop` | Integration | — | — |
| `feature/<short-name>` | Features and non-urgent fixes | `develop` | `develop` |
| `hotfix/<version>` | Urgent production fixes | `master` | `master` and `develop` |
| `release/<version>` | Release stabilization | `develop` | `master` and `develop` |

Rules:

- **Never commit directly to `master` or `develop`.**
- **Branch before touching any file.** If changes were made on a long-lived branch, stop, create the correct branch with the changes intact, then verify `git status`.
- Before creating any branch, run `git branch --show-current` and `git status`, update the base branch, and pull the latest base branch.
- All merges into `develop` and `master` use `--no-ff`.
- Every merge into `master` gets an annotated semver tag.
- Use short kebab-case feature names and version numbers for hotfix/release names.
- Split unrelated changes into separate branches.

If only `master` or `main` exists and `develop` is absent, ask before initializing Gitflow and pushing the new `develop` branch.

## Semver

- Feature → **minor**
- Hotfix / bug fix → **patch**
- Breaking change → **major**

Read the current version from the latest `master` tag or the version file recorded in `AGENTS.md`. Call out breaking changes during planning.

## Interaction, remotes, and CI

Use local merge mode by default. Ask only when a requirement or choice materially changes the result: ambiguous behavior, unrelated-work boundaries, Gitflow initialization, pre-existing uncommitted changes, destructive actions, intentionally conflicting edits, or an explicit choice between local merge and pull request mode.

- **No remote configured:** complete the workflow locally and state that nothing was pushed.
- **Pull request mode requested:** push the task branch, open a PR against the correct target, verify CI, report the link, and stop for review.
- **Protected target branch:** if direct push is rejected, switch to pull request mode; never bypass protection.
- **CI configured:** check the remote pipeline after pushing. Never merge into `develop` or `master` while the pipeline is red.
- **No CI configured:** mark the CI check N/A and continue after local verification.
- **Uncommitted changes before switching:** ask whether to stash, commit, or abort.

## Shared implementation rules

- Plan the change before editing. Ask about unresolved requirements; do not ask for confirmation of already explicit requirements.
- Use small Conventional Commits. Do not add a co-authorship trailer or AI attribution.
- Before every commit, inspect `git status` and the staged diff for secrets, credentials, large binaries, build artifacts, and editor/OS junk. If a secret is already committed, stop before pushing and tell the user to rotate it.
- Every feature gets tests. Every bug fix gets a regression test that fails without the fix.
- Run the full test suite plus configured lint/format checks. Never merge red.
- Update `README.md` when public behavior, setup, commands, or architecture changes.
- Update `AGENTS.md` for task-touched files, architecture/dependencies, verified reusable commands, and real gotchas. Do not invent a gotcha when none occurred.
- Update `CHANGELOG.md` under `## [Unreleased]` for code changes, using `references/release.md`.

## Definition of done

- [ ] Correct playbook and ordered checklist used
- [ ] Correct branch created before changes
- [ ] Code complete with no unintended TODOs or dead code
- [ ] Feature/regression tests added as required
- [ ] Full suite and configured lint/format checks pass
- [ ] `README.md`, `AGENTS.md`, and `CHANGELOG.md` updated when their observable predicates apply
- [ ] Conventional Commits used; no secrets, binaries, junk, or AI co-author trailers
- [ ] Feature branch synced with latest `develop` before the final merge; hotfix/release branches synced with their required bases
- [ ] Correct targets used: feature→develop; hotfix/release→master and develop
- [ ] `--no-ff` used; master merges tagged
- [ ] CI green when configured
- [ ] Authorized pushes verified, or local/review-only state reported precisely

## Guardrails

- Never force-push shared branches.
- Never rebase `master` or `develop`.
- Destructive operations: confirm with the user first and explain what will be lost.
- When any git command fails mid-workflow, including a merge conflict or push rejection, stop and resolve it deliberately before continuing.
- Resolve a merge conflict when intent is obvious, but show the resolution before pushing. Ask when both sides look intentional.
