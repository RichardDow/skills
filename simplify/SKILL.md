---
name: simplify
description: On-demand reduction pass — find and apply opportunities to reuse existing code, simplify control flow, cut inefficiency, and fix mixed abstraction levels ("altitude"). Behaviour-preserving where a fix is provably equivalent, applied anyway with the edge-case shift named explicitly where it isn't; edits a diff. Use when the user says "/simplify", "cut this down", "find redundancy", "make this more efficient", or wants a reduction/reuse pass on changed code. Distinct from /clarify, which never changes behaviour under any circumstance.
group: review-quality
---

# simplify

Find and apply the reduction a diff still has left in it: reuse, simplification, efficiency, and altitude. This is the counterpart to `/clarify` — where clarify asks "is this self-explanatory," simplify asks "is there less code, at the right depth."

## What it is vs /clarify

- `/simplify` — *is there less code, at the right depth?* Reuse, simplification, efficiency, altitude. May change behaviour.
- `/clarify` — *is the code self-explanatory without comments?* Naming, extraction, control-flow shape, file layout, comment hygiene. Never changes behaviour.

They may produce different diffs on the same file. Run either independently.

## Where it runs

<!-- CLAUDE-SPECIFIC: this skill spawns a fresh subagent via the Claude Code Agent
     tool. Another agent needs its own version using its own subagent mechanism. -->

- [ ] Run in a fresh subagent, never inline. The point is a context that did not write the code — an author simplifying its own diff mostly re-reads its own reasoning and misses the reuse opportunity it already passed up once.
- [ ] Spawn on the tier the governing agent-instructions file names for code-facing judgement, naming that model explicitly on the spawn — never inherit the calling session's model.
- [ ] Hand the subagent: the target diff, the branch's commits, and any review queue.
- [ ] Exactly one subagent, one pass, covering all four dimensions together — no fan-out into per-dimension finders.
- [ ] Let the subagent make the edits and write that commit.

## Scope

- [ ] Default: changed code only — the branch diff vs its base, same as `/clarify`.
- [ ] Override: `/simplify <path>` operates on that file or directory instead.
- [ ] A fix that must touch code outside the diff (e.g. reusing a helper defined elsewhere, updating every call site of a signature it simplified) updates every affected call site — correctness requires it — and the summary reports the ripple explicitly.

## Behaviour policy

Unlike `/clarify`, this pass may change behaviour — that's the actual distinction between the two, not a detail to soften.

- [ ] Apply a fix freely once typecheck and the existing test suite confirm it's provably equivalent to what it replaces.
- [ ] When a fix might shift an edge case — a stricter null check, a merged branch that changes one input's outcome, a "dead" code path that was actually reachable — apply it anyway, but name the exact case explicitly in the summary. Never silent.
- [ ] If a fix cannot be verified either way (no test reaches the changed path, typecheck doesn't cover the claim), flag it as a suggestion instead of applying it — the same treatment `/clarify` gives a fix that would require a real logic change.

## The four dimensions

- **Reuse** — does this duplicate logic that already exists elsewhere in the same repo (a util, a shared helper, a DAO/service method) that should be called instead of reinvented?
- **Simplification** — can the same behaviour be expressed with less code, fewer branches, fewer intermediate steps?
- **Efficiency** — does this do more work than necessary (a redundant query, needless re-computation, an avoidable loop, an N+1 pattern)?
- **Altitude** — does each function/file sit at one consistent level of abstraction, and in the layer the repo's own architecture doc says it belongs in — not mixing high-level orchestration with low-level mechanics in the same place? Where the repo has an architecture doc defining layers, cite the specific rule a violation breaks. Where none exists, fall back to ordinary convention for the stack — business logic and external-call orchestration belong in a layer separate from presentation, not embedded inside it — and say so explicitly.

## Verification

- [ ] Run the project's own script for typecheck. Find it in the repo's manifest (`package.json` scripts, a `Makefile` target, or the equivalent for the stack); the repo's agent config wins where it names a narrower command. Never hardcode a tool binary.
- [ ] Also run the existing test suite the same way, scoped to the touched files (not new tests — that's not this pass's job). This is what "provably equivalent" in the Behaviour policy above actually means: typecheck alone doesn't catch a behaviour change, only a green test does.
- [ ] Where the agent's instructions say to skip typecheck or lint (a pre-existing error baseline that would drown a real failure), do not run it — but treat every fix in this run as unverifiable rather than provably equivalent. Unlike `/clarify`, this pass has no other way to tell a behaviour-preserving fix from an edge-case-shifting one, so a fix with no verification path is flagged as a suggestion, never applied.

## Workflow

1. [ ] Resolve the target (diff by default, or the given path).
2. [ ] Read the code. For each dimension, look for a concrete opportunity — treat the four as four separate searches, not one checklist to confirm clean.
3. [ ] Apply each fix. For every fix, decide: provably equivalent (verified per above), edge-case-shifting (apply it anyway, name the case), or unverifiable (flag as a suggestion, don't apply).
4. [ ] Verify per the repo rule above.
5. [ ] Write the simplify commit message, naming each applied fix and whether it was provably equivalent or edge-case-shifting — an unverifiable fix is never applied, so it has no place in this commit.
6. [ ] Summarize: the fixes made, which ones changed an edge case (named explicitly), any cross-file ripple, and any fix flagged as a suggestion instead of applied.

## Clean exit

If the target has nothing left to reuse, simplify, speed up, or relevel, make no edits and say so.
