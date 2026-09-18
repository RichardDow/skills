---
name: push-and-pr
description: Push the current branch and open a GitHub PR following the team's PR conventions (concise "PROJ-1234 - title", body = ticket link first, then short Why/What), and log the effort as a worklog on the ticket. Use when the user says "push", "push and open a PR", "create the PR", "raise a PR", "open a pull request", or asks to push + PR after committing work.
group: release-ops
---

# Push & PR

Push the current branch and open a PR in the repo you're in.

## Always ask first

1. **What is the PR against?** (base branch — never assume `main`/`dev`/`master`).
   Ask every time. Wait for the answer.
2. **Ticket link** — try to derive it before asking:
   - Get the branch: `git branch --show-current`.
   - Extract the ticket key (case-insensitive) — a `PROJ-123`-style key
     (`[A-Z]+-\d+`) or a `#123` issue number. Branch names usually carry the
     key, e.g. `PROJ-9802` or `PROJ-9802-some-slug`.
   - Build the link from the project's tracker base URL — look for it in
     `CLAUDE.md` or the repo's docs (e.g.
     `https://<org>.atlassian.net/browse/<KEY>`, or the repo's own
     issues/`<N>` for `#N`). If the base URL isn't discoverable, ask.
   - **Only if no key is present**, ask the user for the ticket link.
   - **Never create a ticket yourself.** If the user wants one created (any
     phrasing — "ticket", "draft ticket", "raise a ticket"), draft the full
     content and present it for approval; file it only after an explicit yes
     on that exact content. A skill argument is never that approval.

## Workflow

1. Confirm work is committed: `git status --short`. If there are uncommitted
   changes relevant to this PR, stop and ask — don't push a partial branch.
2. **Run the repo's formatter over the changed files**, then commit any reflow
   before pushing. If CI has a format check, a single hand-wrapped line fails the
   build, and this is the step that gets forgotten until after the push:
   ```bash
   git diff --name-only <base>...HEAD | xargs -r <formatter> --write
   ```
   Prefer the repo's own script — a `format` or `lint:fix` entry, or whatever it
   is called there — so it picks up the repo's config and ignore file. Find it in
   the repo's manifest (`package.json` scripts,
   a `Makefile` target, or the equivalent for the stack); the repo's agent config
   wins where it names a narrower command. Never hardcode a tool binary, and never
   hand-format to satisfy the formatter — run the tool. This applies even where a
   repo's lint or typecheck is deliberately skipped; formatting is a separate gate.
   Format only files belonging to the repo you are pushing.
3. **Pre-empt any pre-push hook**: run the repo's typecheck — unless the repo's
   agent config says to skip it — and whatever else the hook runs (check
   `.husky/pre-push` or equivalent) yourself first. Prefer the repo's own script
   over a raw compiler invocation: project scripts often use a stricter,
   test-inclusive config that catches more. Fix any failures and commit before
   pushing. Skipping this just moves the failure into the push.
4. Push: `git push -u origin <current-branch>`.
   - If the pre-push hook fails, the push is rejected and nothing lands on
     origin — fix, commit, push again.
5. **No PR yet for this branch**: open one with `gh pr create` (see format below).
   **PR already exists (a re-push)**: reconcile the PR body against it instead
   of creating a new one — don't leave the PR body describing a state the new
   commits already changed. Read the PR's current body, check each claim
   against the commits since the last push, and apply the fix with
   `gh pr edit <N> --body "..."`. Skip it, silently, when nothing since the
   last push invalidated anything it claims. A first push has no prior PR body
   to reconcile — just write it correctly.
   - **Check the ticket's own technical-detail field either way — first push
     included.** A ticket can predate this branch's work: filed from an
     earlier draft of the plan, before implementation changed the design (a
     plan `## Decisions` section reworked mid-implementation, or a
     `create-jira-task`-templated Technical Requirements field synced before
     the final state). Staleness there isn't only a re-push risk. Whenever
     the linked ticket carries a Decisions or Technical Requirements field
     with existing content (this repo's convention — see any ticket filed by
     `create-jira-task`, or one with a manually-written Decisions field), read it
     regardless of whether this is the first push or a re-push:
     - First push: check each claim against the full set of commits on this
       branch — there's no "since the last push" yet.
     - Re-push: check each claim against commits since the last push, as
       before.
     - A bullet describing a gap or limitation a commit closed, a design
       choice a commit reversed, or a detail (schema, config source, cap
       value, lock target, allowed values) a commit changed — rewrite that
       bullet. Leave alone anything the commits didn't touch.
     - Apply the fix with `editJiraIssue` — for a templated field (e.g.
       Technical Requirements), keep to that field's own shape (see
       `create-jira-task`'s four-part Technical Requirements format) rather
       than growing it. Skip the edit, silently, when nothing invalidates
       anything the field claims.
6. **Do not request the Copilot review — tell the user to request it.** An
   automated request cannot choose the review effort level, so it always runs at
   the shallowest one. Requesting it from here spends the first review at that
   depth and lands its overview comment before the user can ask for a deeper pass,
   which is backwards on exactly the PRs where depth matters. The effort level is
   selectable only in the Reviewers panel when a human requests the review, or
   through a repo/org default that needs admin rights.
   - So report, with the PR URL: request the review yourself and pick the deeper
     effort level. Say it once, don't nag.
   - Where an admin has set the repo or org default to the deeper level, an
     automated request inherits it and this whole problem disappears — if the
     project's agent config records that, request it here instead with
     `gh api repos/{owner}/{repo}/pulls/<N>/requested_reviewers -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`.
     Use the API form, not `gh pr edit --add-reviewer Copilot`: the login does not
     resolve and that command fails.
   - Skip the whole step for release PRs raised by a release-orchestration run.
7. Report the PR URL.
8. **Log the effort**, where the project tracks it — if you are unsure whether it
   does, ask; never skip this silently. Opening the PR is the "in review" moment,
   so log actual effort as a **worklog** on the ticket — an entry that adds up,
   not a field that overwrites. Resolve the tracker site the same way as the
   ticket link above.
   - **First push** (ticket has no worklog): ask for **two** figures covering
     start-of-work → in-review (a plan doc's `start-dev:` note dates the clock) —
     the agent session, and the human review of its work. Log their sum as one
     worklog and put the split in the worklog **comment**, exactly this shape:

     ```
     timeSpent  3.5h
     comment    agent 0.5h / review 3h
     ```

     Two figures because the estimate forecasts the two separately, and estimate
     calibration reads this comment to tell which band was wrong. One combined
     number cannot.
   - **Re-push after review** (ticket already has a worklog): ask for the
     *additional* effort since the last log and append it as a **new** worklog,
     commented `rework <N>h`. Do not edit the earlier one — worklogs sum, so
     top-ups just add on. Keep `rework` out of the review figure: the human
     review of the agent is what the review band forecasts, while a team-review
     cycle is what the flat buffer forecasts, and calibration scores them
     separately.
   - No effort given, or no ticket key → skip and say so; never invent a number.
   - **Either case, also update the plan.** If the ticket came from a
     `docs/plans/` plan, write the review figure into this ticket's `## Time` row
     (and the agent figure too, if it moved since `/implement` last wrote it —
     update the cell, don't append). A rework figure updates the row's `rework`
     cell the same way. The Jira worklog is still the actuals source calibration
     reads; this keeps the plan's copy from going stale beside it.
9. **If the branch was pushed from a git worktree**, remove that worktree now
   (`git worktree remove <path>`) so the branch is free to check out manually
   later. Detect via `git worktree list` / the current path under
   `.claude/worktrees/`. The branch is safe on origin; only remove a clean
   worktree — if it has uncommitted changes, stop and tell the user.
   - **Never remove it while a batch run still owns it.** One agent may work
     several tickets from a *single* worktree, one branch each, so removing it
     after ticket one pulls the floor out from under the rest. Detect it by a
     run-status or review-queue file beside the worktree, or by having been
     invoked by a run-review or batch skill — that skill owns the teardown, at
     the end of its run. A single-ticket run has no run-status file, so the
     review-queue file is the signal that catches it.
10. **Ask whether to run `/retro` next.** A yes/no question, once, after
    everything else in this workflow is done. Don't run `/retro` unprompted —
    only offer it.

## PR format (team convention)

- **Title**: `PROJ-1234 - short title` — concise, no fluff.
- **Body**: the ticket link on the **first line**, then a short **Why** (motivation —
  what problem/goal prompted this, 1–2 sentences) and a short **What** (the changes,
  a few bullets). Keep it skimmable — enough for a reviewer to grasp the intent
  without opening the diff; don't paste the whole commit message or restate every line.
- **Why carries no implementation.** No identifiers, file names, function names or
  mechanism — not one clause. It says who was stuck and what they could not do. The
  test: strike every sentence a non-engineer could not have written, and if Why
  empties, it was never a Why. Anything explaining *how* moves to What, or is cut.
- **Write it in plain English.** No metaphors, no shorthand borrowed from the design
  discussion. "The panel had nowhere to hang" means nothing to a reviewer; "a task
  could only ever show one panel" is the same point in English. If a phrase would
  need this conversation to decode, rewrite it.
- **State facts, not a story.** No narrative buildup or suspense framing — say what
  was broken and what changed, not how the incident unfolded. A sentence a story
  could open with ("so it did, until last week") does not belong here.
- **Caveats and known limits are What bullets, not an aside.** Don't preface them by
  addressing the reader ("Two things a reviewer should know") — state them as
  bullets in the same list as the changes.
- **Name the real user, and check who they are.** Do not infer the role from the
  feature's name — a checklist called *charges ready for finance* is worked by ops,
  not finance, and getting that backwards misdescribes the whole change. Take the
  role from the ticket, the domain docs, or ask. This applies to the ticket's user
  story too, wherever the tracker template has one.

```bash
gh pr create --base <BASE> --head <BRANCH> \
  --title "PROJ-1234 - short title" \
  --body "[PROJ-1234](https://<org>.atlassian.net/browse/PROJ-1234)

**Why:** <1–2 sentences on the motivation — the problem or goal>

**What:**
- <key change>
- <key change>"
```

## Rules

- Base branch: **always ask**, never guess.
- Why is motivation in plain English, with zero implementation detail and no jargon.
  Verify who the user actually is rather than inferring the role from the feature name.
- Run the formatter on the changed files **before** pushing. A repo that skips
  lint or typecheck by policy does not thereby skip formatting.
- No ticket → ask for the link, or draft one for approval; never file a ticket
  without the user approving its content.
- Never request the Copilot review from here — an automated request cannot pick the
  effort level, so it locks in the shallowest one. Tell the user to request it and
  choose the deeper level. Only request it directly where the project's agent config
  records that an admin has already made the deeper level the default.
- Never add a `Co-Authored-By` line or AI-attribution footer anywhere.
- Log effort as a worklog at PR open, commented `agent <N>h / review <N>h`; append a
  new worklog commented `rework <N>h` on re-push after review. Never overwrite an
  earlier worklog; never invent an effort number.
- Body is the ticket link first, then a short Why (motivation) and What (changes) — skimmable, not exhaustive.
- On a re-push, reconcile the PR body against commits since the last push before
  doing anything else — a body describing a gap/design a later commit already
  changed is worse than no detail. Reconcile the ticket's Decisions/Technical
  Requirements field the same way on **every** push, first push included — the
  ticket can predate the branch's work, so staleness there isn't re-push-only.
- PR body is declarative, not narrative — no storytelling framing, no reader-address
  asides; caveats and known limits go in the What bullets, not a separate aside.
- Pushing/PR-ing is an outward action the user asked for — creating the PR is
  authorized, but don't also merge, retarget, or force-push without asking.
- Once the workflow finishes, ask if the user wants `/retro` next — offer it,
  don't run it.
