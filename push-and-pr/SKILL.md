---
name: push-and-pr
description: Push the current branch and open a GitHub PR following the team's PR conventions (concise "PROJ-1234 - title", body = ticket link first, then short Why/What). Use when the user says "push and open a PR", "create the PR", "raise a PR", "open a pull request", or asks to push + PR after committing work.
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
2. **Pre-empt any pre-push hook**: run the repo's typecheck (and whatever else
   the hook runs — check `.husky/pre-push` or equivalent) yourself first.
   Prefer the repo's own script (e.g. `npm run typecheck`) over raw
   `tsc --noEmit` — project scripts often use a stricter, test-inclusive
   config that catches more. Fix any failures and commit before pushing.
   Skipping this just moves the failure into the push.
3. Push: `git push -u origin <current-branch>`.
   - If the pre-push hook fails, the push is rejected and nothing lands on
     origin — fix, commit, push again.
4. Open the PR with `gh pr create` (see format below).
5. **Optionally request a Copilot review** (separate step, after the PR
   exists), if the team uses it:
   `gh pr edit <PR-URL> --add-reviewer Copilot`.
   - If `Copilot` doesn't resolve as a handle, fall back to
     `gh api repos/{owner}/{repo}/pulls/<N>/requested_reviewers -f 'reviewers[]=copilot-pull-request-reviewer[bot]'`.
   - If the request fails: warn the user and continue — the PR is already
     created; don't retry, don't block. Fire-and-forget: never wait for
     Copilot's review to land.
6. Report the PR URL.
7. **If the branch was pushed from a git worktree**, remove that worktree now
   (`git worktree remove <path>`) so the branch is free to check out manually
   later. Detect via `git worktree list` / the current path under
   `.claude/worktrees/`. The branch is safe on origin; only remove a clean
   worktree — if it has uncommitted changes, stop and tell the user.

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
- No ticket → ask for the link, or draft one for approval; never file a ticket
  without the user approving its content.
- Never add a `Co-Authored-By` line or AI-attribution footer anywhere.
- Body is the ticket link first, then a short Why (motivation) and What (changes) — skimmable, not exhaustive.
- Pushing/PR-ing is an outward action the user asked for — creating the PR is
  authorized, but don't also merge, retarget, or force-push without asking.
