---
name: push-and-pr
description: Push the current branch and open a GitHub PR following the team's PR conventions (concise "PROJ-1234 - title", body = ticket link first, then short Why/What), and log the effort as a worklog on the ticket. Use when the user says "push and open a PR", "create the PR", "raise a PR", "open a pull request", or asks to push + PR after committing work.
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
5. Open the PR with `gh pr create` (see format below).
6. **Request a Copilot review** (separate step, after the PR exists), where the
   repo has it enabled: `gh pr edit <PR-URL> --add-reviewer Copilot`.
   - If `Copilot` doesn't resolve as a handle, fall back to
     `gh api repos/{owner}/{repo}/pulls/<N>/requested_reviewers -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`.
   - If the request fails: warn the user and continue — the PR is already
     created; don't retry, don't block. Fire-and-forget: never wait for
     Copilot's review to land.
   - Skip it for release PRs raised by a release-orchestration run.
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

## PR format (team convention)

- **Title**: `PROJ-1234 - short title` — concise, no fluff.
- **Body**: the ticket link on the **first line**, then a short **Why** (motivation —
  what problem/goal prompted this, 1–2 sentences) and a short **What** (the changes,
  a few bullets). Keep it skimmable — enough for a reviewer to grasp the intent
  without opening the diff; don't paste the whole commit message or restate every line.

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
- Run the formatter on the changed files **before** pushing. A repo that skips
  lint or typecheck by policy does not thereby skip formatting.
- No ticket → ask for the link, or draft one for approval; never file a ticket
  without the user approving its content.
- Request a Copilot review after opening the PR, except on release PRs.
- Never add a `Co-Authored-By` line or AI-attribution footer anywhere.
- Log effort as a worklog at PR open, commented `agent <N>h / review <N>h`; append a
  new worklog commented `rework <N>h` on re-push after review. Never overwrite an
  earlier worklog; never invent an effort number.
- Body is the ticket link first, then a short Why (motivation) and What (changes) — skimmable, not exhaustive.
- Pushing/PR-ing is an outward action the user asked for — creating the PR is
  authorized, but don't also merge, retarget, or force-push without asking.
