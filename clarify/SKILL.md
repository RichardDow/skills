---
name: clarify
description: On-demand clarity-refactor pass — make code self-explanatory by structure (rename, extract, restructure, re-layout) and delete the comments that structure makes redundant. Behaviour-preserving; edits a diff. Use when the user says "/clarify", "make this self-explanatory", "clean up the names/structure", or wants a readability pass on changed code. Distinct from /simplify, which may change behaviour to reduce or generalise code — /clarify never changes behaviour.
group: review-quality
---

# clarify

Make code explain itself through structure, so comments are not needed. This is the enforcement pass for the "self-explanatory code" rule stated in the **Code clarity & comments** section of the governing agent-instructions file.

## What it is vs /simplify

- `/simplify` — *is there less code, at the right depth?* Reuse, simplification, efficiency, altitude. May change behaviour.
- `/clarify` — *is the code self-explanatory without comments?* Naming, extraction, control-flow shape, file layout, comment hygiene. Never changes behaviour.

They may produce different diffs on the same file. Run either independently.

## Where it runs

<!-- CLAUDE-SPECIFIC: this skill spawns a fresh subagent via the Claude Code Agent
     tool. Another agent needs its own version using its own subagent mechanism. -->

- [ ] Run in a fresh subagent, never inline. The point is a context that did not write the code — an author clarifying its own diff re-reads its own reasoning and finds the names it already chose to be clear.
- [ ] Spawn on the tier the governing agent-instructions file names for code-facing judgement, naming that model explicitly on the spawn — never inherit the calling session's model.
- [ ] Hand the subagent: the target diff, the branch's commits, and any review queue. The commits are where the rationale it must rehome into the clarify commit message already lives.
- [ ] Let the subagent make the edits and write that commit.

## Scope

- [ ] Default: changed code only — the branch diff vs its base, same as `/simplify`.
- [ ] Override: `/clarify <path>` operates on that file or directory instead.
- [ ] A clarity fix that must touch code outside the diff (e.g. renaming an exported symbol used elsewhere) updates **every call site** — correctness requires it — and the summary **reports the ripple** explicitly. A local readability fix never silently rewrites unrelated files.

## Hard constraint: behaviour-preserving

Only refactors a compiler/test would treat as equivalent:

- [ ] rename variable / function / type
- [ ] extract function or variable; inline a needless indirection
- [ ] split a file; reorder declarations
- [ ] reshape control flow **only** when the result is provably equivalent (e.g. early-return instead of nesting)
- [ ] replace a comment with a named construct
- [ ] if making code clearer seems to **require a real logic change** (flip a guard, merge branches, reorder effects), do **not** apply it — flag it as a separate suggestion for the user to decide

## Clarity policy

The authority is the **Code clarity & comments** section of the governing agent-instructions file, subsections included — the user-level `CLAUDE.md`, plus any repo-level `CLAUDE.md` or `AGENTS.md` covering the changed files. Read it and apply it as written, every subsection it carries, not the comment rules alone.

Where no such section is in scope, fall back to:

- [ ] **What/how comments** — delete, and restructure so the code still reads clearly without them.
- [ ] **Why an implementation looks this way** — move into the commit message, then delete the comment.
- [ ] **Why a reader would otherwise break it** — keep, 1–2 lines, only when a competent dev would not get the constraint from careful reading AND nothing else (rename, extracted constant, type, test assertion) fails or reads wrong if it breaks. A narrow exception, not a category to aim for. **"This documents obscure third-party library behaviour" is not itself a guard** — a fact about `axios`, a framework, or a runtime is cut exactly like a fact about this repo's own code once something else would catch its violation; the fact's obscurity only matters for the first half of the test (would a careful read reveal it), never as a substitute for checking the second half.
- [ ] **JSDoc** — keep on exported functions whose contract is not obvious from the signature. Describe the contract, not the reasoning.
- [ ] **A documented repo convention wins** — a README or `spec/` file requiring a comment at a specific spot (an opt-out flag, a stand-in, a debt marker) overrides the minimization default there.
- [ ] A comment deleted because its content belongs in history **must** have that content carried into the commit message for the clarify commit — deleting rationale without rehoming it loses it.

### Density check

- [ ] If a file's diff is a third comment by line count, report it as a finding in itself and treat every block as guilty until proven to be an edit-time constraint. Comment blocks outnumbering the constructs they sit on is a finding in itself, not a style preference.

## Verification

A rename or an extraction is only safe if something checks it, so verify the way the repo allows.

- [ ] **Where the repo has a working typecheck**, run the project's own script for it. Find it in the repo's manifest (`package.json` scripts, a `Makefile` target, or the equivalent for the stack); the repo's agent config wins where it names a narrower command. Never hardcode a tool binary. Behaviour-preservation is then machine-checked.
- [ ] **Where the agent's instructions say to skip typecheck or lint** — the repo's config or the user's global one, usually a pre-existing error baseline that would drown a real failure — do not run it. Update all call sites via exhaustive search instead, and rely on the visible ripple report. If a change is too broad to verify by search alone, decline it and flag it rather than guess.

## Workflow

1. [ ] Resolve the target (diff by default, or the given path).
2. [ ] Read the code. For each unclear spot, pick the smallest structural fix that removes the need for explanation.
3. [ ] Apply behaviour-preserving edits. Update every affected call site.
4. Read every line of every file the target touches — the whole file, not the changed hunks. Extracting the comments is not reading: an identifier named after a word you have just removed from the docstring above it is invisible to a grep or a comment dump, and that is the miss this step exists to catch. Then, for every comment and JSDoc block in those files:
   - [ ] Split it clause by clause; name which category of the authority's comment policy each clause falls under — never judge the block as one unit, since a block that mixes categories otherwise survives whole on the strength of its one qualifying clause.
   - [ ] Before deleting a why-you'd-break-it or JSDoc-contract clause, name the actual guard — the rename, extracted constant, type, or test assertion that would fail or read wrong if the fact it states were violated. No named guard means the clause stays, trimmed to 1–2 lines, even for a fact that lives in this repo's own code.
   - [ ] Before *keeping* a clause on the "nothing else would catch its violation" half of the bar, actually search for a covering assertion — a test that already asserts the same fact, a type, a lint rule — rather than concluding none exists from memory of what the file's tests probably cover. A clause kept on an unverified "no guard exists" claim, when a guard was there all along, is the same miss as skipping the search on the delete side.
   - [ ] Before deleting any clause, check whether the repo's own docs require a comment at that spot (an opt-out flag, a stand-in, a debt marker) — a documented convention overrides the minimization default there.
   - [ ] Delete a clause that falls under none of these; delete the whole block once every clause is gone.
   - [ ] For every identifier declared in those files — not only the ones the diff introduces — name the plain word it uses, or rename it.
   - [ ] Report the file, line and block counts, how many blocks were split, and how many clauses were kept because no guard was found.

   A file you did not open is a file you did not check.
5. Check every function, method and constructor declared in those files against the authority's parameter policy, where it states one. A signature is the only label a call site gets, so a parameter list the policy would object to is a clarity defect and not a style preference:
   - [ ] Fix it and update every call site.
   - [ ] Report how many signatures you checked and how many you changed.
   - [ ] Where the authority states no parameter policy, skip this step and say you skipped it.
6. [ ] Verify per the repo rule above.
7. [ ] Write the clarify commit message, carrying the rationale from every comment deleted for belonging in history.
8. [ ] Summarize: the clarity fixes made, any cross-file ripple, and any logic-change suggestions flagged (not applied).

## Clean exit

If the target is already self-explanatory, make no edits and say so.
