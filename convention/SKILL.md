---
name: convention
description: Capture a coding convention or domain gotcha into the repo's central spec/ folder — mapping the rule to the spec that covers its topic and appending it as a Rule callout, or proposing a new numbered spec when none fits. Use when the user says "/convention", "capture this rule", "make this a convention", "we should always/never ...", or states a must-do / gotcha worth writing down so it outlives the person who knows it.
---

# Convention

Capture a rule into the repo's central `spec/` folder — the authoritative, numbered pattern docs indexed from the repo's agent-instructions file. That file is `AGENTS.md` or `CLAUDE.md`; prefer `AGENTS.md` when both exist (`CLAUDE.md` is often a symlink to it). Match the rule to the spec covering its topic; append it there. Propose a new spec only when none fits.

## Quick start

`/convention prefer tv() for component variants`

→ read the `### Specifications` index in `AGENTS.md`/`CLAUDE.md` → the design-system spec covers it → append a `**Rule:**` line under the right section. Done.

## Workflow

1. **Locate the spec set.** Find the repo root (dir with `.git` / `package.json`) and its `spec/` folder. The **`### Specifications` table in the repo's `AGENTS.md`/`CLAUDE.md`** is the index — it maps each `spec/NNN-*.md` to the topic it covers. Read it; it's the routing map.

2. **Match the rule to a spec.** From the rule's topic, pick the covering spec via the index (e.g. a route-layer rule → `001-route-architecture`, a fixture rule → `005-scenario-builder`). When two could fit, pick the more specific.

3. **Append the rule.**
   - Open the matched spec. Find the `##`/`###` section the rule belongs under (the section on that concern). Add it as a **Rule callout** in the doc's existing style — most specs write `**Rule:** <terse one-liner>` inline under the relevant bullet/section.
   - Keep it terse: one rule, one line, imperative. No preamble.
   - If the rule is a **gotcha** (a surprising truth, not a directive), state the trap and the workaround in one line.
   - Deduplicate: if the rule (or its inverse) already exists in that spec, update in place — don't add a second.

4. **No matching spec → propose, don't auto-spawn.** If no existing spec covers the topic, **stop and ask**: "No spec covers this. Create `spec/00N-<topic>.md`?" (N = next free number). A spec is a deep pattern doc, not a one-liner bin — never create one silently.
   - On yes: create `spec/00N-<topic>.md` with a `# Title`, a one-line intro, and the rule as the first `**Rule:**`. Then **add a row to the `### Specifications` table in `AGENTS.md`/`CLAUDE.md`** so the new spec is indexed and triggerable.

5. **Report** the spec file + section touched, one line back.

## Format rules

- Match the target spec's existing prose style (see [STYLE cues](#style-cues)). Specs are prose + inline `**Rule:**` callouts, not a flat bullet list.
- One rule = one line. Split compound rules.
- No dates, author names, or "as of" — rules are timeless.
- Reference a canonical example file where it sharpens the rule (`see EButton.vue`) — a path, not pasted code (code rots).

## Style cues

- `**Rule:** <one-liner>` placed under the section that owns the concern.
- Longer rationale only if the *why* is non-obvious; keep it to a sentence, in the surrounding prose — the callout stays one line.

## Scope

This skill only ever writes to the central `spec/` folder and the `### Specifications` index in `AGENTS.md`/`CLAUDE.md`. It does not create colocated per-directory rule files. Central spec/ is the single source of truth; the `AGENTS.md`/`CLAUDE.md` index is how agents find the right one.
