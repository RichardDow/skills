---
name: create-jira-task
description: Create a Jira issue (Task, Bug, Epic, or Subtask) in the team's template, with the right custom fields per type, and assign it. Use when the user says "create a jira task/bug/epic/subtask", "raise a ticket", "file this as an issue", "/create-jira-task", or asks to file the current work as a Jira issue. Defaults to assigning the new ticket to the authenticated user.
---

# create-jira-task

Files an issue using the team's template and assigns it (self by default), through
the Atlassian MCP tools.

## Resolve the instance before drafting

Never hardcode any of this — discover it, and prefer a recorded value over a
lookup:

- **Site / cloud id.** `getAccessibleAtlassianResources`. One accessible site →
  use it without asking.
- **Project key.** From the ticket key in the conversation, the branch name, or
  the project's agent config. Ask only if none of those answer.
- **The field map** — issue-type ids and the template's `customfield_*` ids. If
  the project's agent config or project memory records them with a verification
  date, use those. Otherwise rebuild it from the live schema in two calls, in
  this order: list the project's issue types with
  `getJiraProjectIssueTypesMetadata` and match Task/Bug/Epic/Subtask by name,
  then fetch each type's fields with `getJiraIssueTypeMetaWithFields` — it needs
  a type id, which is why the enumeration comes first. Map each template section
  to its current id **by field name**, record each field's type as well, and
  report what you found so it can be written down for next time.

Field ids drift. A create that fails on an unknown or invalid field is a stale
map, not a bad draft: re-fetch the schema, remap by name, retry, and report the
corrected ids.

## What the field types demand

These constraints come from Jira itself and cost a failed create when ignored:

- Custom fields of type **textarea** do not render markdown. They MUST be ADF doc
  objects. Only `description` takes markdown.
- Custom fields of type **textfield** are single-line plain strings, max 255
  characters. Passing ADF is rejected with "Operation value must be a string".

So the mapping step must record each field's **type** as well as its id — the
schema response carries both.

## Issue types & their template sections

Pick type from the request ("bug" → Bug, "epic" → Epic, "subtask of PROJ-x" →
Subtask). Default: **Task**.

### Task
- **Description** — `description` param, **markdown**. User-story form:
  `As a <role>,` / `I want <capability>,` / `so that <benefit>`.
- **Background** — ADF (why/what's broken, the situation prompting the work).
- **Acceptance Criteria** — ADF (bullet list of verifiable conditions).
- **Technical Requirements** — ADF, optional (implementation notes).

### Bug
No Background/AC. Instead:
- **Description** — markdown; short statement of the defect and impact (not
  user-story form).
- **Steps to Reproduce** — ADF textarea (numbered/bullet steps).
- **Actual Result** — single-line plain string, ≤255 chars.
- **Expected Result** — single-line plain string, ≤255 chars.
- **Technical Requirements** — ADF textarea, optional (suspected cause / fix notes).
- Optional `parent` (epic) — only if the user names one.

### Epic
No template custom fields at all — just `summary` + `description` (markdown: goal,
scope, what's in/out). Optional if the user provides them: **Start date** (date
string) and **Figma Design** (url string).

### Subtask
- **Parent is REQUIRED** — the create fails without it. If no parent ticket given,
  ask for it before drafting.
- **Description** — markdown; concrete piece of work, plain imperative (no
  user-story boilerplate).
- **Acceptance Criteria** — ADF.
- **Technical Requirements** — ADF, optional.
- No Background field on this type.

## Time-tracking fields

Every ticket carries four time fields. This skill sets **Original Estimate only**;
Start/Due are set later at pickup (`start-ticket`), and actual time is logged as
worklogs when the work goes to review (`push-and-pr`). Read the forecast from the plan doc — it is the source of
truth. Do not invent it here.

- **Original Estimate** → `timetracking: { originalEstimate: "<value>" }` in
  `additional_fields`.
  - The **estimate** skill owns granularity, ceiling, and how the number is
    derived. Take the value from the plan. No plan, or no estimate in it → run
    **estimate** rather than inventing a figure here. It forecasts agent execution
    plus human review, never a human writing the code.
  - Granularity **0.5h** (`1h`, `1.5h`, `3.5h`) — Jira takes an `Nh` string here.
    Ceiling **1d** (8h): if the plan estimate is over 8h, **flag and suggest
    splitting** into smaller tickets before filing. Do not block — if the user
    insists, file it and note it was over-ceiling.
  - The plan's `## Manual verification` list is copied into **Acceptance Criteria**
    on the ticket — copied, never linked, since plan paths never appear in the
    tracker.
  - **Write-once. Hard-refuse overwriting it.** Before writing, if the live issue
    already has an Original Estimate, do **not** write — print
    `Original Estimate already set to <x>, not changing` and move on. Changing it
    is a deliberate manual edit, never a skill action.
- **Start Date** and **Due Date** — leave **empty** at creation. `start-ticket`
  sets them at pickup. This lets interstitial tickets sit filed-but-not-started.

### Adopted tickets (already exist)

A ticket filed by someone else that we adopt is **edited, not created** — use
`editJiraIssue` on the existing key, and fill only the **missing** fields:

- Original Estimate already set → inherit it, never overwrite. We are measured
  against their forecast; raise it out-of-band if scoping proves it unreasonable.
- No Original Estimate → write ours (0.5h granularity, 1d ceiling, rules above).

## Workflow

1. **Resolve the instance** (above) — site, project key, field map.
2. **Pick issue type.** Subtask with no parent → ask for parent key first.
3. **Gather content** for that type's sections.
   - Mid-conversation: **draft all fields from context**. Don't interrogate when
     the answer is already in the thread.
   - Cold start (no context): interview section by section in the order listed for
     the type.
4. **Confirm.** Show the drafted summary + sections (and parent, for Subtask or
   Bug-under-epic) and get approval before creating. Edit on feedback.
5. **Resolve assignee.**
   - Default = the authenticated user: call `atlassianUserInfo`, take `account_id`.
   - If the request names someone else ("assign to Sam"): `lookupJiraAccountId`
     with their name, use that `account_id`.
6. **Build ADF** for each ADF field. Pipe the section text to the bundled helper:
   `node scripts/to-adf.js "<text>"` — blank lines split paragraphs; lines
   starting with `- ` become a bullet list. It prints the ADF doc JSON to embed in
   `additional_fields`.
7. **Create** with `createJiraIssue`:
   - `cloudId`, `projectKey`, `issueTypeName` per type, `summary`,
     `assignee_account_id`.
   - `contentFormat: "markdown"`, `description: "<markdown>"`.
   - `additional_fields`: the type's `customfield_*` entries in the right shape per
     field type; plus `parent: { key: "PROJ-1234" }` for Subtask (or Bug/Task under
     an epic); plus `timetracking: { originalEstimate: "<1h/1.5h/3.5h/…>" }` — omit
     Start/Due, they are set at pickup.
8. **Report** the returned key + `webUrl`. Remind the user that Start/Due Date and
   logged time are set later, by `start-ticket` at pickup and `push-and-pr` at PR
   open.

## Example call shapes

```
# Task
createJiraIssue(
  cloudId="<resolved>",
  projectKey="PROJ", issueTypeName="Task",
  summary="<concise summary>",
  assignee_account_id="<from atlassianUserInfo>",
  contentFormat="markdown",
  description="As a <role>,\nI want <capability>,\nso that <benefit>.",
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

Substitute the ids from the resolved field map. Where the map came from a
recorded note rather than a live fetch, trust it — but re-fetch on the first
field error rather than editing the draft.
