# claude-skills

[Claude Code skills](https://code.claude.com/docs/en/skills) and an output style. The skills form one development loop: a feature travels from a half-formed intention to a merged-ready PR, and every stage's output is the next stage's input. The output style governs how the agent writes to you at every stage.

```
/grill-me  →  /plan-in-docs  →  /implement  →  /push-and-pr  →  /wrap-up-plan-in-docs
                 └─ /estimate      ├─ /tdd
                                   └─ /review
```

## The loop

**1. Grill** (`/grill-me`). Before anything is written, Claude interviews you relentlessly about the plan — one question at a time, each with a recommended answer, walking every branch of the decision tree. Questions answerable from the codebase are answered by exploring it instead of asking. The output isn't a document; it's shared understanding.

**2. Plan** (`/plan-in-docs`). The resolved decision tree becomes a markdown file under `docs/plans/<date>/<slug>.md` — goal, context, decisions with their reasoning, checkable steps, risks. Plans have a lifecycle (`draft → active → done | abandoned`) tracked in frontmatter, and are never deleted: an abandoned plan is a record, not garbage. This stage invokes grill-me's method itself, so you can start here and get the interview for free. Worked example: [docs/plans/2026-07-31/add-idea-skill.md](docs/plans/2026-07-31/add-idea-skill.md).

**3. Estimate** (`/estimate`, invoked by plan-in-docs). Agents write the code, so estimating typing is estimating the wrong thing. The forecast splits into agent execution, human review, and a flat one-cycle rework buffer — and the review half is *derived* from an explicit manual-verification list, every check a human must make because an agent cannot. An empty list means a half-hour review. The number lands in the plan's `estimate:` frontmatter, written once, before the work starts.

**4. Implement** (`/implement`). Execution starts with git discipline: always ask which base branch to cut from, always fetch origin first, always ask whether to work in a worktree (so parallel work stays untouched). The build itself uses `/tdd` at pre-agreed seams. Three feedback loops run alongside the code:

   - *The plan stays true.* Steps get ticked as they land; divergences, deferred steps, and PR links are written back into the plan file. The plan is the source of truth, not a write-once doc.
   - *Comments are proposed, never sprinkled.* Opaque spots are collected as candidates (`file:line` + exact text + why the code can't say it) and presented for approval. The expected outcome for clear code is an empty list.
   - *Review runs as a loop, not a gate.* See below.

**5. TDD** (`/tdd`, invoked by implement). Red-green-refactor with vertical slices — one test, one implementation, repeat. Tests verify behaviour through public interfaces, never implementation details. Comes with reference docs on test quality, mocking, refactoring, interface design, and deep modules.

**6. Review** (`/review`, or the review–fix loop inside implement). Standalone, it reviews any diff along two axes with parallel sub-agents so neither pollutes the other: **Standards** (does the diff follow the repo's documented conventions?) and **Spec** (does it faithfully implement what the issue/plan asked for?). The axes are never merged or reranked — code can pass one and fail the other, and reporting them separately stops one from masking the other.

   Inside implement it runs as a loop instead. Each round spawns a separate read-only reviewer subagent — a different model where possible, since an author reviewing its own diff mostly re-reads its own reasoning. The reviewer classifies each finding as **fix** (correctness bugs, weak tests, one obvious right answer) or **escalate** (product decisions, architecture with more than one defensible answer, public contracts, anything it's under ~80% sure about). The author applies the fixes and queues the escalations in a file written *outside* the working tree, where it can't be committed by accident. Every committed round is green. The loop stops on convergence, five rounds, or two rounds with identical findings.

**7. Push & PR** (`/push-and-pr`). Base branch is always asked, never guessed. The ticket key is derived from the branch name. Two gates are pre-empted before the push, because a rejected push teaches you nothing a local run couldn't: the repo's formatter over the changed files (a CI format check rejects a single hand-wrapped line, and this is the step everyone remembers only afterwards), and the repo's typecheck. PR bodies follow one shape: ticket link first, then a short Why and What. If the work happened in a worktree, it's cleaned up after the push.

**8. Wrap up** (`/wrap-up-plan-in-docs`). Plans drift from reality once tickets close. This sweep reads each open plan's `jira:` frontmatter, fetches the ticket's status, and syncs the lifecycle: in-flight ticket → `active` (auto), cancelled → `abandoned` (proposed, never auto — cancelled work sometimes moved to a new ticket), done with all steps ticked → `done` (auto). Done with *unticked* steps triggers an interview: each step is resolved one at a time (it happened / overtaken by events / genuinely outstanding), and the human decides whether the plan closes. The status-name table in the skill is the adaptation point for your Jira workflow — status *names* are mapped explicitly because Jira's Done category is ambiguous (a "Passed" QA column and "Cancelled" both live there).

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

The skills work independently — the loop is a convention, not a coupling — but implement expects `/tdd` and `/review` to exist, plan-in-docs expects `/estimate`, and plan-in-docs uses grill-me's method.

Note: `implement` sets `disable-model-invocation: true` — it only runs when you explicitly type `/implement`. Claude never decides on its own to start cutting branches.

## Conventions baked in

These skills are opinionated. The load-bearing opinions:

- **Ask, don't guess**, for anything with blast radius: base branches, worktrees, ticket creation, comment insertion.
- **Documents have lifecycles.** Plans move `draft → active → done/abandoned` and are updated as work lands, so the next session inherits reality rather than intentions.
- **Separation of concerns in judgment.** Review's two axes stay separate; the reviewer that finds a problem is never the author that fixes it; comment candidates are judged by the human, not the model.
- **Estimate the human, not the typing.** Code volume is close to free; review and discovery are not.
- Placeholders like `PROJ-1234` and `https://<org>.atlassian.net` mark the spots to adapt to your tracker.

Two skills — `review`, and the review–fix loop in `implement` — dispatch work to parallel subagents through the Claude Code Agent tool, and carry a `CLAUDE-SPECIFIC` comment saying so. On another agent, swap in its own subagent mechanism, or fall back to a single-pass review.

## Adapting these

If you fork this and diverge — pointing the placeholders at your own tracker, adding your own process — `scripts/check-drift.sh` reports where your working copies have drifted from what's published here, without touching anything:

```bash
LOCAL_SKILLS=~/.claude/skills ./scripts/check-drift.sh
```

Some divergence is the point. The script exists to catch the other kind: a genuinely general improvement that landed in your copy and never came back.

## Attribution

- `grill-me`, `tdd`, `review`, and `implement` are adapted from [Matt Pocock's skills collection](https://github.com/mattpocock/skills) (MIT) — `implement` extends Matt's core with branch/worktree discipline, the review–fix loop, comment candidates, and plan sync.
- `plan-in-docs`, `estimate`, `push-and-pr`, and `wrap-up-plan-in-docs` are original.

## License

MIT — see [LICENSE](LICENSE).
