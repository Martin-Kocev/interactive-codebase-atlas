# Feature and bugfix playbook

Use this playbook for features and non-urgent bug fixes. Both branch from `develop` and merge back into `develop`.

## 1. Plan

Read `AGENTS.md`, restate the requested outcome, list affected files, identify risks, and resolve genuinely ambiguous requirements. Do not pause for requirements the user already made explicit.

Inspect the repository before branching:

```bash
git branch --show-current
git status
git remote
```

If uncommitted work exists, ask whether to stash, commit, or abort. If unrelated changes are requested, split them into separate branches.

## 2. Branch before changes

Update `develop`, then create and publish the task branch when a remote exists:

```bash
git checkout develop
git pull
git checkout -b feature/<short-name>
git push -u origin feature/<short-name>
```

When no remote exists, omit both push commands and complete locally. Verify the active branch before editing:

```bash
git branch --show-current
git status
```

## 3. Implement and commit

Implement in small logical units with Conventional Commits:

```text
feat: add avatar upload endpoint
fix: handle empty CSV rows in importer
docs: document avatar size limits
```

Do not add a co-authorship trailer or AI attribution.

Before every commit, inspect `git status` and the staged diff. Do not commit secrets, `.env` files, credentials, private certificates, large binaries, build artifacts, or editor/OS junk. Add generated or local-only files to `.gitignore`. If a secret is already committed, stop before pushing and tell the user to rotate it.

## 4. Test

Every feature gets tests. Every bug fix gets a regression test that fails without the fix.

Use the commands recorded in `AGENTS.md` or the repository configuration. Run:

1. The focused new or regression test.
2. The full test suite.
3. Configured lint and format checks.

Never merge red. If an unrelated pre-existing failure remains, report it and ask how to proceed.

## 5. Document

Before merge:

- Update `README.md` when public behavior, setup, commands, or architecture changed.
- Update `AGENTS.md` for task-touched files, architecture or dependency changes, reusable commands that actually succeeded, and real gotchas.
- Add the code change under `## [Unreleased]` in `CHANGELOG.md` using `references/release.md`.

When an observable predicate does not apply, mark it N/A in the checklist instead of inventing content.

## 6. Sync and verify

Walk the definition of done in `SKILL.md`, then sync the task branch with the latest `develop`:

```bash
git checkout develop
git pull
git checkout feature/<short-name>
git merge develop
```

Resolve conflicts deliberately. Rerun the full suite after any conflict resolution.

## 7. Finish

### Local merge mode (default)

With a remote:

```bash
git push origin feature/<short-name>
git checkout develop
git merge --no-ff feature/<short-name>
git push origin develop
git branch -d feature/<short-name>
git push origin --delete feature/<short-name>
```

Without a remote, perform the checkout, `--no-ff` merge, and safe local branch deletion only. State clearly that nothing was pushed.

Confirm each command succeeded before continuing. A rejected push is not completion: resolve the divergence or switch to pull request mode when branch protection caused the rejection.

### Pull request mode

Push the branch and open a PR targeting `develop`:

```bash
gh pr create --base develop
```

Verify CI is green, report the PR link, and stop for user review. Do not merge or delete the branch.

## 8. Report

Summarize the outcome, changed files, commits, focused and full test results, lint/format results, documentation updates, CI state, and exactly what was pushed or left local.
