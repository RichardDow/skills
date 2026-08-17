# Portability

A skill must run unchanged in someone else's repo, on someone else's machine, at another company.
The skill states the **job**. The project states the **command**. The environment supplies the
**identity**.

This is the canonical text. A skill that runs commands inlines the one-line version below; nothing
links to this file at run time, because skills are installed one directory at a time and a
cross-skill link does not survive installation.

## What a skill must never contain

- The name of an employer, product, client or internal system.
- The name of a specific repository.
- A tracker, wiki or CI **instance** — a workspace URL, a cloud id, an org slug, a project key
  prefix.
- An absolute path into a home directory, or a home-rooted path outside the skill's own folder, save
  for the three allowances under [Paths](#paths).
- A real ticket key, PR number, host name or person's name in an example.

Naming a tool is allowed and often necessary — a skill that drives Jira must say Jira, and one that
opens a PR must say `gh`. Naming *your instance* of that tool is the violation.

## Commands — name the job, discover the spelling

Never hardcode the underlying binary. Invoking a formatter or a test runner directly ignores the
config, ignore-file and narrowing that the project's own script already encodes, and it assumes an
ecosystem. Resolve the command in this order:

1. **The project manifest.** `package.json` scripts, `Makefile` targets, `pyproject.toml`,
   `Cargo.toml`, `composer.json`, `mix.exs`, `Rakefile`.
2. **The repo's agent config** (`CLAUDE.md`, `AGENTS.md`). It wins where it names a narrower or
   different invocation than the manifest offers — for example running the tests for the touched
   files only, or skipping a check against a known baseline.
3. **Ask.** Only when neither states it.

The line to inline in any skill that runs project commands:

> Run the project's own script for this. Find it in the repo's manifest (`package.json` scripts, a
> `Makefile` target, or the equivalent for the stack); the repo's agent config wins where it names a
> narrower command. Never hardcode a tool binary.

## Instance identity — discover, do not hardcode

For a workspace URL, cloud id, org, project key or account id, in this fixed order:

1. **Ask the API.** Where the tool exposes a discovery call, use it. A single accessible instance is
   used without asking.
2. **Read the repo.** The agent config or docs usually carry the base URL and the key prefix.
3. **Ask the user.** The floor, not the plan.

## Paths

Skill-relative (`scripts/helper.py`) or self-referential (a path to the skill's own installed
folder). Three further paths are allowed, because each is the same for everyone who has the thing it
names:

| Allowed | Write it as |
| --- | --- |
| The config of a tool the skill drives | `$XDG_CONFIG_HOME/<tool>/` — the variable, not the `~/.config` default |
| That tool's own state directory, where its documented contract puts it | `~/.<tool>/` |
| A path the agent estate config declares — the store, a farm, the publish target, the provenance lock | as the config spells it |

Everything else is a violation: a directory the user invented — `~/<work-dir>`, `~/<notes-dir>`, a
screenshots folder — a sibling skill's folder, and a path that merely describes a directory layout.
Layouts differ between two machines belonging to the same person, and a skill installed on its own
has no siblings.

The test is whether the path is wrong on someone else's machine. A tool's config path is not — anyone
who installs the tool has it. A directory the user invented is, and no amount of it being "just an
example" changes that; put a placeholder there instead.

A skill whose subject is a machine's layout beyond these three — one that drives a local sandbox
with its own directory conventions — still cannot obey this. That is what the declared exception
below is for. Do not invent a further private allowance for it.

## Placeholders in examples

Fixed neutral literals, so every skill reads the same way:

| Kind | Use |
| --- | --- |
| Ticket key | `PROJ-1234` |
| Tracker host | `<org>.atlassian.net` |
| Repository | `owner/repo` |
| Branch | `feature/short-slug` |
| Person | `the reviewer`, `the user` |
| Path in an example | repo-relative (`docs/plans/<date>/<slug>.md`); `<project-root>` where a root is needed |

Use angle brackets for a value the agent must actually substitute (`<TICKET-KEY>`), and a neutral
literal for an illustration (`PROJ-1234 - short title`). Do not mix the two for the same value in
one skill.

## When a skill genuinely cannot be generic

Some skills are a company process with no public analogue. They are allowed, but they are declared,
not assumed. Add an entry to the estate config's `portability.project_scoped`, carrying:

- **A reason that names the specific blocker.** "company-specific" is unfalsifiable and is not
  accepted. "Drives an internal release webhook with no public analogue" can be checked, and can
  stop being true.
- **The date it was declared.**

A declared skill is excluded from publication for as long as the declaration stands. The skill-review
pass challenges each entry on every run.

## Editing an existing skill

Removing a specific must never delete the fact. For each one removed, name it and say where it went
— the repo's agent config, the project docs, project memory, or a run-time discovery step. A fact
with no destination is raised with the user, not dropped.
