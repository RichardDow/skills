---
name: start-ticket
description: Mark a ticket as started at pickup — set Start Date to today, set Due Date to today plus its Original Estimate in working days, transition it to In Progress, and stamp the start-of-work day in its plan doc. Use when the user says "start ticket PROJ-1234", "/start-ticket", "I'm picking up PROJ-1234", or is about to begin implementing a ticket that was filed earlier with Start and Due left empty.
group: ticket-lifecycle
---

# start-ticket

The pickup hook. This flow files a ticket early with an Original Estimate only —
Start Date and Due Date are left empty, so a ticket can sit in the backlog before
anyone works it. This skill is the "I am starting now" moment: it fills those two
dates, moves the ticket to In Progress, and records the effort-clock start.

Run it the moment you begin `/implement`, not before.

## Why `implement` does not call this

Two reasons, and the second one is the one people ask about.

**`implement` is an attempt; this is the commitment.** An abandoned or exploratory
run must not silently start a ticket and set a due date nobody agreed to. The
Start-Date guard below cannot cover that — it only ever blocks the *second* write,
never the first one you did not want.

**Tracker writes stay on the trusted side.** An unattended or sandboxed runner
should hold no credential that can write to the tracker — a read-only token is
what makes an unsupervised run safe, and handing it a writable one to save a step
gives that away. So a runner that batches tickets calls this skill on the host
first, then launches the inner agent with `implement` alone. The same rule keeps
the worklog write out of the sandbox.

## Resolve the tracker at run time

Discover these; never hardcode them.

- **Site / cloud id.** Ask the tracker's API which sites are accessible. One site →
  use it without asking.
- **Project key.** Take it from the ticket key you were given (`PROJ-1234` → `PROJ`).
- **Start Date field.** Not standard on Jira Cloud — it is usually a custom field
  (`customfield_NNNNN`). Read it from the issue's field metadata. If the project's
  agent config or project memory already records the id, use that and skip the
  lookup.
- **Due Date field.** Standard on Jira (`duedate`).
- **In Progress transition.** Look up the issue's available transitions via the
  tracker's API and find the one whose target status name matches "in progress"
  (case-insensitive). More than one match, or none → ask the user which transition
  to use.

Examples below use Jira. Any tracker with a start date, a due date and an estimate
field works the same way.

## Workflow

```
/start-ticket PROJ-1234
```

1. **Read the issue.** Fetch the ticket; take its Original Estimate, its current
   Start Date, and its current status.
2. **Guard.** If Start Date is already set, the ticket is already started. Print
   `Start Date already <date>, not changing` and stop. Do not re-stamp, and do not
   transition the status either.
3. **Resolve the dates.**
   - Start Date = today.
   - Convert the estimate to days first. Jira returns `Nh` for anything under a day
     (`3.5h` → `0.4375`) and `Nd` above it. A day is 8h — use your own working day if
     it differs.
   - Due Date = the start advanced by the estimate in **working days**, weekends
     skipped, using `max(0, ceil(estimateDays) - 1)` days. So anything up to `1d` is
     due today, and `1.5d` or `2d` is due the next working day.
   - No Original Estimate on the ticket → ask the user for a Due Date. Do not guess.

   ```bash
   start=$(date +%F)
   # advance $start by N working days (N from the rule above)
   node -e 'const d=new Date(process.argv[1]+"T00:00:00Z");let n=+process.argv[2];
     while(n>0){d.setUTCDate(d.getUTCDate()+1);const g=d.getUTCDay();if(g!==0&&g!==6)n--;}
     console.log(d.toISOString().slice(0,10));' "$start" "$N"
   ```
4. **Confirm, then write.** Show both dates and, if the ticket is not already In
   Progress or further along, the status change too — these are shared-state
   writes that other people see. Get a yes, then set the Start Date and Due Date
   fields and fire the In Progress transition.

   If the status is already In Progress or past it (e.g. In Review), skip the
   transition — only move status forward, never backward. Still set the dates.

   Never touch the Original Estimate here. It is write-once and owned by whatever
   filed the ticket.
5. **Stamp the effort clock.** Find the plans directory the way
   [plan-in-docs](../plan-in-docs/SKILL.md#location) resolves it — the repo's vault as
   recorded in project memory, never a `docs/plans/` folder found by searching the
   repo's own tree. If a plan doc exists for this ticket,
   add a one-line `start-dev: <today>` note, so the actual effort can be reported
   later against the forecast. No plan doc → skip.
6. **Report** the ticket key, the two dates, the status transition (or that it was
   skipped and why), and that the effort clock started today.

## Rules

- Start and Due are movable. Re-running is blocked by the Start-Date guard, but the
  user may edit either date by hand at any time afterwards.
- Never write the Original Estimate. Never log time here — that belongs to the
  push-and-PR step, which logs the worklog when the work goes to review.
- Only move status forward. Never transition a ticket backward to In Progress from
  a later status.
- One ticket per run.

**See also:** where the estimate comes from — [estimate](../estimate/SKILL.md);
where the plan doc lives — [plan-in-docs](../plan-in-docs/SKILL.md).
