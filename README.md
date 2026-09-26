# claude-skills

[Claude Code skills](https://code.claude.com/docs/en/skills) and an output style. The skills form one development loop. A feature moves from a half-formed idea to a merge-ready PR. Each stage's output feeds the next stage. The output style governs how the agent writes to you at every stage.

```
/grill-me → /plan-in-docs → /start-ticket → /implement → /push-and-pr → /wrap-up-plan-in-docs
                └─ /estimate                    ├─ /tdd
                                                ├─ /review
                                                ├─ /simplify
                                                └─ /clarify
```

You invoke six stages. They call five more skills for you: `/estimate` under plan; `/tdd`, `/review`, `/simplify`, and `/clarify` under implement. Each of the five also runs standalone.

## The stages

**1. Grill** (`/grill-me`). Interviews you about the plan, one question at a time, each answer scored and checked against its real source before it settles anything. Closes only once every branch is resolved and every named file is confirmed read.

**2. Plan** (`/plan-in-docs`). Turns the resolved decisions into a plan file, `<vault>/plans/<date>/<slug>.md`, with a fixed set of sections and a lifecycle status. Runs grill-me's own interview method to get there. Worked example: [docs/plans/2026-07-31/add-idea-skill.md](docs/plans/2026-07-31/add-idea-skill.md).

**3. Start ticket** (`/start-ticket`). Sets Start Date and Due Date at pickup, not at filing. Never called by implement — implement is one attempt, start-ticket is the commitment, so an abandoned attempt can't silently commit you to a date.

**4. Implement** (`/implement`). Builds with `/tdd`, keeps the plan file synced as steps land, and runs `/review` as a loop rather than a one-shot gate. Then `/simplify` and `/clarify` run once review converges. Attended by default; `--unattended` skips the closing interview.

**5. Push & PR** (`/push-and-pr`). Asks the base branch, runs the repo's formatter and typecheck before pushing, and opens the PR with a fixed body shape. Logs the effort as a worklog on the ticket.

**6. Wrap up** (`/wrap-up-plan-in-docs`). Syncs each plan's lifecycle to its ticket's Jira status — in-flight, cancelled, or done. Interviews you when a done ticket still has unticked steps.

## The skills the stages invoke

Each of these also runs standalone on anything you point it at.

**Estimate** (`/estimate`, called by plan-in-docs). Splits the forecast into agent execution, human review, and a rework buffer, since agents write the code and estimating typing estimates the wrong thing. `/estimate calibrate` checks past forecasts against what shipped.

**TDD** (`/tdd`, called by implement). Red-green-refactor in vertical slices, testing behaviour through public interfaces, never internals.

**Review** (`/review`, called by implement). Reviews a diff along up to three axes — Standards, Spec, and Boundary — using parallel sub-agents so none pollutes the others. Inside implement it runs as a loop: fixes land directly, harder calls get escalated to you.

**Simplify** (`/simplify`, called by implement's quality passes). Looks for reuse, simpler control flow, and efficiency, once review has already caught correctness.

**Clarify** (`/clarify`, called by implement's quality passes, after simplify). Makes changed code self-explanatory by structure, and deletes the comments that structure makes redundant. Never changes behaviour.

## Beyond the loop

Fifteen more skills, independent of the loop and the five it calls. Each runs standalone.

**Understand a codebase.** `/document-module` documents one module: what it does, plus its open problems under stable IDs. `/module-inventory` carves a codebase into that module list. `/docs-sweep` finds which module docs have gone stale. `/convention` captures a rule or a gotcha into the repo's own spec folder.

**Decide what to build.** `/design-an-interface` generates several different shapes for the same module, and compares them. `/technical-proposal` drafts the case for a change as a linked document set. `/request-refactor-plan` breaks a refactor into commits small enough to land safely.

**When something breaks.** `/document-investigation` records a debugging session as a durable investigation. `/incident-report` interviews you section by section, and produces a blameless post-mortem.

**Everything else.** `/idea` captures a raw idea in one file, with a lifecycle instead of deletion. `/create-jira-task` files a ticket in your team's template. `/write-a-skill` authors and edits skills, and holds this repo's portability rules. `/caveman` compresses the agent's replies to roughly a quarter of the tokens. `/learning-mode` inverts the contract: the agent coaches, you write the code. `/show-me` draws the diagram vocabulary the other skills cite instead of reinventing.

`/simplify` and `/clarify` are listed above, under [The skills the stages invoke](#the-skills-the-stages-invoke) — they're the loop's own quality passes, not independent of it.

## Output style

**Plain Technical English** — prose rules adapted from [ASD-STE100 Simplified Technical English](https://www.asd-ste100.org/), the controlled language aerospace uses so a maintenance instruction can't be misread. One word for one meaning, active voice, short sentences, conclusion first, no hype or filler. It changes how the agent writes *to you*, not how it writes code.

## Install

Skills, via the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add RichardDow/skills -g     # -g installs to ~/.claude/skills
```

Drop `-g` to install into `.claude/skills/` in the current project instead. Pass `-s <name>` to take one skill rather than all of them.

The output style isn't a `SKILL.md`, so the CLI doesn't carry it. Copy it by hand:

```bash
git clone https://github.com/RichardDow/skills
cp skills/output-styles/*.md ~/.claude/output-styles/
```

Then select it with `/output-style` → **Plain Technical English**.

The skills work independently — the loop is a convention, not a coupling. But `implement` expects `/tdd`, `/review`, `/simplify`, and `/clarify` to exist, and `plan-in-docs` expects `/estimate` and uses grill-me's own method.

## Conventions baked in

These skills are opinionated. The load-bearing opinions:

- **Ask, don't guess**, for anything with blast radius: base branches, worktrees, ticket creation, shared-state writes.
- **Documents have lifecycles.** Plans move `draft → active → done/abandoned`, and get updated as work lands, so the next session inherits reality, not intentions.
- **Separation of concerns in judgment.** The reviewer that finds a problem is never the author that fixes it. Anything with more than one defensible answer goes to the human, not the model.
- **Estimate the human, not the typing.** Code volume is close to free. Review and discovery are not.
- Placeholders like `PROJ-1234` and `https://<org>.atlassian.net` mark the spots to adapt to your tracker.

## Adapting these

If you fork this and diverge — new placeholders, your own process — `scripts/check-drift.sh` reports where your working copy has drifted from what's published here. It only reports; it never touches anything:

```bash
LOCAL_SKILLS=~/.claude/skills ./scripts/check-drift.sh
```

Some divergence is the point. The script catches the other kind: a genuinely general improvement that landed in your copy and never came back.

## Attribution

- `grill-me`, `tdd`, `review`, and `implement` are adapted from [Matt Pocock's skills collection](https://github.com/mattpocock/skills) (MIT).
- `show-me` is adapted from [humanlayer/skills](https://github.com/humanlayer/skills) (MIT).
- `plan-in-docs`, `estimate`, `start-ticket`, `push-and-pr`, and `wrap-up-plan-in-docs` are original.

## License

MIT — see [LICENSE](LICENSE).
