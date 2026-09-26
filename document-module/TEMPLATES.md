# File skeletons

Delete guidance before writing. `✅` = verified from source — a bare marker, no inline date (it's a second timestamp that drifts).

---

## Frontmatter rules

`index.md`'s frontmatter is the source of truth the cross-module sweep and the generated
rollups (`STATUS.md`, `PROBLEMS.md`, `README.md`) read. Parts (`NN-slug.md`) don't need it — the
door carries it for the whole module. A prose date is not enough. It is unqueryable and drifts
silently.

- **`fe-homes` and `be-homes` are exact globs**, resolvable by `git log -- <glob>`. This is the
  staleness anchor — the sweep diffs `<verified-sha>..HEAD` over these paths. A prose home (as in
  the early `MODULE_MAP.md`) does not work. Tighten to globs on build or recheck.
- **`verified-fe` and `verified-be`** are stamped from each code repo's HEAD at the moment you
  finish verifying — on build, recheck, or a sweep noise-bump. Never hand-edit either to a date.
  **Stamp a stack's SHA only when you actually read that stack's bodies this pass.** Stamping
  `verified-fe` without reading FE is the exact failure that leaves a BE-only half-doc wearing a
  green timestamp. A module has `fe-homes` but you skipped FE this pass → leave `verified-fe`
  stale and flag "FE unverified" (see [MODES.md](MODES.md)'s Recheck section). Same rule for
  `verified-be`.
- **`shape`** mirrors the diagnosed deep-dive shape, or `flat`. The sweep re-checks it.
- **`adjacent`** is the slugs from the Scope Adjacent table, in machine form.

---

## index.md

```md
---
module: <slug>
shape: flat            # flat | subsystem | parallel-systems | pipeline | hub | dual-flow | layered | mode
verified-fe: <sha>     # frontend repo HEAD at verify time; omit if no FE home
verified-be: <sha>     # backend repo HEAD at verify time; omit if no BE home
fe-homes:              # real path globs relative to the frontend repo's src/ (NOT prose)
  - <views/Area/**>
be-homes:              # real path globs relative to the backend repo's src/
  - <routes/area/**>
adjacent: [<slug-a>, <slug-b>]   # feeds the generated system-map
---

# <Area> module — index

> Living doc of what <area> does + its open problems. ✅ = verified from code.
> Terminology → project `CONTEXT.md`. Problems → [problems.md](./problems.md).
> Proposals against this module link problems by ID (`<area>#P#`).

## Scope

**Owns:**

| Area | What |
|---|---|
| <capability> | <the single source of truth this module is for> |

**Does NOT own:**

| Concern | Owner |
|---|---|
| <adjacent concern> | [[other-module]] |

**Adjacent:**

| Module | Relationship |
|---|---|
| [[mod-a]] | <what crosses the seam> |
| [[mod-b]] | <…> |

## What it does
<2–5 sentences: the module's responsibility and boundary>

## Behaviours
<!-- observable behavior BEFORE mechanism; domain language; anchor each to its symbol.
     see SKILL.md §Behaviors. DEFAULT = one ### per behaviour; table only for a true matrix. -->

<!-- (a) DEFAULT — one `###` heading per behaviour, ≈3-6 word outcome phrase as the anchor,
     prose body opens with the full outcome then given/when + mechanism, ends → `symbol` ✅: -->
### Listing returns only what you're allowed to see
Filtered to shipments the caller's `AppAbility` and party-scope both match.
→ `buildShipmentAuthConditions` ✅

### CargoSync is hidden by default
`byo=true` excluded unless `includeByo`. → `findAccessibleBy` ✅

<!-- (a2) CROSS-STACK FLOW — trigger → endpoint → BE → render, BOTH ends anchored, endpoint = seam
     (see SKILL.md §Behaviors, §FE surface). Use when the behavior IS a flow across the stack. -->
### The user edits a shipment and sees the recomputed status
`ShipmentEdit.vue` submits `PATCH /shipments/:ref` → `updateShipment` whitelists+persists →
the view re-renders derived status. → `ShipmentEdit.vue` · `updateShipment` ✅

<!-- (b) DECISION TABLE — only for a genuine matrix (same axes crossed → different outcomes),
     as its own ### inside ## Behaviors: -->
### Editable fields by caller and byo status
| Given: caller | Given: byo | When update → Then editable fields | Symbol |
|---|---|---|---|
| ADMIN | any | all fields | `updateShipment` ✅ |
| non-admin | `false` | `internalReference`, `nickname`, `mblNumber`, `carrierBookingNumber` | `updateShipment` ✅ |
| non-admin | `true` | the 4 above + `freightForwarder`, `freeTime`, `carrierContractNumber`, `detentionStartDate` | `updateShipment` ✅ |

## Key landmarks
| Symbol | Path | Does |
|---|---|---|
| `functionOrService` | `<backend-repo>/src/…/file.ts` | ... ✅ |

<!-- Anchor on the SYMBOL, not the line. Recheck greps the symbol. -->

## FE surface
<!-- domain FE decision surface only — views/store/queries/router that drive the flows.
     name the ENDPOINT each row calls (the seam to a BE landmark). Cross-link atoms/widgets/
     shell to the fe-* owner, don't re-document. See SKILL.md §FE surface. Omit if no fe-homes. -->
| Symbol | Path | Calls | Does |
|---|---|---|---|
| `ViewThing.vue` | `<frontend-repo>/src/components/views/Thing/` | `GET /things/:ref` | flow entry point; renders the thing ✅ |
| `store/Thing` | `<frontend-repo>/src/store/Thing/Thing.js` | `PATCH /things/:ref` | domain actions/getters shaping the request ✅ |

## Parts
<!-- only once split -->
- [01-slug](./01-slug.md) — ...
```

---

## problems.md

```md
# <Area> — problems

> Registry of known problems + improvement areas. Stable IDs, never reused.
> status: open → proposed → solved. Solved → §Solved. Candidates carry no ID.

## Open

<!-- heading = bare `### <area>-P<n>`, title on the NEXT bold line — so the
     `#<area>-p<n>` anchor survives a retitle (see DEEP-DIVE.md §Links). -->

### <area>-P1
**<title>**
- **status**: open
- **source**: explicit | detected
- **axis**: money | auth | provenance | perf | correctness | debt
- **stack**: fe | be | cross
- **evidence**: `symbol@src/…/file.ts` — <what proves it> ✅
- **proposals**: —

### <area>-P2
**<title>**
- **status**: proposed
- **source**: detected
- **axis**: perf
- **evidence**: `symbol@path`
- **proposals**: [../../proposals/<slug>/](../../proposals/<slug>/)

## From other modules
<!-- cross-module problems owned elsewhere; pointer only, no local ID -->
- see [[other-module#P4]] — <why it touches this module>

## Candidates
<!-- detected, unpromoted — no ID until the user promotes -->
- `symbol@path` — <candidate problem, one line> *(signal: dead code / no coverage / …)*

## Solved
### <area>-P0
**<title>**
- **status**: solved — <date>, via [../../proposals/<slug>/](../../proposals/<slug>/)
```
