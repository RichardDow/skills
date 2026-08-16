---
name: review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along up to three axes — Standards (does the code follow this repo's documented coding standards?), Spec (does the code match what the originating issue/PRD asked for?), and Boundary (does a change crossing a contract between two independently-deployed systems still agree with the other side?). Runs the reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, says "I need a code review", or asks to "review since X".
---

<!-- CLAUDE-SPECIFIC: this skill dispatches work via the Claude Code Agent tool and
     named subagents (general-purpose). Another agent needs its own version using
     its own parallel-subagent mechanism. -->

Review of the diff between `HEAD` and a fixed point the user supplies, along two standing axes and one conditional:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?
- **Boundary** — where the change crosses a contract between independently-deployed systems, does the other side still agree? Runs only when the diff touches boundary code (step 3.5).

Each axis runs as a **parallel sub-agent** so they don't pollute each other's context, then this skill aggregates their findings.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If they didn't specify one, ask for it.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here — not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `PROJ-456`, `Closes #45`, GitLab `!67`, etc.) — fetch via the repo's documented issue-tracker workflow if one exists (e.g. `docs/agents/issue-tracker.md`), otherwise the tracker's CLI (`gh issue view`, `jira issue view`, …).
2. A path the user passed as an argument.
3. A plan under `docs/plans/` (plan-in-docs) or a PRD/spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Collect whichever of these the repo actually has — skip what's absent:

- **A pattern-doc folder** such as `spec/` holding authoritative per-area standards. If `CLAUDE.md` carries an index table mapping each doc to the area it covers, use it to select the docs whose area the diff touches, and record which changed paths each selected doc governs.
- **General standards.** `CODING_STANDARDS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, and anything else documenting how code should be written.

If the repo documents no standards at all, the Standards sub-agent still runs, judging only against conventions visible in the surrounding code — and says so in its report.

### 3.5 Decide whether the Boundary axis runs

Scan the diff for code that crosses a contract between two independently-deployed systems — a frontend and its API, two services, a client and its server, a job producer and its worker. [boundary-checks.md](boundary-checks.md) lists the producer and consumer signals to look for.

Run the axis if **either** side appears. Do not require both: the dangerous case is one-sided, where the producer renamed a field and every consumer is untouched and therefore absent from the diff. Requiring both sides means the check only fires once the problem is already visible.

Skip the axis, silently, when no signal appears — a pure-UI or migration-only diff should not pay for a sub-agent.

Note which counterpart systems are readable from here. A cross-repo worktree set gives both sides; a single checkout may give only one, and the axis reports that rather than guessing.

### 4. Spawn the sub-agents in parallel

Send a single message with one `Agent` tool call per axis that is running. Use the `general-purpose` subagent for all of them.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, each pattern doc tagged with the changed paths whose area it governs.
- The brief: "Report — per file/hunk where relevant — every place the diff violates a documented standard or spec. Cite the source (file + the rule). Judge a pattern doc only against changes in the area it covers — don't flag code outside that area against it. Distinguish hard violations from judgement calls. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

**Boundary sub-agent prompt** — include:

- The diff command and commit list.
- Which counterpart systems are readable, and where they are.
- The contents of [boundary-checks.md](boundary-checks.md).
- The brief: "Find every hunk that crosses a contract between independently-deployed systems, locate the counterpart on the other side whether or not it changed, and compare the shapes. Two severities only: definite mismatch (both sides inspected) and needs manual verification (state exactly what a human must check). If a counterpart system is not readable from here, say so rather than guessing — that is a finding, not a blank. Under 400 words."

### 5. Aggregate

Present each report under its own `## Standards`, `## Spec` and `## Boundary` heading, verbatim or lightly cleaned. Do **not** merge or rerank findings — the axes are deliberately separate (see _Why separate axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent. Say explicitly when the Boundary axis did not run.

## Why separate axes

A change can pass one axis and fail another:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**
- Code that is clean, matches the spec, and disagrees with the other side of a contract → **both pass, Boundary fail.** This one compiles and ships, which is why it gets its own axis rather than a note inside Standards.

Reporting them separately stops one axis from masking another.
