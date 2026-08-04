# Hotfix playbook

Hotfixes fix urgent production bugs. They branch from `master` (not `develop` — develop may contain unreleased work you must not ship) and must land in **both** long-lived branches. The dual merge is the step most often forgotten; forgetting it means the fix silently disappears in the next release.

```bash
# 1. Branch from up-to-date master; version = current + patch bump
git checkout master && git pull
git checkout -b hotfix/1.3.1
git push -u origin hotfix/1.3.1   # publish the branch before making changes

# 2. Only now touch code: fix the bug, add a regression test, run the full suite
#    Commit with Conventional Commits (fix: ...)

# 3. Bump the version in the project's version file; update CHANGELOG.md
#    with a new version heading (see references/release.md for the format).
#    Commit: chore: bump version to 1.3.1

# 4. Merge into master and tag
git checkout master && git pull
git merge --no-ff hotfix/1.3.1
git tag -a v1.3.1 -m "Hotfix 1.3.1: <one-line summary>"
git push origin master --follow-tags

# 5. Merge into develop as well — NOT optional
git checkout develop && git pull
git merge --no-ff hotfix/1.3.1
git push origin develop

# 6. Delete the branch (local and remote) and summarize
git branch -d hotfix/1.3.1
git push origin --delete hotfix/1.3.1
```

Verify both pushes (master with tags, develop) succeeded before reporting the hotfix as done — unpushed work means the task is not finished.

The definition-of-done checklist and the "Remotes, merge mode, and CI" rules from SKILL.md apply (no remote → local-only with a clear note; protected branches → pull request mode; CI must be green before merging) (documentation updates included).

**Exception:** if an active `release/*` branch exists, merge the hotfix into it instead of `develop` (the release branch will carry it into develop) — mention this to the user.
