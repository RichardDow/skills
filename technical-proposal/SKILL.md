---
name: technical-proposal
description: Draft a technical proposal as a linked multi-file doc set (problem, current state, hypothesis, implementation, cost/benefit, appendix) plus a one-page summary for share-out. Use when the user wants to write a technical proposal, RFC, design doc, or pitch a change/migration, or mentions "proposal", "RFC", "design doc", or "make the case for X".
---

# Technical Proposal

Produce a forward-looking proposal: pitch a change and defend it. Structure follows
`docs/architecture/platform/` — one file per *lens*, `SUMMARY.md` as the door.
Prose style: follow `../document-module/STYLE.md` (prose-first — structure earns its place;
folded depth; subject-only inline links). A proposal is an argument: make the case in
paragraphs. Reserve tables for a comparison matrix and the decisions log; avoid bullet dumps.

## Output shape

Write to `docs/proposals/<slug>/` (ask for slug; kebab-case the topic). Six files:

| File | Contains | Your material |
|---|---|---|
| `SUMMARY.md` | one-page entry: problem-in-one-line, "today" diagram, the proposal, decisions-log table, links to every other file | summary/index |
| `PROBLEM.md` | problem statement **linked to registered problem IDs** in the living doc + current state | prob statement, current state |
| `PROPOSAL.md` | the hypothesis (what we do + why it fixes it) + pros/cons table | hypothesis, pros/cons |
| `IMPLEMENTATION.md` | doer-level notes, ideas, stages, open risks | impl notes/ideas |
| `COST.md` | costs & benefits, estimates flagged as estimates | costs & benefits |
| `APPENDIX.md` | references, evidence, fact-check, provenance | references, appendix |

Small proposal (<1 page total)? Collapse to a single `PROPOSAL.md` with these as `##`
headings. Ask if unsure.

## Ground truth first — the living doc is upstream

A proposal must sit on documented ground truth. Before drafting, ensure
`modules/<area>/` exists — the living record of that module: behaviors + a
`Key landmarks` table (`file:line`) + a `problems.md` registry (stable IDs
`<area>-P1…`, status `open → proposed → solved`).

- **Missing** → build it first via the `document-module` skill (build mode), then flow in.
- **Present** → run `document-module` in **recheck mode** (symbol-anchored drift + rescan)
  before drafting, so the proposal never links stale truth.
- The proposal's problem statement **links registered problem IDs** (`[[<area>#P3]]`);
  the registry back-links the proposal (bidirectional).
- **Write-back**: if drafting surfaces a problem not yet registered, add it to the
  module's `problems.md` first (new `P#`), *then* link it. Never hold an orphan problem.

## Process

1. **Interview first — one question at a time**, giving your recommended answer each
   time (grill-me style). Walk the tree: problem → evidence for current state →
   hypothesis → tradeoffs → cost → implementation risks. If a question is answerable
   from the codebase, go read it instead of asking.
2. **Verify claims against source.** Mark load-bearing facts `✅` with a
   `file:line` citation. Anything unverified → mark it and log in APPENDIX open questions.
3. **Write the files.** Use `TEMPLATES.md` skeletons. SUMMARY last (it indexes the rest).
4. **Offer a presentation artifact** — single-page share-out (diagrams + the pitch) via
   the Artifact tool. Only if the user wants it.

## House style (from platform/ + checklist/ docs)

- Every file opens with a `> TL;DR` blockquote + links to sibling files.
- Cross-link siblings by relative path; `SUMMARY.md` links to all.
- Diagrams in mermaid: a "today" flow (mark waste red) and a "tomorrow" flow.
- Decisions log = markdown table `# | Decision | Where`, newest reasoning wins.
- Pre-empt rebuttals: state the obvious objection, then answer it.
- Estimates: label loudly (`⚠️ ESTIMATE`) and say what would confirm them.

See [TEMPLATES.md](TEMPLATES.md) for per-file skeletons.
