---
name: document-investigation
description: Write a diagnosis session up as an investigation record in docs/investigations/ — symptom, hypotheses (including killed ones), re-runnable evidence queries, root cause, ranked fixes. Use when the user says "document this investigation", "write up the diagnosis", "record this debugging session", or wants a durable trail of a root-cause hunt that isn't a formal incident report.
---

# Document Investigation

Turn the current session's diagnosis work into a durable record at `docs/investigations/<YYYY-MM-DD>-<short-slug>.md`. Date = investigation start. Find `docs/` by walking up from the working directory — the nearest ancestor holding a `docs/` tree wins; fall back to a location recorded in the project's agent config. Create the `investigations/` directory if missing.

Prose style: follow the `document-module` skill's `STYLE.md` (bullets-first, folded depth, subject-only inline links).

Unlike [[incident-report]] (facts gathered by interview), an investigation's evidence lives in the session context. **Auto-draft from the conversation, then confirm** — do not grill section-by-section.

## Process

1. **Extract the chain from context**: initial symptom, every hypothesis raised, the evidence that confirmed or killed it, queries/commands run (with log groups, time windows, PromQL), the verdict, fix options.
2. **Draft the full document** using the template below.
3. **Ask only what context can't answer** (one message, 2-4 questions max):
   - Status: `open | root-caused | fixed | abandoned`
   - Anything to redact (account IDs, customer names, screenshots)?
   - Follow-up owner / ticket to link?
4. **Write the file**, confirm path with user only if the slug is ambiguous.
5. If an investigation doc for this thread already exists, **update it in place** (append new evidence, revise status) rather than creating a second file.

## Template

```markdown
---
status: open | root-caused | fixed | abandoned
started: YYYY-MM-DD
systems: [api, worker, ...]
links: [PROJ-1234, incident file, PRs]
---

# <Title: symptom, not cause>

## Symptom
What was observed, where, with dashboard/graph references and time windows (UTC).

## Hypotheses
One subsection per hypothesis, in the order investigated. Killed hypotheses are
as valuable as the winner — record why each died.

### H1: <name> — KILLED | CONFIRMED | UNRESOLVED
- Evidence for / against
- Verdict and reasoning

## Evidence log
Re-runnable artifacts: Logs Insights queries (with log group + time range),
PromQL (with window), shell commands, trace-id decoding tricks. Enough for a
future engineer to reproduce every step.

## Root cause
The confirmed chain, stated plainly. "Unknown" is a valid entry for open status.

## Fixes
Ranked options with effort/risk. Mark which were applied.

## Timeline
Key UTC timestamps: symptom onset, deploys, restarts, episodes.
```

## Rules

- Convert all times to UTC.
- Queries must be copy-paste re-runnable — include log group, time bounds, and any non-obvious syntax fixes discovered along the way.
- Keep the register factual and blameless; systems, not people.
- Cross-link: if a formal incident report or Jira ticket exists or gets created later, add it to `links`.
- Screenshots: only when the user asks to save them. Copy to `docs/investigations/assets/<doc-slug>/` with descriptive names and reference from the relevant section. Do this at the moment they're shared — the session image cache is ephemeral, and the desktop's own screenshot directory holds the originals as a fallback, matchable by timestamp.
