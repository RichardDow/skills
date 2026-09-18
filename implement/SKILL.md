---
name: implement
description: Implement a piece of work based on a plan, PRD, or set of issues — branch from a confirmed base (optionally in a worktree), build with TDD, review, and keep the plan file in sync. Use when the user says "/implement", "implement this plan", "build this", or hands over a PRD/issue to execute.
group: build-implement
disable-model-invocation: true
---

Implement the work described by the user in the plan, PRD, or issues.

**Mode.** This skill runs *attended* by default, and *unattended* only when
invoked with an explicit `--unattended` (an unattended launcher passes it). Do not
infer the mode from TTY presence — a launcher may run the agent on a pty, so a TTY
exists even when nobody is watching. Two things behave differently: how the
review-fix loop surfaces escalations at the end, and how an unattended run treats
the plan's open questions (next paragraph). Everything else is identical.

**A plan's `## Open questions` are not yours to settle.** An unattended run reads that section before starting.

- [ ] **Blocking entry:** leave its dependent steps untouched and record in the review queue which steps you skipped and why — the plan marked it blocking because guessing there is unsafe.
- [ ] **Non-blocking entry:** decide the most reasonable default as usual, but mark that review-queue entry as resting on a plan question nobody settled, not on a design decision that was — review needs to tell a choice you made from a gap the plan left.
- [ ] **Attended run:** ignore all of this and ask the user.

**No function ships ahead of a real caller** — the governing agent-instructions
file's "Working style" section owns this rule; read it there. A plan step that
fails it (nothing this ticket's own call chain reaches actually calls the new
symbol) gets the same treatment as a blocking `Open questions` entry: attended
asks the user, unattended skips the step and logs why in the review queue.

**Already-prepared worktree.** If a worktree is already created and the feature
branch already checked out (a launcher may do this before starting the agent),
**skip the entire "Branch first" and "Worktree" sections** — their preconditions
are already satisfied — and start at "Implement".

**Stamp the clock before anything else.** Take `date -u +%H:%MZ` as you begin and
write the elapsed time into the review queue header when you finish (format
below). Nobody is watching an unattended run, so this is the only honest source
for the agent half of the ticket's worklog: the push-and-PR step asks for that
figure at PR open, and after an overnight run the answer is otherwise a guess.

**Docs worktrees.** A worktree holding a prose vault rather than code:

- [ ] Follow the vault's style guide — the vault's own notes say where it lives, and it may sit outside the vault.
- [ ] **Never reformat its files** — prose vaults are usually not formatter-managed, so a whole-file reformat is unreviewable and cannot be cleanly reverted. Touch only the prose you were asked to change.
- [ ] Never edit the editor's own config directory — its plugin files are executed on the host.

**Cross-repo features.** You may be given several worktrees at once — one per
service, all on the same ticket branch, with your working directory set to the one
where the contract originates. Treat it as **one** piece of work, not several:

- [ ] Design the contract once, then implement each side against it — the whole reason a single agent holds every repo is to prevent contract drift, so keep the response shape and its consumer in step, and name the same fields on both sides.
- [ ] **Commit per repo** (each repo's history is its own PR) but keep the commits consistent — every repo's tests green before you call a round done.
- [ ] Where one side deploys first, its contract is the one to keep and the other follows it. Which side that is is a project fact: take it from the repos' agent config or from the launch brief, and absent both, treat the side where the contract originates — your starting working directory — as the one that deploys first.

## Branch first — before writing any code

1. [ ] **Ask two things up front** (never assume either): the base branch to cut from, and whether to work in a git worktree (see [Worktree](#worktree) below). Ask about the worktree *every time* — don't infer it from context or default to a plain checkout. Wait for the answer.
2. **Update the base from origin first.** If the user names a branch, fetch it so the new branch is cut from the latest:
   - [ ] `git fetch origin <base>`
   - [ ] Branch off the freshly-fetched ref: `git checkout -b <feature-branch> origin/<base>` (this guarantees you're on updated origin, not a stale local copy).
3. [ ] Name the feature branch after the work — if there's a tracker ticket, use the ticket key (e.g. `PROJ-1234`).

Do this even if a usable branch is already checked out; branching off the wrong
base (e.g. a release/bump branch instead of the integration branch) drags
unrelated commits into the eventual PR.

## Worktree

**Always ask** whether to use a worktree (part of the up-front branch question —
never skip it). A worktree keeps the current checkout untouched and lets parallel
work continue; the user often has other branches in flight.

If yes, create the feature branch as a worktree instead of a plain `checkout -b`:

- [ ] `git fetch origin <base>` first (same as above).
- [ ] `git worktree add -b <feature-branch> <path> origin/<base>` — cut from the freshly-fetched ref.
- [ ] Run the rest of the skill from inside `<path>`.
- [ ] Ask where to put the worktree if the user didn't say.

**Set up the fresh worktree before running anything in it.** `git worktree add`
never brings untracked files along, so do this unconditionally — not only when a
project's own notes happen to mention it. From the main checkout:

- [ ] For each of `.env` and `node_modules` that exists there: symlink it into the new worktree (`ln -sfn <main-checkout>/<name> <worktree>/<name>`) — a symlink, not a copy, so the worktree always sees the main checkout's current version.
- [ ] For `CLAUDE.local.md`: copy it instead (not symlink — it's usually a worktree-specific override, not something that should track the main checkout).
- [ ] Skip any of the three the main checkout doesn't have.
- [ ] Check the project's own notes for anything beyond these three (a project-specific env var, a service that must already be running, etc.).

## Implement

**Known patterns.**

- [ ] If the governing agent-instructions file points to a lessons file of patterns past review loops have actually caught, pull this ticket's repo tag out of it before writing any code. Its own header explains how (a bootstrap step included, so finding out how doesn't itself cost the whole file).
- [ ] Before your first commit, decide which entries apply to this ticket and which don't — record it in that commit's message, even when the answer is "none apply." A pattern already known from a past session should not need rediscovering as a fresh finding later.

Use /tdd where possible, at pre-agreed seams:

- [ ] A seam's size is what its plan's own Acceptance Criteria demand, not
      the size of the code change — a one-line condition removal with a
      multi-line AC list is still a seam. Skipping `/tdd` because the diff
      looks trivial is exactly how an AC-to-assertion mapping gap (`/tdd`
      Planning's own rule for this) survives to review instead of being
      caught before the first commit.
- [ ] At the start of each seam, call the Skill tool for `/tdd` yourself, in
      your own context — do not spawn a separate subagent for it. `/tdd` needs
      the ticket's accumulated context (prior commits, branch state), unlike
      `/review` below, which forks precisely because it must *not* share the
      author's context.
- [ ] Do not read `tdd/SKILL.md` once and reproduce its steps from memory or
      copy-paste. A paraphrase drifts from the real file the moment it's
      edited, and silently drops whatever the edit added.

- [ ] Write to the governing agent-instructions file's "Code clarity & comments" section as you go — names, comments, parameter shapes — not only at the `/clarify` pass below. `/clarify` verifies with fresh eyes once the shape is final; it is not a substitute for writing clean code the first time.

Run single test files regularly. Right before the commit below — not after every edit — run typechecking once and the tests once:

- [ ] Run typecheck once.
- [ ] Run the project's own lint command once too, over the files changed since the loop's base. A pre-commit hook that's supposed to catch this can silently no-op — most commonly in a git worktree, where husky's hooks don't always regenerate — so run lint directly rather than trusting the hook fired; don't rely on it surfacing only at push, in CI, or in a later review pass.
- [ ] Run tests once, scoped to this commit: for each production file changed since the loop's base, its colocated test file(s) (same basename, same directory — `.spec.ext`/`.test.ext`); plus any test file edited directly. A changed file with no colocated test contributes nothing to the run — typecheck and the review loop below cover what a test file can't. This is the default everywhere; run the project's full suite only when the repo's own agent config explicitly names a broader command (the same carve-out the next bullet gives typecheck). Most repos already get a full run from CI on push — a repo without one is exactly the case for that config to ask for a local one instead.
- [ ] Use the project's own scripts for all three (single test files, typecheck, tests) — find them in the repo's manifest; the repo's agent config wins where it names a narrower command (e.g. a wrapper that serializes typecheck runs on a memory-constrained host). Never invoke the underlying test runner directly (`npx jest <file>`, `npx vitest <file>`, or the stack's equivalent) for either the single-file runs above or the scoped run the previous bullet introduces — the project's own script carries config, setup and env vars a bare invocation skips; pass the file path through to that script as an argument instead (`npm run test:unit -- <file>` or whatever the manifest names it). A full-project typecheck is expensive enough (cold, minutes on a large backend) that running it per edit rather than per commit is where that cost actually goes.

Commit your work to the feature branch created above once the tests are green.

## Review–fix loop

<!-- CLAUDE-SPECIFIC: this loop spawns a fresh subagent via the Claude Code Agent
     tool, told to run the /review skill. Another agent needs its own version
     using its own subagent mechanism and its own way of invoking /review. A
     one-shot /review is the fallback if yours has none. -->

Once the work is committed and green, run a review–fix loop rather than a one-shot `/review`. You are the **author**.

- [ ] Each round spawns a **separate fresh subagent**, told to run `/review` pinned against the same base every round — never the previous round's commit, or a fix that only touched one round's diff reads as clean forever.
- [ ] `/review` is read-only: it reports, you edit. Exception: a self-restoring measurement script a repo's own review skill runs as part of a step (e.g. a mutation-testing runner) — the reviewer may execute and triage it directly, since it reverts its own writes before the round ends. Only an actual code fix stays the author's job.
- [ ] Spawn on the tier the governing agent-instructions file's model-split rule names for code-facing judgement, naming that model on the spawn rather than letting it inherit the session's. A cheap author session is exactly when the reviewer must not be cheap too.
- [ ] Spawn it in caveman mode where installed (`/caveman` where installed), without asking, same as any other fresh subagent — and tell it to pass that instruction on to `/review`'s own step-4 sub-agent spawns too: caveman mode does not cascade to an agent's own further spawns by itself.

**The fresh context is the guarantee, not a different model.** An author reviewing its own diff mostly re-reads its own reasoning, and a separate subagent escapes that whatever model it runs. This is the same shape already used below for `/simplify` and `/clarify` — a fresh subagent, told what to run, handing back a result — not a separate mechanism.

`/review` has no concept of fix versus escalate; it reports per-axis findings
(Standards, Spec, Boundary, and whatever else the repo declares), each either a
documented breach or a judgement call. Classifying each into fix or escalate is
**your** job as the author, not the reviewer's:

- [ ] **escalate** if the finding is a product or behaviour decision, an architectural choice with more than one defensible answer, a change to a public contract / API / DB schema, or anything you are under ~80% sure about.
- [ ] **fix** only for correctness bugs, missing or weak tests, and mechanical issues with one obvious right answer.
- [ ] **Axis-level caveat** (an axis reports something about its own coverage rather than about the diff — a spec it could not reach, a counterpart system it could not read, a verification step it could not run at all this round, e.g. mutation testing blocked by no live DB session): escalate immediately, the round it first appears, tagged with its axis — it does not wait for the stuck check below, because a coverage gap does not improve on retry, and it does not block convergence. If the identical caveat recurs on a later round, it is already on the queue; do not add it twice. Logging it as a passing note in the round's own report instead of an escalation is the same gap under a different name — a later round that finally gets past the blocker (confirmed once: mutation testing ran once a DB session became available, three rounds in, and immediately found a real defect) proves the earlier rounds' silence wasn't nothing to act on.
- [ ] Tell the reviewer subagent to run the same lessons-file extraction the author ran (see Implement) — a backstop, not the primary route.

**Each round:**

1. Spawn the subagent.
   - [ ] For a cross-repo feature, hand it the combined diff of every worktree — `/review`'s own Boundary axis already knows to check the contract across them once it has that, so there is nothing further to tell it.
   - [ ] From round 2 onward, tell it to skip any one-time-cost verification round 1's report already ran — mutation testing, for instance — rather than repeating it every round: name the specific check from round 1's own report, since only that report says whether the repo's review skill carries one at all.
   - [ ] From round 2 onward, also tell it to re-check every comment a *prior* round's fix kept against the keep-a-comment bar, not just new comments this round's own diff adds. A round's own fix can retroactively clear the bar an earlier comment was kept against — e.g. adding the test that now guards the exact fact the comment was protecting, so nothing except the comment itself still needs saying. A fresh reviewer told only "review the diff" checks new comments, not this — confirmed twice, independently, across two separate tickets (5 total occurrences) before this became a standing instruction rather than something each ticket's reviewer had to rediscover.
   - [ ] Read its per-axis report and apply the decision rule above, per axis, per finding.
2. Apply every `fix`.
   - [ ] Make the change, then check the round's own diff for the same pattern elsewhere in it and fix every instance you find, not just the one the finding named — a reviewer reports one occurrence per finding, not an exhaustive sweep, and a sibling instance left behind is exactly the kind of thing the next round's reviewer catches instead, costing a whole round for something this round could have closed out.
   - [ ] **Generalize before sweeping — search for the finding's condition, not its literal code.** A finding names one instance of a shape (e.g. "an unrelated banner excludes the primary action in this branch"); before rescanning the diff, state that shape as a sentence that doesn't mention this file's own names, then search for that sentence, not for the code the finding pointed at. Searching for the literal code again finds only exact repeats and misses a mirror-image branch sitting five lines away — a sibling `if`/`else` with the identical shape is the easiest case a real sweep should catch, and the one most likely to be missed by scanning for the wrong thing.
   - [ ] **A finding that debunks one example given for a claim is not evidence against the claim itself — check whether the claim holds through a different mechanism before rewriting it as false.** A finding disproving an illustration is not the same as a finding disproving the general statement the illustration was meant to support; conflating the two throws away a true claim along with its wrong example (confirmed once: round 1 rewrote an AC to say an overlap could never happen because its cited example turned out unreachable, when the overlap was real via a different, unexamined mechanism — round 2 spent a full round re-deriving what round 1 had already correctly stated).
   - [ ] **A finding about how one call site handles a failure mode (a catch too broad, too narrow, or missing) is a reason to check every adjacent call site touching the same failure mode, not just this round's own diff.** The same design mistake can recur one layer up or down from where it was found — a config class's own error handling and its caller's error handling are two separate places the identical bug can live, and a finding against one says nothing about whether the other was already checked (confirmed once: a security review narrowed a config class's own overly-broad catch; a later PR review found the route that called it had the identical gap one layer up, never checked because nothing prompted looking there once the first instance was fixed).
   - [ ] **A fix that changes how a value used to gate a decision is computed — a new local variable, state discovered later, a widened trigger — must be applied everywhere that value is read, not just at the one call site the finding named.** The same decision can appear more than once in a function (a primary branch and a secondary/repair branch, a fast path and a fallback), each reading the same source value independently; fixing the computation in one reader while a sibling reader still consults the old value reintroduces the bug through a path the fix's own test never exercises (confirmed 2026-09-17: a fix correctly updated one decision point's stale-value gate, but a second decision point in the same function — a repair pass added in the same round — still read the original value).
   - [ ] **A fix to a rule stated in more than one document needs every restatement checked, not just the file the finding named.** When a spec amendment, a corrected comment, or a boundary description also appears in a sibling instructions file, a plan, or another spec, list every file that states it (grep the concept, not the wording) before committing — a restatement nobody checked can be correct today and silently go stale the moment the file you actually fixed changes again. Unlike the sweep above, the sibling copy may sit in a file this round's own diff never touches — a real case cost four rounds when a fourth instructions file restating the same boundary went unchecked until the round that finally made one document the single source of truth and had every other file point at it instead of restating it.
   - [ ] **A fix for a correctness-bug finding gets its own new/changed test run once against the pre-fix code, before the round's commit:** `git stash` just the fix's own hunk (not the test), run that one test file, confirm it fails — then `git stash pop` and confirm green again. A test that still passes with the fix reverted doesn't discriminate; strengthen the fixture or assertion until it does. Skip this for a rename, a comment fix, or anything with no behavior to revert.
   - [ ] **A fix that restructures a test file — not a targeted edit, a rewrite of its shape — re-checks every assertion the file already had, not just the fix's own new one.** The check above only verifies the fix's own target; a restructuring fix can silently drop an unrelated action or assertion the file depended on while fixing something else in the same file. Confirmed cost: a round's own restructuring fix (wrapping a story in an IIFE to fix a docblock-attachment bug) deleted the `userEvent.click` line its click-block assertion depended on — the test kept passing, vacuously, for a full round before a later reviewer caught it (confirmed 2026-09-17). Read the restructured version against the one it replaced and confirm every original action/assertion still appears somewhere in it before committing.
   - [ ] **A test asserting only that a call was *not* made, when that call sits inside a branch that also performs another effect (a throw, a second call), must also assert that other effect still happens.** Otherwise a guard broadened to swallow both the call you're testing for and the other effect stays green — the test only pins the absence, not the branch's actual shape. Pin the branch's other outcome, not just the missing call (confirmed 2026-09-14: a test proving a 429 no longer paused a subscription passed even when the fix under test also silently swallowed the throw's own `retryDelayMs`, until the assertion was widened to also check it).
   - [ ] **A fix that gates an existing write behind a new condition must enumerate every reason that write exists before trusting the gate is scoped correctly.** A write can serve two purposes at once (e.g. rate-limit backoff and circuit-breaker health) — gating it off for the one purpose the finding named silently removes it for every other reason it was there. Trace every reader of what the write touches, not just the code path the finding pointed at.
   - [ ] **A fix that excludes an item from a batch to avoid re-calling it must check whether anything downstream in that batch was relying on that item being awaited, not just called.** Excluding an already-in-flight item from a call list closes a duplicate-call bug, but if the batch's own ordering guarantee depended on every item settling before a later step ran, removing the call also removes the wait — the later step can now run ahead of work it was supposed to see finished (confirmed 2026-09-17: excluding an already-in-flight item from a batch's create list stopped a duplicate POST, but also meant the batch no longer awaited that item before firing a dependent downstream create, breaking the ordering its own comment promised and permanently under-grouping the result on the far side).
   - [ ] Before the round's commit, run typecheck once — skip only when this round's own diff touches no file the project's typecheck command would ever check, since typecheck cannot have changed for a round that changed nothing it looks at. Run it regardless of whether the round's test suite passes — where the repo's tests run `isolatedModules` (transpile only, no type checking), the suite goes green on a type error the suite itself can never catch, and nothing downstream re-checks it before the quality passes at the end. Typecheck goes first: it fails faster than the suite once its cache is warm. Filter its output to errors in files changed since the loop's base — a pre-existing error elsewhere in the project is not this round's problem.
   - [ ] Then re-run the tests at the scope Implement's test step defines: every file changed since the loop's base, plus each touched production file's colocated test(s) — a fix can regress a sibling test covering the same file, not just the one it touched. Same full-suite-only-by-repo-config carve-out as that section; not restated here.
   - [ ] If a fix breaks typecheck or tests and you cannot resolve it in the same round, do not commit it red — convert that finding to an escalation instead. The loop's invariant is that **every committed round is green**, and a type error is exactly as red as a failing test.
   - [ ] If this round applied at least one `fix`, append a `## Round N — fixes` block to the review queue file (see below) listing each one, axis-tagged, in one line — this is what keeps the queue self-contained for `/retro` afterward, instead of it needing to open git log to see what a round actually changed.
   - [ ] **Before writing that block's own line for a fix, diff what you're about to claim against what the round's commit actually contains.** A described rename, deletion, or correction can read as done in the commit message while the underlying edit never landed — confirmed twice on the same ticket (2026-09-17): a rename recorded in one round's commit message but only applied two rounds later once a fresh reviewer caught the mismatch, and a JSDoc correction that fixed one clause of a stale claim while leaving a second, equally wrong clause in place. Read the actual diff line the fix produced, not the sentence you're about to write about it.
3. [ ] Append every `escalate` — including the axis-level caveats above — to the review queue file (see below), tagged with the axis that raised it.
4. **If you disagree with a finding, do not silently override it.**
   - [ ] Do not apply it. Convert it to an escalation: "the reviewer found X, I think Y because…, your call." Disagreement between author and reviewer is itself a signal worth surfacing.
5. Commit the round's fixes, then review again.
   - [ ] If this branch already has an open PR, push through `/push-and-pr` now, not a bare `git push` — a re-push to an existing PR is exactly the case it handles (PR-body reconciliation, the Copilot-review reminder, the worklog top-up), and it's easy to mistake a continuing PR's push for plumbing that doesn't need the skill. See "Push", after Quality passes, for the same rule applied to this whole loop's end.

**A diff containing an artifact this loop cannot execute — a manual-test collection,
a runbook, a documented procedure — converges more slowly than code does.** The
loop's own typecheck/test re-run each round is what turns "the reviewer read it and
it looked right" into "and it's now verified" for code; nothing plays that role for
an artifact nobody runs. N rounds of text-only review against it is not equivalent
to N rounds of verified review against code, even when the loop itself terminates
cleanly. Say so explicitly in the review queue when this happens — the artifact's
own convergence is unverified, not proven, by the loop ending.

**Set the iteration cap once, before round 1**, from the diff between the loop's base and the first commit (`git diff <base>...HEAD --stat`, total lines changed). Fixed for the whole loop — later rounds add lines of their own, but the cap does not move with them.

- [ ] **small** (≤50 lines) → **2** rounds
- [ ] **medium** (≤300 lines) → **3** rounds
- [ ] **large** (above 300) → **5** rounds

**Terminate** when any of these fires first:

- [ ] **converged** — a round's `fix` findings, summed across every axis that ran, are zero. An axis running clean for the first time counts immediately.
- [ ] **iteration cap** — the size-based cap set above.
- [ ] **no progress**, checked **per axis** — an axis whose findings are identical across two consecutive rounds it ran in both is stuck, and that finding auto-escalates, tagged with its axis. An axis that did not run this round — its trigger no longer matches the diff — is simply absent, not evidence of progress or stagnation either way.
- [ ] On exit, write a terminal status line at the top of the review queue: `CONVERGED`, `HIT_ITERATION_CAP (N rounds, M escalations)`, or `STUCK on <finding> [axis]`.

**Lesson capture is not this skill's job.** A ticket that produced a reusable
lesson — a pattern that would trip up a *different* ticket's author too, not
a one-off specific to this ticket's own business logic — gets that lesson
captured by running `/retro` against this ticket's review queue afterward,
whichever way the loop terminated. `/retro` reads the same review queue this
skill writes (see its expanded format below) and is the only place that
proposes a lessons-file entry or an edit to a skill's own text; this skill
does not do either itself. Say so once, at exit, alongside the terminal
status line — don't run any part of that process inline.

**The review queue** is a markdown file written *outside* the working tree — a
sibling of it, e.g. `../<dirname>-REVIEW-QUEUE.md`, in a parent directory that is
not itself a git repo.

- [ ] For a cross-repo feature write **one** queue for the whole feature, named for the ticket rather than a single worktree (`../<TICKET>-REVIEW-QUEUE.md`), and label each escalation with the repo it concerns. Outside means it can never be `git add`-ed into a commit and needs no ignore entry — which also matters where a sandbox denies writes under `.git` — and it survives an agent restart.
- [ ] When committing, add only the files you actually changed — **never `git add -A` or `git add .`**.
- [ ] Format: a header (terminal status, counts, the author and reviewer models, last-commit sha, elapsed time), then one `## Round N — fixes` block per round that applied at least one fix, then one `## ` section per escalation, its heading naming the axis that raised it (e.g. `## [Spec] <title>`), carrying the finding and any author disagreement:

```
PROJ-10101 — CONVERGED (3 rounds, 2 escalations)
implement <author-model> / review <reviewer-model>
last commit 1a2b3c4
agent-time 1.25h  (02:10Z → 03:25Z)

## Round 1 — fixes (commit a1b2c3d)
- [Standards] renamed a two-positional-arg helper to take a destructured object
- [Spec] gated the export action on the missing permission check the ticket asked for

## Round 2 — fixes (commit e4f5a6b)
- [Boundary] matched the field name the consumer service actually reads

## [Spec] export limit hardcoded at 500 rows
the reviewer flagged the cap as a product decision, not a bug
resolved: keep 500 for now, revisit if a customer hits it
```

- [ ] **A round with zero applied fixes gets no block** — only escalations, or nothing, for that round. The block exists to make "what did each round actually change" answerable from the queue alone; a round that changed nothing has nothing to add to that answer.
- [ ] **`agent-time` is appended, never overwritten.** A resumed ticket adds a second line (`agent-time 0.5h  (09:40Z → 10:10Z)   resumed`) so the sum stays true — the same rule as the tracker worklog, where a top-up is a new entry and never an edit. Round to 0.25h. Whoever logs the worklog sums the lines; a rewritten first line would silently lose the earlier attempt.

**Surfacing (the only attended/unattended difference):**

- [ ] **unattended** — leave the review queue and exit. It is informational only; nobody is here to answer.
- [ ] **attended** — after the loop terminates, grill every escalation before
      moving on to Quality passes and Push (a mid-loop re-push, the one at
      "Each round" step 5 above, is exempt — its escalations aren't final
      yet). Call the Skill tool for `/grill-me` yourself, in your own
      context — do not spawn a subagent for it — for the same reason as
      `/tdd` above: the interview waits for your answer turn by turn, which
      only the live session can do.
  - [ ] Treat each `## [Axis] <title>` entry as one branch to resolve.
  - [ ] Skip an axis-level caveat (an axis reporting a gap in its own
        coverage, see the review-fix loop's classification rules above) —
        there is no decision to interview, only information to note.
  - [ ] Run `/grill-me`'s question-by-question protocol on every other
        escalation, through to its own closing check and ledger.
  - [ ] Write each escalation's outcome back into the review queue file, on
        its own entry: `resolved: <what was decided>` or
        `deferred: <why left open>` — this keeps the queue the one record
        `/retro` reads afterward, not the conversation that produced it.
  - [ ] Only once every escalation carries a `resolved:` or `deferred:` line
        does the run continue to Quality passes and Push.

## Quality passes — after the loop converges

The review–fix loop hunts correctness. Further passes run over the same branch
diff once it has converged, in this order:

0. **Only for a repo whose CI produces a post-push coverage/CRAP-style report, medium/large diffs only** (the same size bands the iteration cap uses — skip this step entirely on a small diff, or when the repo has no such report). **Runs after Push, not before, and never locally** — check the repo's agent config for whether CI produces this report; where it does, there's usually no local equivalent to run in its place, whether or not CI has finished yet:
   - [ ] Once `/push-and-pr` opens (or updates) the PR and CI's coverage run completes, fetch the report CI attached to the PR — a check run, an artifact, or a PR comment, whichever this repo's CI actually produces — rather than computing one locally.
   - [ ] Split its findings by `remediation.kind`: `refactor`-kind findings get their own follow-up commit on this branch (a `/simplify`-shaped pass over just those findings); `cover`-kind findings feed step 3 below, run now instead of up front.
   - [ ] Run this once — nothing later re-runs it.
1. **Check for a repo-declared security-review skill.** Read the governing agent-instructions file for a security-review skill and the paths that trigger it (e.g. a project-specific security-review skill scoped to `src/routes/**`, `src/dao/**`). If this diff touches a triggering path, run that skill as its own pass here, same fresh-subagent treatment as `/simplify`/`/clarify` below — don't wait to notice its trigger conditions after Push.
2. **`/simplify`** — reuse, simplification, efficiency, altitude, in one pass. The review loop above has already hunted correctness, so there's no need for anything deeper here.
   - [ ] Apply what it finds; note what you skip and why.
3. **`/clarify`** — naming, extraction, control-flow shape, comment hygiene.
4. **Only when step 0 ran and its post-push report found `cover`-kind findings**:
   - [ ] Write tests closing the coverage gap for each one, in a fresh subagent, its own commit.
   - [ ] Locate each target function by its current content, not by the name or line step 0 recorded — steps 2 and 3 can have moved both.
   - [ ] Reuse step 0's report; do not run CRAP again, locally or otherwise.

**The order is not arbitrary, but step 0 now runs last, not first.** `/simplify`
moves code around, so clarifying first means naming things that are about to be
deleted or merged — that ordering between steps 2 and 3 is unchanged. Step 0 no
longer gates either of them: it depends on a coverage run only CI produces, which
doesn't exist until after `/push-and-pr` opens the PR, so its `refactor` findings
land as a follow-up commit after Push instead of feeding step 2 up front, and its
`cover` findings feed step 4 at that same later point. Step 1's security-review
check runs first among the pre-Push steps since it can surface a real fix
`/simplify`/`/clarify` would otherwise move around.

**Run each pass in a fresh subagent on the code-judgement tier — never inline.**
`/simplify` spawns nothing further, same as `/clarify`; step 4's test-writing is
TDD work, not judgement, but still gets a fresh subagent for the same reason —
an inline pass is the author's own context grading the author's own diff on the
author's own model, which is the thing the review loop above is shaped to avoid.
Step 1's security-review skill, when it runs, gets the same fresh-subagent
treatment.

- [ ] Hand each subagent the branch diff, the branch's commits and the review queue, and have it make the edits and write that pass's commit.
- [ ] Tell each subagent to check `git log <base>..HEAD` for a deliberate prior decision before reverting or "fixing" anything that looks like an accidental inconsistency — a signature that doesn't match a sibling function's, an asymmetric branch, a structure one part of the diff doesn't share with another. A fresh subagent has no way to tell a prior round's deliberate, reasoned choice from an oversight; the commit history is the only record that can. Confirmed: a `/simplify` pass reverted a review-fix loop's own just-approved decision (a function signature narrowed on purpose, per its own commit message) on exactly this "make it consistent" instinct, with no visibility into the earlier commit that made the call — the author caught it only by independently re-deriving the same reasoning. A later `/clarify` pass, told explicitly to check first, found the same asymmetry, read the cited commit, and correctly left it alone.
- [ ] (Step 0 is not a subagent step — it produces a report, nothing to hand off yet.)
- [ ] Each of steps 1 through 4 that runs gets its own commit, because `/clarify`'s output *is* a commit message: the rationale it strips out of comments has to land in the commit that introduced the code, and a pass folded into someone else's commit loses it.
- [ ] Before each of those commits, run typecheck once, filtered to files changed since the loop's base — same gate as each review round's commit above. `/clarify` already does this itself as part of its own verification step; tell the security-review, `/simplify`, and step-4 subagents to do the same before their commits, since none of them has such a step of its own.

**`/clarify` owns the comment and naming policy for this skill.**

- [ ] The authority is the "Code clarity & comments" section of the governing agent-instructions file. Read it there rather than from a copy here. Do not collect comment candidates and do not ask which to add.
- [ ] Where those passes are not installed, do the same two readings yourself, in the same order, applying that section's comment and naming policy.

**Unattended:** every step runs exactly as above.

- [ ] Never ask a question — decide with the most reasonable default and record the choice and the alternative in the review queue.
- [ ] A pass that spawns fresh subagents runs them in caveman mode (`/caveman` where installed) without asking, and on the same tier as the review loop's reviewers rather than a cheaper one. These passes propose designs rather than report facts, and a proposal that is never made is simply lost — the best finding of a run is often one of theirs.

## Push

Once the quality passes are committed, hand off to `/push-and-pr` for the push:

- [ ] **Attended only** — an unattended run has no one to answer that skill's own always-ask questions, so leave the branch pushed by the review-fix loop's own last `git push` (if any) and say so in the review queue instead.
- [ ] **This applies whether or not a PR already exists.** A branch this skill resumed onto an already-open PR is a re-push, not a fresh one — `/push-and-pr` has its own instructions for exactly that case (reconcile the PR body against the new commits, remind the user to request the Copilot review at a deeper effort level, log the *additional* effort as a `rework` worklog rather than a fresh one). Treating a continuing PR's push as plumbing that doesn't need the skill is the mistake to avoid here — every push this skill makes to a ticket's branch is a `/push-and-pr` moment, not only the first one.

## Keep the plan in sync

If the work came from a `docs/plans/` plan (plan-in-docs), update that plan file
as the work lands — the plan is the source of truth, not a write-once doc:

- [ ] Tick the `Steps` checkboxes (`- [ ]` → `- [x]`) for each step completed.
- [ ] Record what actually happened when it diverges from the plan: verification results, decisions changed mid-flight, steps deferred, PR/commit links (add `pr:`/`pr2:` frontmatter keys).
- [ ] **After writing to the ticket or plan, re-read the field to confirm the write actually landed before recording in the commit message or review queue that it's done.** A claim of having updated it is not evidence that it happened (confirmed once: a review round's own commit message and the review queue both said the ticket's AC and the plan's Decisions had been rewritten; a later round, reading the actual ticket, found neither edit had landed).
- [ ] Redraw `## Technical Requirements`' diagram as-built when the code landed somewhere other than the drawing. The drawing is indicative, so diverging from it is not a failure — but the plan has to end up holding the picture that shipped, beside the record of what moved, or the next reader reviews a shape that never existed. Touching a file the section's `Must not touch` line lists as untouched is the exception: that is scope, not shape, and it goes in the run report as well as the plan.
- [ ] A `## Decisions` entry that describes a code mechanism — not just what changed, but how — needs that description checked against the actual code before it's written. A plausible paraphrase of intent can name a mechanism the code doesn't have (confirmed once: a Decision said a health exclusion worked via an early return inside one function, when the code actually checked a flag at each call site instead), and nothing else catches the mismatch once it's in prose.
- [ ] Move `status:` along the lifecycle: `draft` → `active` when implementation starts, `done` only when every step is complete (a multi-phase plan stays `active` until the final phase ships).
- [ ] **Update this ticket's `## Time` row.** Write the session's summed `agent-time` into the row's agent cell — update the running total, don't append a log line; the plan is a working ledger, the tracker's worklog is the audit trail. Do this for an attended run only; an unattended one has no plan access at all (below).

**When the plan is not writable, do not attempt any of it.** A sandboxed run has
the vault readable and deliberately outside `allowWrite`, and `implement-queue`
forbids plan writes outright — so a subagent following this file as its brief
would spend a denied tool call and then file an escalation that reads like a real
finding.

- [ ] Write what you *would* have changed into the review queue instead: which steps completed, the as-built shape where it moved, the status the plan should reach, and any file you touched that `## Technical Requirements`' `Must not touch` line listed as untouched. The human transcribes it, the same route the `agent-time` figures already take.

Do this before ending the turn, so the plan reflects reality for the next
session.
