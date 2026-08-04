# Interactive Codebase Atlas skills

## Project overview

This repository distributes two self-contained Agent Skills. `interactive-codebase-atlas` creates evidence-backed, browser-based explanations of unfamiliar repositories while keeping every generated atlas outside the analyzed repository's Git history. `gitflow-feature-workflow` supplies the branching and release discipline used to maintain this repository and other Gitflow projects.

Consumers install either skill through the open `skills` CLI. The public source of truth is the content under `skills/`; repository-level files document, validate, and release those packages.

## Tech stack

- Markdown and YAML skill definitions
- Dependency-free Node.js ESM scripts and tests
- Static HTML, CSS, JavaScript, and JSON atlas templates
- Gitflow with `master`, `develop`, feature, release, and hotfix branches

## Common commands

| Task | Command | Notes |
|---|---|---|
| Run full validation | `npm test` | Run from the repository root; no install step |
| Validate repository packages | `node scripts/validate-repository.mjs` | Checks metadata and bundled resource references |
| Validate atlas template | `node skills/interactive-codebase-atlas/scripts/validate-atlas.mjs skills/interactive-codebase-atlas/templates --no-write` | Structural validation without regenerating the bundle |
| Run atlas template tests | `node --test skills/interactive-codebase-atlas/templates/tests/atlas.data.test.mjs skills/interactive-codebase-atlas/templates/tests/progress.api.test.mjs` | Dependency-free tests |
| List locally discoverable skills | `npx skills add . --list` | Uses the external skills CLI; may need network access on first run |

## Project conventions

- Use `gitflow-feature-workflow` for every repository change.
- Never commit directly to `master` or `develop`; merge long-lived branches with `--no-ff`.
- Keep each skill self-contained under `skills/<skill-name>/`.
- Keep `SKILL.md` frontmatter limited to `name` and `description`.
- Update root documentation for public installation or layout changes.
- Generated codebase atlases are never stored in this repository as examples or fixtures.
- Do not add dependencies unless dependency-free validation can no longer cover a demonstrated requirement.

## Architecture notes

The root repository is a distribution shell. The skills CLI recursively discovers the two `SKILL.md` entrypoints. Each entrypoint progressively discloses its own `references/`, while deterministic work lives in `scripts/` and reusable atlas output files live in `templates/`.

The repository validator checks package identity and every local resource path mentioned by the skill entrypoints. The atlas's own validator and Node tests then exercise the reusable static template independently.

## File reference

| Path | Purpose | Key exports / dependencies |
|---|---|---|
| `skills/interactive-codebase-atlas/SKILL.md` | Atlas activation and execution contract | References atlas playbooks, scripts, and templates |
| `skills/interactive-codebase-atlas/references/safety.md` | Non-negotiable Git isolation and secret-handling rules | Must be read before creating an atlas |
| `skills/interactive-codebase-atlas/scripts/validate-atlas.mjs` | Validates generated atlas structure and content | Node.js standard library |
| `skills/interactive-codebase-atlas/templates/` | Zero-dependency static atlas starting point | HTML, CSS, JS, JSON, tests |
| `skills/gitflow-feature-workflow/SKILL.md` | Gitflow routing and definition of done | References feature, release, and hotfix playbooks |
| `scripts/validate-repository.mjs` | Repository-wide skill package validation | Node.js standard library |
| `.github/workflows/validate.yml` | Public CI validation | Runs `npm test` on Node.js 20 |

## Gotchas and lessons learned

- **2026-08-04** — The skill-creator metadata generator requires PyYAML. Preserve already-valid `agents/openai.yaml` when that dependency is unavailable, and use the dependency-free repository validator for CI.
- **2026-08-04** — The atlas safety rules apply to generated atlas output. The distributable skill package itself belongs in this repository; generated atlases never do.
