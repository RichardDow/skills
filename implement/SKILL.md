---
name: implement
description: Implement a piece of work based on a plan, PRD, or set of issues — branch from a confirmed base (optionally in a worktree), build with TDD, review, and keep the plan file in sync. Use when the user says "/implement", "implement this plan", "build this", or hands over a PRD/issue to execute.
disable-model-invocation: true
---

Implement the work described by the user in the plan, PRD, or issues.

## Branch first — before writing any code

1. **Ask two things up front** (never assume either): the base branch to cut
   from, and whether to work in a git worktree (see [Worktree](#worktree) below).
   Ask about the worktree *every time* — don't infer it from context or default
   to a plain checkout. Wait for the answer.
2. **Update the base from origin first.** If the user names a branch, fetch it so
   the new branch is cut from the latest:
   - `git fetch origin <base>`
   - Branch off the freshly-fetched ref: `git checkout -b <feature-branch> origin/<base>`
     (this guarantees you're on updated origin, not a stale local copy).
3. Name the feature branch after the work — if there's a tracker ticket, use the
   ticket key (e.g. `PROJ-1234`).

Do this even if a usable branch is already checked out; branching off the wrong
base (e.g. a release/bump branch instead of `dev`) drags unrelated commits into
the eventual PR.

## Worktree

**Always ask** whether to use a worktree (part of the up-front branch question —
never skip it). A worktree keeps the current checkout untouched and lets parallel
work continue; the user often has other branches in flight.

If yes, create the feature branch as a worktree instead of a plain `checkout -b`:

- `git fetch origin <base>` first (same as above).
- `git worktree add -b <feature-branch> <path> origin/<base>` — cut from the
  freshly-fetched ref.
- Run the rest of the skill from inside `<path>`.

Ask where to put the worktree if the user didn't say.

**A fresh worktree may need setup** before tests run: untracked files like
`.env` and installed `node_modules` don't come along — symlink or copy them
from the main checkout (check the project's own notes for specifics).

## Implement

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Commit your work to the feature branch created above once the tests are green.

## Review–fix loop

<!-- CLAUDE-SPECIFIC: this loop spawns a reviewer via the Claude Code Agent tool.
     Another agent needs its own version using its own subagent mechanism. A
     one-shot /review is the fallback if yours has none. -->

Once the work is committed and green, run a review–fix loop rather than a one-shot
`/review`. You are the **author**. Each round spawns a **separate read-only reviewer
subagent** to critique the diff. The reviewer never edits code — it reports, you
edit. Use a different model for the reviewer if you can: an author reviewing its own
diff mostly re-reads its own reasoning.

**Each round:**

1. Spawn the reviewer over the branch diff. It returns a structured list of
   findings, each `{ file, line, severity, category, action, fix_instruction,
   escalation_reason }`, applying this decision rule for `action`:
   - **escalate** if the finding is a product or behaviour decision, an
     architectural choice with more than one defensible answer, a change to a
     public contract / API / DB schema, or anything it is under ~80% sure about.
   - **fix** only for correctness bugs, missing or weak tests, and mechanical
     issues with one obvious right answer.
2. Apply every `fix`: make the change, re-run the touched tests, then re-run the
   **full** suite before the round's commit — a fix can regress an untouched test.
   The loop's invariant is that **every committed round is green**. If a fix breaks
   tests and you cannot resolve it in the same round, do not commit it red. Convert
   that finding to an escalation instead.
3. Append every `escalate` to the review queue file (see below).
4. **If you disagree with a `fix_instruction`, do not silently override it.** Do not
   apply it. Convert it to an escalation: "the reviewer asked X, I think Y because…,
   your call." Disagreement between author and reviewer is itself a signal worth
   surfacing.
5. Commit the round's fixes, then review again.

**Terminate** when any of these fires first: **converged** (a round yields zero
`fix` findings), **iteration cap** (5 rounds), or **no progress** (a round's
findings match the previous round's — auto-escalate the stuck finding). On exit,
write a terminal status line at the top of the review queue: `CONVERGED`,
`HIT_ITERATION_CAP (N rounds, M escalations)`, or `STUCK on <finding>`.

**The review queue** is a markdown file written *outside* the working tree — a
sibling of it, e.g. `../<dirname>-REVIEW-QUEUE.md`. Outside means it can never be
`git add`-ed into a commit and needs no ignore entry, and it survives an agent
restart. When committing, add only the files you actually changed — **never
`git add -A` or `git add .`**. Format: a header (terminal status, counts, the
author and reviewer models, last-commit sha), then one `## ` section per escalation
carrying the reviewer's reason and any author disagreement.

## Comments — propose as candidates, never sprinkle

Comment sparingly: well-named, well-structured code should explain itself, and
most of it does. The exception is code that stays opaque **even after you've
read it fully** — a non-obvious workaround, a hard-won invariant, a surprising
ordering dependency, a "why not the obvious thing" choice. Those are comment
*candidates*, not licence to annotate. A warranted comment is the
minimum-viable-why: the constraint plus what triggers it, 1–3 lines, no
war-stories.

Do not add these comments silently. Instead:

1. While implementing, collect candidates into a list. For each, record:
   - **Where** — `file:line`
   - **Comment** — the exact text you'd add
   - **Why** — what the code cannot explain about itself (the reason a reader
     would still be confused after reading it)
2. Present the full list to the user before adding anything.
3. The user decides which to add. Add only the approved ones; drop the rest.

If nothing in the change is opaque, say so and add no comments — an empty list is
the expected outcome for clear code.

## Keep the plan in sync

If the work came from a `docs/plans/` plan (plan-in-docs), update that plan file
as the work lands — the plan is the source of truth, not a write-once doc:

- Tick the `Steps` checkboxes (`- [ ]` → `- [x]`) for each step completed.
- Record what actually happened when it diverges from the plan: verification
  results, decisions changed mid-flight, steps deferred, PR/commit links (add
  `pr:`/`pr2:` frontmatter keys).
- Move `status:` along the lifecycle: `draft` → `active` when implementation
  starts, `done` only when every step is complete (a multi-phase plan stays
  `active` until the final phase ships).

Do this before ending the turn, so the plan reflects reality for the next
session.
