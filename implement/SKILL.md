---
name: implement
description: Implement a piece of work based on a plan, PRD, or set of issues — branch from a confirmed base (optionally in a worktree), build with TDD, review, and keep the plan file in sync. Use when the user says "/implement", "implement this plan", "build this", or hands over a PRD/issue to execute.
disable-model-invocation: true
---

Implement the work described by the user in the plan, PRD, or issues.

**Mode.** This skill runs *attended* by default, and *unattended* only when
invoked with an explicit `--unattended` (an unattended launcher passes it). Do not
infer the mode from TTY presence — a launcher may run the agent on a pty, so a TTY
exists even when nobody is watching. The only behavioural difference is how the
review-fix loop surfaces escalations at the end; everything else is identical.

**Already-prepared worktree.** If a worktree is already created and the feature
branch already checked out (a launcher may do this before starting the agent),
**skip the entire "Branch first" and "Worktree" sections** — their preconditions
are already satisfied — and start at "Implement".

**Stamp the clock before anything else.** Take `date -u +%H:%MZ` as you begin and
write the elapsed time into the review queue header when you finish (format
below). Nobody is watching an unattended run, so this is the only honest source
for the agent half of the ticket's worklog: the push-and-PR step asks for that
figure at PR open, and after an overnight run the answer is otherwise a guess.

**Docs worktrees.** A worktree holding a prose vault rather than code follows two
rules: follow the vault's style guide — the vault's own notes say where it lives,
and it may sit outside the vault — and **never reformat its files** — prose
vaults are usually not formatter-managed, so a whole-file reformat is unreviewable
and cannot be cleanly reverted. Touch only the prose you were asked to change, and
never edit the editor's own config directory — its plugin files are executed on
the host.

**Cross-repo features.** You may be given several worktrees at once — one per
service, all on the same ticket branch, with your working directory set to the one
where the contract originates. Treat it as **one** piece of work, not several:
design the contract once, then implement each side against it. The whole reason a
single agent holds every repo is to prevent contract drift, so keep the response
shape and its consumer in step, and name the same fields on both sides. **Commit
per repo** (each repo's history is its own PR) but keep the commits consistent —
every repo's tests green before you call a round done. Where one side deploys
first, its contract is the one to keep and the other follows it. Which side that
is is a project fact: take it from the repos' agent config or from the launch
brief, and absent both, treat the side where the contract originates — your
starting working directory — as the one that deploys first.

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
base (e.g. a release/bump branch instead of the integration branch) drags
unrelated commits into the eventual PR.

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
`.env` and installed dependencies don't come along — symlink or copy them
from the main checkout (check the project's own notes for specifics).

## Implement

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite
once at the end. Use the project's own scripts for all three — find them in the
repo's manifest; the repo's agent config wins where it names a narrower command.

Commit your work to the feature branch created above once the tests are green.

## Review–fix loop

<!-- CLAUDE-SPECIFIC: this loop spawns a reviewer via the Claude Code Agent tool.
     Another agent needs its own version using its own subagent mechanism. A
     one-shot /review is the fallback if yours has none. -->

Once the work is committed and green, run a review–fix loop rather than a one-shot
`/review`. You are the **author**. Each round spawns a **separate read-only reviewer
subagent** to critique the diff. The reviewer never edits code — it reports, you
edit. Use a different model for the reviewer if you can, and never a weaker one:
an author reviewing its own diff mostly re-reads its own reasoning, and reviewing
is where your strongest available model belongs. Follow the project's model policy
where it names one.

**Each round:**

1. Spawn the reviewer over the branch diff — **for a cross-repo feature, the
   combined diff of every worktree in one review**, since contract drift is only
   visible when both sides are in view (tell the reviewer which repos are in play
   and to check the contract across them explicitly). It returns a structured list
   of findings, each `{ file, line, severity, category, action, fix_instruction,
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
sibling of it, e.g. `../<dirname>-REVIEW-QUEUE.md`, in a parent directory that is
not itself a git repo. For a cross-repo feature write **one** queue for the whole
feature, named for the ticket rather than a single worktree
(`../<TICKET>-REVIEW-QUEUE.md`), and label each escalation with the repo it
concerns. Outside means it can never be `git add`-ed into a commit and needs no
ignore entry — which also matters where a sandbox denies writes under `.git` — and
it survives an agent restart. When committing, add only the files you actually
changed — **never `git add -A` or `git add .`**. Format: a header (terminal status,
counts, the author and reviewer models, last-commit sha, elapsed time), then one
`## ` section per escalation carrying the reviewer's reason and any author
disagreement:

```
PROJ-10101 — CONVERGED (3 rounds, 2 escalations)
implement <author-model> / review <reviewer-model>
last commit 1a2b3c4
agent-time 1.25h  (02:10Z → 03:25Z)
```

**`agent-time` is appended, never overwritten.** A resumed ticket adds a second
line (`agent-time 0.5h  (09:40Z → 10:10Z)   resumed`) so the sum stays true — the
same rule as the tracker worklog, where a top-up is a new entry and never an edit.
Round to 0.25h. Whoever logs the worklog sums the lines; a rewritten first line
would silently lose the earlier attempt.

**Surfacing (the only attended/unattended difference):**

- **unattended** — leave the review queue and exit. It is informational only;
  nobody is here to answer.
- **attended** — after the loop terminates, present the same queue inline as a
  single batch (don't pause per-finding mid-loop) so the user can answer now.

## Quality passes — after the loop converges

The review–fix loop hunts correctness. Two further passes run over the same branch
diff once it has converged, in this order:

1. **`/simplify`** — reuse, simplification, efficiency, altitude. Apply what it
   finds; note what you skip and why.
2. **`/clarify`** — naming, extraction, control-flow shape, comment hygiene.

**The order is not arbitrary.** `/simplify` moves code around, so clarifying first
means naming things that are about to be deleted or merged.

Each pass gets its own commit, because `/clarify`'s output *is* a commit message:
the rationale it strips out of comments has to land in the commit that introduced
the code, and a pass folded into someone else's commit loses it.

**`/clarify` owns the comment policy for this skill.** A comment is a smell —
needing prose to explain code is the signal the code is not good enough yet.
Rationale lives in commit messages, PR descriptions, review threads and tickets,
which are searchable, dated and attached to the change that motivated them. A
comment survives only where a constraint bites at the point of edit, for a reader
who will not be reading git history. Do not collect comment candidates and do not
ask which to add.

Where those passes are not installed, do the same two readings yourself, in the
same order, with the same comment policy.

**Unattended:** both passes run exactly as above. Never ask a question — decide
with the most reasonable default and record the choice and the alternative in the
review queue. A pass that spawns fresh subagents runs them in caveman mode
(`/caveman` where installed) without asking.

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
