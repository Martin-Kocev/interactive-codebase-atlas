# Interactive Codebase Atlas skills

Two portable Agent Skills for understanding repositories and shipping changes safely:

- **interactive-codebase-atlas** builds an evidence-backed, browser-based map of a codebase in a separate, untracked sibling directory.
- **gitflow-feature-workflow** runs features, hotfixes, and releases through strict Gitflow branches and verification gates.

The atlas is explicitly invoked. It does not activate for generic documentation requests, and it must never add a generated atlas to the repository being studied.

## Install

After publishing this repository to GitHub, replace `YOUR_GITHUB_USERNAME` in these commands:

```bash
npx skills add YOUR_GITHUB_USERNAME/interactive-codebase-atlas --skill interactive-codebase-atlas
npx skills add YOUR_GITHUB_USERNAME/interactive-codebase-atlas --skill gitflow-feature-workflow
```

Install both skills interactively:

```bash
npx skills add YOUR_GITHUB_USERNAME/interactive-codebase-atlas
```

Install the atlas globally for Codex without prompts:

```bash
npx skills add YOUR_GITHUB_USERNAME/interactive-codebase-atlas --skill interactive-codebase-atlas --global --agent codex --yes
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
└── gitflow-feature-workflow/
    ├── SKILL.md
    ├── agents/openai.yaml
    ├── references/
    └── scripts/
```

Each folder is self-contained. The `skills` CLI discovers valid `SKILL.md` files recursively and lets users select either skill with `--skill`.

## Validate

Node.js 20 or newer is recommended.

```bash
npm test
```

The test suite validates both skill packages, checks referenced resources, syntax-checks JavaScript, validates the atlas template, and runs its dependency-free data and progress tests. Browser interaction tests are included in the atlas template but require Playwright and are not part of the dependency-free repository check.

## Publish to GitHub and skills.sh

1. Create an empty public GitHub repository named `interactive-codebase-atlas`.
2. Add it as `origin` and push `master`, `develop`, and tags.
3. Run one of the install commands above against the public `OWNER/REPO` source.
4. The skill becomes eligible for skills.sh automatically after installations are reported by the CLI; there is no separate package upload.

Optional skills.sh badge after publication:

```markdown
[![skills.sh](https://skills.sh/b/OWNER/interactive-codebase-atlas)](https://skills.sh/OWNER/interactive-codebase-atlas)
```

## License

MIT. See [LICENSE](LICENSE).
