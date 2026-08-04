# Explain mode

Answer a focused question about the codebase using the atlas plus repository evidence. Explain mode **answers**; it does not rebuild the atlas. It may add a small amount of content when the answer clearly belongs in the atlas and the user wants it kept.

## Procedure

1. **Read the atlas first** — `data/atlas.json`. It is a pre-verified index; use it before re-reading the repository.
2. **Check currency.** If the atlas is behind `HEAD`, say so in one line before answering, and verify anything load-bearing against the current code.
3. **Verify against the repository.** Never answer from the atlas alone for anything the user might act on. Open the files the atlas cites and confirm they still say what it claims.
4. **Fill gaps by investigating** (`references/investigation.md`) when the atlas does not cover the question.
5. **Answer at the requested depth** — default `balanced`.
6. **Cite sources.** Every substantive claim gets `path:line` or `path` + symbol.
7. **Carry the confidence level through.** If the atlas says `inferred`, the answer says so too.
8. **Offer the atlas link.** Name the section the reader can open to explore further, and — if the answer revealed a genuine gap — offer to add it in update mode.

## Depth levels

**Simple** — plain language, one analogy if it helps, no jargon without a gloss. 3–6 sentences.

**Balanced** (default) — accurate architecture with real names and file references, still short paragraphs. Names the mechanism, the enforcement point, and the failure mode.

**Deep dive** — adds short code excerpts, edge cases, invariants, and the tests that pin the behavior. Still no full-file dumps.

## Question shapes

**"How does X work?"** (auth, caching, uploads)
Answer as a chain: entry point → each hop with file and symbol → where state changes → what the caller sees. End with where enforcement or validation actually happens, which is often not where a reader expects.

**"What happens when a user does X?"**
Walk the workflow. If the atlas has it, reuse the traced steps and point at the simulator. If not, trace it now and offer to add it.

**"Where should I implement this feature?"**
Give a starting file, the other layers that will need changes, the tests to update, applicable project instructions from `AGENTS.md`/`CONTRIBUTING.md`, and any area to leave alone. State a confidence level. If the codebase has an existing analogous feature, point at it — the best answer is usually "do what `X` does".

**"Why does this exist?"**
Use the atlas's `why` entries, then check comments, tests, and — selectively — `git log`/`git blame` for the introducing commit. Classify the answer as `verified`, `inferred`, or `unknown`. **An honest "the repository does not say, but here is what the structure implies" is a better answer than a confident invention.**

**"What changed since the atlas was last updated?"**
`git log --oneline <recorded>..HEAD`, grouped by meaning, mapped onto affected atlas sections. Offer update mode.

**"Which parts have I not explored yet?"**
When the atlas is served by `scripts/serve-atlas.mjs`, progress lives in the local `progress/progress.json` file and may be read without changing it. For a `file://` or static-only atlas, progress exists only in browser `localStorage`; use *Review unfinished* or ask the reader to paste the progress export. Never claim to know browser-only state you did not receive.

## Scoped-relevance requests

For *"show me only the parts relevant to implementing [FEATURE]"*:

1. Identify the touched layers from the feature description.
2. Select the components, workflows, entities, and playbooks that intersect them.
3. Present a short ordered reading list — 5–12 files with a one-line reason each, in the order they should be read.
4. Name the tests that will need to change.
5. Flag anything adjacent that looks similar but should not be touched.
6. Offer to open the atlas filtered to those files (the explorer's "files relevant to a selected feature" toggle).

Keep it a *path*, not an inventory. The value is the ordering and the reasons.

## Constraints

- No secrets, credentials, tokens, or personal data in the answer — same rule as the atlas.
- No full-file pastes. Short excerpts only.
- Do not rewrite the atlas as a side effect of answering. If the answer should be captured, say so and let the user choose update mode.
- If the question is about behavior the repository does not determine (runtime config, external service behavior), say that plainly rather than guessing.
