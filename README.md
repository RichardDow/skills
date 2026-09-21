# claude-skills

[Claude Code skills](https://code.claude.com/docs/en/skills) and an output style. The skills form one development loop: a feature travels from a half-formed intention to a merge-ready PR, and every stage's output is the next stage's input. The output style governs how the agent writes to you at every stage.

```
/grill-me → /plan-in-docs → /start-ticket → /implement → /push-and-pr → /wrap-up-plan-in-docs
                └─ /estimate                    ├─ /tdd
                                                ├─ /review
                                                ├─ /simplify
                                                └─ /clarify
```

Six stages you invoke, and five skills the stages call for you (`/estimate` under plan; `/tdd`, `/review`, `/simplify` and `/clarify` under implement). Each of the five also runs standalone.

## The stages

**1. Grill** (`/grill-me`). Before anything is written, Claude interviews you relentlessly about the plan — one question at a time, each with a recommended answer carrying a confidence score. Scores at one question sum to 100: they rank the live options against each other, not each one in isolation. A claim borrowed from somewhere else (a linked review, a bot comment, a teammate's summary) is verified against its real source before it's allowed to settle a question, and marked **UNVERIFIED** until it is. When an answer changes what files exist or what calls what, the shape is redrawn in ASCII before the next question — the drawing is the record, not something authored afterward to fill a section. Questions answerable from the codebase are answered by exploring it instead of asking. Closing needs a passed check, not a feeling: every unresolved branch re-derived from the transcript, every named file and symbol confirmed read, and — for a skill that borrows this method to produce a document — every row that document adds on top.

**2. Plan** (`/plan-in-docs`). The resolved decision tree becomes a markdown file under `<vault>/plans/<date>/<slug>.md` (the vault is a recorded mapping, never a folder discovered by searching the repo) — `Description`, `Background`, `Decisions`, `Technical Requirements` (with an as-built ASCII diagram), `Acceptance Criteria`, `Steps`, `Open questions`, `Time`, and `Risks`. Plans have a lifecycle (`draft → active → done | abandoned`) tracked in frontmatter, and are never deleted: an abandoned plan is a record, not garbage. This stage invokes grill-me's method itself, adding ten of its own required rows to the closing check — among them that no two `Decisions` conflict and that the pseudocode is checked line-by-line against its own Acceptance Criteria for narrowing or omission. Worked example: [docs/plans/2026-07-31/add-idea-skill.md](docs/plans/2026-07-31/add-idea-skill.md) (written against an earlier, shorter template — the section names above are current).

**3. Start ticket** (`/start-ticket`). The pickup hook. Tickets get filed early with an estimate and no dates, so they can sit in a backlog; this is the "I am starting now" moment that fills them in. Start Date is today, Due Date is today advanced by the estimate in *working* days, and a `start-dev:` note goes into the plan so the actual effort can be measured against the forecast later. A Start Date that is already set blocks a re-stamp, and both dates are confirmed before writing — other people see them.

   It is deliberately *not* called by implement. Implement is one **attempt**; start-ticket is the **commitment**, and an abandoned attempt must not silently set a due date nobody agreed to. The re-stamp guard can't help there — it only ever blocks the second write, never the first one you didn't want. It is also the only loop stage that writes to shared state, so if you run implement unattended or with restricted credentials, this step stays on the trusted side of that line.

**4. Implement** (`/implement`). Attended by default; an explicit `--unattended` changes only how a blocking plan gap surfaces and skips the closing interview — everything else runs the same. Execution starts with git discipline: always ask which base branch to cut from, always fetch origin first, always ask whether to work in a worktree (so parallel work stays untouched). The build itself uses `/tdd` at pre-agreed seams. Four feedback loops run alongside the code:

   - *The plan stays true.* Steps get ticked as they land; divergences, deferred steps, and PR links are written back into the plan file. The plan is the source of truth, not a write-once doc.
   - *A comment is a smell.* Rationale belongs in the commit message, the PR description, the review thread — searchable, dated, attached to the change that motivated it. A comment survives only where a constraint bites at the point of edit, for a reader who won't be reading git history. Nothing is collected for approval; the clarity pass owns this.
   - *Review runs as a loop, not a gate.* See `/review` below for the rounds and their termination conditions. Attended, every escalation is grilled before moving on; unattended, it's left in the queue for a human to read.
   - *Quality passes follow convergence*, in order: a repo-declared security-review skill where the diff touches its trigger paths, then `/simplify`, then `/clarify` — simplify runs first so clarify isn't naming things about to be deleted or merged. Each gets its own commit, because the clarity pass's output *is* a commit message. A repo whose CI produces a post-push coverage/CRAP-style report gets one further pass once the PR is open: `refactor`-kind findings become a follow-up commit, `cover`-kind findings become new tests in a commit of their own.

**5. Push & PR** (`/push-and-pr`). Base branch is always asked, never guessed. The ticket key is derived from the branch name. Two gates are pre-empted before the push, because a rejected push teaches you nothing a local run couldn't: the repo's formatter over the changed files (a CI format check rejects a single hand-wrapped line, and this is the step everyone remembers only afterwards), and the repo's typecheck. PR bodies follow one shape: ticket link first, then a short Why and What. A re-push reconciles the existing PR body and the ticket's own Decisions/Technical Requirements field against the commits since the last push, rather than leaving either describing a state the new commits already changed. The skill never requests the Copilot review itself — an automated request can't pick the effort level, so it always lands at the shallowest one — and tells you to request it yourself instead. Opening the PR is also the "in review" moment, so the effort is logged as a worklog on the ticket — two figures, the agent session and the human review of it, summed into one entry with the split in the comment, because that comment is what `/estimate calibrate` reads later; a re-push after review logs the *additional* effort as its own `rework` entry instead of editing the first one. If the work happened in a worktree, it's cleaned up after the push — unless a batch run still owns it. Finishes by asking, once, whether to run `/retro`.

**6. Wrap up** (`/wrap-up-plan-in-docs`). Plans drift from reality once tickets close. This sweep reads each open plan's `jira:` frontmatter, fetches the ticket's status, and syncs the lifecycle: in-flight ticket → `active` (auto), cancelled → `abandoned` (proposed, never auto — cancelled work sometimes moved to a new ticket), done with all steps ticked → `done` (auto). Done with *unticked* steps triggers an interview: each step is resolved one at a time (it happened / overtaken by events / genuinely outstanding), and the human decides whether the plan closes. The status-name table in the skill is the adaptation point for your Jira workflow — status *names* are mapped explicitly because Jira's Done category is ambiguous (a "Passed" QA column and "Cancelled" both live there).

## The skills the stages invoke

Each of these also runs standalone on anything you point it at.

**Estimate** (`/estimate`, called by plan-in-docs). Agents write the code, so estimating typing is estimating the wrong thing. The forecast splits into agent execution and human review, plus a 1h rework buffer that fires only when the change touches code more than one shipped surface depends on, carries three or more manual acceptance-criteria entries, or spans repos — otherwise it adds nothing. The review figure is *derived* from an explicit manual-verification list, every check a human must make because an agent cannot; an empty list means a half-hour review. The number lands in the plan's `estimate:` frontmatter, written once, before the work starts, and start-ticket turns it into a Due Date. `/estimate calibrate` compares shipped tickets' logged actuals against their forecasts and reports which band drifted — run it after five or ten tickets ship, never move a band on the evidence of one.

**TDD** (`/tdd`, called by implement). Red-green-refactor with vertical slices — one test, one implementation, repeat. Tests verify behaviour through public interfaces, never implementation details. Comes with reference docs on test quality, mocking, refactoring, interface design, and deep modules.

**Review** (`/review`, called by implement). Standalone, it reviews any diff along up to three axes with parallel sub-agents so none pollutes the others: **Standards** (does the diff follow the repo's documented conventions?), **Spec** (does it faithfully implement what the issue/plan asked for?), and **Boundary** (where the diff crosses a contract between independently-deployed systems, does the other side still agree? — runs only when the diff touches that kind of code). A repo that names its own Standards/Spec review skill supplies that material in place of the generic version. The axes are never merged or reranked — code can pass one and fail the others, and reporting them separately stops one from masking the rest.

Inside implement it runs as a loop rather than a gate. Each round spawns a separate read-only reviewer subagent — a different model where possible, since an author reviewing its own diff mostly re-reads its own reasoning. The reviewer classifies each finding as **fix** (correctness bugs, weak tests, one obvious right answer) or **escalate** (product decisions, architecture with more than one defensible answer, public contracts, anything it's under ~80% sure about). The author applies the fixes and queues the escalations in a file written *outside* the working tree, where it can't be committed by accident. Every committed round is green. The loop stops on convergence, a size-based round cap (2 for a small diff, 3 medium, 5 large), or one axis reporting the same finding two rounds running.

**Simplify** (`/simplify`, called by implement's quality passes). Reuse, control-flow simplification, efficiency, and mixed abstraction levels ("altitude") — the review loop above has already hunted correctness, so this pass looks for what's merely redundant or over-complicated. Behaviour-preserving where a fix is provably equivalent; applied anyway, with the edge-case shift named explicitly, where it isn't.

**Clarify** (`/clarify`, called by implement's quality passes, after simplify). Makes changed code self-explanatory by structure — renaming, extraction, control-flow shape — and deletes the comments that structure makes redundant. Never changes behaviour, unlike simplify.

## Beyond the loop

Fifteen more skills, independent of the loop and the five it calls. Each runs standalone.

**Understand a codebase.** `/document-module` builds the living documentation for one module — what it does, plus a registry of its open problems under stable IDs. `/module-inventory` carves a codebase into the module list those docs are written against. `/docs-sweep` finds which of those docs have gone stale as the code moved. `/convention` captures a rule or a gotcha into the repo's own spec folder, so it outlives the person who knows it.

**Decide what to build.** `/design-an-interface` generates several deliberately different shapes for the same module and compares them. `/technical-proposal` drafts the case for a change as a linked document set. `/request-refactor-plan` breaks a refactor into commits small enough to land safely.

**When something breaks.** `/document-investigation` records a debugging session as a durable investigation — including the hypotheses that were killed, and evidence queries you can re-run. `/incident-report` interviews you section by section and produces a blameless post-mortem.

**Everything else.** `/idea` captures a raw idea in one file, with a lifecycle and a graveyard instead of deletion. `/create-jira-task` files a ticket in your team's template. `/write-a-skill` authors and edits skills, and holds the portability rules this repo is written to. `/caveman` compresses the agent's replies to roughly a quarter of the tokens without losing technical accuracy. `/learning-mode` inverts the contract: the agent coaches with clues and doc pointers, and you write the code. `/show-me` draws the diagram vocabulary — file trees, call trees, sequences, before/after blocks — that grill-me and plan-in-docs cite rather than reinvent.

`/simplify` and `/clarify` — the loop's own quality-pass skills — are listed above under [The skills the stages invoke](#the-skills-the-stages-invoke).

## Output style

**Plain Technical English** — prose rules adapted from [ASD-STE100 Simplified Technical English](https://www.asd-ste100.org/), the controlled language aerospace uses so a maintenance instruction cannot be misread. One word for one meaning, active voice, short sentences, conclusion first, no hype or filler. Accuracy outranks brevity: it never drops a fact, a number or a scope qualifier to shorten a sentence, and it leaves code, commands and error messages verbatim.

It changes how the agent writes *to you*, not how it writes code.

## Install

Skills, via the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add RichardDow/skills -g     # -g installs to ~/.claude/skills
```

Drop `-g` to install into `.claude/skills/` in the current project instead. Pass `-s <name>` to take one skill rather than all of them.

The output style is not a `SKILL.md`, so the CLI doesn't carry it — copy it by hand:

```bash
git clone https://github.com/RichardDow/skills
cp skills/output-styles/*.md ~/.claude/output-styles/
```

Then select it with `/output-style` → **Plain Technical English**.

The skills work independently — the loop is a convention, not a coupling — but implement expects `/tdd`, `/review`, `/simplify` and `/clarify` to exist, plan-in-docs expects `/estimate`, start-ticket expects an estimate on the ticket, and plan-in-docs uses grill-me's method.

## Conventions baked in

These skills are opinionated. The load-bearing opinions:

- **Ask, don't guess**, for anything with blast radius: base branches, worktrees, ticket creation, shared-state writes.
- **Documents have lifecycles.** Plans move `draft → active → done/abandoned` and are updated as work lands, so the next session inherits reality rather than intentions.
- **Separation of concerns in judgment.** Review's axes stay separate; the reviewer that finds a problem is never the author that fixes it; anything with more than one defensible answer is escalated to the human rather than decided by the model.
- **Estimate the human, not the typing.** Code volume is close to free; review and discovery are not.
- Placeholders like `PROJ-1234` and `https://<org>.atlassian.net` mark the spots to adapt to your tracker.

Several skills — `review`, the review–fix loop in `implement`, `clarify`, and `simplify` among them — dispatch work to parallel subagents through the Claude Code Agent tool, and carry a `CLAUDE-SPECIFIC` comment saying so. On another agent, swap in its own subagent mechanism, or fall back to a single-pass review.

## Adapting these

If you fork this and diverge — pointing the placeholders at your own tracker, adding your own process — `scripts/check-drift.sh` reports where your working copies have drifted from what's published here, without touching anything:

```bash
LOCAL_SKILLS=~/.claude/skills ./scripts/check-drift.sh
```

Some divergence is the point. The script exists to catch the other kind: a genuinely general improvement that landed in your copy and never came back.

## Attribution

- `grill-me`, `tdd`, `review`, and `implement` are adapted from [Matt Pocock's skills collection](https://github.com/mattpocock/skills) (MIT) — `implement` extends Matt's core with branch/worktree discipline, the review–fix loop, comment candidates, and plan sync.
- `show-me` is adapted from [humanlayer/skills](https://github.com/humanlayer/skills) (MIT).
- `plan-in-docs`, `estimate`, `start-ticket`, `push-and-pr`, and `wrap-up-plan-in-docs` are original.

## License

MIT — see [LICENSE](LICENSE).
