---
name: plan-in-docs
description: Write a plan document into the project's docs/plans/<YYYY-MM-DD>/<slug>.md, shaping it through a grill-me style interview first. Tracks lifecycle status (draft/active/done/abandoned). Use when the user says "/plan-in-docs", "write a plan", "plan this out", "save this as a plan", or wants to list or update existing plans.
---

# plan-in-docs

One plan = one markdown file under `docs/plans/<creation-date>/`, grouped by day.

Prose style: follow the project's documentation style guide where it has one.

## Location

- Target dir: `docs/plans/`. Find it by walking up from the working directory —
  the plans tree often sits beside the repos rather than inside one, so the
  nearest ancestor holding `docs/plans/` wins. Fall back to a location recorded
  in project state, and ask only if neither answers. `PLANS_DIR` env overrides
  all of it.
- Subdir per creation date: `docs/plans/$(date +%F)/` — plans made the same day share a dir. Create it if missing.
- Filename: short kebab-case slug of the plan title, e.g. `docs/plans/2026-07-06/webhook-gc-fix.md`.
- A `docs/plans/PAST/` dir holds legacy pre-skill plans — leave them alone and exclude from list/resume.

## Write a plan (default)

1. **Grill first.** Use the grill-me skill's method: interview relentlessly about the plan until shared understanding — one question at a time, recommended answer with each, walk each branch of the decision tree. If a question can be answered by exploring the codebase, explore instead of asking. Skip questions the conversation already answers.
2. **Write the file** once the tree is resolved:

```md
---
title: Fix webhook GC thrash
date: 2026-07-06
status: draft
estimate: 3.5h
estimate_split: agent 1h / review 2h / buffer 0.5h
slack: https://<workspace>.slack.com/archives/C0000000/p1234567890
jira: https://<org>.atlassian.net/browse/PROJ-1234
---

## Goal

What done looks like, one paragraph.

## Context

Why now; constraints; links to related docs/tickets.

## Decisions

Key decisions from the grilling, with the reasoning that settled each.

## Steps

- [ ] Ordered, checkable steps — each small enough to verify.

## Risks

What could go wrong and the fallback.
```

3. Tell the user the file path. Sections are a default, not a straitjacket — drop or add as the plan demands.

- **Link frontmatter (flat labelled keys).** Capture reference URLs — Slack threads, tickets, PRs, dashboards — as **flat frontmatter keys named after the link** (`slack:`, `jira:`, `pr:`, `figma:`), one URL per key. Obsidian renders these as clean clickable properties; a `links:` list-of-objects renders as raw JSON and is broken, so avoid it. Use a `2` suffix if you genuinely need two of a kind (`pr: …`, `pr2: …`). Omit any key with no link. A link may still *also* appear inline in `Context`/see-also when the sentence is genuinely about that thing — frontmatter is the index, prose is the argument.
4. **Graduated from an idea?** If the project keeps an ideas dir (e.g. `docs/ideas/`) and the plan grew out of one, cross-link both ways: plan's `Context` links the idea file, and the idea gets a `plan: <relative path>` frontmatter field plus a one-line note in its body pointing at the plan. Leave the idea `alive` — the plan's status now carries the lifecycle.
5. **Time (multi-ticket plans).** A plan split across several tickets cannot express four forecasts and four actuals in one `estimate_split:` line, so it carries a `## Time` table instead — one row per ticket, created once and keyed on the ticket. `jira:` becomes a list of URLs when a plan has several tickets. Estimate calibration reads forecasts from this table when it exists and actuals from the tickets' worklogs; the table supersedes `estimate_split:` rather than replacing it, so single-ticket plans and older plans keep calibrating untouched.

   ```md
   ## Time

   | ticket | forecast (agent/review/buffer) | agent | review | rework |
   | --- | --- | --- | --- | --- |
   | PROJ-10101 | 1h / 0.5h / 0h | 1.25h | 0.75h | — |
   | PROJ-10102 | 1h / 1h / 0h | — | — | — |
   ```

   Rows are seeded with forecasts when the tickets are queued, so a ticket an unattended run never reached still shows up here; actuals are filled in at review, where the agent figure is transcribed from the run's review queue and the review figure is measured and confirmed. Both halves are measured — the tracker remains the record of actuals, this is the working ledger that feeds it.

6. **Estimate (implementation plans).** The plan doc is the source of truth for the ticket's **Original Estimate** — set it here, before the work. Derive it with the [estimate](../estimate/SKILL.md) skill, which owns the rules: agents write the code, so the forecast splits into agent execution and human review, and the human half is derived from a `## Manual verification` section the plan must carry. Record the summed figure as an `estimate:` frontmatter key, an `Nh` string at 0.5h granularity, and the breakdown as `estimate_split: agent <N>h / review <N>h / buffer <N>h` beside it — estimate calibration reads that key rather than opening plan bodies, so keep its shape fixed. The reasoning behind each figure stays in the plan body. A multi-ticket plan omits the frontmatter key and gives each ticket its own figure in `Steps`. Whatever files the ticket reads the value once and writes it once; it never changes after filing. Skip for non-implementation plans.

## Lifecycle

`status`: `draft` (still being shaped) → `active` (being executed) → `done` | `abandoned`.

- Promote/demote by editing `status:` in the file. When abandoning, add a one-line `**Abandoned:** reason` under the frontmatter.
- Never delete plans — abandoned ones stay in place as the record.
- While a plan is `active`, tick its `Steps` checkboxes as work lands.

## Other verbs

- **list**: `grep -r "^status:" <plans-dir> --include="*.md"` grouped by status; show path + title. Resolve `<plans-dir>` the way Location does — a bare relative path fails from a repo subdirectory.
- **resume/update `<plan>`**: read the file, report remaining unchecked steps, continue from there.
