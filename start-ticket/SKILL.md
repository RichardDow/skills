---
name: start-ticket
description: Mark a ticket as started at pickup — set Start Date to today, set Due Date to today plus its Original Estimate in working days, and stamp the start-of-work day in its plan doc. Use when the user says "start ticket PROJ-1234", "/start-ticket", "I'm picking up PROJ-1234", or is about to begin implementing a ticket that was filed earlier with Start and Due left empty.
---

# start-ticket

The pickup hook. This flow files a ticket early with an Original Estimate only —
Start Date and Due Date are left empty, so a ticket can sit in the backlog before
anyone works it. This skill is the "I am starting now" moment: it fills those two
dates and records the effort-clock start.

Run it the moment you begin `/implement`, not before.

## Configure once

Record your tracker's field identifiers here, so the skill stops guessing:

- **Start Date field.** Not standard on Jira Cloud — it is usually a custom field
  (`customfield_NNNNN`). Find its ID once via the field list API and write it down,
  along with the date you verified it.
- **Due Date field.** Standard on Jira (`duedate`).
- **Project key and site**, if your tracker's API needs them.

Examples below use Jira, since `wrap-up-plan-in-docs` already assumes it. Any tracker
with a start date, a due date and an estimate field works the same way.

## Workflow

```
/start-ticket PROJ-1234
```

1. **Read the issue.** Fetch the ticket; take its Original Estimate and its current
   Start Date.
2. **Guard.** If Start Date is already set, the ticket is already started. Print
   `Start Date already <date>, not changing` and stop. Do not re-stamp.
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
4. **Confirm, then write.** Show both dates and get a yes — these are shared-state
   writes that other people see. Then set the Start Date and Due Date fields.

   Never touch the Original Estimate here. It is write-once and owned by whatever
   filed the ticket.
5. **Stamp the effort clock.** If a plan doc exists for this ticket under
   `docs/plans/` (plan-in-docs), add a one-line `start-dev: <today>` note, so the
   actual effort can be reported later against the forecast. No plan doc → skip.
6. **Report** the ticket key, the two dates, and that the effort clock started today.

## Rules

- Start and Due are movable. Re-running is blocked by the Start-Date guard, but the
  user may edit either date by hand at any time afterwards.
- Never write the Original Estimate. Never log time here.
- One ticket per run.

**See also:** where the estimate comes from — [estimate](../estimate/SKILL.md);
where the plan doc lives — [plan-in-docs](../plan-in-docs/SKILL.md).
