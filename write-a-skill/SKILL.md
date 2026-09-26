---
name: write-a-skill
description: Create or edit agent skills with proper structure, progressive disclosure, bundled resources, and a portability mandate that keeps every skill free of employer, repo, tracker-instance and machine-path names. Use when the user wants to create, write, build, edit or genericise a skill, or to fix a skill an audit flagged as not portable.
group: meta-utility
---

# Writing Skills

Two modes. **Create** writes a new skill. **Edit** changes an existing one. Two triggers send a
skill to Edit mode: `skills-audit` flags it as not portable, or `workflow-review` flags it as a
**restructure** candidate — long and heavily loaded (see that skill's own Buckets section). Both
modes obey the portability mandate below. Both also write every sentence in the active output
style: short, one instruction per sentence, no jargon, no filler. That governs every line drafted
or touched here, not just a final checklist pass — the output style itself states this rule for
"skill files."

## Create

1. **Gather requirements** - ask user about:
   - What task/domain does the skill cover?
   - What specific use cases should it handle?
   - Does it need executable scripts or just instructions?
   - Any reference materials to include?
   - Which group does it belong to? Run
     `python3 ~/.agents/skills/catalogue/scripts/catalogue.py --slugs`
     for the `group:` slugs currently in use and offer them as a fixed
     list plus "other" — a new value requires confirming it's genuinely
     new, not a near-duplicate of an existing one. Do not continue to
     step 2 until a value is set.

2. **Draft the skill** - create:
   - SKILL.md with concise instructions
   - Additional reference files if content exceeds 500 lines
   - Utility scripts if deterministic operations needed

3. **Review with user** - present draft and ask:
   - Does this cover your use cases?
   - Anything missing or unclear?
   - Should any section be more/less detailed?
4. **Optional: test it before it ships.** For a skill whose output is genuinely uncertain, read
   [EVALUATE.md](EVALUATE.md)'s eval loop — real test prompts, paired with/without-skill runs,
   grading, a benchmark, and a static viewer the user reviews. Ask first; never run it unprompted.

## Edit

1. **Read the whole skill first**, including its bundled files.
2. **Make the change**, holding the portability mandate over every line you touch.
3. **When genericising**, list each specific you removed and where the fact went — the repo's agent
   config, the project's docs, `~/.agents` (after asking), or a run-time discovery step. Raise
   anything with no destination instead of dropping it.
4. **When restructuring** (a `workflow-review`-flagged candidate), read [EVALUATE.md](EVALUATE.md)'s
   blind comparison — an independent subagent judges the old and new versions' output with no label
   on which is which. Optional, but the cheapest way to confirm a split-and-rewrite didn't change
   behavior.
5. **Present the diff and stop.** Committing skill changes belongs to `skills-audit`, which owns the
   estate's paths and commits one skill per commit.

## Portability mandate

**No skill may name your employer, product, repository, tracker instance, host or home directory.**
A skill states the job, the project states the command, the environment supplies the identity. Read
[PORTABILITY.md](PORTABILITY.md) before drafting or editing, and apply it in full.

The three rules that decide most lines:

- **Commands.** Never hardcode a tool binary. Resolve the command from the project manifest, then
  the repo's agent config, then ask. Inline the one-line version of this rule into any skill that
  runs project commands — PORTABILITY.md holds the exact sentence.
- **Identity.** Resolve a workspace URL, cloud id, org or key prefix by checking a project-recorded
  tracker config file first (when the repo's agent config names one), then API discovery, then the
  repo, then ask. Never write the value into the skill.
- **Paths.** Skill-relative or self-referential, plus a driven tool's `$XDG_CONFIG_HOME` config, that
  tool's own `~/.<tool>/` state directory, and a path the estate config declares. A user-chosen
  directory is never allowed, not even as an example.

Naming a tool is allowed. Naming your instance of it is the violation.

A skill that genuinely cannot be generic is declared, not left unmarked: add it to the estate
config's `portability.project_scoped` with a reason that names the blocker and the date. Propose the
declaration and its reason; never add one silently. A declared skill is excluded from publication.

## Skill Structure

```
skill-name/
├── SKILL.md           # Main instructions (required)
├── REFERENCE.md       # Detailed docs (if needed)
├── EXAMPLES.md        # Usage examples (if needed)
└── scripts/           # Utility scripts (if needed)
    └── helper.js
```

This skill's own directory carries the optional eval tooling `EVALUATE.md` points to:
`scripts/` (`quick_validate.py`, `run_eval.py`, `run_loop.py`, `improve_description.py`,
`generate_report.py`, `aggregate_benchmark.py`, `utils.py`), `agents/` (`grader.md`,
`comparator.md`, `analyzer.md`), `references/schemas.md`, and `eval-viewer/`. Results land in a
sibling `<skill-name>-workspace/` directory, gitignored — never commit it.

## SKILL.md Template

```md
---
name: skill-name
description: Brief description of capability. Use when [specific triggers].
group: <slug>
---

# Skill Name

## Quick start

[Minimal working example]

## Workflows

[Step-by-step processes with checklists for complex tasks]

## Advanced features

[Link to separate files: See [REFERENCE.md](REFERENCE.md)]
```

## Description Requirements

The description is **the only thing your agent sees** when deciding which skill to load. It's surfaced in the system prompt alongside all other installed skills. Your agent reads these descriptions and picks the relevant skill based on the user's request.

**Goal**: Give your agent just enough info to know:

1. What capability this skill provides
2. When/why to trigger it (specific keywords, contexts, file types)

**Format**:

- Max 1024 chars
- Write in third person
- First sentence: what it does
- Second sentence: "Use when [specific triggers]"

**Good example**:

```
Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when user mentions PDFs, forms, or document extraction.
```

**Bad example**:

```
Helps with documents.
```

The bad example gives your agent no way to distinguish this from other document skills.

## When to Add Scripts

Add utility scripts when:

- Operation is deterministic (validation, formatting)
- Same code would be generated repeatedly
- Errors need explicit handling

Scripts save tokens and improve reliability vs generated code.

## When to Split Files

Split into separate files when:

- SKILL.md exceeds 500 lines
- Content has distinct domains (finance vs sales schemas)
- A section passes both of these tests. First: it's a complete, self-contained procedure with its
  own internal structure — a round-by-round loop, a file-format spec — not orienting material that
  only makes sense woven into the surrounding flow. Second: it's only needed once execution
  actually reaches that phase, not needed to understand the skill's overall shape. `implement`'s
  `REVIEW-LOOP.md` and `QUALITY-PASSES.md` are the worked example. Branch/worktree/commit setup
  stayed inline — sequential, needed to follow the flow. The review loop's round mechanics and the
  quality-pass dispatch order moved out — self-contained, read only once that phase starts.

## Review Checklist

After drafting, verify:

- [ ] Description includes triggers ("Use when...")
- [ ] SKILL.md under 500 lines
- [ ] Every sentence follows the active output style — short, one instruction each, no jargon
- [ ] `group:` set to one of the values currently in use, or a confirmed new one
- [ ] No time-sensitive info
- [ ] Consistent terminology
- [ ] Concrete examples included
- [ ] References one level deep
- [ ] No employer, product, repository, tracker-instance, host or home-directory name — in the body,
      the examples **and** the frontmatter description
- [ ] Every project command is discovered, not hardcoded; the discovery line is inlined
- [ ] Examples use the placeholder vocabulary from PORTABILITY.md
- [ ] Paths are skill-relative, self-referential, or one of PORTABILITY.md's three allowances
- [ ] When editing: every removed specific has a stated destination
