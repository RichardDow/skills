# Upstream

This skill is a fork of `show-me` from
[humanlayer/skills](https://github.com/humanlayer/skills)
(`plugins/show-me/skills/show-me/SKILL.md`), kept here for reference. `SKILL.md`
and `FORMS.md` are the current, actively maintained version — this file is not.

```markdown
# show-me

**Purpose:** A visual communication guide for Claude Code—help users grasp concepts through minimal, focused diagrams rather than lengthy text.

**Core principle:** "Skip the preamble and keep prose brief. Pick the smallest view that makes the key point clear."

## Visual Formats

**Pseudocode/Logic** — Show algorithms as plain-text steps

**Call Trees** — Display runtime flow and function relationships

**Component Trees** — Map UI structure with state and module ownership

**File Trees** — Illustrate codebase organization and responsibility

**Mermaid Diagrams** — Render sequence flows, dependencies, and interactions

**Diffs** — Highlight changes while preserving context (components, files, control flow, state)

**Full Code Blocks** — Show complete implementations when mostly new or when context matters for ownership

**HTML Artifacts** — Build focused infographics for dense visual concepts (layouts, state comparisons, UI variations)

## Key Constraints

- Match product aesthetics (colors, typography, spacing)
- Include only essential details for the current question
- Avoid overwhelming with too many visuals
- Use real labels and data when possible
- Ensure mobile and desktop support for HTML outputs

**Result:** Users grasp architecture, logic, and change impact at a glance.
```
