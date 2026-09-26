---
name: review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along up to four axes — Standards (does the code follow this repo's documented coding standards?), Spec (does the code match what the originating issue/PRD asked for?), Regression (for a rebuilt or rewritten feature, does it still behave the same as its old implementation, reported independent of what the spec asked for?), and Boundary (does a change crossing a contract between two independently-deployed systems still agree with the other side?). Runs the reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, says "I need a code review", or asks to "review since X".
group: review-quality
---

<!-- Dispatch through the current agent's subagent mechanism. -->

Review of the diff between `HEAD` and a fixed point the user supplies, along three standing axes and one conditional:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?
- **Regression** — for a rebuilt or rewritten feature, does it still behave the same as its old implementation? Reported independent of what the spec asked for — the old code's own prior behavior is the only source of truth, and it's the human reviewer who decides afterward whether each difference is intentional.
- **Boundary** — where the change crosses a contract between independently-deployed systems, does the other side still agree? Runs only when the diff touches boundary code (step 3.5).

A repo that names its own review skill for Standards and Spec (step 3a) supplies that material itself in place of the generic discovery below; any further axis it names runs alongside Boundary the same way.

Each axis runs as a **parallel sub-agent** so they don't pollute each other's context, then this skill aggregates their findings.

## Process

### 1. Pin the fixed point

- [ ] Take the fixed point the user supplied — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. Ask for one if they didn't specify.
- [ ] Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base).
- [ ] Note the commit list: `git log <fixed-point>..HEAD --oneline`.
- [ ] Confirm the fixed point resolves: `git rev-parse <fixed-point>`.
- [ ] Confirm the diff is non-empty.

A bad ref or empty diff fails here — not inside two parallel sub-agents.

### 1a. Inputs a calling loop may pass

A caller that runs this skill more than once against the same fixed point (a review–fix loop) may pass any of these. Each one is optional. When a caller passes none, every step runs as written.

- [ ] **A path list.** Every axis reads only these paths, plus the callers and callees of the symbols they change. "Every changed file in this diff" in the step 4 briefs means every file on this list. The diff command stays the full diff, so the agents still have the rest as context.
- [ ] **Source locations from an earlier run:** the spec's location, the standards files with the paths each one governs, whether a repo review skill replaced the generic axes, and each counterpart system with its branch or revision. Steps 2, 3 and 3a read these sources again instead of searching for them. Step 3.5's gate still runs, because a later change can touch boundary code for the first time.
- [ ] **Findings already escalated.** Pass the list to every axis. An axis reports one of them again only when it has new evidence, marked `re-raised: <what changed>`.
- [ ] **Apply mode.** Off by default — `/review` stays fully read-only unless the caller passes this. When on, step 5a runs: you, the orchestrator running this skill, apply each documented-breach finding's proposed fix directly to the working tree instead of only reporting it. A standalone `/review` call, and any other read-only caller, never passes this.
- [ ] **Protected scope** (meaningful only with apply mode on): paths or lines apply mode must never write to — e.g. a plan's `Must not touch` line. When passed, step 5a treats it as a hard boundary regardless of how correct a fix would otherwise be.

### 2. Identify the spec source

Look for the originating spec, in this order — stop at the first that finds one:

- [ ] Issue references in the commit messages (`#123`, `PROJ-456`, `Closes #45`, GitLab `!67`, etc.) — fetch via the repo's documented issue-tracker workflow if one exists (e.g. `docs/agents/issue-tracker.md`), otherwise the tracker's CLI (`gh issue view`, `jira issue view`, …). Then also search the plans (`plan-in-docs`) for that key, and pass every matching plan as spec too. A ticket's Acceptance Criteria states only what users see; the plan's `## Test conditions` carries the technical checklist and never reaches the ticket.
- [ ] A path the user passed as an argument.
- [ ] A plan under `docs/plans/` (plan-in-docs) or a PRD/spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
- [ ] If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent skips and reports "no spec available".

### 3. Identify the standards sources

Collect whichever of these the repo actually has — skip what's absent:

- [ ] A pattern-doc folder such as `spec/` holding authoritative per-area standards. If `CLAUDE.md` carries an index table mapping each doc to the area it covers, use it to select the docs whose area the diff touches, and record which changed paths each selected doc governs.
- [ ] General standards: `CODING_STANDARDS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, and anything else documenting how code should be written.
- [ ] If the repo documents no standards at all, the Standards sub-agent still runs, judging only against conventions visible in the surrounding code — and says so in its report.

### 3a. Defer to a repo-declared review skill, if one exists

- [ ] While reading `CLAUDE.md`/`AGENTS.md` in step 3, also read `CLAUDE.local.md` when present — a personal, gitignored override file some repos use to stage a declaration before it's promoted to the shared doc — and judge, by reading, not by matching a fixed phrase, whether the repo names a specific skill of its own as its review skill. A repo that has done this usually says so plainly, in prose like "`<skill-name>` is this repo's review skill."
- [ ] If it does: **borrow its rulebook, not its orchestration.** Read that skill's own per-axis rulebook file(s) — wherever it points — and use their content as the standards-source material for this skill's own Standards brief (step 4), in place of the generic discovery in step 3. Don't run the generic Standards brief text; the repo's own rulebook content replaces it, not adds to it. Keep dispatching through this skill's own step 4, and keep this skill's own step 5 aggregation and step 5a apply-mode behavior — a repo's own review skill may say things about its own process (an aggregation step, a verdict step, an instruction never to touch the tree) that apply only when that skill runs on its own; borrowing its rulebook content into this skill's dispatch does not inherit them.
- [ ] **Spec is separate: the ticket is still the spec, and step 2 still finds it — unless the repo's own Spec rulebook defines its own ticket-fetch procedure.** When it does, use that procedure in place of step 2's generic one (the same borrow-the-rulebook logic as Standards). When it doesn't, step 2's generic discovery still runs and feeds the repo's own Spec brief content. Either way, don't run the generic Spec brief text; the repo's own rulebook content replaces it.
- [ ] Dispatch any further axis the repo's skill names (a Correctness or Security axis, for instance) alongside Boundary, in step 4, the same way — built from that axis's own rulebook file, dispatched through this skill's own mechanism.
- [ ] **Every brief this skill builds — Standards, Spec, and any further axis the repo declares — asks for a fix on that axis's own top severity tier, except Regression's.** Whatever the axis's own rulebook calls an unambiguous, citable, or verified finding (a rule-numbered breach, a quoted spec line, a verified failure scenario, a definite mismatch) gets a proposed fix as a diff snippet, do not apply it. Add this instruction yourself even when the repo's own rulebook doesn't ask for one; step 5a depends on it being there. Regression stays neutral-report-only, same as the generic axis — never ask it for a fix, whatever the repo's rulebook says.
- [ ] Where that further axis is itself conditional — the repo's own text gates it to certain touched paths — give it the same conditional treatment 3.5 gives Boundary: read the axis's own trigger and only spawn it when a changed path matches, not unconditionally every time.
- [ ] If none of `CLAUDE.md`/`AGENTS.md`/`CLAUDE.local.md` exists, or none is found, or nothing in them makes this declaration: change nothing. Proceed with the generic Standards and Spec sub-agents exactly as below.

**No third axis for the assistant's own judgement, yet.** A repo's own review skill may in turn ask for a further axis carrying whatever review skill the assistant running it already has of its own. This skill does not attempt that: there is no way from here to tell an assistant's own general-purpose review skill to subtract the ground the Standards/Spec axes above already cover, and running it unscoped duplicates findings on ground already read from the repo's own documented rules — worse than not running it at all.

- [ ] Report that this axis did not run, rather than attempting an unscoped version of it.

### 3.5 Decide whether the Boundary axis runs

- [ ] Scan the diff for code that crosses a contract between two independently-deployed systems — a frontend and its API, two services, a client and its server, a job producer and its worker. See [boundary-checks.md](boundary-checks.md) for producer and consumer signals.
- [ ] Run the axis if **either** side appears. Do not require both: the dangerous case is one-sided, where the producer renamed a field and every consumer is untouched and therefore absent from the diff. Requiring both sides means the check only fires once the problem is already visible.
- [ ] Skip the axis when no signal appears — a pure-UI or migration-only diff should not pay for a sub-agent. Don't announce the decision mid-flow; step 5 records it.
- [ ] Note which counterpart systems are readable from here, and **which revision of each you are looking at**. A cross-repo worktree set gives both sides on paired branches; a single checkout may give only one, or one sitting on its default branch. A counterpart on the wrong branch yields confident wrong verdicts, so the axis needs to be told what it is comparing against rather than left to assume.
- [ ] **Read the counterpart's actual integration branch (`dev`/`main`) directly — never substitute a nearby release/bump branch as a "roughly current" stand-in, even when it's more conveniently at hand.** A release branch can already have diverged from the integration branch via an unrelated, already-merged ticket, and the substitution surfaces as a confident, wrong finding rather than a flagged gap (confirmed once: a Boundary check treated a release-bump commit as "roughly-current mainline" for a counterpart repo and reported a live mismatch that a direct check of that repo's actual `dev` branch showed had already been fixed there).

### 3.6 Locate the regression comparison target

Regression always runs, unlike Boundary — there is no gate here.

- [ ] For every path in the diff — DELETED, MODIFIED, or ADDED — note it as a candidate. When the caller passed a path list (step 1a), only paths on that list are candidates. The old behavior lives in its content at the merge-base; the new behavior lives in its content at the PR head. This holds regardless of whether the old code was cleanly deleted (replaced by differently-named files) or rewritten in place at the same path. A path renamed with only minor changes needs no special handling: once a rename changes enough content to matter, git's own similarity detection already reports it as a plain delete+add rather than a rename, so the candidate list above already catches it.
- [ ] If this change is one half of a paired migration across two independently-deployed systems, look for a companion PR named in the PR body — many repos name one when it exists (e.g. "companion PR: owner/repo#1234"). If found, resolve it to its own branch, not the counterpart repo's `dev`/`main` — a paired migration's counterpart contract often lives only on that unmerged branch.
- [ ] If no companion PR is named but the diff still touches behavior that depends on a counterpart system, ask the user for a PR reference or a branch name rather than guessing or skipping.
- [ ] Whichever branch is settled on, apply Boundary's own rule from [boundary-checks.md](boundary-checks.md): establish that it is the branch that pairs with this change, not the counterpart's default branch.

### 4. Spawn the sub-agents

- [ ] Dispatch one fresh subagent per axis that is running, using the current agent's subagent mechanism. Keep the axes independent so they do not share review context.
- [ ] In Claude Code, use one `Agent` tool call per axis and the `general-purpose` subagent unless a repo-declared axis from step 3a names its own.
- [ ] In Codex, use `collaboration.spawn_agent` for each axis. Spawn only as many agents as the available slots allow; when more axes remain, dispatch them as slots open.
- [ ] Name the code-judgement model required by the governing agent instructions when the platform supports it. Do not leave a required model choice to inherit from the calling session.
- [ ] Honor a repo-declared subagent type for an axis when step 3a names one. In Claude Code, set it in the `Agent` call; in Codex, include the requested type or role in the agent prompt because `collaboration.spawn_agent` has no type selector.
- [ ] Tell every fresh subagent to run in caveman mode and pass that instruction to any subagents it spawns — caveman mode does not cascade on its own.
- [ ] Pass each axis the path list and the escalated findings from step 1a, when the caller supplied them.
- [ ] Add to every brief: "End the report with `Read:`, listing every file you read in full, and `Tracing stopped:`, listing each point where you stopped tracing a symbol and why (a repo boundary, a third-party package, a file too large to read)." A caller uses these lists to decide what a later run still has to read.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, each pattern doc tagged with the changed paths whose area it governs.
- The brief: "Report — per file/hunk where relevant — every place the diff violates a documented standard or spec. Cite the source (file + the rule). Before citing a rule as violated, check whether that same rule states its own exception and whether the code falls under it — a citation that ignores the rule's own carve-out is a false positive, not a judgement call. Judge a pattern doc only against changes in the area it covers — don't flag code outside that area against it. Distinguish hard violations from judgement calls. For a hard violation, also propose the fix as a diff snippet; do not apply it. Skip anything tooling enforces. Read every changed file in this diff in full, not just the hunk, and trace every changed symbol into its callers and callees before concluding. Before reporting a finding, search the full diff for every other instance of the same shape and report them together, not just the first one you found. Keep the report concise, but never omit a real finding to fit a target length."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The plan's own linked design artifact, if its frontmatter carries one (e.g. a `design:` link) — fetch it, don't just note its URL.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong; (d) when the diff adds an exception to a gate/precondition function (a write-path check), whether every read-path function reporting on that same precondition (a status/summary/readiness endpoint) was updated to match — a write path that silently outpaces its own status reporting leaves the new capability unreachable through any UI built on that status, even though every acceptance criterion written against the write path still passes. Before flagging (b), check whether the plan's own linked design artifact already shows the addition — a detail that comes straight from the linked design isn't creep, even when the spec's own prose never separately enumerated it. Quote the spec line for each finding. For a finding under (a) or (c) that quotes an exact spec line as missing or wrongly implemented — not a scope-creep note under (b) or an ambiguous case — also propose the fix as a diff snippet; do not apply it. Read every changed file in this diff in full, not just the hunk, and trace every changed symbol into its callers and callees before concluding. Before reporting a finding, search the full diff for every other instance of the same shape and report them together, not just the first one you found. Keep the report concise, but never omit a real finding to fit a target length."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

**Boundary sub-agent prompt** — include:

- The diff command and commit list.
- Which counterpart systems are readable, where they are, and which branch or revision each is on.
- The contents of [boundary-checks.md](boundary-checks.md).
- The brief: "Find every hunk that crosses a contract between independently-deployed systems, locate the counterpart on the other side whether or not it changed, and compare the shapes. Two severities only: definite mismatch (both sides inspected) and needs manual verification (state exactly what a human must check). If a counterpart system is not readable from here, say so rather than guessing — that is a finding, not a blank. Read every changed file in this diff in full, not just the hunk, and trace every changed symbol into its callers and callees before concluding. Before reporting a finding, search the full diff for every other instance of the same shape and report them together, not just the first one you found. Keep the report concise, but never omit a real finding to fit a target length."

**Regression sub-agent prompt** — include:

- The full diff command and commit list.
- Every candidate path noted in step 3.6, plus the merge-base and PR-head revisions to read each one's full content at — not just the diff hunk.
- The companion branch identified in step 3.6, if any, and which revision of it to read.
- The contents of [regression-checks.md](regression-checks.md).
- The brief: "For every candidate path, read its full content at the merge-base and at the PR head, and report every user-visible behavior difference between them — a field removed, a default changed, a validation rule tightened or loosened, a display format changed, a control type changed, anything a user or QA would notice. Report neutrally: never judge whether the spec asked for a difference — that call belongs to the human reviewer. Verify every claim against the real downstream code, including the companion branch when one applies, before reporting it; a claim you cannot verify from here is reported as needing manual verification, not asserted as fact. If a companion system this diff depends on cannot be read, say so as its own finding rather than guessing. Two severities only: definite difference (verified) and needs manual verification. Trace every changed symbol into its callers and callees before concluding, in addition to the merge-base/PR-head reads already required above. Before reporting a finding, search the full diff for every other instance of the same shape and report them together, not just the first one you found. Keep the report concise, but never omit a real finding to fit a target length."

### 5. Aggregate

- [ ] Present each report under its own `## Standards`, `## Spec`, `## Regression` and `## Boundary` heading, verbatim or lightly cleaned. Keep each axis's `Read:` and `Tracing stopped:` lists.
- [ ] Do **not** merge or rerank findings — the axes are deliberately separate (see _Why separate axes_).
- [ ] End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any).
- [ ] Don't pick a single winner across axes — that's the reranking the separation exists to prevent.
- [ ] Say explicitly when the Boundary axis did not run.
- [ ] Say explicitly whether apply mode ran (step 5a); if it did, its per-finding `applied` / `could not apply` marks carry the detail — don't duplicate them here.

### 5a. Apply (opt-in)

Runs only when the caller passed apply mode in step 1a. Otherwise stop at step 5 — `/review` stays read-only.

- [ ] Collect every finding carrying a proposed fix: a Standards hard violation, a Spec finding quoting a missing/wrong spec line, a Boundary definite mismatch (already required to include one, [boundary-checks.md](boundary-checks.md)), or — for a repo-declared axis from step 3a — that axis's own top-severity finding, carrying the fix step 3a's own instruction adds to its brief. A Regression finding never carries one — never apply it, whatever axis produced it.
- [ ] Apply them yourself, with your own Edit/Write tools. Do not spawn a further subagent for this, and do not hand them back to the caller to apply.
- [ ] Fixed order: Standards, then Spec, then Boundary, then any repo-declared axis from step 3a in the order it's dispatched. Re-read each target file's current content immediately before applying its fix — an earlier axis's applied fix can already have changed the text a later one targets.
- [ ] If a fix's target text doesn't match the file — an earlier fix this round already changed it, the match is ambiguous (more than one candidate), or the snippet was wrong from the start — do not force it and do not guess. Leave it unapplied and mark it with the real reason (`could not apply: target changed by an earlier fix this round`, `could not apply: target text not found`, or `could not apply: ambiguous match`) — the caller treats any of these the same as an escalation, not as a fix that happened.
- [ ] When the caller passed a protected scope (step 1a), never write inside it, even when the fix is otherwise correct — mark it `could not apply: inside protected scope` instead.
- [ ] Stay within the diff this review is pinned against (step 1) — never touch a line the diff doesn't already contain. Mark a fix that would touch anything else `could not apply: outside the diff`.
- [ ] Every other finding — judgement calls, "needs manual verification," axis-level caveats — is never applied here, apply mode or not.
- [ ] Mark each fix-carrying finding `applied` or `could not apply: <reason>` next to its normal entry in step 5's report.

## Why separate axes

A change can pass one axis and fail another:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**
- Code that is clean, matches the spec, and disagrees with the other side of a contract → **both pass, Boundary fail.** This one compiles and ships, which is why it gets its own axis rather than a note inside Standards.
- Code that is clean and matches the spec, but a rebuild that quietly stopped doing something the old implementation did → **both pass, Regression fail.** The new code was never wrong relative to its own ticket — it just silently dropped a capability no acceptance criterion happened to name.

Reporting them separately stops one axis from masking another.
