---
name: review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along up to three axes — Standards (does the code follow this repo's documented coding standards?), Spec (does the code match what the originating issue/PRD asked for?), and Boundary (does a change crossing a contract between two independently-deployed systems still agree with the other side?). Runs the reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, says "I need a code review", or asks to "review since X".
group: review-quality
---

<!-- CLAUDE-SPECIFIC: this skill dispatches work via the Claude Code Agent tool and
     named subagents (general-purpose). Another agent needs its own version using
     its own parallel-subagent mechanism. -->

Review of the diff between `HEAD` and a fixed point the user supplies, along two standing axes and one conditional:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?
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

### 2. Identify the spec source

Look for the originating spec, in this order — stop at the first that finds one:

- [ ] Issue references in the commit messages (`#123`, `PROJ-456`, `Closes #45`, GitLab `!67`, etc.) — fetch via the repo's documented issue-tracker workflow if one exists (e.g. `docs/agents/issue-tracker.md`), otherwise the tracker's CLI (`gh issue view`, `jira issue view`, …).
- [ ] A path the user passed as an argument.
- [ ] A plan under `docs/plans/` (plan-in-docs) or a PRD/spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
- [ ] If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent skips and reports "no spec available".

### 3. Identify the standards sources

Collect whichever of these the repo actually has — skip what's absent:

- [ ] A pattern-doc folder such as `spec/` holding authoritative per-area standards. If `CLAUDE.md` carries an index table mapping each doc to the area it covers, use it to select the docs whose area the diff touches, and record which changed paths each selected doc governs.
- [ ] General standards: `CODING_STANDARDS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, and anything else documenting how code should be written.
- [ ] If the repo documents no standards at all, the Standards sub-agent still runs, judging only against conventions visible in the surrounding code — and says so in its report.

### 3a. Defer to a repo-declared review skill, if one exists

- [ ] While reading `CLAUDE.md`/`AGENTS.md` in step 3, judge — by reading, not by matching a fixed phrase — whether the repo names a specific skill of its own as its review skill. A repo that has done this usually says so plainly, in prose like "`<skill-name>` is this repo's review skill."
- [ ] If it does: that skill's own Standards and Spec material — wherever it points, its own rulebook files — supersedes the generic Standards and Spec sub-agents below. Don't run the generic versions for those two axes; the repo's own axes replace them, not add to them.
- [ ] Dispatch any further axis the repo's skill names (a Security axis, for instance) alongside Boundary, in step 4.
- [ ] Where that further axis is itself conditional — the repo's own text gates it to certain touched paths — give it the same conditional treatment 3.5 gives Boundary: read the axis's own trigger and only spawn it when a changed path matches, not unconditionally every time.
- [ ] If no `CLAUDE.md`/`AGENTS.md` exists, or none is found, or nothing in it makes this declaration: change nothing. Proceed with the generic Standards and Spec sub-agents exactly as below.

**No third axis for the assistant's own judgement, yet.** A repo's own review skill may in turn ask for a further axis carrying whatever review skill the assistant running it already has of its own. This skill does not attempt that: there is no way from here to tell an assistant's own general-purpose review skill to subtract the ground the Standards/Spec axes above already cover, and running it unscoped duplicates findings on ground already read from the repo's own documented rules — worse than not running it at all.

- [ ] Report that this axis did not run, rather than attempting an unscoped version of it.

### 3.5 Decide whether the Boundary axis runs

- [ ] Scan the diff for code that crosses a contract between two independently-deployed systems — a frontend and its API, two services, a client and its server, a job producer and its worker. See [boundary-checks.md](boundary-checks.md) for producer and consumer signals.
- [ ] Run the axis if **either** side appears. Do not require both: the dangerous case is one-sided, where the producer renamed a field and every consumer is untouched and therefore absent from the diff. Requiring both sides means the check only fires once the problem is already visible.
- [ ] Skip the axis when no signal appears — a pure-UI or migration-only diff should not pay for a sub-agent. Don't announce the decision mid-flow; step 5 records it.
- [ ] Note which counterpart systems are readable from here, and **which revision of each you are looking at**. A cross-repo worktree set gives both sides on paired branches; a single checkout may give only one, or one sitting on its default branch. A counterpart on the wrong branch yields confident wrong verdicts, so the axis needs to be told what it is comparing against rather than left to assume.

### 4. Spawn the sub-agents in parallel

- [ ] Send a single message with one `Agent` tool call per axis that is running.
- [ ] Use the `general-purpose` subagent for all of them, unless a repo-declared axis from step 3a names a subagent of its own.
- [ ] Name the tier the governing agent-instructions file's model-split rule names for code-facing judgement, explicitly on each spawn — never left to inherit the calling session's model.
- [ ] If whoever is running this skill was itself told to run in caveman mode, pass that instruction on to each of these spawns too — caveman mode does not cascade to an agent's own further spawns on its own.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, each pattern doc tagged with the changed paths whose area it governs.
- The brief: "Report — per file/hunk where relevant — every place the diff violates a documented standard or spec. Cite the source (file + the rule). Before citing a rule as violated, check whether that same rule states its own exception and whether the code falls under it — a citation that ignores the rule's own carve-out is a false positive, not a judgement call. Judge a pattern doc only against changes in the area it covers — don't flag code outside that area against it. Distinguish hard violations from judgement calls. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The plan's own linked design artifact, if its frontmatter carries one (e.g. a `design:` link) — fetch it, don't just note its URL.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong; (d) when the diff adds an exception to a gate/precondition function (a write-path check), whether every read-path function reporting on that same precondition (a status/summary/readiness endpoint) was updated to match — a write path that silently outpaces its own status reporting leaves the new capability unreachable through any UI built on that status, even though every acceptance criterion written against the write path still passes. Before flagging (b), check whether the plan's own linked design artifact already shows the addition — a detail that comes straight from the linked design isn't creep, even when the spec's own prose never separately enumerated it. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

**Boundary sub-agent prompt** — include:

- The diff command and commit list.
- Which counterpart systems are readable, where they are, and which branch or revision each is on.
- The contents of [boundary-checks.md](boundary-checks.md).
- The brief: "Find every hunk that crosses a contract between independently-deployed systems, locate the counterpart on the other side whether or not it changed, and compare the shapes. Two severities only: definite mismatch (both sides inspected) and needs manual verification (state exactly what a human must check). If a counterpart system is not readable from here, say so rather than guessing — that is a finding, not a blank. Under 400 words."

### 5. Aggregate

- [ ] Present each report under its own `## Standards`, `## Spec` and `## Boundary` heading, verbatim or lightly cleaned.
- [ ] Do **not** merge or rerank findings — the axes are deliberately separate (see _Why separate axes_).
- [ ] End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any).
- [ ] Don't pick a single winner across axes — that's the reranking the separation exists to prevent.
- [ ] Say explicitly when the Boundary axis did not run.

## Why separate axes

A change can pass one axis and fail another:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**
- Code that is clean, matches the spec, and disagrees with the other side of a contract → **both pass, Boundary fail.** This one compiles and ships, which is why it gets its own axis rather than a note inside Standards.

Reporting them separately stops one axis from masking another.
