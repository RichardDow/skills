---
name: estimate
description: Produce an Original Estimate for a piece of work on the assumption that agents write the code and humans only review it. Splits the forecast into agent execution, human review, and a rework buffer, and generates the manual-verification list that the human half is derived from. Use when the user says "/estimate", "estimate this", "estimate them", "how long will this take", "size these tickets", or when plan-in-docs or a ticket-filing step needs an `estimate:` value. Owns the 0.5h granularity and 1d ceiling rules that those steps defer to.
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

- **Agent-unverifiable work** — visual output, prod data, external vendors, flaky harnesses.

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

Do not pad for the model itself being young. The 30m–2h band is unmeasured, and the
fix is measurement, not a standing apology. If you log actuals, split them into agent
session and review, then after five or ten tickets compare them against these
forecasts and move the band.

## What lands where

The `estimate:` frontmatter key in the plan doc carries the **summed figure** only,
as an `Nh` string. That is what the ticket-filing step writes to the tracker's
original-estimate field, and the number any due-date rule derives from. The
agent/review/buffer split and its reasoning stay in the plan body so the number can
be argued with later.

The manual-verification list is written once in the plan as a
`## Manual verification` section, then copied into the ticket's acceptance criteria
at filing. Copied, not linked — plan paths are internal notes and should not appear
in the tracker.

For a multi-ticket plan, omit the plan-level `estimate:` key and give each ticket its
own figure in the Steps list.

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

## Rules

- Never quote a range. One number, stated, with the split behind it.

- Never price test-writing separately when the thing is automatically testable. Assume it is written.

- An item that cannot be automatically tested belongs on the manual-verification list, not in the agent hours.

- If a decision is unresolved, do not pad the estimate for it. Name it as a blocker and estimate the resolved path.

**See also:** where the number is recorded — [plan-in-docs](../plan-in-docs/SKILL.md).
