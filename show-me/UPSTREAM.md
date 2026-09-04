# Differences from upstream

This skill is a fork of `show-me` from
[humanlayer/skills](https://github.com/humanlayer/skills)
(`plugins/show-me/skills/show-me/SKILL.md`). What changed since the fork:

| | upstream | this fork |
|---|---|---|
| length | ~30 lines, one file | `SKILL.md` (pointer) + `FORMS.md` (the vocabulary) |
| notation | mermaid-first | ASCII fenced, 72 cols, on terminal and working documents; mermaid reserved for share-out artifacts only |
| forms | prose list of 8 categories | concrete syntax per form: box-drawing tables, ER/state-machine notation, sequence lanes, pseudocode boxes |
| picking a form | "pick the smallest view" (judgment call) | a table mapping what the change touches to a target-state form and a delta form |
| deltas | "highlight changes" (general) | a diff convention per form: component diff, file-tree diff, call-tree diff, control-flow diff, today/tomorrow for a cross-service path |
| pseudocode | "show algorithms as plain-text steps" | doc comment per method, body elided except a `calls:` line, before/after boxing for a changed method, rule for when a class earns its own box |
| reuse | standalone | cited as the shared vocabulary by `grill-me` and `plan-in-docs`, instead of each restating it |

Upstream states principles ("pick the smallest view," "match product aesthetics").
This fork also states mechanics — exact column widths, when a diff outranks a
full block, when a heading is needed and when it isn't — so two different
sessions draw the same change the same way.
