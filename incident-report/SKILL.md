---
name: incident-report
description: Produce a blameless incident report by interviewing the user section-by-section. Use when the user wants to write an incident report, post-mortem, or RCA, or mentions "incident report", "post-mortem", or "write up the incident".
---

# Incident Report

Interview the user to gather details for each section, then produce a final report. Use the [[grill-me]] style: ask one question at a time, walk down each branch, and offer a recommended answer where you can infer one from context.

## Process

1. **Confirm scope** — ask for a one-line incident summary and the rough date/time window. Use this to anchor the rest of the interview.

2. **Work through the five sections in order**, grilling on each before moving to the next. Don't move on until the section has enough detail to stand alone. After each section, show the user what you've captured and ask "anything to add or correct?" before continuing.

3. **Convert all times to UTC** as you collect them. If the user gives a local time, ask their timezone and convert explicitly.

4. **Stay blameless** — phrase contributing factors in terms of systems, signals, and processes, not individuals. If the user names a person, capture the action they took, not the person.

5. **Write the report** to `docs/incidents/INCIDENT-<YYYY-MM-DD>-<short-slug>.md`. Find `docs/` by walking up from the working directory — the nearest ancestor holding a `docs/` tree wins; fall back to a location recorded in the project's agent config. Create the `incidents/` directory if missing. Confirm the filename with the user before writing.

## Sections to gather

For each section below, grill until the answers are concrete. Suggested probe questions are starting points, not a script.

### 1. Lead-up
The sequence of events that led to the incident.
- What changed in the hours/days before? (deploys, config changes, traffic shifts, dependency updates, feature flags)
- Were there any prior warnings, flaky alerts, or near-misses that were dismissed?
- What was the system state that made this change land badly?

### 2. Detection
When and how the team became aware.
- Exact UTC time of first detection.
- Who/what detected it? (alert, customer report, internal user, monitoring dashboard, chance)
- What was the gap between impact start and detection? Why?
- What signal would have caught it sooner? (missing alert, missing metric, threshold too loose, missing log)

### 3. Impact
Where in the application — and on whom — the incident landed.
- Which surfaces / services / pages / endpoints were affected?
- Which user segments? (all users, specific tenants, internal only)
- Severity of impact: degraded, partial outage, full outage, data loss/corruption.
- Duration of user-visible impact (UTC start → UTC end).

### 4. Timeline
Chronological log in UTC. Include lead-up events, detection, mitigation steps, decisions, and resolution.
- Format each entry: `HH:MM UTC — what happened / who decided what`.
- Capture decisions and *why* they were made at the time, not just actions.
- Include the "all clear" entry and any follow-up monitoring window.

### 5. Blameless root cause
The underlying cause and what needs to change to prevent this *class* of incident.
- State the root cause as a system/process gap, not a human error.
- List contributing factors (what made detection or recovery slower than ideal).
- Concrete follow-up actions: owner-less is fine at draft stage, but each action should be specific and testable.
- Note explicitly what is **not** an action item (avoid blame-flavoured "be more careful" items).

## Output template

```md
# Incident: <one-line summary>

- **Date:** <YYYY-MM-DD>
- **Duration of impact:** <HH:MM UTC> → <HH:MM UTC> (<X> minutes)
- **Severity:** <degraded | partial outage | full outage | data issue>

## Lead-up
<prose, oldest first>

## Detection
<when, how, gap-to-detection, what would have caught it sooner>

## Impact
<surfaces, users, severity, duration>

## Timeline (UTC)
- HH:MM — …
- HH:MM — …

## Root cause (blameless)
<root cause + contributing factors>

### Follow-up actions
- [ ] …
- [ ] …

### Explicitly not action items
- …
```

## Style rules

- Past tense, third person, no names — refer to roles ("the on-call engineer", "the deploy pipeline").
- Prefer specifics ("p95 latency on `/quotes` rose from 200ms to 8s") over vague claims ("things got slow").
- If the user can't answer a probe, write "Unknown — investigation needed" rather than guessing.
