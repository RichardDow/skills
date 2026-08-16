---
name: estimate
description: Produce an Original Estimate for a piece of work on the assumption that agents write the code and humans only review it. Splits the forecast into agent execution, human review, and a rework buffer, and generates the manual-verification list that the human half is derived from. Use when the user says "/estimate", "estimate this", "estimate them", "how long will this take", "size these tickets", or when a planning or ticket-filing step needs an `estimate:` value. Owns the 0.5h granularity and 1d ceiling rules that those steps defer to. Also runs `/estimate calibrate`, which compares shipped tickets' logged actuals against their forecasts and reports which band drifted — use when the user says "calibrate the estimates", "are my estimates accurate", "how are the estimates tracking", or wants to move the agent/review/buffer bands on evidence.
---

# Estimate

**Agents write the code. Estimate the human, not the typing.**

## The correction this skill exists for

Default estimates price a human writing every line. That is wrong here. An agent
produces the component, the wiring, and the tests in one session. Code volume is
close to free and does not scale the number.

What actually costs time:

- **Discovery** — how much of the system must be understood before the change is safe.

- **Human review** — the scarce input. Scales with blast radius and reversibility, not lines.

- **Blocked-on-human decisions** — an ambiguity the agent cannot resolve alone stalls the ticket.

- **Agent-unverifiable work** — visual output, production data, external vendors, flaky harnesses.

- **Environment friction** — a package not in the checkout, a service that must be running.

Never price these: lines of code, number of files, writing tests for anything
automatically testable, boilerplate, repetitive edits across many call sites.

## Output

Produce three things.

**Agent execution** — wall-clock for the agent to reach a reviewable diff, in hours.
Most single-repo tickets are **30m–2h** regardless of size. Raise it only for
discovery depth, agent-unverifiable work, or environment friction. A ticket that
prices above 2h of agent time is usually a discovery problem or a blocked decision
wearing an execution costume — say which, or split it.

**Human review** — the user's own time, in hours. Start at 0.5h and add for blast
radius, irreversibility, and every item on the manual-verification list.

**Manual verification list** — every check a human must make because an agent
cannot. This is not a nice-to-have: it is what the human-review number is derived
from, so an empty list means a 0.5h review. Each entry names the check and why an
agent cannot do it.

**Rework buffer** — add **1h** (0.5h agent, 0.5h review) when any of these is true,
and nothing at all otherwise:

- the change touches code that more than one shipped surface depends on

- the ticket carries three or more manual-verification entries

- the ticket spans repos, or needs a coordinated deploy

This buys one review-and-fix cycle, which is the dominant overrun in agent work. It
is deliberately not a multiplier: a flat pad prices the safe tickets like the risky
ones, and it can never be shown to have been wrong.

Then sum to the tracker's number: round up to **0.5h granularity** (`1h`, `1.5h`,
`3.5h`). Most trackers take an `Nh` string for the original-estimate field directly
(in Jira, `timetracking.originalEstimate`). Ceiling is **1d** (8h) — over that, flag
and suggest splitting. Flag, do not block. A ticket at 8h is roughly 2h of agent work
against 6h of review, which is a ticket that wants to be two.

Do not pad for the model itself being young. The 30m–2h band starts unmeasured, and
the fix is measurement, not a standing apology. Run `/estimate calibrate` (below)
once five or ten tickets have shipped, and move the band on what it reports.

## What lands where

The `estimate:` frontmatter key in the plan doc carries the **summed figure** only,
as an `Nh` string — that is what the ticket-filing step writes to the tracker's
original-estimate field, write-once, and the number any due-date rule derives from.
A second key beside it, `estimate_split: agent <N>h / review <N>h / buffer <N>h`,
carries the breakdown in a fixed shape so `calibrate` can read it without opening
plan bodies. The reasoning behind each figure stays in the body, so the number can
be argued with later.

Every sub-8h estimate resolves to "due today" under the pickup rule
`max(0, ceil(estimateDays) - 1)`, exactly as `0.5d` did.

The manual-verification list is written once in the plan as a
`## Manual verification` section, then copied into the ticket's acceptance criteria
at filing. Copied, not linked — plan paths are internal notes and never appear in
the tracker.

For a multi-ticket plan, omit the plan-level `estimate:` key and give each ticket its
own figure in the Steps list. The filing step then reads the per-ticket value.

## Worked example

A new ~90-line UI component, its colocated unit test, and wiring into two existing cards.

A human-typing estimate says 1.5d. That is wrong. The agent writes the component,
the test, and both wirings in one session — 1h, and it is closely modelled on an
existing component, so there is little discovery. Environment friction adds another
hour: the component-workshop package is not in this checkout and has to be cloned and
installed. Review is one diff across two screens behind a feature flag, plus three
manual-verification entries, so 1.5h. Three entries fires the rework trigger, so add
1h. Total **4.5h**.

The 1.5d became 4.5h, and what survived is review, an environment flake, and one
allowed round trip — not typing.

## calibrate — move the bands on evidence

```
/estimate calibrate [last N tickets, default 10]
```

The forecast bands above are guesses until this runs. Run it after five or ten
tickets ship, not per ticket.

**Plan-driven, not ticket-driven.** Plans carry a `jira:` key; tickets carry no path
back to their plan, because plan paths never appear in the tracker. So walk the
plans tree — located the way [plan-in-docs](../plan-in-docs/SKILL.md) locates it,
by walking up from the working directory — take each plan with a
`jira:` and either an `estimate_split:` or a `## Time` table, and fetch those
tickets' worklogs.

1. **Collect.** Per plan: the forecast from `estimate_split:`, and the ticket's
   worklogs from the tracker. Parse the first worklog's comment
   (`agent <N>h / review <N>h`) into the two actuals, and any `rework <N>h` worklog
   as a buffer actual. Skip tickets whose worklog has no comment in that shape —
   they predate the convention. Report how many you skipped; never guess a split.

   **A plan with a `## Time` table is multi-ticket:** `jira:` is a list, and each
   row carries that ticket's own forecast. Take forecasts from the table — it
   wins over `estimate_split:` when present — and one actual per ticket, still
   from the tracker. Each source owns one thing: forecasts are made in the plan,
   actuals are logged in the tracker, so the two cannot drift into disagreeing.
   The table's own actual columns are the human's working copy and are never the
   calibration input, so a transcription slip cannot become evidence.
2. **Compare per band.** Agent against the 30m–2h band, review against the 0.5h
   floor plus its manual-verification entries, buffer against the flat 1h.
3. **Report** one row per ticket, then a verdict per band:

   ```
   PROJ-10041   forecast 1h/1.5h/0h    actual 0.5h/3h/—
   PROJ-10044   forecast 1h/0.5h/1h    actual 1h/2h/1.5h

   agent    band holding (30m–2h)
   review   under-forecast on 2 of 2 — raise the floor above 0.5h
   buffer   fired on 4 of 11, median 1.5h against 1h assumed
   ```

4. **Never edit a worklog, a ticket, or a plan from here.** Calibrate reads and
   reports. Changing a band is a decision for the user, applied by editing this
   skill.

Three signals worth naming when they appear: a review band that misses in one
direction every time is a floor problem, not noise; a buffer that fires on most
tickets means the trigger conditions are too narrow rather than the 1h being wrong;
and an agent band that only misses on tickets with environment friction means the
friction, not the band, needs its own line.

## Rules

- Never quote a range. One number, stated, with the split behind it.

- Never price test-writing separately when the thing is automatically testable. Assume it is written.

- An item that cannot be automatically tested belongs on the manual-verification list, not in the agent hours.

- If a decision is unresolved, do not pad the estimate for it. Name it as a blocker and estimate the resolved path.

- Never move a band from a single ticket. Calibrate reports; five or ten tickets argue.

**See also:** where the number is recorded — [plan-in-docs](../plan-in-docs/SKILL.md);
how it becomes a Due Date at pickup — [start-ticket](../start-ticket/SKILL.md).
