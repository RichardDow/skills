---
title: Add an /idea skill upstream of grill-me
date: 2026-07-31
status: active
jira: https://<org>.atlassian.net/browse/PROJ-1234
slack: https://<org>.slack.com/archives/C0000000/p1234567890
---

*Example plan — illustrates `/plan-in-docs` output. Not tracked work.*

## Goal

An `/idea` skill exists in this repo as the loop's entry point: it captures a raw thought as one markdown file under `docs/ideas/` in seconds, without asking questions. Ideas carry a lifecycle, dead ones are buried rather than deleted, and an idea that graduates into a plan is cross-linked with it in both directions. Done means the dangling `docs/ideas/` reference in `plan-in-docs/SKILL.md` resolves to something real.

## Context

`plan-in-docs/SKILL.md` already documents a cross-link contract with a skill that does not exist:

```
Graduated from an idea? If the repo keeps an ideas dir (e.g. docs/ideas/) and the
plan grew out of one, cross-link both ways: plan's Context links the idea file, and
the idea gets a plan: <relative path> frontmatter field plus a one-line note.
```

Nothing in this repo writes those idea files. The loop as advertised in the README starts at `/grill-me`, which is the wrong entry point for a half-formed thought: grilling assumes there is already a plan worth stress-testing. Ideas that arrive mid-task have nowhere to go, so they are lost or they derail the task.

The gap is verifiable: `grep -rl "docs/ideas" .` hits `plan-in-docs/SKILL.md` and this plan, nothing else.

Constraint: capture must be near-zero friction. If recording an idea costs a conversation, the idea does not get recorded.

## Decisions

**One idea = one file under `docs/ideas/`, no index.** Mirrors `plan-in-docs`' one-file-per-thing shape, so both skills are read the same way and `grep` is the index. An index file is a merge-conflict magnet and goes stale the first time someone edits a file directly.

**Lifecycle in frontmatter: `seed → alive → dead`.** Deliberately parallel to plans' `draft → active → done | abandoned`. The loop's standing opinion is that documents have lifecycles; ideas are not exempt. Distinct vocabulary from plans, because an idea is never "done" — it either becomes a plan or it dies.

**Dead ideas move to a graveyard, never deleted.** Same reasoning as never deleting abandoned plans: the record of what was considered and rejected is the valuable part. Killing an idea by `git rm` hides it behind history nobody reads; `docs/ideas/graveyard/` keeps it one `grep` away with its cause of death written down.

**Capture does not grill.** `/idea` asks nothing — it writes the file and reports the path. Interrogation belongs at `/grill-me`, one stage downstream. Mixing them means every idea costs an interview, which defeats the point and blurs a stage boundary the rest of the loop keeps clean.

**Cross-link contract, both directions.** The graduating idea gains `plan: <relative path>` frontmatter plus a one-line body pointer; the plan's `Context` links the idea. This is not new design — it is the contract `plan-in-docs` already specifies. Implementing it as written keeps one skill from silently redefining another's interface.

## Steps

- [x] Confirm the gap is real and single-sited — `grep -rl "docs/ideas" .` names `plan-in-docs/SKILL.md` as the only skill referencing the dir
- [x] Settle the lifecycle vocabulary (`seed`/`alive`/`dead`) against plans' vocabulary
- [x] Settle the death semantics: graveyard subdir, not deletion
- [ ] Write `idea/SKILL.md` — frontmatter, capture verb, file template, lifecycle section
- [ ] Add the other verbs: `list` (grouped by status), `kill <idea>` (move to graveyard + reason), `revive <idea>`
- [ ] Add the graduation verb: stamp `plan:` on the idea, hand off to `/plan-in-docs`
- [ ] Amend `plan-in-docs/SKILL.md` — the ideas dir is no longer hypothetical; name `/idea` as its source
- [ ] Update the README loop diagram to start at `/idea`, and add a numbered stage for it
- [ ] Add `/idea` to the README install `cp -r` line
- [ ] Dogfood once: capture a real idea, kill it, confirm the graveyard path and `list` output

**Divergence (2026-07-31):** the graduation verb was originally scoped as an `/idea promote` command that wrote the plan file itself. Dropped — that duplicates `/plan-in-docs`. `/idea` now only stamps the `plan:` field and hands off, which keeps plan-writing in exactly one place.

## Risks

**`docs/ideas/` rots into a dumping ground.** Zero-friction capture with no curation pressure means hundreds of seeds nobody revisits, and the dir stops being worth reading. Fallback: `list` sorts oldest-first by default so stale seeds surface, and a periodic sweep moves untouched seeds to the graveyard — recoverable, so the sweep can be aggressive.

**Scope creep back into grilling.** The first time an idea is captured badly, the temptation is to have `/idea` ask one clarifying question, then two. That erases the stage boundary and makes capture expensive. Mitigation: the no-questions rule is stated as a decision in the skill itself, not just implied by its brevity.
