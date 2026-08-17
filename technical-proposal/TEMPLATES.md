# File skeletons

Fill and drop. Keep the `> TL;DR` header + sibling links on every file. Delete guidance
comments before writing.

---

## SUMMARY.md

```md
# <Topic> — proposal summary

> One-page overview. Detail lives in the linked docs:
> **[PROBLEM.md](./PROBLEM.md)** · **[PROPOSAL.md](./PROPOSAL.md)** ·
> **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** · **[COST.md](./COST.md)** ·
> **[APPENDIX.md](./APPENDIX.md)**

## The problem in one line
<one sentence>

## Today
```mermaid
flowchart TD
  %% current state; mark the wasteful/broken node red
```

## The proposal
<2–4 sentences: the hypothesis + the payoff>

```mermaid
flowchart TD
  %% tomorrow / end state
```

## Decisions log
| # | Decision | Where |
|---|---|---|
| D1 | ... | [PROPOSAL.md](./PROPOSAL.md) |
```

---

## PROBLEM.md

```md
# Problem & current state

> TL;DR — <the problem in one line>. See [PROPOSAL.md](./PROPOSAL.md) for the fix.

## Problem statement
Links to registered problems in the living doc — the source of truth:
- [[modules/<area>#P3]] — <one-line restatement>

<what hurts, who it hurts, why it matters now>

## Current state
<how it works today — concrete, cited `file:line` where load-bearing>
<evidence of the pain: metrics, incidents, cost, time>
```

> Every problem cited here must exist in `modules/<area>/problems.md`. If it
> doesn't yet, register it there first (write-back), then link.

---

## PROPOSAL.md

```md
# Proposal

> TL;DR — <hypothesis in one line>. Cost → [COST.md](./COST.md), how →
> [IMPLEMENTATION.md](./IMPLEMENTATION.md).

## Hypothesis
<what we propose, and the causal claim: doing X fixes the problem because Y>

## Why this over the alternatives
<pre-empt the obvious rebuttal; name options considered and rejected>

## Pros / cons
| | Pro | Con |
|---|---|---|
| ... | ... | ... |
```

---

## IMPLEMENTATION.md

```md
# Implementation notes

> TL;DR — <n stages / key ideas>. What & why → [PROPOSAL.md](./PROPOSAL.md).

## Approach
<stages or workstreams; ordering; what stays operational until cutover>

## Notes & ideas
<doer-level detail; each note = something the plan assumes works + the change it needs>

## Risks & open questions
<what could break; unknowns; who to ask>
```

---

## COST.md

```md
# Cost & benefit

> ⚠️ Figures are ESTIMATES unless cited. Validate against <source> before committing.

> TL;DR — <today $/effort> → <after>; the win comes from <lever>.

## Inputs (real, not guessed)
<measured numbers; cite where each came from>

## Cost
<one-off + ongoing; effort in eng-days as well as $>

## Benefit
<quantified where possible; qualitative otherwise>
```

---

## APPENDIX.md

```md
# Appendix

> Reference material for the proposal. ✅ = verified from source (<date>).

## References
<links: tickets, docs, prior art, external sources>

## Fact-check / provenance
<load-bearing claims → `file:line`; note any corrections made>

## Open questions
<unresolved; blocking vs non-blocking>
```
