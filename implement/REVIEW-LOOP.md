# Review-fix loop

Read this before running the review-fix loop `SKILL.md` hands off to. Once
the work is committed and green, run this loop rather than a one-shot
review. You are the **author**.

- [ ] Each round spawns a **separate fresh subagent**, told to use the
      `review` skill pinned against the same base every round — never the
      previous round's commit. A fix that only touched one round's diff
      reads as clean forever otherwise. In Claude Code, use the Agent
      tool. In Codex, use `collaboration.spawn_agent` and name the
      code-review model from the governing model-split rule.
- [ ] Pass `/review` apply mode (its own step 1a input). This makes it
      apply each documented-breach finding's proposed fix directly to the
      working tree instead of only reporting it — see the
      documented-breach paragraph below. When a plan exists, also pass
      its `## Technical Requirements` `Must not touch` line as `/review`'s
      protected scope — the same line the Quality passes in
      [QUALITY-PASSES.md](QUALITY-PASSES.md) already receive.
- [ ] `/review` reports every finding that isn't a documented breach — you
      edit those. A documented breach it already applied under apply
      mode: you verify and commit it, you don't write it.
- [ ] Separately, unrelated to apply mode: `/review` may run a
      self-restoring measurement script as part of a step (e.g. a
      mutation-testing runner, when a repo's own review skill carries
      one). It executes and triages that directly, since the script
      reverts its own writes before the round ends. This is never the
      author's job, apply mode on or off.
- [ ] Spawn on the tier the governing agent-instructions file's
      model-split rule names for code-facing judgement. Name that model
      on the spawn — don't let it inherit the session's. A cheap author
      session is exactly when the reviewer must not be cheap too.
- [ ] Tell it to use caveman mode, and pass that instruction to any
      agents it spawns, including the review skill's own subagents.
      Caveman mode does not cascade automatically.

**The fresh context is the guarantee, not a different model.** An author
reviewing its own diff mostly re-reads its own reasoning. A separate
subagent escapes that, whatever model it runs. This is the same shape
[QUALITY-PASSES.md](QUALITY-PASSES.md) uses for `/simplify` and
`/clarify` — a fresh subagent, told what to run, handing back a result —
not a separate mechanism.

`/review` reports per-axis findings: Standards, Spec, Regression,
Boundary, and whatever else the repo declares — including a repo's own
review skill's axes, when one exists, per `/review`'s own step 3a. Under
apply mode, it also applies a **documented breach**'s fix directly to the
tree instead of only reporting it. A documented breach is each axis's own
top severity tier, per `/review`'s own criterion: a Standards hard
violation, a Spec finding that quotes a spec line as missing or wrongly
implemented, a Boundary definite mismatch, or — for a repo-declared axis
— that axis's own equivalent (e.g. a verified failure scenario).
Regression findings are never breaches. That axis reports differences
neutrally, for a human to judge, and apply mode never touches them.
Everything else is a judgement call, and `/review` never applies a
judgement call regardless of mode.

Classifying each non-breach finding into fix or escalate is **your** job
as the author, not the reviewer's:

- [ ] **escalate** if the finding is a product or behaviour decision, an
      architectural choice with more than one defensible answer, a
      change to a public contract/API/DB schema, or anything you are
      under ~80% sure about.
- [ ] **fix** only for correctness bugs, missing or weak tests, and
      mechanical issues with one obvious right answer.
- [ ] **Could not apply** — a documented breach `/review` reports as
      `could not apply: <reason>` under apply mode (see `/review`'s own
      step 5a for the possible reasons). Treat it exactly as an
      escalation, tagged with its axis. Never hand-write it yourself in
      the same round. Let the next round's fresh reviewer re-diagnose it
      against the now-current code.
- [ ] **Axis-level caveat** — an axis reports something about its own
      coverage rather than about the diff. Examples: a spec it could not
      reach, a counterpart system it could not read, a verification step
      it could not run at all this round (e.g. mutation testing blocked
      by no live DB session). Escalate it immediately, the round it
      first appears, tagged with its axis. It does not wait for the
      stuck check below — a coverage gap does not improve on retry, and
      it does not block convergence. If the identical caveat recurs on a
      later round, it is already on the queue — do not add it twice.
      Logging it as a passing note in the round's own report instead of
      an escalation is the same gap under a different name. Confirmed
      once: mutation testing ran once a DB session became available,
      three rounds in, and immediately found a real defect. That proves
      the earlier rounds' silence wasn't nothing to act on.
- [ ] In round 1, tell the reviewer subagent to run the same lessons-file
      extraction the author ran (see `SKILL.md`'s "Known patterns"). This
      is a backstop, not the primary route. From round 2 onward, pass
      round 1's extracted entries to the reviewer as text instead — the
      tag and the file do not change during the loop.

## Each round

1. Spawn the subagent.
   - [ ] For a cross-repo feature, hand it the combined diff of every
         worktree. `/review`'s own Boundary axis already knows to check
         the contract across them once it has that — there is nothing
         further to tell it.
   - [ ] From round 2 onward, pass `/review` its remaining step 1a
         inputs. Apply mode and protected scope are already passed every
         round, from round 1, above.
     - **The path list:** every file an earlier round's fix touched,
       plus every changed file that no axis has listed under `Read:` in
       any earlier round. A file nobody has read yet stays in scope
       until some round reads it.
     - **Round 1's source locations:** the spec location, the standards
       files, the repo review-skill decision, and the counterpart
       revisions, taken from round 1's report.
     - **The escalations already in the review queue.**
   - [ ] From round 2 onward, tell it to skip any one-time-cost
         verification round 1's report already ran (mutation testing,
         for instance) rather than repeating it every round. Name the
         specific check from round 1's own report — only that report
         says whether the repo's review skill carries one at all.
   - [ ] From round 2 onward, also tell it to re-check every comment a
         *prior* round's fix kept against the keep-a-comment bar, not
         just new comments this round's own diff adds. A round's own
         fix can retroactively clear the bar an earlier comment was kept
         against — e.g. adding the test that now guards the exact fact
         the comment was protecting, so nothing except the comment
         itself still needs saying. A fresh reviewer told only "review
         the diff" checks new comments, not this. Confirmed twice,
         independently, across two separate tickets (5 total
         occurrences), before this became a standing instruction rather
         than something each ticket's reviewer had to rediscover.
   - [ ] Read its per-axis report. Apply the decision rule above, per
         axis, per finding.
2. Apply every `fix`, and verify every documented breach `/review`
   already applied.
   - [ ] For a non-breach `fix`, make the change yourself. Then apply
         every rule in [fix-checks.md](fix-checks.md) whose condition it
         matches. Read that file every round — its rules are the fix
         mistakes past loops actually shipped.
   - [ ] For a documented breach `/review` applied under apply mode,
         skip straight to verification: apply every matching
         [fix-checks.md](fix-checks.md) rule against the change it
         already made, exactly as you would your own.
   - [ ] Before the round's commit, run typecheck once, using the same
         skip rule as `SKILL.md`'s own typecheck step: skip only when
         nothing in this round's diff could affect what the type
         checker sees. Run it regardless of whether the round's test
         suite passes. Where the repo's tests run `isolatedModules`
         (transpile only, no type checking), the suite goes green on a
         type error the suite itself can never catch, and nothing
         downstream re-checks it before the quality passes at the end.
         Typecheck goes first — it fails faster than the suite once its
         cache is warm. Filter its output to errors in files changed
         since the loop's base. A pre-existing error elsewhere in the
         project is not this round's problem.
   - [ ] Then re-run the tests at the scope `SKILL.md`'s own test step
         defines: every file changed since the loop's base, plus each
         touched production file's colocated test(s). A fix can regress
         a sibling test covering the same file, not just the one it
         touched. Same full-suite-only-by-repo-config carve-out as that
         section — not restated here.
   - [ ] If a fix breaks typecheck or tests and you cannot resolve it in
         the same round, do not commit it red. Convert that finding to
         an escalation instead. For an orchestrator-applied breach,
         revert its hunk from the tree first — an author-written fix
         that never got this far simply isn't committed, but an applied
         breach is already sitting in the working tree, and "don't
         commit it" alone leaves it there. The loop's invariant is that
         **every committed round is green**, and a type error is exactly
         as red as a failing test.
   - [ ] If this round applied at least one `fix` or one documented
         breach, append a `## Round N — fixes` block to the review queue
         file (see below) listing each one, axis-tagged, in one line,
         marking which were orchestrator-applied. This is what keeps the
         queue self-contained for `/retro` afterward, instead of it
         needing to open git log to see what a round actually changed.
3. [ ] Append every `escalate` — including the axis-level caveats above —
       to the review queue file (see below), tagged with the axis that
       raised it.
4. **If you disagree with a finding, do not silently override it.**
   - [ ] Do not apply it. Convert it to an escalation: "the reviewer
         found X, I think Y because…, your call." For an
         orchestrator-applied breach you disagree with, revert its hunk
         from the tree first — "do not apply it" alone leaves an
         already-applied change in place. Disagreement between author
         and reviewer is itself a signal worth surfacing.
   - [ ] **Exception, attended only:** for a documented breach `/review`
         already applied, don't escalate it on your own judgement before
         the round's commit gate below. Verify it mechanically, and if
         you still have a concern beyond what verification catches, note
         it alongside the diff the gate shows — the accept/reject call
         belongs to the human there. Unattended has no gate, so this
         exception doesn't apply — escalate exactly as above.
5. Commit the round's fixes, then review again.
   - [ ] **Attended only:** before committing, show the round's diff
         (`git diff`) and wait for an explicit go-ahead — same pattern
         as the per-seam commits in `SKILL.md`'s "Implement" section.
         Unattended commits immediately, no gate, exactly as before this
         rule existed.
   - [ ] **Rejecting at the gate depends on who wrote the piece you're
         rejecting.** A documented breach `/review` applied: revert it
         from the tree and convert it to a queued escalation, same as
         rule 4 above. A fix you wrote yourself: handle it live — adjust
         it and re-verify before committing, no new mechanism.
   - [ ] Do not push between rounds, even when the branch already has an
         open PR. The one push is at "Push," after Quality passes, so a
         human reviewer only ever sees a converged branch.

**A diff containing an artifact this loop cannot execute — a manual-test
collection, a runbook, a documented procedure — converges more slowly
than code does.** The loop's own typecheck/test re-run each round is what
turns "the reviewer read it and it looked right" into "and it's now
verified" for code. Nothing plays that role for an artifact nobody runs.
N rounds of text-only review against it is not equivalent to N rounds of
verified review against code, even when the loop itself terminates
cleanly. Say so explicitly in the review queue when this happens — the
artifact's own convergence is unverified, not proven, by the loop ending.

## Iteration cap and termination

**Set the iteration cap once, before round 1**, from the diff between the
loop's base and HEAD at the moment the loop starts (`git diff
<base>...HEAD --stat`, total lines changed). An attended run may already
carry several per-step commits by this point — this is the accumulated
ticket diff, not any single commit's own size. It's fixed for the whole
loop. Later rounds add lines of their own, but the cap does not move with
them.

- [ ] Leave out lines nobody reviews: lock files (`package-lock.json`,
      `yarn.lock`, `pnpm-lock.yaml`, and the stack's equivalents),
      snapshot files (`__snapshots__/`, `*.snap`), paths
      `.gitattributes` marks `linguist-generated`, and any paths the
      repo's agent config names as generated. Tests still count.

- [ ] **small** (≤50 lines) → **2** rounds
- [ ] **medium** (≤300 lines) → **3** rounds
- [ ] **large** (above 300) → **5** rounds

**Terminate** when any of these fires first:

- [ ] **converged** — a round's `fix` findings, summed across every axis
      that ran, are zero, **and** the round applied no documented
      breach. A round that applied at least one breach needs one further
      round with both at zero before it can converge. Every applied
      change earns the same fresh-reviewer pass this loop already gives
      every author-written fix, per the reason round-pinning exists in
      the first place ("never the previous round's commit... reads as
      clean forever," above). An axis running clean for the first time
      still counts immediately toward the `fix`-findings half of this
      test.
- [ ] **iteration cap** — the size-based cap set above.
- [ ] **no progress**, checked **per finding** — if you fixed a finding
      in round N, or `/review` applied it as a documented breach, and
      round N+1 reports the same defect in the same file, the fix did
      not work. That finding auto-escalates, tagged with its axis,
      instead of getting a second fix or a second apply. You judge "same
      defect." A `re-raised:` escalation is not a fixed finding and
      never triggers this.
- [ ] On exit, write a terminal status line at the top of the review
      queue: `CONVERGED`, `HIT_ITERATION_CAP (N rounds, M escalations)`,
      or `STUCK on <finding> [axis]`.

**Lesson capture is not this skill's job.** A ticket that produced a
reusable lesson — a pattern that would trip up a *different* ticket's
author too, not a one-off specific to this ticket's own business logic —
gets that lesson captured by running `/retro` against this ticket's
review queue afterward, whichever way the loop terminated. `/retro` reads
the same review queue this skill writes (see the expanded format below).
It is the only place that proposes a lessons-file entry or an edit to a
skill's own text — this skill does not do either itself. Say so once, at
exit, alongside the terminal status line. Don't run any part of that
process inline.

## The review queue

The review queue is a markdown file written *outside* the working tree —
a sibling of it, e.g. `../<dirname>-REVIEW-QUEUE.md`, in a parent
directory that is not itself a git repo.

- [ ] For a cross-repo feature write **one** queue for the whole feature,
      named for the ticket rather than a single worktree
      (`../<TICKET>-REVIEW-QUEUE.md`). Label each escalation with the
      repo it concerns. Outside means it can never be `git add`-ed into
      a commit and needs no ignore entry — which also matters where a
      sandbox denies writes under `.git` — and it survives an agent
      restart.
- [ ] When committing, add only the files you actually changed — **never
      `git add -A` or `git add .`**.
- [ ] Format: a header (terminal status, counts, the author and reviewer
      models, last-commit sha, elapsed time), with **breaches applied**
      by `/review` under apply mode counted separately from **breaches
      escalated** (a `could not apply` documented breach, defined above)
      and from other escalations. Applied breaches don't block
      `CONVERGED` on their own but do force the extra clean round above.
      Escalated breaches don't block `CONVERGED` either, but an author
      who escalates a finding with one right answer should be visible at
      a glance. Then, before any `## Round N` block, one `## Step N —
      feedback` line per step whose commit the per-step review
      checkpoint amended, naming what changed. Then one `## Round N —
      fixes` block per round that applied at least one fix or breach,
      then one `## ` section per escalation, its heading naming the axis
      that raised it (e.g. `## [Spec] <title>`), carrying the finding
      and any author disagreement:

```
PROJ-10101 — CONVERGED (3 rounds, 2 escalations, 2 breaches applied, 0 breaches escalated)
implement <author-model> / review <reviewer-model>
last commit 1a2b3c4
agent-time 1.25h  (02:10Z → 03:25Z)

## Step 2 — feedback (commit f7a8c9d)
renamed the DAO method after the reviewer-facing name read as a query, not a write

## Round 1 — fixes (commit a1b2c3d)
- [Standards] renamed a two-positional-arg helper to take a destructured object (orchestrator-applied)
- [Spec] gated the export action on the missing permission check the ticket asked for

## Round 2 — fixes (commit e4f5a6b)
- [Boundary] matched the field name the consumer service actually reads

## [Spec] export limit hardcoded at 500 rows
the reviewer flagged the cap as a product decision, not a bug
resolved: keep 500 for now, revisit if a customer hits it
```

- [ ] **A round with zero applied fixes gets no block** — only
      escalations, or nothing, for that round. The block exists to make
      "what did each round actually change" answerable from the queue
      alone. A round that changed nothing has nothing to add to that
      answer.
- [ ] **`agent-time` is appended, never overwritten.** A resumed ticket
      adds a second line (`agent-time 0.5h  (09:40Z → 10:10Z)   resumed`)
      so the sum stays true — the same rule as the tracker worklog,
      where a top-up is a new entry and never an edit. Round to 0.25h.
      Whoever logs the worklog sums the lines. A rewritten first line
      would silently lose the earlier attempt.

## Surfacing (post-loop)

The round commit gate above is the loop's other attended/unattended
difference.

- [ ] **unattended** — leave the review queue and exit. It is
      informational only. Nobody is here to answer.
- [ ] **attended** — after the loop terminates, grill every escalation
      before moving on to Quality passes and Push. Invoke the `grill-me`
      skill in the current agent context. Do not spawn a subagent for it
      — like `tdd`, the interview needs the ticket context and waits for
      the user's answers.
  - [ ] Treat each `## [Axis] <title>` entry as one branch to resolve.
  - [ ] Skip an axis-level caveat (an axis reporting a gap in its own
        coverage, see the classification rules above) — there is no
        decision to interview, only information to note.
  - [ ] Run `/grill-me`'s question-by-question protocol on every other
        escalation, through to its own closing check and ledger.
  - [ ] Write each escalation's outcome back into the review queue file,
        on its own entry: `resolved: <what was decided>` or `deferred:
        <why left open>`. This keeps the queue the one record `/retro`
        reads afterward, not the conversation that produced it.
  - [ ] Only once every escalation carries a `resolved:` or `deferred:`
        line does the run continue to Quality passes and Push.
