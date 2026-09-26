---
name: implement
description: Implement a piece of work based on a plan, PRD, or set of issues — branch from a confirmed base (optionally in a worktree), build with TDD, review, and keep the plan file in sync. Use when the user says "/implement", "implement this plan", "build this", or hands over a PRD/issue to execute.
group: build-implement
---

Implement the work described by the user in the plan, PRD, or issues.

**Mode.** This skill runs attended by default. It runs unattended only when
invoked with an explicit `--unattended` flag, which an unattended launcher
passes. Do not infer the mode from TTY presence. A launcher can run the agent
on a pty, so a TTY can exist even when nobody is watching.

Two places behave differently between the two modes: the review-fix loop
(see [REVIEW-LOOP.md](REVIEW-LOOP.md) for its round commit gate, rejection
handling, and end-of-loop escalation) and how an unattended run treats the
plan's open questions (next paragraph). Everywhere else in this file, treat
both modes as identical unless a section says otherwise.

**A plan's `## Open questions` are not yours to settle.** An unattended run
reads that section before starting.

- [ ] **Blocking entry:** leave its dependent steps untouched. Record in the
      review queue which steps you skipped and why. The plan marked it
      blocking because guessing there is unsafe.
- [ ] **Non-blocking entry:** decide the most reasonable default, as usual.
      Mark that review-queue entry as resting on an unsettled plan question,
      not a design decision the plan made. Review needs to tell apart a
      choice you made from a gap the plan left.
- [ ] **Attended run:** ignore all of this. Ask the user.

**No function ships ahead of a real caller.** The governing
agent-instructions file's "Working style" section owns this rule — read it
there. A plan step fails this rule when nothing in this ticket's own call
chain calls the new symbol. Treat a failing step the same as a blocking
`Open questions` entry: attended asks the user, unattended skips the step
and logs why in the review queue.

**Nested skills.** Slash forms such as `/tdd` and `/review` below are Claude
Code's invocation syntax — invoke them with its Skill tool. In Codex, invoke
the registered skill by name and follow its instructions in the current
agent, or tell a spawned agent which registered skill to use. The
platform's skill catalog supplies the full instructions. Do not paraphrase
them from memory.

**Model split.** Use the governing agent-instructions file's model-split
rule for the implementation session and every fresh agent it spawns. This
skill cannot change the current session's model. When spawning in Codex,
set the resolved model explicitly — do not let it inherit the author's
model.

**Already-prepared worktree.** A launcher may create the worktree and check
out the feature branch before starting the agent. When that's already done,
skip the entire "Branch first" and "Worktree" sections below — their
preconditions are already met. Start at "Implement" instead.

**Record the start time before anything else.** Run `date -u +%H:%MZ` as you
begin. Write the elapsed time into the review queue header when you finish
(format in [REVIEW-LOOP.md](REVIEW-LOOP.md)). Nobody watches an unattended
run, so this is the only real source for the agent half of the ticket's
worklog. The push-and-PR step asks for that figure when it opens the PR,
and after an overnight run any other answer is a guess.

**Docs worktrees.** A worktree can hold a prose vault instead of code.

- [ ] Follow the vault's style guide. The vault's own notes say where it
      lives — it may sit outside the vault.
- [ ] **Never reformat its files.** Prose vaults are usually not
      formatter-managed. A whole-file reformat is unreviewable and cannot
      be cleanly reverted. Touch only the prose you were asked to change.
- [ ] Never edit the editor's own config directory. Its plugin files run
      on the host.

**Cross-repo features.** You may get several worktrees at once — one per
service, all on the same ticket branch. Your working directory starts in
the one where the contract originates. Treat this as **one** piece of
work, not several.

- [ ] Design the contract once. Then implement each side against it. A
      single agent holds every repo specifically to prevent contract
      drift — keep the response shape and its consumer in step, and name
      the same fields on both sides.
- [ ] **Commit per repo** — each repo's history is its own PR. Keep the
      commits consistent: every repo's tests pass green before you call a
      round done.
- [ ] One side deploys first, and its contract is the one the other side
      follows. Which side that is is a project fact. Take it from the
      repos' agent config or the launch brief. Absent both, treat the side
      where the contract originates — your starting working directory —
      as the one that deploys first.

## Branch first — before writing any code

1. [ ] **Ask two things up front** (never assume either): the base branch
       to cut from, and whether to work in a git worktree (see
       [Worktree](#worktree) below). Ask about the worktree *every time* —
       don't infer it from context or default to a plain checkout. Wait
       for the answer.
2. **Update the base from origin first.** If the user names a branch,
   fetch it, so the new branch cuts from the latest:
   - [ ] `git fetch origin <base>`
   - [ ] Branch off the freshly-fetched ref: `git checkout -b
         <feature-branch> origin/<base>`. This guarantees you're on
         updated origin, not a stale local copy.
3. [ ] Name the feature branch after the work. If there's a tracker
       ticket, use the ticket key (e.g. `PROJ-1234`).

Do this even when a usable branch is already checked out. Branching off the
wrong base — a release/bump branch instead of the integration branch —
drags unrelated commits into the eventual PR.

## Worktree

**Always ask** whether to use a worktree (part of the up-front branch
question — never skip it). A worktree keeps the current checkout untouched
and lets parallel work continue. The user often has other branches in
flight.

If yes, create the feature branch as a worktree instead of a plain
`checkout -b`:

- [ ] `git fetch origin <base>` first (same as above).
- [ ] `git worktree add -b <feature-branch> <path> origin/<base>` — cut
      from the freshly-fetched ref.
- [ ] Run the rest of the skill from inside `<path>`.
- [ ] Ask where to put the worktree if the user didn't say.

**Set up the fresh worktree before running anything in it.** `git worktree
add` never brings untracked files along, so do this unconditionally — not
only when a project's own notes happen to mention it. From the main
checkout:

- [ ] For each of `.env` and `node_modules` that exists there: symlink it
      into the new worktree (`ln -sfn <main-checkout>/<name>
      <worktree>/<name>`). Use a symlink, not a copy, so the worktree
      always sees the main checkout's current version.
- [ ] Copy any present `CLAUDE.local.md` and `AGENTS.override.md` into the
      worktree. Do not symlink local instruction overrides.
- [ ] Skip any source path the main checkout does not have.
- [ ] Check the project's own notes for anything beyond these paths — a
      project-specific env var, a service that must already be running.

## Implement

**Attended only, once, right before the first step's preview:** print the
command to watch the branch's live diff in an editor terminal, so the user
can follow commits landing without asking for it each time. For nvim:
`cd <worktree-or-checkout-path> && nvim -c 'term watch -n2 --color git
show --color=always HEAD'`. Print it once per ticket, not per seam.

**Full ticket record, when there's no plan doc.** A plan doc already
carries the full picture. A bare ticket key does not — an issue's short
`description` (or summary) is not the whole ticket.

- [ ] Before writing any code, fetch the tracker issue's full field set:
      description plus every Acceptance-Criteria/Technical-Requirements-
      equivalent field the project's own ticket template carries. Don't
      settle for whichever fields an earlier pickup step happened to read
      for an unrelated purpose (a start-date stamp, a status check). A
      field read once for one reason does not substitute for reading it
      for this one.
- [ ] A missed AC/TR line surfaces expensively — as a review-round
      escalation instead of a first-pass read, or not at all.

**Known patterns.**

- [ ] If the governing agent-instructions file points to a lessons file of
      patterns past review loops have actually caught, pull this ticket's
      repo tag out of it before writing any code. Its own header explains
      how — a bootstrap step included, so finding out how doesn't itself
      cost the whole file.
- [ ] Before your first commit, decide which entries apply to this ticket
      and which don't. Record it in that commit's message, even when the
      answer is "none apply." A pattern already known from a past session
      should not need rediscovering as a fresh finding later.

### Per-seam preview (attended only)

**Unattended:** skip this — nobody is here to answer a pre-write gate.

**Attended:** before writing a seam's code (before invoking `/tdd` below),
for each seam:

A seam is the same unit the commit rule further down treats as one commit.
A plan's `## Steps` entry can span more than one seam, or one seam can
span more than one `## Steps` entry — a production-code entry and its
own-test entry are one seam, one commit.

- [ ] Announce the seam in one line: what's changing, and why, per the
      plan.
- [ ] Decide whether the seam has a shape worth drawing, using the
      `show-me` skill's own `FORMS.md` rule. A genuine logic or algorithm
      change gets a `/show-me` pseudocode diff (before/after). A literal,
      copy, or mechanical change — a constant's value, a test that
      mirrors an existing sibling's exact shape with only its literals
      changed — gets no drawing: "some changes have no shape... draw
      nothing." A no-shape seam still gets the announce, and gets its
      actual diff shown (`git diff`) once written, rather than nothing at
      all.
- [ ] Wait for the user's clear go-ahead (e.g. "go", "yes", "ok") before
      writing any code for this seam.

This applies only to a plan's `## Steps` commits. The review-fix loop's
per-round fixes and the Quality passes further down run exactly as
[REVIEW-LOOP.md](REVIEW-LOOP.md) and [QUALITY-PASSES.md](QUALITY-PASSES.md)
already specify, with no pre-write preview. Both respond to a reviewer's
findings neither side has read yet, so there is nothing to preview.

Use the `tdd` skill where possible, at pre-agreed seams:

- [ ] A seam's size is what its plan's own Acceptance Criteria and Test
      conditions demand, not the size of the code change. A one-line
      condition removal with a multi-line list behind it is still a seam.
      Skipping `/tdd` because the diff looks trivial is exactly how an
      AC-to-assertion mapping gap survives to review instead of being
      caught before the first commit (`/tdd` Planning's own rule for
      this).
- [ ] At the start of each seam, invoke the `tdd` skill yourself in the
      current author context. Do not spawn a separate subagent for it —
      it needs the ticket's accumulated context (prior commits, branch
      state), unlike the review skill below, which forks precisely
      because it must *not* share the author's context.
- [ ] Do not read `tdd/SKILL.md` once and reproduce its steps from memory
      or copy-paste. A paraphrase drifts from the real file the moment
      it's edited, and silently drops whatever the edit added.

- [ ] Write to the governing agent-instructions file's "Code clarity &
      comments" section as you go — names, comments, parameter shapes —
      not only at the `/clarify` pass below. `/clarify` verifies with
      fresh eyes once the shape is final. It is not a substitute for
      writing clean code the first time.

Run single test files regularly. Right before each step's own commit —
not after every edit — run typechecking once and the tests once:

- [ ] Run typecheck once. Skip only when nothing in this commit's diff
      could affect what the type checker sees: a comment-only change, a
      prose/doc/runbook file, a string literal with no type implication.
      Run it whenever the diff touches a signature, an expression, or
      anything else the checker actually evaluates. This is the only
      copy of this skip rule — the review-fix loop's own typecheck step
      applies the same test rather than restating it.
- [ ] Run the project's own lint command once too, over the files changed
      since the loop's base. Where the governing agent-instructions file
      says to skip lint for this repo, skip it — do not run it there.
      Where it isn't skipped: a pre-commit hook that's supposed to catch
      this can silently no-op, most commonly in a git worktree, where
      husky's hooks don't always regenerate. Run lint directly rather
      than trusting the hook fired. Don't rely on it surfacing only at
      push, in CI, or in a later review pass.
- [ ] Run tests once, scoped to this commit: for each production file
      changed since the loop's base, its colocated test file(s) (same
      basename, same directory — `.spec.ext`/`.test.ext`), plus any test
      file edited directly. A changed file with no colocated test
      contributes nothing to the run — typecheck and the review loop
      cover what a test file can't. This is the default everywhere. Run
      the project's full suite only when the repo's own agent config
      explicitly names a broader command (the same carve-out the
      previous bullet gives typecheck). Most repos already get a full
      run from CI on push — a repo without one is exactly the case for
      that config to ask for a local one instead.
- [ ] Use the project's own scripts for all three (single test files,
      typecheck, tests). Find them in the repo's manifest. The repo's
      agent config wins where it names a narrower command — e.g. a
      wrapper that serializes typecheck runs on a memory-constrained
      host. Never invoke the underlying test runner directly (`npx jest
      <file>`, `npx vitest <file>`, or the stack's equivalent). The
      project's own script carries config, setup, and env vars a bare
      invocation skips — pass the file path through to that script as an
      argument instead (`npm run test:unit -- <file>` or whatever the
      manifest names it). A full-project typecheck is expensive enough
      — cold, minutes on a large backend — that running it per edit
      rather than per commit is where that cost actually goes.

Commit each `## Steps` entry to the feature branch once its own tests are
green — not the whole ticket at once. Tick that entry's checkbox in the
plan when its commit lands (see "Keep the plan in sync" below).

**Attended only:** show the diff (`git diff`) for this commit and wait for
an explicit go-ahead before running `git commit`. This gate is separate
from the per-seam preview above (before writing the code) and the review
guide below (after the commit already landed). Unattended has no one to
approve — it commits as soon as its own tests are green, same as before.

### Per-step review checkpoint (attended only)

**Unattended:** skip this whole subsection. Implement every remaining
step straight through, and let the commit above stand for the whole
ticket, same as before this subsection existed. Nobody is here to answer
a stop.

**Attended:** after each step's own commit:

- [ ] Write a short review guide — a navigation aid, not a second design
      document. Cover: one line for what changed, the file/read order to
      start with, the key design decision this step introduced (if any),
      what the tests added this step prove, and a deviation-from-plan
      line only when this step actually diverged from what the plan
      said. Omit diff size — the diff itself already shows that.
- [ ] If the per-seam preview above drew a shape for this step, render
      the actual landed implementation in that same form, so the user
      can compare the two. A step whose preview drew nothing (no shape
      existed) keeps the review guide prose-only. Do not manufacture a
      rendering it never needed at preview time.
- [ ] Ask: "Continue, or run `/review` on this diff first?"
  - **Continue** — move to the next step.
  - **Run `/review`** — call it with the fixed point pinned at the
    ticket's own base, and the path list (its step 1a input) set to this
    step's changed files only. The axes still see the whole ticket as
    context, but judge only this step's files. Never pass apply mode
    here — this call stays read-only, same as any standalone `/review`
    call. Read its report. For a documented breach (defined in
    [REVIEW-LOOP.md](REVIEW-LOOP.md)), apply its proposed fix diff
    verbatim — copy it, don't re-derive it from the finding's
    description. For everything else, apply the same fix/escalate
    classification [REVIEW-LOOP.md](REVIEW-LOOP.md) uses. Then ask
    again.
  - **Feedback instead of either** — apply it, amend this step's commit
    (nothing has been pushed yet, so this doesn't touch the "don't amend
    pushed branches" rule), append one line under a `## Step N —
    feedback` heading in the review queue (create the file now, at this
    location, if this is the first entry it needs — see
    [REVIEW-LOOP.md](REVIEW-LOOP.md) for the file's location and
    format), then ask again.

## Review-fix loop

Once the work is committed and green, run a review-fix loop rather than a
one-shot review. Read [REVIEW-LOOP.md](REVIEW-LOOP.md) before running
this — it holds the round-by-round spawn/apply/escalate mechanics, the
convergence and iteration-cap rules, and the review-queue file format.

It hands back one of three outcomes: a converged branch, a branch that
hit its iteration cap, or a branch stuck on one finding. An attended run
then grills every escalation before moving on.

## Quality passes — after the loop converges

Further passes run over the same branch diff once the review-fix loop
converges: a repo-declared security review (when one applies), then
`/simplify`, then `/clarify`, then a coverage-gap test-writing pass (when
CI's post-push report calls for one). Read
[QUALITY-PASSES.md](QUALITY-PASSES.md) before running this section — it
holds the exact order, why that order holds, and the fresh-subagent
dispatch rules.

## Push

Once the quality passes are committed, hand off to `/push-and-pr` for the
push:

- [ ] **Attended only** — an unattended run has no one to answer that
      skill's own always-ask questions. It leaves the branch unpushed,
      and says so in the review queue instead.
- [ ] **This applies whether or not a PR already exists.** A branch this
      skill resumed onto an already-open PR is a re-push, not a fresh
      one. `/push-and-pr` has its own instructions for exactly that
      case: reconcile the PR body against the new commits, remind the
      user to request the Copilot review at a deeper effort level, and
      log the *additional* effort as a `rework` worklog rather than a
      fresh one. Treating a continuing PR's push as plumbing that
      doesn't need the skill is the mistake to avoid here — every push
      this skill makes to a ticket's branch is a `/push-and-pr` moment,
      not only the first one.

## Keep the plan in sync

If the work came from a `docs/plans/` plan (plan-in-docs), update that
plan file as the work lands. The plan is the source of truth, not a
write-once doc.

- [ ] Tick the `Steps` checkboxes (`- [ ]` → `- [x]`) for each step
      completed.
- [ ] Record what actually happened when it diverges from the plan:
      verification results, decisions changed mid-flight, steps
      deferred, PR/commit links (add `pr:`/`pr2:` frontmatter keys).
- [ ] **After writing to the ticket or plan, re-read the field to
      confirm the write actually landed** before recording in the commit
      message or review queue that it's done. A claim of having updated
      it is not evidence that it happened. Confirmed once: a review
      round's own commit message and the review queue both said the
      ticket's AC and the plan's Decisions had been rewritten. A later
      round, reading the actual ticket, found neither edit had landed.
- [ ] Redraw `## Technical Requirements`' diagram as-built when the code
      landed somewhere other than the drawing. The drawing is
      indicative, so diverging from it is not a failure — but the plan
      has to end up holding the picture that shipped, beside the record
      of what moved, or the next reader reviews a shape that never
      existed. Touching a file the section's `Must not touch` line lists
      as untouched is the exception: that is scope, not shape, and it
      goes in the run report as well as the plan.
- [ ] A `## Decisions` entry that describes a code mechanism — not just
      what changed, but how — needs that description checked against the
      actual code before it's written. A plausible paraphrase of intent
      can name a mechanism the code doesn't have. Confirmed once: a
      Decision said a health exclusion worked via an early return inside
      one function, when the code actually checked a flag at each call
      site instead. Nothing else catches the mismatch once it's in
      prose.
- [ ] Move `status:` along the lifecycle: `draft` → `active` when
      implementation starts, `done` only when every step is complete (a
      multi-phase plan stays `active` until the final phase ships).
- [ ] **Update this ticket's `## Time` row.** Write the session's summed
      `agent-time` into the row's agent cell — update the running total,
      don't append a log line. The plan is a working ledger; the
      tracker's worklog is the audit trail. Do this for an attended run
      only. An unattended one has no plan access at all (below).

**When the plan is not writable, do not attempt any of it.** A sandboxed
run has the vault readable and deliberately outside `allowWrite`, and
`implement-queue` forbids plan writes outright. A subagent following this
file as its brief would spend a denied tool call, then file an
escalation that reads like a real finding.

- [ ] Write what you *would* have changed into the review queue instead:
      which steps completed, the as-built shape where it moved, the
      status the plan should reach, and any file you touched that
      `## Technical Requirements`' `Must not touch` line listed as
      untouched. The human transcribes it — the same route the
      `agent-time` figures already take.

Do this before ending the turn, so the plan reflects reality for the next
session.
