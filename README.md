# Agent Skills

[![skills.sh](https://skills.sh/b/Martin-Kocev/skills)](https://skills.sh/Martin-Kocev/skills)

A collection of portable, composable Agent Skills for codebase exploration, disciplined delivery, and multi-agent coordination.

## Skills

| Skill | What it does | Install |
|---|---|---|
| [interactive-codebase-atlas](skills/interactive-codebase-atlas/) | Builds an evidence-backed, browser-based map of a codebase in a separate, untracked sibling directory. | `npx skills@latest add Martin-Kocev/skills --skill interactive-codebase-atlas` |
| [gitflow-feature-workflow](skills/gitflow-feature-workflow/) | Runs features, hotfixes, and releases through strict Gitflow branches and verification gates. | `npx skills@latest add Martin-Kocev/skills --skill gitflow-feature-workflow` |
| [orchestrator](skills/orchestrator/) | Coordinates separable work across specialized subagents and independently verifies the integrated result. | `npx skills@latest add Martin-Kocev/skills --skill orchestrator` |

Each skill is self-contained and can be installed independently. `interactive-codebase-atlas` is explicitly invoked and never adds a generated atlas to the repository being studied.

## Install

Install any skill directly from the public GitHub repository:

```bash
npx skills@latest add Martin-Kocev/skills --skill interactive-codebase-atlas
npx skills@latest add Martin-Kocev/skills --skill gitflow-feature-workflow
npx skills@latest add Martin-Kocev/skills --skill orchestrator
```

Browse and select from the full collection interactively:

```bash
npx skills@latest add Martin-Kocev/skills
```

Install the atlas globally for Codex without prompts:

```bash
npx skills@latest add Martin-Kocev/skills --skill interactive-codebase-atlas --global --agent codex --yes
```

Preview what the CLI discovers before publishing:

```bash
npx skills add . --list
```

## Use

```text
Use $interactive-codebase-atlas to create an island-based atlas for this repository.
```

```text
Use $gitflow-feature-workflow to implement this change through the correct Gitflow lifecycle.
```

```text
Use $orchestrator to coordinate this work across specialized subagents and verify the result.
```

The atlas defaults to `../<repo-name>-codebase-atlas/`. Generated atlas files are output artifacts, not part of the repository being analyzed.

## Repository layout

```text
skills/
├── interactive-codebase-atlas/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── references/
│   ├── scripts/
│   └── templates/
├── gitflow-feature-workflow/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── references/
│   └── scripts/
└── orchestrator/
    ├── SKILL.md
    └── agents/openai.yaml
```

Each folder is self-contained. The `skills` CLI discovers valid `SKILL.md` files recursively and presents each skill as a separate installable entry.

## Validate

Node.js 20 or newer is recommended.

```bash
npm test
```

The test suite validates every skill package, checks referenced resources, syntax-checks JavaScript, validates the atlas template, and runs its dependency-free data and progress tests. Browser interaction tests are included in the atlas template but require Playwright and are not part of the dependency-free repository check.

## Published source and skills.sh

The canonical public repository is [Martin-Kocev/skills](https://github.com/Martin-Kocev/skills). Skills become eligible for skills.sh automatically after installations are reported by the CLI; there is no separate package upload.

## License

MIT. See [LICENSE](LICENSE).
