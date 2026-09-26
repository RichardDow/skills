---
name: idea
description: Capture a raw idea fast as one markdown file under docs/ideas/, coarse or fine, smart or dumb, work or non-work. Track lifecycle (seed/alive/dead) and bury dead ideas in a graveyard instead of deleting. Use when the user says "/idea", "record an idea", "capture this idea", "note this down", "jot an idea", or wants to save/list/kill/revive ideas.
group: meta-utility
---

# idea

Record ideas cheap. Most die — that's fine. One file per idea, dead ones move to graveyard, never deleted.

## Capture (default)

User gives idea text. Do NOT interrogate. Pick a short title, run:

```bash
scripts/idea.sh new "<title>" [tags...]
```

Tags free-form, space-separated. Suggested axes: `work`/`life`, `coarse`/`fine`, `smart`/`dumb`. Only add tags the user implied — don't force all axes.

Script prints the file path. Open it, append the user's idea as the body (below the frontmatter). Keep their words. Add your own one-line sharpening only if it helps; mark it as yours.

File shape:

```md
---
title: Auto-quote every port pair
date: 2026-07-03
status: seed
tags: [work, coarse]
---

Raw idea text here...
```

`status`: `seed` (just caught) → `alive` (worth chasing) → `dead` (buried).

## Other verbs

```bash
scripts/idea.sh list                    # alive ideas + graveyard count
scripts/idea.sh bury <file> "reason"    # mark dead, move to graveyard/
scripts/idea.sh revive <file>           # bring back, mark alive
```

Promote seed→alive by editing `status:` in the file directly.

## Rules

- Capture speed over structure. Never block on questions.
- Don't delete ideas — `bury` them. Graveyard is the record of what didn't survive.
- **Always resolve and pass `IDEAS_DIR` explicitly.** Never call the script bare and let its own
  cwd-relative default apply. Exactly one vault exists per project, recorded in the user's shared
  repo map. Resolve the repo being worked in — same rule as
  [plan-in-docs](../plan-in-docs/SKILL.md#location): the most recently written file this
  conversation, or the working directory on a cold start. Look up which vault that repo maps to,
  and pass `IDEAS_DIR=<vault>/ideas`. No mapping recorded yet? Ask which vault it belongs to,
  rather than falling back to the script's own default. The script's `docs/ideas`-from-cwd default
  exists only for someone installing this skill standalone with no recorded mapping to consult —
  it is not this session's resolution path.
