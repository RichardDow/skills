---
name: plan-in-docs
description: Write a plan document into the repo's docs/plans/<YYYY-MM-DD>/<slug>.md, shaping it through a grill-me style interview first. Tracks lifecycle status (draft/active/done/abandoned). Use when the user says "/plan-in-docs", "write a plan", "plan this out", "save this as a plan", or wants to list or update existing plans.
---

# plan-in-docs

One plan = one markdown file under `docs/plans/<creation-date>/`, grouped by day.

## Location

- Target dir: `docs/plans/` at the root of the current repo. `PLANS_DIR` env overrides.
- Subdir per creation date: `docs/plans/$(date +%F)/` — plans made the same day share a dir. Create it if missing.
- Filename: short kebab-case slug of the plan title, e.g. `docs/plans/2026-07-06/webhook-gc-fix.md`.

## Write a plan (default)

1. **Grill first.** Use the grill-me skill's method: interview relentlessly about the plan until shared understanding — one question at a time, recommended answer with each, walk each branch of the decision tree. If a question can be answered by exploring the codebase, explore instead of asking. Skip questions the conversation already answers.
2. **Write the file** once the tree is resolved:

```md
---
title: Fix webhook GC thrash
date: 2026-07-06
status: draft
slack: https://example.slack.com/archives/C0000000/p1234567890
jira: https://example.atlassian.net/browse/PROJ-1234
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

4. **Graduated from an idea?** If the repo keeps an ideas dir (e.g. `docs/ideas/`) and the plan grew out of one, cross-link both ways: plan's `Context` links the idea file, and the idea gets a `plan: <relative path>` frontmatter field plus a one-line note in its body pointing at the plan.

## Lifecycle

`status`: `draft` (still being shaped) → `active` (being executed) → `done` | `abandoned`.

- Promote/demote by editing `status:` in the file. When abandoning, add a one-line `**Abandoned:** reason` under the frontmatter.
- Never delete plans — abandoned ones stay in place as the record.
- While a plan is `active`, tick its `Steps` checkboxes as work lands.

## Other verbs

- **list**: `grep -r "^status:" docs/plans --include="*.md"` grouped by status; show path + title.
- **resume/update `<plan>`**: read the file, report remaining unchecked steps, continue from there.
