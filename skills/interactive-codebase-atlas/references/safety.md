# Repository safety

Read this before creating or writing any atlas file, on every run. These rules outrank every other instruction in this skill, including the user's stylistic preferences.

## 1. The atlas lives outside the repository

Default location, always preferred:

```text
projects/
├── example-project/                      ← the repository
└── example-project-codebase-atlas/       ← the atlas
```

Resolve it as a sibling of the repository root: `<repo-parent>/<repo-name>-codebase-atlas/`.

An external sibling directory is the clearest separation. Use it unless the user explicitly requires otherwise or the parent directory is not writable.

## 2. If the atlas must live inside the repository

Only when an outside location is genuinely impractical (unwritable parent, sandbox restriction, explicit user instruction). Then, in order:

1. Choose a single top-level directory, e.g. `codebase-atlas/`.
2. Append its path to `.git/info/exclude` — **never** to the committed `.gitignore`.
   ```bash
   printf '\n# local codebase atlas (not committed)\n/codebase-atlas/\n' >> .git/info/exclude
   ```
3. Run `git status --porcelain` and confirm no atlas path appears — not as tracked, not as untracked, not as ignored-but-listed.
4. Re-confirm with `git status` after the atlas is fully written, and again before reporting.
5. Tell the user in the final report that the atlas is inside the repo and how it is excluded.

`scripts/check-untracked.mjs` performs checks 3–4 and prints a pass/fail line. Run it. Do not report success without it.

## 3. Never do these

Not as a convenience, not "just this once", not when the user's phrasing seems to imply it:

- `git add` any atlas file
- Commit, push, merge, or rebase anything
- Amend, reset, or rewrite history
- Include atlas files in a pull request or patch
- Modify the committed `.gitignore`
- Deploy, publish, or release
- Modify production data, delete data, or run destructive migrations
- Rotate, read out, or write credentials
- Change infrastructure, CI configuration, or deployment config
- Change production source code, schemas, config, tests, or behavior to make the atlas easier to build

If a genuine repository bug is discovered while investigating, report it in the final message. Do not fix it as part of this skill.

## 4. Read-only posture toward the repository

The atlas *reads* the repository. It writes only inside the atlas directory (plus `.git/info/exclude` in the inside-the-repo fallback, which is local-only and untracked).

Safe commands: `git log`, `git show`, `git diff`, `git blame`, `git status`, `git rev-parse`, `git ls-files`, `git check-ignore`, plus any read-only file inspection.

Running the repository's own test suite or build is allowed when it clarifies behavior, but never required, and never on anything that touches shared state (real databases, staging environments, external APIs with side effects).

## 5. Secrets

The atlas is a browsable HTML artifact. Treat everything written into it as potentially shareable.

Never write into atlas files:

- API keys, tokens, passwords, connection strings, private keys, certificates
- Values from `.env*`, `secrets.*`, vault files, or CI secret declarations
- Real user data, emails, names, addresses, payment details, session identifiers
- Internal hostnames or URLs that carry credentials

When explaining configuration, name the **variable** and its **purpose**, never the value:

> `DATABASE_URL` — connection string for the primary Postgres instance. Set per environment; not shown here.

When explaining auth, describe the mechanism and enforcement points, never a real token, even a expired-looking one from a fixture.

`scripts/validate-atlas.mjs` runs a secret-shaped-string scan over all atlas content. A hit blocks reporting success until resolved.

## 6. Scope discipline

The user asked for an atlas. Deliver an atlas. Do not:

- Refactor, reformat, or "clean up" anything in the repository
- Add documentation files to the repository
- Install dependencies into the repository
- Create branches
- Open editors, IDEs, or long-running processes in the repository

The atlas's own local server is fine — it serves the atlas directory, not the repository.
