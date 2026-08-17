---
name: write-a-skill
description: Create or edit agent skills with proper structure, progressive disclosure, bundled resources, and a portability mandate that keeps every skill free of employer, repo, tracker-instance and machine-path names. Use when the user wants to create, write, build, edit or genericise a skill, or to fix a skill an audit flagged as not portable.
---

# Writing Skills

Two modes. **Create** writes a new skill. **Edit** changes an existing one, including genericising a
skill that `skills-audit` flagged as not portable. Both obey the portability mandate below.

## Create

1. **Gather requirements** - ask user about:
   - What task/domain does the skill cover?
   - What specific use cases should it handle?
   - Does it need executable scripts or just instructions?
   - Any reference materials to include?

2. **Draft the skill** - create:
   - SKILL.md with concise instructions
   - Additional reference files if content exceeds 500 lines
   - Utility scripts if deterministic operations needed

3. **Review with user** - present draft and ask:
   - Does this cover your use cases?
   - Anything missing or unclear?
   - Should any section be more/less detailed?

## Edit

1. **Read the whole skill first**, including its bundled files.
2. **Make the change**, holding the portability mandate over every line you touch.
3. **When genericising**, list each specific you removed and where the fact went — the repo's agent
   config, the project's docs, project memory, or a run-time discovery step. Raise anything with no
   destination instead of dropping it.
4. **Present the diff and stop.** Committing skill changes belongs to `skills-audit`, which owns the
   estate's paths and commits one skill per commit.

## Portability mandate

**No skill may name your employer, product, repository, tracker instance, host or home directory.**
A skill states the job, the project states the command, the environment supplies the identity. Read
[PORTABILITY.md](PORTABILITY.md) before drafting or editing, and apply it in full.

The three rules that decide most lines:

- **Commands.** Never hardcode a tool binary. Resolve the command from the project manifest, then
  the repo's agent config, then ask. Inline the one-line version of this rule into any skill that
  runs project commands — PORTABILITY.md holds the exact sentence.
- **Identity.** Resolve a workspace URL, cloud id, org or key prefix by API discovery, then the
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

## SKILL.md Template

```md
---
name: skill-name
description: Brief description of capability. Use when [specific triggers].
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

- SKILL.md exceeds 100 lines
- Content has distinct domains (finance vs sales schemas)
- Advanced features are rarely needed

## Review Checklist

After drafting, verify:

- [ ] Description includes triggers ("Use when...")
- [ ] SKILL.md under 100 lines
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
