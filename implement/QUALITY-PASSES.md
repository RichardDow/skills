# Quality passes

Read this before running the quality passes `SKILL.md` hands off to. These
passes run over the same branch diff once the review-fix loop converges,
in this order:

0. **Only for a repo whose CI produces a post-push coverage/CRAP-style
   report, medium/large diffs only** (the same size bands the iteration
   cap uses — skip this step entirely on a small diff, or when the repo
   has no such report). **Runs after Push, not before, and never
   locally.** Check the repo's agent config for whether CI produces this
   report. Where it does, there's usually no local equivalent to run in
   its place, whether or not CI has finished yet.
   - [ ] Once `/push-and-pr` opens (or updates) the PR and CI's coverage
         run completes, fetch the report CI attached to the PR — a check
         run, an artifact, or a PR comment, whichever this repo's CI
         actually produces — rather than computing one locally.
   - [ ] Split its findings by `remediation.kind`. `refactor`-kind
         findings get their own follow-up commit on this branch (a
         `/simplify`-shaped pass over just those findings). `cover`-kind
         findings feed step 3 below, run now instead of up front.
   - [ ] Run this once — nothing later re-runs it.
1. **Check for a repo-declared security-review skill.** Read the
   governing agent-instructions file for a security-review skill and the
   paths that trigger it (e.g. a project-specific security-review skill
   scoped to `src/routes/**`, `src/dao/**`). If this diff touches a
   triggering path, run that skill as its own pass here, same
   fresh-subagent treatment as `/simplify`/`/clarify` below. Don't wait
   to notice its trigger conditions after Push.
2. **`/simplify`** — reuse, simplification, efficiency, altitude, in one
   pass. The review-fix loop has already hunted correctness, so there's
   no need for anything deeper here.
   - [ ] Apply what it finds. Note what you skip and why.
3. **`/clarify`** — naming, extraction, control-flow shape, comment
   hygiene.
4. **Only when step 0 ran and its post-push report found `cover`-kind
   findings**:
   - [ ] Write tests closing the coverage gap for each one, in a fresh
         subagent, its own commit.
   - [ ] Locate each target function by its current content, not by the
         name or line step 0 recorded — steps 2 and 3 can have moved
         both.
   - [ ] Reuse step 0's report. Do not run CRAP again, locally or
         otherwise.

**The order is not arbitrary, and step 0 now runs last, not first.**
`/simplify` moves code around, so clarifying first means naming things
that are about to be deleted or merged — that ordering between steps 2
and 3 is unchanged. Step 0 no longer gates either of them: it depends on
a coverage run only CI produces, which doesn't exist until after
`/push-and-pr` opens the PR. Its `refactor` findings land as a follow-up
commit after Push instead of feeding step 2 up front, and its `cover`
findings feed step 4 at that same later point. Step 1's security-review
check runs first among the pre-Push steps, since it can surface a real
fix `/simplify`/`/clarify` would otherwise move around.

## Dispatch rules

**Run each pass in a fresh subagent on the code-judgement tier — never
inline.** `/simplify` spawns nothing further, same as `/clarify`. Step
4's test-writing is TDD work, not judgement, but still gets a fresh
subagent for the same reason: an inline pass is the author's own context
grading the author's own diff on the author's own model, the exact thing
the review-fix loop is shaped to avoid. Step 1's security-review skill,
when it runs, gets the same fresh-subagent treatment.

- [ ] In Claude Code, spawn each pass with the Agent tool and
      `general-purpose`. In Codex, use `collaboration.spawn_agent` and
      set the code-review model resolved from the governing model-split
      rule. Tell the agent which registered skill to run (`simplify`,
      `clarify`, or the repo-declared security-review skill), and hand
      it the branch diff, commits, and review queue.
- [ ] When a plan doc exists, also hand it the plan's `## Technical
      Requirements` `Must not touch` line verbatim. Say explicitly: only
      edit lines the ticket's own diff already touches. A repo-wide
      convention — parameter shape, comment hygiene, naming — applies
      only within those lines, never to untouched code in the same
      file, even when applying it there would also be correct in
      isolation. Reading the whole file for context stays fine; editing
      outside the diff is the line. Confirmed once (`PROJ-1234`): a
      `/clarify` pass correctly applied the parameter-shape rule to a
      function the ticket's own diff never touched and the plan
      explicitly listed as must-not-touch — reverted in a follow-up
      commit.
- [ ] For step 4's test-writing agent, use the implementation model from
      the governing model-split rule instead. Tell it to use the `tdd`
      skill.
- [ ] Tell every fresh agent to use caveman mode, and pass it to any
      agents it spawns.
- [ ] Tell each subagent to check `git log <base>..HEAD` for a
      deliberate prior decision before reverting or "fixing" anything
      that looks like an accidental inconsistency — a signature that
      doesn't match a sibling function's, an asymmetric branch, a
      structure one part of the diff doesn't share with another. A
      fresh subagent has no way to tell a prior round's deliberate,
      reasoned choice from an oversight — the commit history is the only
      record that can. Confirmed: a `/simplify` pass reverted a
      review-fix loop's own just-approved decision (a function signature
      narrowed on purpose, per its own commit message) on exactly this
      "make it consistent" instinct, with no visibility into the earlier
      commit that made the call. The author caught it only by
      independently re-deriving the same reasoning. A later `/clarify`
      pass, told explicitly to check first, found the same asymmetry,
      read the cited commit, and correctly left it alone.
- [ ] (Step 0 is not a subagent step — it produces a report, nothing to
      hand off yet.)
- [ ] Each of steps 1 through 4 that runs gets its own commit, because
      `/clarify`'s output *is* a commit message: the rationale it strips
      out of comments has to land in the commit that introduced the
      code, and a pass folded into someone else's commit loses it.
- [ ] Before each of those commits, run typecheck once, filtered to
      files changed since the loop's base — same gate as each review
      round's commit in [REVIEW-LOOP.md](REVIEW-LOOP.md). `/clarify`
      already does this itself as part of its own verification step —
      tell the security-review, `/simplify`, and step-4 subagents to do
      the same before their commits, since none of them has such a step
      of its own.

**`/clarify` owns the comment and naming policy for this skill.**

- [ ] The authority is the "Code clarity & comments" section of the
      governing agent-instructions file. Read it there rather than from
      a copy here. Do not collect comment candidates and do not ask
      which to add.
- [ ] Where those passes are not installed, do the same two readings
      yourself, in the same order, applying that section's comment and
      naming policy.

**Unattended:** every step runs exactly as above.

- [ ] Never ask a question — decide with the most reasonable default and
      record the choice and the alternative in the review queue.
- [ ] A pass that spawns fresh subagents runs them in caveman mode
      without asking, on the same tier as the review loop's reviewers.
      Tell each to pass caveman mode to any agents it spawns. These
      passes propose designs rather than report facts, and a proposal
      that is never made is simply lost — the best finding of a run is
      often one of theirs.
