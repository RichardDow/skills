---
name: technical-proposal
description: Draft a technical proposal as a linked multi-file doc set (problem, current state, hypothesis, implementation, cost/benefit, appendix) plus a one-page summary for share-out. Use when the user wants to write a technical proposal, RFC, design doc, or pitch a change/migration, or mentions "proposal", "RFC", "design doc", or "make the case for X".
group: planning-design
---

# Technical Proposal

Produce a forward-looking proposal: pitch a change, then defend it. One file
per *lens*, with `SUMMARY.md` as the door — see **Output shape** below for
the full layout.

Prose style follows `../document-module/STYLE.md`: prose-first, structure
earns its place, depth stays inline and always visible, links go inline
only when they're the sentence's subject. A proposal is an argument — make
the case in paragraphs. Reserve tables for the comparison matrix and the
decisions log. Avoid bullet dumps.

## Location

Write to `<vault>/proposals/<slug>/` (ask for the slug; kebab-case the
topic). Resolve `<vault>` the same way
[plan-in-docs](../plan-in-docs/SKILL.md#location) does: look up which vault
the repo being worked in maps to, in the user's shared repo map. Never
infer a vault from a repo-local `docs/` folder. No mapping recorded yet?
Ask which vault it belongs to.

## Frontmatter

`SUMMARY.md` opens with frontmatter:

```md
---
title: Auto-quote every port pair
date: 2026-07-06
status: draft
problems: [shipments#P3, tracking#P1]
slack: https://<workspace>.slack.com/archives/C0000000/p1234567890
jira: https://<org>.atlassian.net/browse/PROJ-1234
---
```

- `title`/`date`: same fields plan-in-docs uses.
- `status`: `draft` (being written) → `active` (pitched, awaiting a
  decision) → `done` (accepted) or `abandoned` (rejected or shelved).
  - `done`: once the accepted work is planned, add a `plan:` key pointing
    at that plan-in-docs plan — the same graduation path an idea already
    has to a plan.
  - `abandoned`: add a one-line `**Abandoned:** reason` under the
    frontmatter, the same convention plan-in-docs uses.
- Link keys (`slack:`/`jira:`/`pr:`/`figma:`): flat keys, one URL each,
  same convention as plan-in-docs. Omit any key with no link. Use a `2`
  suffix for a second link of the same kind.
- `problems:` — a flat list mirroring `PROBLEM.md`'s `[[area#P3]]` links.
  This lets a future sweep find every proposal touching a module without
  grepping file bodies.

Never delete a proposal. Abandon it in place — the frontmatter carries the
lifecycle, so the file itself is the record.

## Output shape

Six files:

| File | Contains | Your material |
|---|---|---|
| `SUMMARY.md` | one-page entry: problem-in-one-line, "today" diagram, the proposal, decisions-log table, links to every other file | summary/index |
| `PROBLEM.md` | problem statement **linked to registered problem IDs** in the living doc, plus current state | problem statement, current state |
| `PROPOSAL.md` | the hypothesis (what we do, why it fixes the problem) plus a pros/cons table | hypothesis, pros/cons |
| `IMPLEMENTATION.md` | doer-level notes, ideas, stages, open risks | implementation notes and ideas |
| `COST.md` | costs and benefits, estimates flagged as estimates | costs and benefits |
| `APPENDIX.md` | references, evidence, fact-check, provenance | references, appendix |

Small proposal (under one page total)? Collapse to a single `PROPOSAL.md`
with these as `##` headings. Ask if unsure.

## Ground truth first — the living doc is upstream

A proposal must sit on documented ground truth. Before drafting, confirm
`modules/<area>/` exists — the living record of that module: behaviors,
a `Key landmarks` table (symbol-anchored), and a `problems.md` registry
(stable IDs `<area>-P1…`, status `open → proposed → solved`).

- **Missing** → build it first via the `document-module` skill (build
  mode), then flow in.
- **Present** → run `document-module` in **recheck mode**
  (symbol-anchored drift plus a rescan) before drafting. This keeps the
  proposal from linking stale truth.
- The proposal's problem statement **links registered problem IDs**
  (`[[<area>#P3]]`). The registry back-links the proposal — the link runs
  both ways.
- **Write-back**: when drafting surfaces a problem not yet registered,
  add it to the module's `problems.md` first (a new `P#`), then link it.
  Never hold an orphan problem.

## Process

1. **Interview first.** Read [grill-me](../grill-me/SKILL.md) and follow
   it — that file is the only copy of the interview method and of the
   rule for when an interview may end. Do not work from a summary of it.
   The tree for a proposal is: problem → evidence for current state →
   hypothesis → tradeoffs → cost → implementation risks. A proposal adds
   seven required rows to the closing check (below). Rows it leaves
   unmet go to `APPENDIX.md`'s open questions, marked blocking or
   non-blocking.
2. **Verify claims against source.** Mark load-bearing facts `✅` with a
   symbol citation — never a line number, per
   `document-module/STYLE.md`. Mark anything unverified, and log it in
   `APPENDIX.md`'s open questions.
3. **Write the files.** Use `TEMPLATES.md` skeletons. Write `SUMMARY.md`
   last — it indexes the rest.
4. **Offer a presentation artifact** — a single-page share-out (diagrams
   plus the pitch) via the Artifact tool. Only if the user wants it.

## Closing check — seven required rows

1. Every load-bearing claim in `PROBLEM.md`/`COST.md` is marked ✅
   (verified from source) or explicitly flagged unverified.
2. Every problem `PROBLEM.md` cites exists in the module's `problems.md`
   registry — no orphan `[[area#P3]]` link.
3. Every cost/benefit figure in `COST.md` traces to a named measurement,
   or is flagged `⚠️ ESTIMATE` with what would confirm it.
4. The obvious rebuttal is stated and answered, and every rejected
   alternative is named.
5. No two Pros/cons or Decisions-log rows state conflicting claims.
6. `document-module` ground truth was actually rechecked this session,
   not assumed current.
7. Every Open questions row is marked blocking or non-blocking.

Print the table with the evidence for each row before writing anything —
which source, which read, which decision settled it — the same way
plan-in-docs prints its own closing check. This lets the user attack a
row before anything is written. An unmet row removes your authority to
close; it never removes the user's right to stop. When the user stops
with rows unmet, write the files anyway and carry every unmet row into
`APPENDIX.md`'s open questions.

## Other verbs

- **list**: `grep -r "^status:" <vault>/proposals --include="*.md"`,
  grouped by status. Show path and title.
- **resume `<proposal>`**: read the file. Report its current status and
  every open question in `APPENDIX.md` with no resolution yet. A
  proposal has no `Steps` checklist — Open questions plays that role
  instead.
- **update `<proposal>`**: a change to an already-written proposal
  follows the same strict process as writing one. Grill the delta, print
  the closing check for whatever it touches, then edit the files. Never
  make a direct edit to a proposal file outside this process.

## House style

- Every file opens with a `> TL;DR` blockquote plus links to sibling
  files.
- Cross-link siblings by relative path. `SUMMARY.md` links to all of
  them.
- Diagrams in mermaid: a "today" flow (mark waste red) and a "tomorrow"
  flow.
- Decisions log is a markdown table: `# | Decision | Where`. Newest
  reasoning wins.
- Pre-empt rebuttals: state the obvious objection, then answer it.
- Estimates: label loudly (`⚠️ ESTIMATE`), and say what would confirm
  them.

See [TEMPLATES.md](TEMPLATES.md) for per-file skeletons.
