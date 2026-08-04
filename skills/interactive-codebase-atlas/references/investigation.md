# Repository investigation

The atlas is only as good as this phase. Its job is to build a verified mental model — not to list files.

## Order of operations

1. **Instruction files first.** `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.cursorrules`, `.github/copilot-instructions.md`, and any nested per-package equivalents. **Repository-specific instructions outrank this skill's general guidance whenever they are stricter.** If `AGENTS.md` forbids something, obey it.
2. **Orientation.** Root `README`, `docs/`, existing architecture diagrams, ADRs (`docs/adr/`, `decisions/`), changelogs.
3. **Shape.** Workspace config (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`, `go.work`, Cargo workspace, Gradle settings, `pom.xml` modules), package manifests, lockfiles, language/runtime versions.
4. **Entry points.** `main`, `index`, `app`, `cmd/`, `bin/`, `Program.cs`, `wsgi.py`, framework conventions (Next.js `app/`, Rails `config/routes.rb`, Django `urls.py`, Spring `@SpringBootApplication`, Express `app.listen`).
5. **Then everything below**, guided by what actually exists.

## What to look for

Each item is a *possibility*, not a requirement. Absence is information too — record it.

**Applications and services** — frontend apps, admin apps, mobile/desktop clients, backend services, APIs, gateways, workers, CLIs, cron/scheduled runners.

**Domain and logic** — business/domain modules, use cases, services, state machines, validators, policy objects, calculation cores.

**Data** — database schemas, ORM models, migrations, seeds, fixtures, query layers, repositories, caches, object storage, search indexes, read models.

**Communication** — HTTP routes/controllers, RPC/gRPC, GraphQL schemas and resolvers, server actions, WebSockets, server-sent events, message queues, event buses, webhooks (inbound and outbound), background jobs, polling loops, IPC.

**Access control** — authentication providers, session/token creation, middleware, guards, decorators, row-level security, roles and permission definitions, frontend route protection.

**Shared code** — shared packages, shared UI libraries, design systems, utility modules, generated clients, type/schema packages.

**Delivery** — build config, bundlers, Dockerfiles, compose files, IaC (Terraform, Pulumi, CDK, Helm, k8s manifests), CI workflows, release scripts, deployment config, environment matrices.

**Verification** — unit/integration/e2e tests, test helpers and factories, test databases, snapshot suites, linters, typecheckers, dev scripts, `Makefile`/`justfile`/`package.json` scripts.

## Verification rules

**Do not infer architecture from directory names.** A folder called `services/` may contain thin HTTP wrappers; a folder called `utils/` may contain the core domain rules. Open the files.

Verify each important relationship with at least one of:

- The actual import/require/dependency edge
- The route registration or handler binding
- The configuration that wires it
- A test that exercises the path end to end
- The script that runs it

**Trace, don't guess.** For each workflow you plan to document, follow the real call chain: UI event handler → request → route → handler → service → domain → persistence → response/event → UI update. Note the file and symbol at each hop. If the chain breaks (dynamic dispatch, DI container, event name resolved at runtime), say so and mark that hop `inferred`.

**Grep for the mechanism, not the vocabulary.** Search for `addEventListener`, `subscribe`, `emit`, `publish`, `enqueue`, `@Scheduled`, `cron`, `on(`, decorators, and framework-specific registration calls — not for the word "event".

## When documentation and implementation disagree

Do not silently resolve it.

1. Prefer the behavior verified in the implementation.
2. Record the conflicting documentation claim.
3. Reference both sources with paths.
4. Surface the conflict in the atlas as a visible `conflict` note on that item.
5. State whether the difference plausibly reflects outdated documentation, an aspirational design, or a real bug — and mark that judgment `inferred`.

Every conflict also goes into the final report.

## Using Git history for "why"

History is expensive. Use it **selectively**, for decisions that are important or confusing — not routinely, and never per line.

Worth a look:

- A module whose existence is non-obvious → `git log --diff-filter=A -- <path>` for the introducing commit and its message
- A defensive check that looks redundant → `git log -S'<snippet>' -- <path>` to find when and why it appeared
- A surprising layering choice → `git log --follow -- <path>` for a rename or extraction event
- A workaround with no comment → `git blame -L <start>,<end> -- <path>` then read that commit body

A commit message that explains intent, a referenced issue number, or a test added alongside the change promotes a claim to `verified`. Absence of history evidence keeps it `inferred` or `unknown`.

## Confidence classification

Apply to every claim, especially every "why".

| Level | Means | Requires |
|---|---|---|
| `verified` | Explicitly supported by evidence | A comment, test, doc, commit message, or directly observable behavior that states or demonstrates it |
| `inferred` | A reasonable conclusion from implementation | The code structure supports it, but nothing states it |
| `unknown` | The repository does not say | Show the question, show what is known, do not invent the answer |

**Never invent developer intent.** "This was probably done for performance" without evidence is `inferred` at best and usually `unknown`. An honest `unknown` with a good question is more useful — and more trustworthy — than a confident fabrication.

## Budgeting the investigation

Large repositories punish exhaustive reading. Allocate roughly:

- 20% — orientation and shape (instructions, manifests, entry points, routes list, schema list)
- 45% — tracing the 3–5 chosen workflows end to end
- 20% — the chosen subsystems, data model, and auth
- 15% — delivery, testing, glossary terms, and cross-checking conflicts

Stop reading a file the moment it stops changing your model. Depth on the chosen paths beats breadth across all paths.
