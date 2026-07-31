# claude-skills-loop

Six [Claude Code skills](https://code.claude.com/docs/en/skills) that form one development loop: a feature travels from a half-formed intention to a merged-ready PR, and every stage's output is the next stage's input.

```
/grill-me  →  /plan-in-docs  →  /implement  →  /push-and-pr
                                  ├─ /tdd
                                  └─ /review
```

## The loop

**1. Grill** (`/grill-me`). Before anything is written, Claude interviews you relentlessly about the plan — one question at a time, each with a recommended answer, walking every branch of the decision tree. Questions answerable from the codebase are answered by exploring it instead of asking. The output isn't a document; it's shared understanding.

**2. Plan** (`/plan-in-docs`). The resolved decision tree becomes a markdown file under `docs/plans/<date>/<slug>.md` — goal, context, decisions with their reasoning, checkable steps, risks. Plans have a lifecycle (`draft → active → done | abandoned`) tracked in frontmatter, and are never deleted: an abandoned plan is a record, not garbage. This stage invokes grill-me's method itself, so you can start here and get the interview for free.

**3. Implement** (`/implement`). Execution starts with git discipline: always ask which base branch to cut from, always fetch origin first, always ask whether to work in a worktree (so parallel work stays untouched). The build itself uses `/tdd` at pre-agreed seams and ends with `/review`. Two feedback loops run alongside the code:

   - *The plan stays true.* Steps get ticked as they land; divergences, deferred steps, and PR links are written back into the plan file. The plan is the source of truth, not a write-once doc.
   - *Comments are proposed, never sprinkled.* Opaque spots are collected as candidates (`file:line` + exact text + why the code can't say it) and presented for approval. The expected outcome for clear code is an empty list.

**4. TDD** (`/tdd`, invoked by implement). Red-green-refactor with vertical slices — one test, one implementation, repeat. Tests verify behaviour through public interfaces, never implementation details. Comes with reference docs on test quality, mocking, refactoring, interface design, and deep modules.

**5. Review** (`/review`, invoked by implement — or standalone on any diff). Two axes reviewed by parallel sub-agents so neither pollutes the other: **Standards** (does the diff follow the repo's documented conventions?) and **Spec** (does it faithfully implement what the issue/plan asked for?). The axes are never merged or reranked — code can pass one and fail the other, and reporting them separately stops one from masking the other.

**6. Push & PR** (`/push-and-pr`). Base branch is always asked, never guessed. The ticket key is derived from the branch name; pre-push hooks are pre-empted by running the repo's typecheck first (a rejected push teaches you nothing a local run couldn't). PR bodies follow one shape: ticket link first, then a short Why and What. If the work happened in a worktree, it's cleaned up after the push.

## Install

Copy any skill folder into `~/.claude/skills/` (global) or `<repo>/.claude/skills/` (project-scoped):

```bash
cp -r grill-me plan-in-docs implement tdd review push-and-pr ~/.claude/skills/
```

Each skill is one folder with a `SKILL.md`; tdd also bundles five reference files. They work independently — the loop is a convention, not a coupling — but implement expects `/tdd` and `/review` to exist, and plan-in-docs uses grill-me's method.

Note: `implement` sets `disable-model-invocation: true` — it only runs when you explicitly type `/implement`. Claude never decides on its own to start cutting branches.

## Conventions baked in

These skills are opinionated. The load-bearing opinions:

- **Ask, don't guess**, for anything with blast radius: base branches, worktrees, ticket creation, comment insertion.
- **Documents have lifecycles.** Plans move `draft → active → done/abandoned` and are updated as work lands, so the next session inherits reality rather than intentions.
- **Separation of concerns in judgment.** Review's two axes stay separate; comment candidates are judged by the human, not the model.
- Placeholders like `PROJ-1234` and `https://<org>.atlassian.net` mark the spots to adapt to your tracker.

## Attribution

- `grill-me`, `tdd`, `review`, and `implement` are adapted from [Matt Pocock's skills collection](https://github.com/mattpocock/skills) (`implement` extends Matt's core with branch/worktree discipline, comment candidates, and plan sync).
- `plan-in-docs` and `push-and-pr` are original.
