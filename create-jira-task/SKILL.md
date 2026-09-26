---
name: create-jira-task
description: Create a Jira issue (Task, Bug, Epic, or Subtask) in the team's template, with the right custom fields per type, and assign it — or update an existing ticket's templated fields (Description, Background, Acceptance Criteria, Technical Requirements) from its plan doc. Use when the user says "create a jira task/bug/epic/subtask", "raise a ticket", "file this as an issue", "/create-jira-task", asks to file the current work as a Jira issue, or asks to update/sync/edit a ticket's fields — especially one with a matching plan doc. Defaults to assigning a new ticket to the authenticated user.
group: ticket-lifecycle
---

# create-jira-task

Files an issue using the team's template and assigns it (self by default),
through the Atlassian MCP tools.

## Resolve the instance before drafting

Read the Jira configuration file linked from the shared agent config
(`JIRA.md`) before resolving these values. Treat its dated values as a
cache — do not repeat discovery on every run. If a value is missing or
rejected, refresh it from the live API. Map fields by name and type. Then
update `JIRA.md` with the verification date.

- **Site / cloud id.** Use the configured site and cloud id. If absent,
  call `getAccessibleAtlassianResources`. One accessible site → use it
  without asking.
- **Project key.** Use the configured key. Use a different project only
  when the ticket key in the conversation, or the repo's agent config,
  identifies another one.
- **The field map** — issue-type ids and the template's `customfield_*`
  ids. Use the configured issue-type IDs and mappings. If they are missing
  or stale, rebuild them in two calls, in this order: list issue types
  with `getJiraProjectIssueTypesMetadata` and match Task/Bug/Epic/Subtask
  by name, then fetch each type's fields with
  `getJiraIssueTypeMetaWithFields`. Record each field's type, not just its
  id.

Field ids drift. A create that fails on an unknown or invalid field means
a stale map, not a bad draft. Re-fetch the schema, remap by name, retry,
and update the configuration file.

## What the field types demand

These constraints come from Jira itself. Ignoring them costs a failed
create.

- Custom fields of type **textarea** do not render markdown. They MUST be
  ADF doc objects. Only `description` takes markdown.
- Custom fields of type **textfield** are single-line plain strings, max
  255 characters. Passing ADF is rejected with "Operation value must be a
  string".

The mapping step must record each field's **type** as well as its id — the
schema response carries both.

## Issue types and their template sections

Pick the type from the request ("bug" → Bug, "epic" → Epic, "subtask of
PROJ-x" → Subtask). Default: **Task**. Read
[TEMPLATES.md](TEMPLATES.md) for each type's exact field template — what
goes in each field, in what format, and the constraints on Technical
Requirements' four-part shape — before drafting any content.

## Sourcing ticket content

Priority order, highest first:

1. **The plan has `## Description`/`## Background`/`## Technical
   Requirements`/`## Acceptance Criteria` sections** — grouped under a
   heading keyed by this ticket (`## PROJ-1234`) in a multi-ticket plan.
   Extract each one verbatim, **except Technical Requirements** — see
   below for why that one is distilled, not copied. Never re-derive this
   content from the plan's `## Decisions`. These sections already **are**
   the ticket, written and reviewed at plan time. `## Decisions` and
   `## Test conditions` stay plan-only — never send them.

   Description is markdown, passed straight to the `description` param.
   Background, Acceptance Criteria, and Technical Requirements are
   markdown in the plan but ADF fields in Jira — pipe each through
   `scripts/to-adf.js`.

   That script turns a fenced code block into an ADF `codeBlock` node, so
   a diagram keeps its alignment. It turns a markdown link into a real
   ADF link only when its target is an absolute URL. A relative plan-file
   link renders as plain text instead — plan paths never reach the
   tracker, linked or not. A sibling ticket mentioned by bare key (e.g.
   `PROJ-1234`, no markdown link) also stays plain text through this
   conversion — Jira does not reliably auto-link it in its own issue
   view, whatever a legacy rendered-HTML preview might show.
   `plan-in-docs`' own Background/Decisions content should already carry
   a real link per its own rule. Check this directly when drafting
   Technical Requirements' `Open:` line, since that part is authored
   here, not extracted.

   **Technical Requirements is always the type's own four-part shape (in
   [TEMPLATES.md](TEMPLATES.md)), never a copy of the plan's
   `## Technical Requirements` section.** A plan's own Technical
   Requirements section routinely carries more — a file tree, sequence
   diagrams, pseudocode — beyond the four parts the ticket field holds.
   "Extract verbatim" governs which section of the plan to draw from, not
   how much of it to paste. Pick the one diagram, if any, that most
   directly shows the target state for part 3. Leave the rest — the file
   tree, the other diagrams, the pseudocode — out of the ticket. Apply
   this same rule when updating an existing ticket's Technical
   Requirements from a revised plan: re-distill to the four parts again,
   don't grow the field with whatever the plan added since the ticket was
   last synced.
2. **No plan, but the conversation already has the answers** — draft all
   fields from context. Don't interrogate when the answer is already in
   the thread.
3. **Cold start** — no plan, no context: interview section by section, in
   the order listed for the type.

## Time-tracking

Every ticket carries four time fields. This skill sets **Original
Estimate only** — Start/Due are set later at pickup (`start-ticket`), and
actual time is logged as worklogs when the work goes to review
(`push-and-pr`). Read [TEMPLATES.md](TEMPLATES.md) for the full estimate
rules (write-once, adopted-ticket inheritance, updating from a revised
plan). Take the value from the plan's `## Time` row for this ticket — it
is the source of truth. Do not invent it here.

## Workflow

1. **Resolve the instance** (above) — site, project key, field map.
2. **Pick issue type.** Subtask with no parent → ask for the parent key
   first. Read [TEMPLATES.md](TEMPLATES.md) for that type's exact field
   template before drafting.
3. **Gather content** for that type's sections — see **Sourcing ticket
   content** above for priority order.
4. **Confirm.** Show the drafted summary and sections (and parent, for
   Subtask or Bug-under-epic). Get approval before creating. Edit on
   feedback.
5. **Resolve assignee.**
   - Default = the authenticated user: call `atlassianUserInfo`, take
     `account_id`.
   - If the request names someone else ("assign to Sam"):
     `lookupJiraAccountId` with their name, use that `account_id`.
6. **Build ADF** for each ADF field. Pipe the section text to the bundled
   helper: `node scripts/to-adf.js "<text>"`. Blank lines split
   paragraphs. Lines starting with `- ` become a bullet list. It prints
   the ADF doc JSON to embed in `additional_fields`.
7. **Create** with `createJiraIssue`:
   - `cloudId`, `projectKey`, `issueTypeName` per type, `summary`,
     `assignee_account_id`.
   - `contentFormat: "markdown"`, `description: "<markdown>"`.
   - `additional_fields`: the type's `customfield_*` entries in the right
     shape per field type.
   - Also in `additional_fields`: `parent: { key: "PROJ-1234" }` for
     Subtask (or Bug/Task under an epic).
   - Also in `additional_fields`: `timetracking: { originalEstimate:
     "<1h/1.5h/3.5h/…>" }` — omit Start/Due, they are set at pickup.
8. **Report** the returned key and `webUrl`. Remind the user that
   Start/Due Date and logged time are set later — by `start-ticket` at
   pickup and `push-and-pr` at PR open.
9. **Write the key back into the plan, if one was used.** The plan's
   `## Time` table seeds its `ticket` column with a placeholder (`TBD`,
   or a short slug for a not-yet-filed ticket in a multi-ticket plan)
   before a key exists. Replace that placeholder with the real key in
   that row now. Skip this for cold-start/mid-conversation filing with no
   plan.
10. **Link dependent tickets, for a multi-ticket plan.** When the plan's
    `## Steps` section marks one ticket as depending on another (e.g.
    "— depends on `<slug>`"), create a `Blocks` link once both tickets
    have real keys: `createIssueLink(cloudId, inwardIssue: <blocking
    ticket's key>, outwardIssue: <blocked ticket's key>, type:
    "Blocks")`. The tool's own convention names the blocker as inward,
    the blocked ticket as outward. If the sibling a ticket depends on
    isn't filed yet, skip the link. Create it once that sibling exists.
    If `"Blocks"` isn't a valid type on this instance's issue-link
    scheme, look it up with `getIssueLinkTypes` and match by name — the
    same way issue-type ids are resolved. A ticket the plan doesn't mark
    as depending on anything gets no link.

**Filing more than one ticket.** When a plan or request names more than
one ticket to file in the same session, run steps 3-10 **for one ticket
at a time, start to finish** — as if it were the only ticket being filed.
Never collapse step 4 across tickets into a single combined
confirmation, even when every ticket's content is already drafted and
approved in the plan. Show each ticket's complete draft on its own — its
full Technical Requirements, diagram included. Get that ticket's own
approval before creating it and moving to the next. A line like "this one
follows the same pattern" or "the diagram matches its own section" is a
shortcut, not a summary — render the section itself instead of asserting
it. Two tickets being near-identical is not a reason to compress this.
The discipline holds regardless of how many tickets are in the batch.

## Adopted tickets and updates to an existing ticket

Read [TEMPLATES.md](TEMPLATES.md) for adopting a ticket someone else
filed, and for updating an existing ticket's fields from a revised plan
— both are edits (`editJiraIssue`), not creates, and follow different
rules from the Workflow above.
