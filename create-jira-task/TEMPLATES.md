# Templates

Read this before drafting content for any issue type, and before adopting
or updating an existing ticket. `SKILL.md` carries the overall workflow;
this file carries the per-type field templates, the time-tracking rules,
and worked examples.

## Issue types and their template sections

### Task

- **Description** — `description` param, **markdown**. No user-story
  form. One plain sentence stating what changed. Then **User impact**
  lines: a bold audience label leading a prose line, one per audience
  that actually applies. Write each line for a shareholder reader
  (product, leadership). No jargon, no symbol or function names.

  **Before drafting these lines, always ask which audiences apply.**
  Never infer it, even when it looks obvious. Ask: "Which audiences does
  this change affect — Devs, Internal, External, or None (no
  user-facing effect)? Pick any combination of the first three, or None
  alone." Suggest candidates from what the change actually does, but the
  user decides. Skip this ask only when the answer already exists — a
  plan's `## Description` drafted during `plan-in-docs` grilling is
  extracted verbatim, not re-asked at filing.
  - **Devs:** name who specifically (our team, a partner integration,
    another team's API consumers), and what changed for them.
  - **Internal:** impact on internal staff using our own tools.
  - **External:** impact on customers using the product.

  Skip any label that doesn't apply. If nothing is user-facing at all,
  replace all three with one unbold line: `No user-facing change: <what
  changed internally, one clause>.`
- **Background** — ADF. Covers why/what's broken, the situation
  prompting the work, and any constraint that shaped the approach. Plain
  language, per `plan-in-docs`' own Background rule. Extracted verbatim,
  not re-drafted here — same as Description.
- **Acceptance Criteria** — ADF, bullet list. What a user can see once
  the work ships. One plain statement per line, with the actor named, in
  the same register as Description — no code, routes, tables, or enum
  values. The plan's own technical checklist (`## Test conditions`)
  never reaches the ticket.
- **Technical Requirements** — ADF, optional, up to four parts, in this
  order. This is a distillation, always — never a copy of a plan's own,
  larger Technical Requirements section (see `SKILL.md`'s "Sourcing
  ticket content").
  1. What was built, precisely — unlabeled, file/function/symbol names,
     no register constraint. This plain sentence is the plan's own
     precise target-definition statement. Description stays jargon-free,
     so it doesn't carry this.
  2. **Why this approach:** — one clause, the reasoning that decided this
     approach over its alternatives.
  3. A fenced code block carrying the target-state diagram, when one
     exists.
  4. **Open:** — one sentence, when either exists: a still-unresolved
     *blocking* question (never a non-blocking one), or a `Risks` entry
     the plan accepted without landing a fix. This is a known, live
     risk, not a caveat about how much confidence to place in the
     design.

### Bug

No Background or Acceptance Criteria. Instead:

- **Description** — markdown. Same User impact shape as Task: a plain
  sentence naming the defect and its impact, then audience lines (skip
  what doesn't apply, or use the no-user-facing-effect line). Not
  user-story form.
- **Steps to Reproduce** — ADF textarea (numbered or bullet steps).
- **Actual Result** — single-line plain string, ≤255 characters.
- **Expected Result** — single-line plain string, ≤255 characters.
- **Technical Requirements** — ADF textarea, optional, same four-part
  structure as Task's (suspected cause / fix notes as the first,
  unlabeled part).
- Optional `parent` (epic) — only if the user names one.

### Epic

No template custom fields at all — just `summary` and `description`
(markdown: goal, scope, what's in/out). Optional, only if the user
provides them: **Start date** (date string) and **Figma Design** (url
string).

### Subtask

- **Parent is REQUIRED** — the create fails without it. If no parent
  ticket is given, ask for it before drafting.
- **Description** — markdown. A concrete piece of work, plain imperative
  — no user-story boilerplate.
- **Acceptance Criteria** — ADF, same product-only shape as Task's.
- **Technical Requirements** — ADF, optional.
- No Background field on this type.

## Time-tracking

Every ticket carries four time fields. This skill sets **Original
Estimate only**. `start-ticket` sets Start/Due later, at pickup.
`push-and-pr` logs actual time as worklogs when the work goes to review.
Read the forecast from the plan doc — it is the source of truth. Do not
invent it here.

- **Original Estimate** → `timetracking: { originalEstimate: "<value>"
  }` in `additional_fields`.
  - The **estimate** skill owns granularity, ceiling, and how the number
    is derived. Take the value from the plan's `## Time` row for this
    ticket. No plan, or no estimate in it → run **estimate** rather than
    inventing a figure here. It forecasts agent execution plus human
    review, never a human writing the code.
  - Granularity and ceiling are [estimate](../estimate/SKILL.md)'s own
    rules — cite them, don't restate the numbers here. If the plan
    estimate is over the ceiling, **flag it and suggest splitting** into
    smaller tickets before filing. Do not block on this — if the user
    insists, file it and note it was over-ceiling.
  - Acceptance Criteria comes from the plan's `## Acceptance Criteria`
    section — see `SKILL.md`'s "Sourcing ticket content". Copy it,
    never link it, since plan paths never appear in the tracker.
  - **Write-once. Hard-refuse overwriting it.** Before writing, check
    whether the live issue already has an Original Estimate. If it does,
    do **not** write — print `Original Estimate already set to <x>, not
    changing` and move on. Changing it is a deliberate manual edit,
    never a skill action.
- **Start Date** and **Due Date** — leave **empty** at creation.
  `start-ticket` sets them at pickup. This lets interstitial tickets sit
  filed-but-not-started.

## Adopted tickets (already exist)

A ticket filed by someone else that we adopt is **edited, not created**.
Use `editJiraIssue` on the existing key. Fill only the **missing**
fields.

- Original Estimate already set → inherit it, never overwrite. We are
  measured against their forecast — raise it out-of-band if scoping
  proves it unreasonable.
- No Original Estimate → write ours, using the granularity/ceiling rules
  above.

## Updating a ticket from its plan

The plan wins, but check the ticket before overwriting it. Something can
write to the ticket without the plan — a hand edit, or a run that edited
only one side. The ticket may hold newer content than the plan.

1. Fetch every templated field you are about to write.
2. Compare each one with the version the plan produces. List every line
   the ticket has that the plan lacks or states differently. Skip
   differences in rendering only (`->` vs `→`, bullet markers).
3. Show the list. Let the user settle each line: bring it into the plan
   through `plan-in-docs update`, or drop it.
4. Write only the fields that still differ from the plan. Re-read them
   afterward to confirm the write landed.

## Example call shapes

```
# Task
createJiraIssue(
  cloudId="<resolved>",
  projectKey="PROJ", issueTypeName="Task",
  summary="<concise summary>",
  assignee_account_id="<from atlassianUserInfo>",
  contentFormat="markdown",
  description="Retry backoff on the shipment-sync worker now caps at 5 minutes instead of climbing unbounded.\n\n**Devs:** the worker's own retry loop is unaffected outside this cap.\n**Internal:** support no longer needs to manually restart stuck sync jobs after a burst of failures.",
  additional_fields={ <background-field>: <Background ADF>,
                      <acceptance-criteria-field>: <Acceptance Criteria ADF>,
                      timetracking: { originalEstimate: "3.5h" } })

# Bug
createJiraIssue(..., issueTypeName="Bug",
  description="<defect + impact>",
  additional_fields={ <steps-field>: <Steps to Reproduce ADF>,
                      <actual-result-field>: "<plain string ≤255 chars>",
                      <expected-result-field>: "<plain string ≤255 chars>" })

# Subtask
createJiraIssue(..., issueTypeName="Subtask",
  description="<what to do>",
  additional_fields={ parent: { key: "PROJ-1234" },
                      <acceptance-criteria-field>: <Acceptance Criteria ADF> })
```

Substitute the ids from the resolved field map. Where the map came from
`JIRA.md`, trust it. Re-fetch on the first field error rather than
editing the draft.
