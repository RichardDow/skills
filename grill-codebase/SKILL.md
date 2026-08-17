---
name: grill-codebase
description: Answer relentless questions about a codebase, grounded in the living module docs first, then verified against real frontend/backend code. Use when the user wants to interrogate/grill the codebase, ask how a module works, understand a domain capability, or mentions "grill the codebase", "ask about the code", "how does X work".
---

# Grill the codebase

The user fires questions at the codebase. You answer — but ground every answer in the
living module docs FIRST, then verify against real code before speaking. Cite `file:line`.
Stay in a loop: keep taking questions until the user stops.

## Where things are

Resolve these before the first answer, and never hardcode them.

- **The docs vault.** Walk up from the working directory for a `docs/modules/`; the
  vault often sits beside the code repos rather than inside one. Fall back to a
  location recorded in project state, and ask only if neither answers.
- **Module docs**: `modules/<slug>/` — `index.md` (door), `NN-<slug>.md` parts,
  `problems.md`, `fe-architecture/`, `be-architecture/`.
- **Map**: `modules/MODULE_MAP.md` — slug → frontend homes + backend homes, each
  relative to its code repo's `src/`.
- **Freshness**: `modules/STATUS.md` — per-module `FE behind` / `BE behind` commit
  counts.
- **The code repos.** The map names homes, not repos. Take *each* repo from the
  working directory when you are inside that one, and every other from the
  project's agent config or the sweep script the status table names as its
  generator — standing in one repo resolves only that repo.

## Answer loop — every question

1. **Resolve to module(s).** Read `MODULE_MAP.md`, map the question to one or more slugs and grab their FE/BE homes. If ambiguous, name the candidates and pick the most likely; don't ask unless truly stuck.
2. **Read the docs.** Open `modules/<slug>/index.md` + the relevant numbered part + `problems.md`. These are the map, not the territory.
3. **Verify against code.** Open the FE/BE homes named in the map and confirm the docs' claims against real source. Never answer from docs alone.
4. **Answer with cites.** Lead with the direct answer, back it with `path:line` for both doc and code. Pull in relevant open problems from `problems.md` when they bear on the answer.

## Flag drift — do not skip

Code is ground truth. When a doc claim contradicts the code, answer from the **code** and
call out the drift explicitly:

```
A: quotes recalculates margin on the client. src/store/Quote.js:212

⚠ DRIFT: modules/quotes/02-pricing.md:40 says margin is server-only —
   stale. Contradicted by Quote.js:212.
```

Check `STATUS.md` for the module: if `FE behind` / `BE behind` > 0, treat that module's
docs as suspect up front and lean harder on code.

## Style

- Terse, direct, technical. No preamble, no "great question".
- One question at a time; wait for the next. This is a grilling — the user drives.
- Volunteer the adjacent module or known problem when it sharpens the answer, but don't sprawl.
- If docs for a module are missing/unmigrated (no frontmatter homes, `—` in STATUS), say so and answer from code alone.

## Ending the session

The user ends it. There is no design tree to exhaust here, so never declare the session over on
your own and never ask whether the user is finished — answer the question and wait for the next one.

Close when the user calls stop. Close with exactly this shape:

````
---
## Grilling complete

**Answered**
- <one line per question, with the `path:line` that settled it>

**Drift flagged**
- <one line per doc claim the code contradicted, with both paths>

**Open**
- <one line per question you could not answer, or answered only in part>
---
````

Drop a heading when its list is empty. Keep each line to the fact and its cite. Do not restate the
reasoning, do not re-answer a question, and do not suggest a next skill.

The ledger stays in the terminal. Drift found here does not get written into the docs from this
skill — `document-module` recheck holds the verification bar and owns that edit.
