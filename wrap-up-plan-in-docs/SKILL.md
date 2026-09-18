---
name: wrap-up-plan-in-docs
description: Sweep docs/plans and sync each plan's lifecycle status with its Jira ticket — done tickets close plans (grilling any unticked steps first), cancelled tickets propose abandonment, in-flight tickets mark plans active. Use when the user says "/wrap-up-plan-in-docs", "wrap up the plans", "sweep the plans", or "sync plans with jira".
group: ticket-lifecycle
---

# wrap-up-plan-in-docs

Companion to plan-in-docs: reads each plan's `jira:` frontmatter, fetches the ticket's
current status, and moves the plan's `status:` to match. Plans without a ticket are
reported, never guessed at.

## Scope

- Default: every plan under the resolved vault's `plans/` directory (resolve it the
  way [plan-in-docs](../plan-in-docs/SKILL.md#location) does — a repo's own recorded
  vault, never a `docs/plans/` folder found by searching its tree) whose `status:` is
  `draft` or `active`. Terminal plans (`done`/`abandoned`) are never touched. Exclude
  `plans/PAST/`.
- `/wrap-up-plan-in-docs <plan>`: wrap up just that plan (path or slug).
- No `jira:` key → one line in the report ("no ticket, can't sweep"); skip otherwise.
- `jira2:`/further ticket keys: the **primary `jira:` decides**; fetch the others too
  and show their statuses in the report for context.

## Fetch

Extract the ticket key from the `jira:` URL and fetch its status (and resolution) via
the Atlassian MCP (`getJiraIssue`), using the URL's host as the cloud ID. If the MCP
isn't connected in this session, say so and stop — don't guess statuses.

## Status mapping

Explicit table first; the table is the adaptation point — edit it to match your
workflow's column names.

| Ticket status | Plan status |
|---|---|
| Done | `done` |
| Cancelled | `abandoned` |
| In Progress, In Review, Merged, Testing, Passed | `active` |

Fallback for status names not in the table, by Jira `statusCategory`:

- **In Progress** → `active`
- **To Do** → leave untouched
- **Done** → **never auto-mapped** — report as unknown. (Done-category names are
  ambiguous: e.g. a "Passed" QA column and "Cancelled" both live there, one meaning
  active and the other abandoned.)

Anything unresolvable stays untouched and is listed in the report.

## Applying transitions

- **→ `active`**: auto-apply (reversible, no information lost). Covers promoting
  `draft` plans whose ticket has started moving.
- **→ `abandoned`**: **propose, never auto** — ask per plan: "ticket is cancelled —
  abandon this plan? If the work moved to a new ticket, give me the key and I'll
  update `jira:` instead." On yes, set the status and add the
  `**Abandoned:** Jira ticket cancelled` line under the frontmatter.
- **→ `done`, all steps ticked**: auto-apply.
- **→ `done`, unticked steps remain**: grill first (below); the user decides.

## The unticked-steps grill

Ticket says done, plan says otherwise — walk the unticked steps **one at a time**,
asking what happened to each. Three outcomes per step:

1. **It happened** → tick it.
2. **Overtaken by events** → tick with a strikethrough note:
   `- [x] ~~step text~~ — obsolete: <why>`. A consciously dropped step, not a
   forgotten one.
3. **Genuinely outstanding** → leave unticked.

After the walk-through, if anything is still outstanding, ask the user's call:

- mark the plan `done` anyway — add a one-line note under `Steps` listing what was
  left undone, and suggest the leftovers may warrant a follow-up ticket; or
- keep it `active` despite the closed ticket, and note the mismatch in the report.

## Report

End every sweep with one table: **plan · ticket · ticket status · action taken**
(including "untouched — unknown status", "no ticket", and "kept active — steps
outstanding" rows). No table row is silent — every plan in scope appears.
