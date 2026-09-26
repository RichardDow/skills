# Evaluate a skill

Read this before running any of the three checks below. All three are
optional. Nothing here is a required step in Create or Edit mode — run one
only when the user asks for it, or when a new skill's output is genuinely
uncertain enough to be worth testing before it ships.

## Quick validate — always available, no setup

```bash
python3 scripts/quick_validate.py <skill-path>
```

Checks SKILL.md structure: frontmatter present, exactly one SKILL.md per
skill. Cheap. Run it any time a skill's structure is in doubt, whether or
not you run either check below.

## Eval loop — Create mode, a new skill worth testing before it ships

Test the draft against real prompts before finalizing it.

1. **Write 2-3 realistic test prompts** — the kind of thing a real user
   would actually say, not an abstract description. Share them with the
   user and confirm before running anything.
2. **Save to `evals/evals.json`** next to the skill (schema:
   [references/schemas.md](references/schemas.md)). Prompts only at
   first — draft assertions in the next step, while the runs are in
   progress.
3. **Spawn paired subagent runs, same turn.** For each test case, one
   subagent with the skill, one without (or the old version, when
   improving an existing skill). Launch both together — never with-skill
   first and baseline later. Save each run's output to
   `<skill-name>-workspace/iteration-N/eval-N/with_skill/` and
   `.../without_skill/` (or `.../old_skill/`).
4. **While runs are in progress, draft assertions.** Objectively
   verifiable claims only — a subjective skill (writing style, art) gets
   qualitative review instead, not forced assertions. Update
   `eval_metadata.json` for each test case.
5. **Grade each run** — spawn a subagent with [agents/grader.md](agents/grader.md), check
   assertions against outputs. Save to `grading.json` per run — the
   viewer depends on the exact field names `text`, `passed`, `evidence`.
6. **Aggregate the benchmark:**
   ```bash
   python3 -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
   Produces `benchmark.json`/`benchmark.md`: pass rate, time, tokens,
   mean ± stddev, delta between with-skill and baseline.
7. **Run an analyst pass** — read [agents/analyzer.md](agents/analyzer.md)'s "Analyzing Benchmark
   Results" section. Flags two things aggregate numbers hide: an
   assertion that passes regardless of the skill (it isn't testing
   anything), and a high-variance eval (it may be flaky, not
   meaningful).
8. **Launch the viewer, always static** — this estate has no reliable
   browser on every host, so never start a local server:
   ```bash
   python3 eval-viewer/generate_review.py <workspace>/iteration-N \
     --skill-name "<name>" --benchmark <workspace>/iteration-N/benchmark.json \
     --static <output_path>
   ```
   Tell the user where the file is. They open it themselves, review
   each case, and leave feedback that saves to `feedback.json` on
   download — ask them to drop that file back into the workspace
   directory when they're done.
9. **Read `feedback.json`.** Empty feedback means that case looked fine.
   Focus the next revision on cases with an actual comment.
10. **Revise, then repeat** from step 3 into `iteration-(N+1)/`, passing
    `--previous-workspace` to the viewer. Stop when the user is happy,
    feedback comes back empty, or another round isn't finding anything
    new.

## Blind comparison — Edit mode, validating a restructure

For "is the restructured version actually behaviorally equivalent," not
for a new skill. Read [agents/comparator.md](agents/comparator.md) and
[agents/analyzer.md](agents/analyzer.md). Give an independent subagent
both outputs — the old skill's and the new one's, run against the same
prompt — with no label on which is which, and let it judge. Then read why
the two differed, using the analyzer's own reasoning. Lighter than the
full eval loop: one comparison, not an iteration cycle.

## Description optimization

The description field is what decides whether a skill triggers at all.
Run this after the skill itself is settled, only if the user wants
triggering accuracy checked.

1. **Generate 20 eval queries** — realistic, concrete, and specific:
   file paths, names, a little backstory. Split roughly 8-10
   should-trigger, 8-10 should-not-trigger. The should-not-trigger set is
   the one that matters most: near-misses that share a keyword or
   concept but genuinely need something else. An obviously irrelevant
   negative tests nothing.
2. **Review with the user** before running anything — bad eval queries
   produce a bad description. Use `assets/eval_review.html` if you ported
   it, or just list the queries in chat and ask for changes.
3. **Run the loop:**
   ```bash
   python3 -m scripts.run_loop --eval-set <path> --skill-path <skill-path> \
     --model <model-id-powering-this-session> --max-iterations 5 --verbose
   ```
   Splits the set 60/40 train/test, runs each query three times for a
   reliable trigger rate, proposes a revised description from what
   failed, and re-scores. Iterates up to five times. Picks
   `best_description` by the *held-out test* score, not train — this is
   what stops it from overfitting to the exact queries you wrote.
4. **Apply the result.** Show the user before/after and the scores. Keep
   it plain — short, no hype, no oversold trigger phrasing. A description
   that reads like an ad is a worse description here, whatever it scores.

## Schemas

[references/schemas.md](references/schemas.md) has the exact JSON shapes
for `evals.json`, `eval_metadata.json`, `grading.json`, and
`benchmark.json`.

## Dependency note

`run_eval.py` and `improve_description.py` both shell out to `claude -p`.
This only works from Claude Code, using the session's own auth — nothing
else to configure, but nothing to run this from outside Claude Code
either.
