---
name: clarify
description: On-demand clarity-refactor pass — make code self-explanatory by structure (rename, extract, restructure, re-layout) and delete the comments that structure makes redundant. Behavior-preserving; edits a diff. Use when the user says "/clarify", "make this self-explanatory", "clean up the names/structure", or wants a readability pass on changed code. Distinct from /simplify (which cuts code volume) — /clarify improves understandability.
---

# clarify

Make code explain itself through structure, so comments are not needed. This is the enforcement pass for the "self-explanatory code" rule (see the `concise-comments` memory).

## What it is vs /simplify

- `/simplify` — *is there less code?* Reuse, dead code, redundant abstraction, efficiency.
- `/clarify` — *is the code self-explanatory without comments?* Naming, extraction, control-flow shape, file layout, comment hygiene.

They may produce different diffs on the same file. Run either independently.

## Scope

- **Default: changed code only** — the branch diff vs its base, same as `/simplify`.
- **Override:** `/clarify <path>` operates on that file or directory instead.
- A clarity fix that must touch code outside the diff (e.g. renaming an exported symbol used elsewhere) updates **every call site** — correctness requires it — and the summary **reports the ripple** explicitly. A local readability fix never silently rewrites unrelated files.

## Hard constraint: behavior-preserving

Only refactors a compiler/test would treat as equivalent:

- rename variable / function / type
- extract function or variable; inline a needless indirection
- split a file; reorder declarations
- reshape control flow **only** when the result is provably equivalent (e.g. early-return instead of nesting)
- replace a comment with a named construct

If making code clearer seems to **require a real logic change** (flip a guard, merge branches, reorder effects), do **not** apply it. Flag it as a separate suggestion for the user to decide.

## Comment policy

**A comment is a smell.** Needing prose to explain code is the signal that the code is not good enough yet. Try structure first for every comment, every time.

**The default home for an explanation is the commit message, not the file.** Rationale is tracked across commit messages, PR descriptions, review threads and tickets — that record is searchable, dated, and attached to the change that motivated it. An inline comment is a fifth copy that nothing keeps in sync. So when structure genuinely cannot carry a *why*, the first question is not "how short can this comment be" but "does this belong in the commit message instead". Usually it does.

- **What/how comments** — narration of what the code does. Delete. If the code read clearly only because of the comment, restructure or rename so it still reads clearly without it.

- **Why an implementation looks this way** — the reasoning behind a choice, a rejected alternative, the history of a decision, what a reviewer asked for. This is commit-message material. Move it there and delete the comment. This covers most surviving comments in practice.

- **Why a reader would otherwise break it** — a constraint that bites at the point of edit, where the person about to change this line will not be reading git history: an external API's quirk, a load-bearing ordering, a value pinned for a reason invisible on the page. Keep, 1–2 lines, stating the constraint and what triggers it. This is a narrow exception, not a category to aim for.

- **JSDoc** — keep on exported functions whose contract is not obvious from the signature. Drop on self-evident ones. Describe the contract, not the reasoning.

When a comment is deleted because its content belongs in history, the pass **must** carry that content into the commit message for the clarify commit. Deleting rationale without rehoming it loses it.

### Density check

Comment blocks outnumbering the constructs they sit on is a finding in itself, not a style preference. If a file's diff is a third comment by line count, the pass reports it and treats every block as guilty until proven to be an edit-time constraint.

## Verification

A rename or an extraction is only safe if something checks it, so verify the way the repo allows.

- **Where the repo has a working typecheck**, run it over the touched files after the pass. Behavior-preservation is then machine-checked. Use the repo's own script rather than the compiler binary.
- **Where the agent's instructions say to skip typecheck or lint — the repo's config or the user's global one** — usually a pre-existing error baseline that would drown a real failure — do not run it. Update all call sites via exhaustive search instead, and rely on the visible ripple report. If a change is too broad to verify by search alone, decline it and flag it rather than guess.

## Workflow

1. Resolve the target (diff by default, or the given path).
2. Read the code. For each unclear spot, pick the smallest structural fix that removes the need for explanation.
3. Apply behavior-preserving edits. Update every affected call site.
4. Apply the comment policy over the touched code.
5. Verify per the repo rule above.
6. Write the clarify commit message, carrying the rationale from every comment deleted for belonging in history.
7. Summarize: the clarity fixes made, any cross-file ripple, and any logic-change suggestions flagged (not applied).

## Clean exit

If the target is already self-explanatory, make no edits and say so.
