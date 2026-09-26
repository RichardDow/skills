---
name: push-and-pr
description: Push the current branch and open a GitHub PR following the team's PR conventions (concise "PROJ-1234 - title", body = ticket link first, then short Why/What), and log the effort as a worklog on the ticket. Use when the user says "push", "push and open a PR", "create the PR", "raise a PR", "open a pull request", or asks to push + PR after committing work.
group: release-ops
---

# Push & PR

Push the current branch and open a PR in the repo you're in.

## Always ask first

1. **What is the PR against?** Derive it, don't ask. The feature branch's
   tracked upstream is the base it was actually cut from — `/implement`'s
   own "Branch first" step creates it from `origin/<base>` explicitly
   (`git checkout -b <feature-branch> origin/<base>`, or the worktree
   equivalent), and git records that as the upstream. Read it with
   `git rev-parse --abbrev-ref <branch>@{upstream}` (strip the `origin/`
   prefix for the base branch name). Only fall back to asking which
   branch to PR against when the current branch has no tracked upstream
   — created some other way. Never assume `main`/`dev`/`master` in that
   fallback.
2. **Ticket link** — try to derive it before asking:
   - Get the branch: `git branch --show-current`.
   - Extract the ticket key (case-insensitive) — a `PROJ-123`-style key
     (`[A-Z]+-\d+`) or a `#123` issue number. Branch names usually carry
     the key, e.g. `PROJ-9802` or `PROJ-9802-some-slug`.
   - Build the link from the project's tracker base URL. Look for it in
     `CLAUDE.md` or the repo's docs (e.g.
     `https://<org>.atlassian.net/browse/<KEY>`, or the repo's own
     issues/`<N>` for `#N`). Ask if the base URL isn't discoverable.
   - **Only if no key is present**, ask the user for the ticket link.
   - **Never create a ticket yourself.** If the user wants one created —
     any phrasing, "ticket," "draft ticket," "raise a ticket" — hand off
     to the `create-jira-task` skill by name. It owns the drafting, the
     per-type field template, and the approval wait. Never call
     `createJiraIssue` directly. A skill argument is never that
     approval.

## Workflow

1. Confirm work is committed: `git status --short`. If there are
   uncommitted changes relevant to this PR, stop and ask — don't push a
   partial branch.
2. **Run the repo's formatter over the changed files**, then commit any
   reflow before pushing. If CI has a format check, a single
   hand-wrapped line fails the build — this is the step that gets
   forgotten until after the push:
   ```bash
   git diff --name-only <base>...HEAD | xargs -r <formatter> --write
   ```
   Prefer the repo's own script — a `format` entry, or whatever it is
   called there — so it picks up the repo's config and ignore file. Find
   it in the repo's manifest (`package.json` scripts, a `Makefile`
   target, or the equivalent for the stack). The repo's agent config
   wins where it names a narrower command. Never hardcode a tool binary,
   and never hand-format to satisfy the formatter — run the tool. This
   applies even where a repo's lint or typecheck is deliberately
   skipped. Formatting is a separate gate.
   A script that bundles lint into formatting (e.g. a `lint:fix` entry
   that runs the linter's own `--fix` mode) is not a formatting script
   for a repo where lint is skipped by policy. Where the only available
   script bundles the two, and the repo separates them at the tool
   level, use the underlying formatter tool directly instead (e.g.
   `prettier --write`). Where the repo doesn't separate them, skip
   formatting there rather than run the bundled lint. Format only files
   belonging to the repo you are pushing.
3. **Pre-empt any pre-push hook.** Run the repo's typecheck yourself
   first, unless the repo's agent config says to skip it. Also run
   whatever else the hook runs — check `.husky/pre-push` or equivalent.
   Prefer the repo's own script over a raw compiler invocation: project
   scripts often use a stricter, test-inclusive config that catches
   more. Fix any failures and commit before pushing. Skipping this just
   moves the failure into the push.
4. Push: `git push -u origin <current-branch>`.
   - If the pre-push hook fails, the push is rejected and nothing lands
     on origin. Fix, commit, push again.
5. **No PR yet for this branch:** open one with `gh pr create` (see
   format below).
   **PR already exists (a re-push):** reconcile the PR body against it
   instead of creating a new one. Don't leave the PR body describing a
   state the new commits already changed. Read the PR's current body,
   check each claim against the commits since the last push, and apply
   the fix with `gh pr edit <N> --body "..."`. Skip it, silently, when
   nothing since the last push invalidated anything it claims. A first
   push has no prior PR body to reconcile — just write it correctly.
   - **Check the ticket's own technical-detail field either way — first
     push included.** A ticket can predate this branch's work: filed
     from an earlier draft of the plan, before implementation changed
     the design. That's a plan `## Decisions` section reworked
     mid-implementation, or a `create-jira-task`-templated Technical
     Requirements field synced before the final state. Staleness there
     isn't only a re-push risk. Read that field whenever the linked
     ticket carries a Decisions or Technical Requirements field with
     existing content — this repo's convention, see any ticket filed by
     `create-jira-task`, or one with a manually-written Decisions field
     — regardless of whether this is the first push or a re-push:
     - First push: check each claim against the full set of commits on
       this branch. There's no "since the last push" yet.
     - Re-push: check each claim against commits since the last push,
       as before.
     - Rewrite a bullet that describes a gap or limitation a commit
       closed, a design choice a commit reversed, or a detail (schema,
       config source, cap value, lock target, allowed values) a commit
       changed. Leave alone anything the commits didn't touch.
     - Apply the fix with `editJiraIssue`. For a templated field (e.g.
       Technical Requirements), keep to that field's own shape (see
       `create-jira-task`'s four-part Technical Requirements format)
       rather than growing it. Skip the edit, silently, when nothing
       invalidates anything the field claims.
6. **Do not request the Copilot review — tell the user to request it.**
   An automated request cannot choose the review effort level, so it
   always runs at the shallowest one. Requesting it from here spends the
   first review at that depth and lands its overview comment before the
   user can ask for a deeper pass — backwards on exactly the PRs where
   depth matters. The effort level is selectable only in the Reviewers
   panel when a human requests the review, or through a repo/org default
   that needs admin rights.
   - So report, with the PR URL: request the review yourself and pick
     the deeper effort level. Say it once, don't nag.
   - Where an admin has set the repo or org default to the deeper level,
     an automated request inherits it and this whole problem
     disappears. If the project's agent config records that, request it
     here instead with
     `gh api repos/{owner}/{repo}/pulls/<N>/requested_reviewers -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`.
     Use the API form, not `gh pr edit --add-reviewer Copilot` — the
     login does not resolve and that command fails.
   - Skip the whole step for release PRs raised by a
     release-orchestration run.
7. Report the PR URL.
8. **Log the effort**, where the project tracks it. Ask if you are
   unsure whether it does — never skip this silently. Opening the PR is
   the "in review" moment. Propose the worklog figures rather than
   asking the user to supply them cold:
   - **First push** (ticket has no worklog): propose agent and review
     figures for start-of-work → in-review. Use the review queue's
     measured `agent-time` when available; otherwise estimate from
     session or subagent duration and commit timestamps. Use measured
     review elapsed time when available; otherwise propose a clearly
     labeled guess. Show the two figures and their total, and ask the
     user to confirm or correct them before writing the worklog.
   - **Re-push after review** (ticket already has a worklog): propose
     the additional effort since the last log using available evidence,
     label any estimate, and ask the user to confirm or correct it.
     Append it as a new worklog commented `rework <N>h` — never edit an
     earlier worklog.
   - Do not leave the worklog blank just because exact timing is
     unavailable. Skip only when there is no ticket key or the user says
     not to log it.
   - **Either case, also update the plan.** If the ticket came from a
     `docs/plans/` plan, write the confirmed review figure into this
     ticket's `## Time` row — update the cell, don't append. Also update
     the agent figure if it moved since `/implement` last wrote it. A
     rework figure updates the row's `rework` cell the same way. The
     Jira worklog is still the actuals source calibration reads. This
     keeps the plan's copy from going stale beside it.
9. **If the branch was pushed from a git worktree**, remove that
   worktree now (`git worktree remove <path>`) so the branch is free to
   check out manually later. Detect it with `git worktree list` and
   match the current directory to its listed path. The branch is safe on
   origin — only remove a clean worktree. If it has uncommitted changes,
   stop and tell the user.
   - **Never remove it while a batch run still owns it.** One agent may
     work several tickets from a *single* worktree, one branch each, so
     removing it after ticket one pulls the floor out from under the
     rest. Detect it by a run-status or review-queue file beside the
     worktree, or by having been invoked by a review-run or batch skill
     — that skill owns the teardown, at the end of its run. A
     single-ticket run has no run-status file, so the review-queue file
     is the signal that catches it.
10. **Ask whether to run `/retro` next.** A yes/no question, once, after
    everything else in this workflow is done. Don't run `/retro`
    unprompted — only offer it.

## PR format (team convention)

- **Title:** `PROJ-1234 - short title` — concise, no fluff.
- **Body:** the ticket link on the **first line**, then a short **Why**
  (motivation — what problem/goal prompted this, 1–2 sentences) and a
  short **What** (the changes, a few bullets). Keep it skimmable —
  enough for a reviewer to grasp the intent without opening the diff.
  Don't paste the whole commit message or restate every line.
- **Why carries no implementation.** No identifiers, file names,
  function names, or mechanism — not one clause. It says who was stuck
  and what they could not do. The test: strike every sentence a
  non-engineer could not have written. If Why empties, it was never a
  Why. Anything explaining *how* moves to What, or is cut.
- **Write it in plain English.** No metaphors, no shorthand borrowed
  from the design discussion. "The panel had nowhere to hang" means
  nothing to a reviewer — "a task could only ever show one panel" is the
  same point in English. Rewrite any phrase that would need this
  conversation to decode.
- **State facts, not a story.** No narrative buildup or suspense framing
  — say what was broken and what changed, not how the incident
  unfolded. A sentence a story could open with ("so it did, until last
  week") does not belong here.
- **Caveats and known limits are What bullets, not an aside.** Don't
  preface them by addressing the reader ("Two things a reviewer should
  know") — state them as bullets in the same list as the changes.
- **Name the real user, and check who they are.** Do not infer the role
  from the feature's name — a checklist called *charges ready for
  finance* is worked by ops, not finance. Getting that backwards
  misdescribes the whole change. Take the role from the ticket, the
  domain docs, or ask. This applies to the ticket's user story too,
  wherever the tracker template has one.

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

- Base branch: derive from the branch's tracked upstream, never guess.
  Ask only when there is no tracked upstream to read (see "Always ask
  first" above for how).
- Why is motivation in plain English, with zero implementation detail
  and no jargon. Verify who the user actually is rather than inferring
  the role from the feature name.
- Run the formatter on the changed files **before** pushing. A repo that
  skips lint or typecheck by policy does not thereby skip formatting.
- No ticket → ask for the link, or hand off to `create-jira-task` to
  draft one. Never call `createJiraIssue` directly, and never file a
  ticket without the user approving its content.
- Never request the Copilot review from here — an automated request
  cannot pick the effort level, so it locks in the shallowest one. Tell
  the user to request it and choose the deeper level. Only request it
  directly where the project's agent config records that an admin has
  already made the deeper level the default.
- Never add a `Co-Authored-By` line or AI-attribution footer anywhere.
- Propose worklog figures grounded in evidence. Label estimates clearly
  and get confirmation or correction before writing. Log at PR open as
  `agent <N>h / review <N>h`. Append `rework <N>h` on re-push. Never
  overwrite an earlier worklog or skip merely because timing is
  uncertain.
- Body is the ticket link first, then a short Why (motivation) and What
  (changes) — skimmable, not exhaustive.
- On a re-push, reconcile the PR body against commits since the last
  push before doing anything else — a body describing a gap/design a
  later commit already changed is worse than no detail. Reconcile the
  ticket's Decisions/Technical Requirements field the same way on
  **every** push, first push included. The ticket can predate the
  branch's work, so staleness there isn't re-push-only.
- PR body is declarative, not narrative — no storytelling framing, no
  reader-address asides. Caveats and known limits go in the What
  bullets, not a separate aside.
- Pushing/PR-ing is an outward action the user asked for — creating the
  PR is authorized, but don't also merge, retarget, or force-push
  without asking.
- Once the workflow finishes, ask if the user wants `/retro` next —
  offer it, don't run it.
