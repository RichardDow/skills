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

Once done, use /review to review the work.

Commit your work to the feature branch created above.

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
