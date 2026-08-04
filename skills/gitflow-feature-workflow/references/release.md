# Release playbook

Releases stabilize what's on `develop` and promote it to production. Only bugfixes, version bumps, and release metadata are allowed on a release branch — no new features (they wait for the next release).

```bash
# 1. Decide the version per the semver rules in SKILL.md
#    (features since last release → minor, etc.)
git checkout develop && git pull
git checkout -b release/1.4.0
git push -u origin release/1.4.0   # publish the branch before making changes

# 2. Only now touch files: bump the version file; finalize CHANGELOG.md: move Unreleased entries
#    under a new "## [1.4.0] - YYYY-MM-DD" heading (format below).
#    Commit: chore: prepare release 1.4.0

# 3. Run the full test suite and lint. Fix bugs directly on this branch
#    (fix: commits only). Never merge red.

# 4. Merge into master and tag
git checkout master && git pull
git merge --no-ff release/1.4.0
git tag -a v1.4.0 -m "Release 1.4.0"
git push origin master --follow-tags

# 5. Merge back into develop (carries release-branch bugfixes + version bump)
git checkout develop && git pull
git merge --no-ff release/1.4.0
git push origin develop

# 6. Delete the branch (local and remote) and summarize
git branch -d release/1.4.0
git push origin --delete release/1.4.0
```

Verify both pushes (master with tags, develop) succeeded before reporting the release as done — unpushed work means the task is not finished.

The definition-of-done checklist and the "Remotes, merge mode, and CI" rules from SKILL.md apply (no remote → local-only with a clear note; protected branches → pull request mode; CI must be green before merging).

## CHANGELOG.md format (Keep a Changelog)

Maintain `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com) format. Features merged to develop add entries under `## [Unreleased]`; releases move that block under a version heading; hotfixes add a new version heading directly.

```markdown
# Changelog

## [Unreleased]

## [1.4.0] - 2026-07-13
### Added
- CSV export for reports

### Fixed
- Empty rows no longer crash the importer

## [1.3.1] - 2026-07-01
### Fixed
- Hotfix: session cookies expiring immediately
```

Use the standard categories: Added, Changed, Deprecated, Removed, Fixed, Security.
