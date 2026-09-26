---
name: document-module
description: Build and maintain the living documentation for a module/service under modules/<area>/ — what it does (behaviors + symbol-anchored landmarks) and its open problems (a stable-ID registry). Scales from a single page to a multi-part deep-dive whose structure is shaped to the module (see Deep-dive mode). The ground truth that technical-proposal proposals link to. Use when the user wants to document a module/service, do a deep dive on a module, record what exists, capture known problems/tech-debt, or when technical-proposal needs grounding docs. Runs standalone (/document-module <area>) or invoked by another skill.
group: module-docs
---

# document-module

The living record of one module: **what we have** (facts from code) plus **what's wrong**
(problems, judged with you). It's ground truth — `technical-proposal` links its `PROBLEM.md` to
problems registered here. Terminology lives in this module's own `glossary.md`
(`docs/modules/<area>/glossary.md`). This skill **seeds** missing terms there during the
reader-roles pass ([READER-ROLES.md](READER-ROLES.md)), but never redefines an existing entry — a
conflict with an existing definition gets grilled, not overwritten.

**Prose style: follow [STYLE.md](./STYLE.md)** — prose-first (bullets and tables earn their
place; reference surfaces stay tabular), depth kept inline and always visible (never deleted),
links inline only when they're the sentence's subject. Any pass that edits a doc file restyles
the whole file to `STYLE.md` in the same pass — facts, verified SHAs, and `P#` IDs stay untouched.

## Mode — auto-detect, override wins

Read [MODES.md](MODES.md) for the procedure once you know which mode applies:

- `modules/<area>/` **absent** → **build**.
- **present** → **recheck**: drift-check landmarks, rescan candidates, re-judge shape.
- **User says "rebuild"** (or "not a recheck — rebuild") → **rebuild**, even when the folder is
  present. The explicit word overrides the presence auto-detect. Rebuild is destructive — the
  vault is a git repo, but MODES.md's Rebuild guard's own backup restores faster than digging
  through history. Never rebuild without it.

## Frontmatter — the machine-readable header

Every `index.md` opens with a YAML frontmatter block. Read
[TEMPLATES.md](TEMPLATES.md)'s "Frontmatter rules" section before stamping one — it holds every
field's rule and the exact failure mode each one guards against.

## Boundaries — a module is a capability, not a folder

A module is one declared capability or bounded-context. Its code may scatter across repos and
layers. `index.md` opens with a **Scope** statement: owns X, does NOT own Y, adjacent modules —
negative space is what stops the blur.

- **Single owner.** Every symbol or behavior has exactly one home module — the one whose
  *decision logic* it is (who edits it when requirements change), not who calls it. Consumers
  **cross-link** `[[owner#landmark]]`, never re-document.
- **Conflict detection.** On build and recheck, grep each landmark's symbol across every other
  `modules/*/index.md`. Already owned elsewhere → flag a boundary conflict, grill for the owner,
  demote the loser to a cross-link. Don't duplicate.
- **Completeness grep (build/rebuild).** The homes globs are the *staleness* anchor, not proof
  you found the whole capability — a too-narrow glob silently hides files, like code colocated
  under another module's folder tree, or a stray sibling route directory. So on build or rebuild,
  grep the module's domain terms across both whole repos, and reconcile every hit to *in-homes*
  (accounted), *owned-elsewhere* (cross-link), or *missing-home* (widen the glob and read the
  file). This is the mechanism that catches the file you didn't know was in scope. [MODES.md](MODES.md)'s
  Build section then guarantees every resolved file is read.
- **Cross-module problems.** A `P#` lives in the module where the fix centres. The other
  module's `problems.md` gets a one-line `see [[owner#P#]]` pointer — no new ID.

## FE surface — document the flow, not the pixels

A domain module owns both halves of its flow. The `fe-*` modules — `fe-atomic-ui`,
`fe-shared-widgets`, `fe-state-data`, `layout-navigation` — deliberately disclaim domain FE. They
own primitives, generic widgets, store root wiring, and the app shell, and push per-domain
views/stores/queries/flows to the owning domain module. So a BE-only module doc is a half-doc — it
stops at the endpoint's server side and can't show the business flow. Read and document the FE
decision surface too.

**In scope** — the domain FE decision surface, anchored as flow entry points, not markup:

| FE surface | What to capture |
|---|---|
| Domain **views/pages** that own a flow | the view as a flow entry point + which endpoint(s) it calls |
| The domain **store module** (`store/<Domain>`) | the actions/getters that shape requests + hold domain state |
| **Query files** (vue-query factories) | which endpoint each query/mutation hits |
| Module **router entries + route guards** | routes specific to the module's flows |

**Out of scope** — cross-link to the owner, never re-document:

| Concern | Owner |
|---|---|
| atoms / generic widgets | [[fe-atomic-ui]] / [[fe-shared-widgets]] |
| store root wiring, the vue-query *pattern*, infra stores | [[fe-state-data]] |
| app shell, router *config*, nav chrome | [[layout-navigation]] |
| styling / presentational component trees | the fe-* owner |

**The decidable test:** does this FE symbol decide what endpoint gets called with what, or hold
domain state? Yes → document it as a flow anchor. No, pure presentation → it belongs to a fe-*
module — cross-link. The endpoint string is the join key that stitches a FE anchor to its BE
landmark. It's also what `/review`'s Boundary axis keys its contract check on.

## Two lenses — mode contract vs per-stack architecture

A big cross-stack module has two legitimate decompositions, serving different readers. Don't
force one to do both.

- **Mode lens (default, product-facing) — the module's main doc.** Organised by what a user does
  (browse, view, create, edit, track), cross-stack at each seam (see Behaviours and FE surface
  above). This is the regression contract — it states what must stay true, as outcome plus
  endpoint, refactor-invariant. `"editing persists only whitelisted fields → PUT /x/:id"` survives
  a rewrite; `"saveX dispatches updateX"` does not. An engineer overhauling either stack replays
  these behaviors — green is safe, red is a bug or a deliberate product change to flag.
- **Per-stack architecture lens (opt-in, engineer-facing)** — `fe-architecture/` and
  `be-architecture/` folders. Organised by how each stack is built, FE and BE separately, to make
  refactoring targets and stack-specific debt visible. Add it only when a stack's internal
  structure is orthogonal to the mode/concern axis: a god-store whose modal flags, wizard, and
  board state cut across every mode; a god-service whose method clusters don't map 1:1 to the
  modes; or a multi-family component sprawl. The mode lens *distributes* each stack's internals
  across modes; the per-stack lens *re-aggregates by stack*, so "this store is a god-object with
  duplicated getters" becomes visible. Read [ARCH-TEMPLATE.md](ARCH-TEMPLATE.md) before writing
  one — it holds the layout, the scope-unit rule, and the required depth.
- **Clean split — mechanism to arch, contract to mode.** A mode "part" that is really pure
  single-stack *mechanism* (a status-derivation engine) or a stack-only *integration* with no user
  mode (an ERP/FTP sync) does not belong in the mode lens. Move it into the arch folder and slim
  or delete the mode part. The mode lens then holds only the behavior *contract* — the observable
  outcomes and known violations that must stay true. The arch lens owns the *mechanism* — how it's
  built, its coupling, and how to refactor it.
- **Direction of dependency.** Per-stack docs link *up* to the mode behaviors they must preserve
  (`preserves: [[view-and-edit]]`). Mode parts do not link down — the module *door* links to both
  lens doors, so the mode lens stays self-contained. The mode lens is phase 1; the per-stack lens
  is a clean phase-2 pass. Prototype it on one module, tune the template from what hurt, then
  replicate. A stack problem should name the mode-flows in its blast radius.
- **Terminology.** Engineer jargon (e.g. "if-else ladder") is defined once, in the engineer lens,
  and stripped from the product/mode lens — say "the derivation," not the mechanism term. A
  product reader shouldn't meet undefined code-structure jargon.

**Concern vs mechanism — don't promote a mechanism to a concern-part.** A *concern* is a
capability a user meets — a journey, cargo, a timeline. A *mechanism* is cross-cutting
infrastructure that powers all of them — auth-scoping, the read-assembler, the FE composition
shell or god-store. A mechanism is not a peer of the concerns. It belongs in `00-orientation`,
the mode it serves, or a per-stack architecture part. Flattening a mechanism (e.g. `read-auth`)
onto the concern level is the classic symptom of a single-stack decomposition, usually BE-only —
re-derive with both stacks equal.

## Layout

Start with two files. Split only when `index.md` outgrows a page.

- `index.md` — Scope statement, overview, behaviors, Key landmarks table, links.
- `problems.md` — the problem registry (see Registry below).
- Big module → `index.md` becomes the door, and narrative parts hang off it. See Deep-dive mode
  below.
- Engineer lens (phase 2, opt-in) → `be-architecture/` and `fe-architecture/` folders (door plus
  `NN-slug.md` sub-parts), per Two lenses above. Skeleton in
  [ARCH-TEMPLATE.md](ARCH-TEMPLATE.md).

**Scope = three tables, always** — never prose bullets, for cross-module consistency:

```
## Scope

**Owns:**

| Area | What |          ← add a `Part` col in deep-dives
|---|---|

**Does NOT own:**

| Concern | Owner |     ← Owner links the module that does own it

**Adjacent:**

| Module | Relationship |
```

Any qualifier on the section — e.g. "**Does NOT own** (decision logic elsewhere):" — goes in the
bold header line, above the table.

**Markdown tables:** always put a blank line before the header row. Obsidian, and CommonMark,
glue a table onto the line above if there's none — a table directly under a heading or paragraph
renders as literal `| ... |` text, not a table.

## Behaviours — given/when/then, symbol-anchored

Every module doc states its observable behaviors before its mechanism — what a caller sees, in
domain language, not how the code is built. This is the reader's fast path to reasoning about
behavior without a code dive. The landmark tables (mechanism) are the evidence beneath it.

- **Default form — one `###` section per behaviour** (see [STYLE.md](./STYLE.md)'s
  "Behaviours" section). Under a `## Behaviours` heading, each behaviour is its own `### <short
  outcome phrase>` — about 3–6 words, for a clean stable anchor. The prose body opens with the
  full observable outcome, then gives the given/when and mechanism, and ends `→ \`symbol\` ✅`.
  Never a numbered list, never a bullet dump. Cross-reference a behaviour by its heading anchor
  (`[01#assign-to-me-re-points-the-tasks]`), never by an ordinal (`B2`) — positions renumber. Use
  this form for distinct scenarios, guard sequences, and reads — almost everything.
- **Decision table**, only when the behaviour is a genuine matrix: the same axes crossed to
  produce different outcomes (e.g. `caller × byo → editable field set`). A table earns its width
  when the given-columns are full and every row varies the same inputs. If a column is
  half-empty, or rows repeat the same "when," it's a scenario — use the section form instead. Put
  the matrix under its own `###` inside `## Behaviours`.
- **Anchor every behavior to the symbol(s) that realise it** (`→ \`updateShipment\``). This is
  the marriage that keeps BDD honest — a behavior with no symbol is a claim, and the anchor makes
  it drift-checkable on recheck (grep the symbol: does the stated outcome still hold?).
- **A cross-stack flow anchors both ends, with the endpoint as the seam.** When a behavior is a
  full business flow — the common case for a domain module — write it as *trigger → endpoint →
  BE symbol → render*, and anchor the FE symbol and the BE symbol:

  > **A public viewer reads one shipment by key.** `ViewSharedShipment.vue` (magicLink=false)
  > issues `GET /public/shipment?key=` → `ShareableShipmentService.getShipment` returns the
  > narrow projection → the view renders map + timeline. →
  > `ViewSharedShipment.vue` · `routes/public/shipment.js` ✅

  The endpoint string joins the two anchors — naming it makes the flow visible in one line and
  lets recheck catch FE↔BE contract drift (see [MODES.md](MODES.md)'s Recheck section). Pure-BE
  behaviors (a guard) or pure-FE behaviors (a client-side validation) keep a single anchor — only
  stitch both ends when the behavior *is* a flow across the stack.
- **Domain language, observable outcome.** Name the outcome a user or caller perceives — "only
  these fields persist," "throws Forbidden" — never the internal call ("calls
  `whitelistFields`").
- **`✅` means verified against the body.** Stamp a behavior only after reading the mechanism
  that proves the given/when/then — never from the symbol name. Same bar as landmarks (see
  [DEEP-DIVE.md](DEEP-DIVE.md)'s verification bar).
- **Placement.** A flat doc gets one `## Behaviours` section in `index.md`, above `Key
  landmarks`, its behaviours as `###` sub-sections. A deep-dive has each part open with `##
  Behaviours` for its concern — after the TL;DR, before the spine narrative. The door's
  `index.md` keeps only the module-level headline behaviours, also as `###` sub-sections.
- **An untested security behavior is a candidate.** A behavior on an auth, provenance, or money
  axis with no test covering it auto-raises in `## Candidates` (see Detection below),
  symbol-anchored.

## Deep-dive mode — shape to the module

Trigger only when the module clears the complexity bar: a god-object (roughly 600+ lines of
core), more than one subsystem, or coexisting systems. Below the bar, stay single-page — do not
manufacture parts. (`comments-notes`, `tags`, `vendors`, `search-schedule` are flat.)

When it triggers, don't force a fixed template. Diagnose the module's dominant axis by reading
code, then pick a matching skeleton from the shape library: Subsystem, Parallel-systems/migration,
Pipeline, Hub, Dual-flow, Layered, Mode/surface, or Flat. Prioritise the business-concern axis —
Hub, lifecycle-Pipeline, Dual-flow, or Mode: how the domain sees the capability — over a
code-structure axis — Subsystem, Layered, or Parallel-systems: how the god-object is built. Pick a
code shape only when no domain axis carries reader value. A god-object is a *trigger* to split,
not the *axis*: a 4000-line hub service is a Hub split by business concern, not a Subsystem split
by method cluster. Shapes compose — a module can be mode-primary and hub, with modes at the top
and concerns nested under the `view` mode.

**Pick the axis where both stacks agree.** The FE often decomposes by user mode/surface —
list/board, detail, create, edit, track — while the BE decomposes by concern/transformation
(service methods). Don't let one stack's file tree dictate — diagnose both, then split on the
axis they share. Frequently that is the mode (both stacks have create/browse/view/edit flows),
with domain concerns nested inside the `view` mode (pane ↔ endpoint ↔ derivation). A concern-only
split derived from BE method-clusters, with the FE bolted on, is the tell of a single-stack
decomposition — and it wrongly promotes cross-cutting mechanisms (auth-scoping, the
read-assembler) to peer concern-parts (see Two lenses' "Concern vs mechanism" above). `index.md`
is the door — each part covers one axis-element, symbol-anchored.

**Before writing any part, read [DEEP-DIVE.md](DEEP-DIVE.md)** — it holds the shape library and
skeletons, the verification bar (every landmark `✅` from source; test framing claims with
import-count or call-site reads; correct the registry inline when a read contradicts an earlier
note), and the file-naming rule: parts are `NN-slug.md`, zero-padded from `01`, in door
read-order — `index.md` and `problems.md` stay bare, never prefixed.

## Registry — `problems.md`

Each registered problem: **`P#`** (never reused), title, **status** (`open` → `proposed` →
`solved`), **source** (`explicit` or `detected`), **axis** (`money`, `auth`, `provenance`, `perf`,
`correctness`, or `debt` — feeds the `PROBLEMS.md` rollup's group-by-axis view), **stack** (`fe`,
`be`, or `cross` — which stack owns the fix, feeding the per-stack architecture lens), **evidence**
(`symbol@path` or a metric/incident), and **proposals** (back-links). Solved problems live in a
`## Solved` section, keeping the live list present-tense. Detected-but-unpromoted items sit in
`## Candidates` with no ID until you promote them — tag candidates with their `stack` too. No
severity field.

## Detection — cited signal checklist

Only surface a candidate you can anchor to a symbol: `TODO`/`FIXME`/`HACK` markers,
dead/unreachable code, functions with no test coverage, tight coupling or circular deps,
duplicated logic, unhandled error paths, `@deprecated`/legacy-shadow markers, a documented
behavior on an auth, provenance, or money axis with no test covering it (see Behaviours above), an
unguarded money write (a money-axis mutation with no idempotency key, dedupe, or single-flight
guard — double-submit writes twice), an unpinned external format (a parser of externally-produced
data whose column or field names are hardcoded but documented nowhere — pair with the
reader-roles contract table in [READER-ROLES.md](READER-ROLES.md)), or config asymmetry/silent
fallback (half a feature runtime-editable while its pair needs a deploy, or a missing env var
that degrades silently instead of failing fast). Anything you can't cite → raise in conversation,
don't write it.

See [TEMPLATES.md](TEMPLATES.md) for file skeletons.
