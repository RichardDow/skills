---
name: docs-sweep
description: Cross-module freshness + problem sweep over all module docs. Runs the stage-1 flag script (commits-behind per module from its verified sha + homes), then LLM-triages only the flagged modules — auto-bumping noise, proposing real drift for a human recheck. Also runs heuristic Detection (tier-1 markers always, tier-2 semantic opt-in) writing new candidates into the owning module's registry, and regenerates STATUS.md / PROBLEMS.md / README.md. Use when the user wants to check which docs are stale, sweep the docs, find drift across all modules, refresh the rollups, or before a batch of proposals. Per-module build/recheck/rebuild is document-module's job — this is the cross-module layer above it.
---

# docs-sweep

The **cross-module** layer above `document-module`. `document-module` builds/rechecks/rebuilds
**one** module; `docs-sweep` sweeps **all** of them: flag what drifted, triage it, feed the
findings back, regenerate the rollups. It never rewrites a module doc's prose itself — real
drift is handed to `document-module` recheck (which holds the grill gate + verification bar).

Reads the machine-readable frontmatter each `index.md` carries (`verified-fe/-be`, `fe-homes`,
`be-homes`, `shape`, `adjacent` — see `document-module` §Frontmatter). A module with no
frontmatter homes is **unmigrated** — reported, never flagged (nothing to diff against).

Any vault file this skill edits (rollups included) follows the vault prose style:
`../document-module/STYLE.md` — restyle the whole file in the same pass.

## Two-stage drift sweep

### Stage 1 — cheap flag (script, no LLM)
Run `python3 scripts/sweep.py`. Per module it computes **commits-behind**:
`git log <verified-sha>..HEAD -- <homes>` in each code repo the module has a home in.
Zero behind → fresh, skip. N behind → **flagged**, goes to stage 2. It also runs **tier-1
Detection** (marker grep) and regenerates the rollups. It prints a TRIAGE worklist.

### Stage 2 — LLM triage (only the flagged set)
For each flagged module, read the doc's landmark symbols + behavior anchors, then read the
actual diff (`git -C <repo> diff <verified-sha>..HEAD -- <homes>`). Classify the change:

| Verdict | Meaning | Action |
|---|---|---|
| **noise** | rename / format / comment / test-only — no documented symbol or behavior touched | **auto-bump** `verified-fe/-be` to current HEAD in the frontmatter. No prose change. |
| **landmark drift** | a landmark symbol changed body / moved file / gone | **propose** — name the symbol; recommend `/document-module <slug>` recheck |
| **behavior drift** | a change hits an anchored given/when/then (guard added/removed, whitelist moved) | **propose** — name the behavior; recommend recheck |
| **new candidate** | the diff introduces a Detection signal (new TODO, untested money/auth path) | add to the module's `## Candidates` (no `P#`), then note it |

**Auto-apply is noise-only.** Everything else is *proposed*, never applied — landmark/behavior
drift must go through `document-module`'s grill + `✅`-verification, not a blind rewrite. Bumping
a `verified` sha on noise is safe (reversible, no content change); rewriting a behavior is not.

## Heuristic Detection — surface NEW problems, not just drift

Drift finds gaps on **existing** landmarks; Detection finds problems the docs never captured.
All findings land in the **owning module's `## Candidates`** (routed by whose `homes` the file
matches), **deduped** against existing candidates + registered `P#`, capped per module so the
list stays signal. **Never auto-promote to `P#`** — a candidate carries no ID until the user
grills it (per `document-module` §Detection). The sweep *feeds* the grill; it does not replace
it.

- **Tier 1 — marker grep** (always, in stage 1): `TODO`/`FIXME`/`HACK`/`XXX`/`@deprecated`
  across each module's homes. Cheap, exact.
- **Tier 2 — semantic** (opt-in, per module, heavier): dead code, duplicated logic, unhandled
  error paths, and **untested money/auth/provenance behavior** (cross the doc's behaviors ×
  the axis tag — an anchored money/auth behavior with no covering test is the high-value gap).
  Coverage-driven signals switch on once a coverage report is available under `docs/`.

## Rollups — the generated views (script writes these)

`scripts/sweep.py --write` regenerates, from frontmatter + every `problems.md`:

- **`modules/STATUS.md`** — per module: shape · FE/BE commits-behind · open-`P#` · new
  candidates · coverage. The freshness dashboard. Unmigrated modules listed separately.
- **`modules/PROBLEMS.md`** — every open/proposed `P#` in one table, sortable by status / axis
  / module. The debt view (needs the `axis:` tag on registry entries for the by-axis cut).
- **`modules/README.md`** — the reader door (see below). Its generated layers (system-map from
  `adjacent`, status table) refresh here; the hand-written domain-spine layer is preserved.

## Reader door — `modules/README.md`

The newcomer's entry point (not `MODULE_MAP.md`, which is the author inventory). Three layers:

1. **Domain spine** — *hand-written*, changes rarely: the freight lifecycle in one line
   (quote → booking → shipment → tracking → delivery → invoice) and which module owns each
   movement. The story. Never overwrite this layer on regen.
2. **System-map** — *generated*: a mermaid graph built from every module's `adjacent`
   frontmatter. Relationships, always fresh.
3. **Status table** — *generated*: coverage + staleness + open-`P#` per module (from STATUS.md).

## Process

1. **Run stage 1**: `python3 scripts/sweep.py --write` — regenerates rollups, prints the
   TRIAGE worklist + new tier-1 candidates.
2. **Triage the flagged set** (stage 2): for each flagged module, read doc anchors vs the diff,
   assign a verdict. Auto-bump noise `verified` shas; collect proposals.
3. **Tier-2 Detection** only if the user opts in (or for a named module).
4. **Write candidates back** into each owning module's `## Candidates` (deduped, capped).
5. **Report**: the proposals (modules needing `/document-module` recheck, with the symbol/
   behavior that drifted) + the new candidates. Recommend recheck order (most-behind first).
   Do **not** run `document-module` yourself — hand off with the worklist.

## Boundaries

- Sweeps + triages + regenerates rollups. Never rewrites a module's behaviors/landmarks prose
  (that's `document-module` recheck) and never assigns a `P#` (that's the grill).
- Auto-applies **only** `verified`-sha noise bumps. All real drift is proposed.
- Unmigrated modules (no frontmatter homes) are reported as a migration backlog, not flagged.
