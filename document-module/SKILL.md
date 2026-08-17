---
name: document-module
description: Build and maintain the living documentation for a module/service under modules/<area>/ — what it does (behaviors + symbol-anchored landmarks) and its open problems (a stable-ID registry). Scales from a single page to a multi-part deep-dive whose structure is shaped to the module (see Deep-dive mode). The ground truth that technical-proposal proposals link to. Use when the user wants to document a module/service, do a deep dive on a module, record what exists, capture known problems/tech-debt, or when technical-proposal needs grounding docs. Runs standalone (/document-module <area>) or invoked by another skill.
---

# document-module

The living record of one module: **what we have** (facts from code) + **what's wrong**
(problems, judged with you). It's ground truth — `technical-proposal` links its
`PROBLEM.md` to problems registered here. Terminology lives in `docs/CONTEXT.md`;
this skill **seeds** missing terms during the reader-roles pass (§Reader-roles) but never
redefines an existing entry — a conflict with an existing definition gets grilled, not overwritten.

**Prose style: follow [STYLE.md](./STYLE.md)** — prose-first (bullets and tables earn their
place; reference surfaces stay tabular), depth folded into collapsed `> [!details]-` callouts
(never deleted), links inline only when they're the sentence's subject. Any pass that edits a doc file restyles the whole file to STYLE.md in the
same pass (facts, verified shas, `P#` IDs untouched).

## Mode — auto-detect, override wins

- `modules/<area>/` **absent** → **build** (§Build).
- **present** → **recheck** (§Recheck): drift-check landmarks + rescan candidates + re-judge shape.
- **User says "rebuild" (or "not a recheck — rebuild")** → **rebuild** (§Rebuild), even when
  the folder is present. Explicit word overrides the presence auto-detect. **Rebuild is
  destructive and there is no git safety net yet** — never rebuild without the §Rebuild guard.

## Frontmatter — the machine-readable header (every `index.md`)

`index.md` opens with a **YAML frontmatter block** — the source of truth the cross-module
sweep + generated rollups (`STATUS.md`, `PROBLEMS.md`, `README.md`) read. Parts (`NN-slug.md`)
do **not** need it; the door carries it for the whole module. Prose dates are not enough — they
are unqueryable and drift silently.

```yaml
---
module: shipments            # slug, matches folder
shape: hub                   # flat | subsystem | parallel-systems | pipeline | hub | dual-flow | layered
verified-fe: <sha>           # frontend repo HEAD at last verify (omit if module has no FE home)
verified-be: <sha>           # backend repo HEAD at last verify (omit if no BE home)
fe-homes:                    # real path globs relative to the frontend repo's src/ — NOT prose
  - views/Shipments/**
  - store/Shipment*
be-homes:                    # real path globs relative to the backend repo's src/
  - routes/shipments/**
  - services/Shipments/**
adjacent: [house-jobs, tracking, charges]   # slugs — feeds the generated system-map
---
```

- **`fe-homes` / `be-homes` are exact globs**, resolvable by `git log -- <glob>`. This is the
  staleness anchor: the sweep diffs `<verified-sha>..HEAD` over these paths. Prose homes (as in
  early `MODULE_MAP.md`) do not work — tighten to globs on build/recheck.
- **`verified-fe` / `verified-be`** are stamped from each code repo's HEAD **at the moment you
  finish verifying** (build, recheck, or a sweep noise-bump). Never hand-edit to a date.
  **A stack's SHA may be stamped only when that stack's bodies were actually read this pass** —
  stamping `verified-fe` without reading FE is the exact failure that leaves BE-only half-docs
  wearing a green timestamp. Module has `fe-homes` but you skipped FE → leave `verified-fe`
  stale and flag "FE unverified" (§Recheck 1). Same for `verified-be`.
- **`shape`** mirrors the diagnosed deep-dive shape (or `flat`). The sweep re-checks it.
- **`adjacent`** = the slugs in your Scope *Adjacent* table, machine-form.

## Boundaries — a module is a capability, not a folder

A module = one declared **capability/bounded-context**; its code may scatter across repos
and layers. `index.md` opens with a **Scope** statement: *owns X · does NOT own Y ·
adjacent modules* — negative space is what stops the blur.

- **Single owner**: every symbol/behavior has exactly one home module — the one whose
  **decision logic** it is (who edits it when requirements change), not who calls it.
  Consumers **cross-link** `[[owner#landmark]]`, never re-document.
- **Conflict detection**: on build & recheck, grep each landmark's symbol across all other
  `modules/*/index.md`. Already owned elsewhere → **flag a boundary conflict**, grill
  for the owner, demote the loser to a cross-link. Don't duplicate.
- **Completeness grep (build/rebuild)**: the homes globs are the *staleness* anchor, not proof you
  found the whole capability — a too-narrow glob silently hides files (code colocated under another
  module's folder tree, a stray sibling route dir). So on build/rebuild, **grep the module's domain
  terms across both whole repos** and reconcile every hit to *in-homes* (accounted) / *owned-
  elsewhere* (cross-link) / *missing-home* (**widen the glob + read the file**). This is the
  mechanism that catches the file you didn't know was in scope; the enumerate-then-account gate
  (§Build 1) then guarantees every resolved file is read. See §Build for the full coverage rules.
- **Cross-module problems**: `P#` lives in the module where the fix centres; the other
  module's `problems.md` gets a one-line `see [[owner#P#]]` pointer, no new ID.

## FE surface — document the flow, not the pixels

A domain module owns **both halves of its flow**. The `fe-*` modules (`fe-atomic-ui`,
`fe-shared-widgets`, `fe-state-data`, `layout-navigation`) deliberately disclaim domain FE —
they own primitives, generic widgets, store *root wiring*, and the app shell, and push
per-domain views/stores/queries/flows **to the owning domain module**. So a BE-only module doc
is a **half-doc**: it stops at the endpoint's server side and can't show the business flow. Read
and document the FE decision surface too.

**In scope** (the domain FE decision surface — anchor these as flow entry points, not markup):

| FE surface | What to capture |
|---|---|
| Domain **views/pages** that own a flow | the view as a flow entry point + which endpoint(s) it calls |
| The domain **store module** (`store/<Domain>`) | the actions/getters that shape requests + hold domain state |
| **Query files** (vue-query factories) | which endpoint each query/mutation hits |
| Module **router entries + route guards** | routes specific to the module's flows |

**Out of scope** (cross-link to the owner, never re-document):

| Concern | Owner |
|---|---|
| atoms / generic widgets | [[fe-atomic-ui]] / [[fe-shared-widgets]] |
| store root wiring, the vue-query *pattern*, infra stores | [[fe-state-data]] |
| app shell, router *config*, nav chrome | [[layout-navigation]] |
| styling / presentational component trees | the fe-* owner |

**The decidable test:** *does this FE symbol decide what endpoint gets called with what, or hold
domain state?* Yes → document it as a flow anchor. No (pure presentation) → it belongs to a
fe-* module; cross-link. The **endpoint string is the join key** that stitches a FE anchor to
its BE landmark — it's also what `/review`'s Boundary axis keys its contract check on.

## Two lenses — mode contract vs per-stack architecture

A big cross-stack module has **two legitimate decompositions**, serving different readers. Don't
force one to do both.

- **Mode lens (default, product-facing) — the module's main doc.** Organised by **what a user
  does** (browse · view · create · edit · track …), cross-stack at each seam (§Behaviors,
  §FE surface). This is the **regression contract**: it states *what must stay true* as
  outcome+endpoint, refactor-invariant (`"editing persists only whitelisted fields → PUT /x/:id"`
  survives a rewrite; `"saveX dispatches updateX"` does not). An engineer overhauling either stack
  replays these behaviors — green = safe, red = a bug *or* a deliberate product change to flag.
- **Per-stack architecture lens (opt-in, engineer-facing) — `fe-architecture/` + `be-architecture/`
  *folders*.** Organised by **how each stack is built**, FE and BE **separately**, to make refactoring
  targets and stack-specific debt visible. Add it only when a stack's internal structure is
  **orthogonal to the mode/concern axis** — a god-store whose modal flags + wizard + board state cut
  *across* every mode, a god-service whose method clusters don't map 1:1 to the modes, or a
  multi-family component sprawl. The mode lens *distributes* each stack's internals across modes; the
  per-stack lens *re-aggregates by stack* so "this store is a god-object with duplicated getters"
  becomes visible. **It is a mini-deep-dive, not one flat file** (that produces a shallow index — the
  failure this lens is meant to avoid):
  - **Layout — a folder per stack.** `be-architecture/` and `fe-architecture/` each hold a door
    `index.md` (a `lens:` header · the stack's shape diagram · a cluster map → parts · `preserves`
    up-links · a size+test-coverage table) plus `NN-slug.md` sub-parts, **one per structural seam of
    that stack**. Doors carry only the light `lens:` header, not module frontmatter.
  - **Scope-unit = the stack's OWN seam, diagnosed from code — never the mode part.** Reusing the mode
    parts as the arch scope re-fragments the cross-cutting structures the lens exists to surface. The
    natural unit differs per stack and per module: BE usually = god-service/store method-clusters
    (e.g. status-derivation · read/assembly · write · allocation · integration); FE = the god-store
    family, **or**, in a query-based app with no domain store, the **component / version families**.
  - **Depth = the core-8 per sub-part.** TL;DR · `preserves` up-link · flow-trace+shape · inventory
    **with a test-coverage column** · **grep-verified** coupling (call-site counts) · extraction seam
    **+ target-interface sketch** · a capped safe-refactor sequence **handing off to
    `/request-refactor-plan`** · anti-goals / load-bearing invariants. Mermaid optional (only when
    internal fan-out is the story). Do **not** number the section headings. **Before writing any arch
    sub-part, Read [ARCH-TEMPLATE.md](ARCH-TEMPLATE.md).**
- **Clean split — mechanism → arch, contract → mode.** A mode "part" that is really pure single-stack
  *mechanism* (a status-derivation engine) or a stack-only *integration with no user mode* (an ERP/FTP
  sync) does not belong in the mode lens: **move it into the arch folder and slim/delete the mode
  part.** The mode lens then holds only the behavior *contract* (the observable outcomes + known
  violations that must stay true); the arch lens owns the *mechanism* (how it's built, its coupling,
  and how to refactor it).
- **Direction of dependency:** per-stack docs link **up** to the mode behaviors they must preserve
  (`preserves: [[view-and-edit]]`); the mode parts do **not** link down (the module *door* links to
  both lens doors, so the mode lens stays self-contained). So the mode lens is phase 1 and the
  per-stack lens is a clean phase-2 pass — **prototype it on one module, tune the template from what
  hurt, then replicate.** A stack problem should name the mode-flows in its blast radius.
- **Terminology:** engineer jargon (e.g. "if-else ladder") is defined **once** in the engineer lens
  and **stripped from the product/mode lens** (say "the derivation", not the mechanism term) — a
  product reader shouldn't meet undefined code-structure jargon.

**Concern vs mechanism — don't promote a mechanism to a concern-part.** A *concern* is a capability
a user meets (journey, cargo, timeline); a *mechanism* is cross-cutting infrastructure that powers
all of them (auth-scoping, the read-assembler, the FE composition shell / god-store). A mechanism is
**not** a peer of the concerns — it belongs in `00-orientation`, the mode it serves, or a per-stack
architecture part. Flattening a mechanism (e.g. `read-auth`) onto the concern level is the classic
symptom of a **single-stack decomposition** (usually BE-only): re-derive with both stacks equal.

## Layout

Start with two files; split only when `index.md` outgrows a page.

- `index.md` — **Scope** statement, overview, behaviors, `Key landmarks` table, links.
- `problems.md` — the problem registry (§Registry).
- Big module → `index.md` becomes the door; narrative parts hang off it → **§Deep-dive**.
- Engineer lens (phase 2, opt-in) → `be-architecture/` + `fe-architecture/` folders (door + `NN-slug.md`
  sub-parts), per §Two-lenses. Skeleton → [ARCH-TEMPLATE.md](ARCH-TEMPLATE.md).

**Scope = three tables**, always (never prose bullets), for cross-module consistency:

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

Any `(qualifier)` on the section (e.g. "**Does NOT own** (decision logic elsewhere):") goes in the bold header line, above the table.

**Markdown tables:** always put a blank line before the header row. Obsidian (and CommonMark) glues a table onto the line above if none — a table directly under a heading or paragraph renders as literal `| ... |` text, not a table.

## Behaviors — given/when/then, symbol-anchored

Every module doc states its **observable behaviors before its mechanism** — what a caller sees,
in domain language, not how the code is built. This is the reader's fast path to *reasoning about
behavior without a code dive*; the landmark tables (mechanism) are the evidence beneath it.

- **Default form — one `###` section per behaviour** (see [STYLE.md](./STYLE.md) "Behaviours").
  Under a `## Behaviours` heading, each behaviour is its own `### <short outcome phrase>`
  (≈3–6 words → clean stable anchor); the prose body opens with the full observable outcome,
  then the given/when + mechanism, and ends `→ \`symbol\` ✅`. Never a numbered list, never a
  bullet dump. Cross-reference a behaviour by its heading anchor
  (`[01#assign-to-me-re-points-the-tasks]`), never by an ordinal (`B2`) — positions renumber.
  Use this for distinct scenarios, guard sequences, and reads — i.e. almost everything.
- **Decision table** *only* when the behaviour is a **genuine matrix**: the *same* axes crossed to
  produce different outcomes (e.g. `caller × byo → editable field set`). A table earns its width
  when the given-columns are full and every row varies the same inputs; if a column is half-empty
  or rows repeat the same "when", it's a scenario — use the section form instead. Put the matrix
  under its own `###` inside `## Behaviours`.
- **Anchor every behavior to the symbol(s) that realise it** (`→ \`updateShipment\``). This is the
  marriage that keeps BDD honest: a behavior with no symbol is a claim; the anchor makes it
  drift-checkable on recheck (grep the symbol → does the stated outcome still hold?).
- **A cross-stack flow anchors *both* ends, with the endpoint as the seam.** When a behavior is a
  full business flow (the common case for a domain module), write it as *trigger → endpoint → BE
  symbol → render* and anchor the FE symbol **and** the BE symbol:

  > **A public viewer reads one shipment by key.** `ViewSharedShipment.vue` (magicLink=false) issues
  > `GET /public/shipment?key=` → `ShareableShipmentService.getShipment` returns the narrow
  > projection → the view renders map + timeline. → `ViewSharedShipment.vue` · `routes/public/shipment.js` ✅

  The endpoint string joins the two anchors; naming it makes the flow visible in one line and lets
  recheck catch FE↔BE contract drift (§Recheck). Pure-BE behaviors (a guard) or pure-FE behaviors
  (a client-side validation) keep a single anchor — only stitch both ends when the behavior *is* a
  flow across the stack.
- **Domain language, observable outcome.** Name the outcome a user/caller perceives ("only these
  fields persist", "throws Forbidden"), never the internal call ("calls `whitelistFields`").
- **`✅` = verified against the body.** Stamp a behavior only after reading the mechanism that
  proves the given/when/then — never from the symbol name. Same bar as landmarks (§verification).
- **Placement:** flat doc → one `## Behaviours` section in `index.md` (above `Key landmarks`),
  its behaviours as `###` sub-sections. Deep-dive → each part opens with `## Behaviours` for its
  concern (after the TL;DR, before the spine narrative); the door's `index.md` keeps only the
  module-level headline behaviours (also as `###` sub-sections).
- **Untested security behavior → candidate.** A behavior on an **auth / provenance / money**
  axis with no test covering it → auto-raise in `## Candidates` (§Detection), symbol-anchored.

## Reader-roles pass — lenses beyond the developer

The sections above serve the *developer* reader (caller → behaviors, dev → landmarks,
refactorer → problems/arch). Four reader roles fall outside that set and were historically
missed (gap register + decisions: `docs/IMPROVEMENT.md`). After Behaviors are drafted
(§Build step 4), walk each role; an output fires **only when the module has that surface** —
never manufacture an empty section:

- **Integrator — contracts.** [IMPROVEMENT #1,3,9 + external contracts]
  - *External formats*: the module parses externally-produced data (provider CSV, EDI,
    webhook payload, uploaded file) or emits a format an external party consumes? → pin the
    contract **next to the behavior that consumes it**: an `## External contract` section
    listing the exact column/field names the parser reads (✅ from parser code, depth folded
    per STYLE.md) + what happens on format drift (silent row-drop vs error). File coverage
    cannot see these — the format lives outside the repo; the parser is the only witness.
  - *DTO/payload shapes*: per endpoint, the **domain-meaningful** request/response fields
    (never an exhaustive schema dump — that's what drifts) folded under the behavior or in
    the landmarks table.
  - *Error catalogue*: the user-visible error strings each endpoint can return, with cause →
    fix (support maps a reported message without grep).
  - *Business-constants registry*: one table of the module's magic numbers — value · where ·
    why-if-known (caps, batch sizes, debounces, thresholds).
- **Security reviewer — risk surface.** [IMPROVEMENT #2,14,10,5,18]
  - *Authz matrix*: one table, endpoint × user-type × role × gate-location. A missing gate
    becomes a visible hole (and a candidate).
  - *External-egress inventory*: what leaves the boundary, to whom, containing what
    (third-party AI, integrations, outbound email with attachments).
  - *Blast-radius map*: what breaks downstream when this module fails, per dependency
    direction (seams say ownership; this says impact).
  - *Async guarantees*: every event-driven behavior states sync/async, delivery guarantee,
    and its silent-failure mode.
  - *Assumption register*: hard-baked assumptions (country, currency, TZ, vendor names) —
    assumption · where baked in.
- **Operator / on-call — operations part.** [IMPROVEMENT #16,17,15,19,20]
  An `NN-operations.md` part when the module carries config knobs, manual procedures, or a
  money/queue path someone answers for:
  - *Config inventory* (knob · kind · key/location · value/shape) and *honest runbook*
    (record the real state, even "no formal procedure — raw SQL").
  - *Undo/recovery per write surface*: every documented write gets its documented reverse —
    or an explicit "no undo exists" (which is a candidate on a money axis).
  - *Multi-user collision semantics*: two operators on the same entity — last-write-wins,
    clobber, or guarded?
  - *Quota/cost envelope*: what the module spends/consumes (API rate limits, per-call cost
    order-of-magnitude) and why its caps are what they are.
  - *Observability state*: what watches this path; "nothing" is a finding → candidate.
  - *Negative-space assertions*: state the verified absences ("zero crons, zero feature
    flags, zero queues") so readers can tell "not documented" from "doesn't exist".
  - *Incident/investigation cross-links*: link the module's records in `incidents/` +
    `investigations/` from the door or the ops part.
- **Newcomer — wayfinding.** [IMPROVEMENT #4,8,13,22 + terms]
  - *Terms*: domain terms the doc uses that `docs/CONTEXT.md` lacks → add entries there
    (tight one-sentence definitions, avoid-aliases, domain terms only — follow the existing
    CONTEXT.md format). Seed, never redefine (see intro).
  - *Navigation map*: per FE-surface row, the route path + click path ("Admin dashboard →
    Customs card") so a non-dev can find the screen.
  - *ER diagram*: one small mermaid ER per model family when relationships span >2 models.
  - *Ownership*: `owner:` frontmatter field on `index.md` (person/team to ask — current
    state, not history).
  - *Persona entry points*: one routing line per persona on the door ("support → ops part +
    error catalogue; integrator → contract sections").

**Coverage manifest** [IMPROVEMENT #15]: stamp which lenses were verified in `index.md`
frontmatter (`lenses: [contracts, risk, ops, wayfinding]` — list only what this pass actually
verified) so absence is visible, not ambiguous.

**Recheck runs this diff-scoped only** (§Recheck 1): a changed file that *is* a lens surface
(external-format parser, DTO/schema file, route/middleware gate, `config.get`/system-config/env
read, money write, event handler) → re-verify that lens's output. The full pass runs on
build/rebuild. Parked (LATER) and declined (NO) lenses are listed in `docs/IMPROVEMENT.md` —
consult it before proposing a new lens.

## Deep-dive mode — shape to the module

Trigger only when the module **clears the complexity bar**: a god-object (~600+‑line core),
more than one subsystem, or coexisting systems. **Below the bar, stay single-page — do not
manufacture parts.** (comments-notes, tags, vendors, search-schedule are Flat.)

When it triggers, don't force a fixed template. **Diagnose the module's dominant axis by
reading code, then pick a matching skeleton** from the shape library — Subsystem, Parallel-
systems/migration, Pipeline, Hub, Dual-flow, Layered, **Mode/surface**, or Flat. **Prioritise the
business-concern axis** (Hub / lifecycle-Pipeline / Dual-flow / Mode — how the domain sees the
capability) over a code-structure axis (Subsystem / Layered / Parallel-systems — how the god-object
is built); pick a code shape only when no domain axis carries reader value. A god-object is a
*trigger* to split, not the *axis* to split on — a 4000-line hub service is a **Hub** split by
business concern, not a **Subsystem** split by method cluster. Shapes **compose** (a module can be
mode-primary *and* hub — modes at the top, concerns nested under the `view` mode).

**Pick the axis where both stacks agree.** The FE often decomposes by **user mode/surface**
(list/board · detail · create · edit · track) while the BE decomposes by **concern/transformation**
(service methods). Don't let one stack's file tree dictate — diagnose *both*, then split on the axis
they share. Frequently that is the **mode** (both stacks have create/browse/view/edit flows), with
domain **concerns nested inside the `view` mode** (pane ↔ endpoint ↔ derivation). A concern-only
split derived from BE method-clusters, with the FE bolted on, is the tell of a single-stack
decomposition — and it wrongly promotes cross-cutting *mechanisms* (auth-scoping, the read-assembler)
to peer concern-parts (see §Two-lenses "Concern vs mechanism"). `index.md` is the door; each part covers one
axis-element, symbol-anchored. **Before writing any part, Read [DEEP-DIVE.md](DEEP-DIVE.md)** —
it holds the shape library + skeletons, the **verification bar** (every landmark `✅` from
source; test framing claims with import-count / call-site reads; correct the registry inline
when a read contradicts an earlier note), and the **file-naming rule**: parts are `NN-slug.md`
zero-padded from `01` in door read-order; `index.md` + `problems.md` stay bare (never prefix).

## Build — code-first facts, grill the problems

> **Coverage first — read every in-scope file, in full, before you make a claim about it.** The
> failure this prevents: a file that is *in scope but never opened* (grepped-not-read, or
> skimmed-to-the-symbol-you-expected) becomes a confident-wrong landmark, ownership call, or
> lineage label. Real examples from one rebuild: a "pricing" view that was actually a Stripe
> subscription table; stores labelled "legacy Vuex" that were Pinia; a controller documented as
> "customer cards" that also held a booking engine; a whole legacy endpoint family never
> enumerated. Every one was a file in the homes globs whose body was never read. So:
>
> - **File-complete, not claim-complete.** Build & rebuild read **every** file the `fe-homes` +
>   `be-homes` globs resolve, in full — not only the ones you end up citing. You cannot dismiss a
>   file as "just presentation / just types / just wiring" to avoid reading it; that label is a
>   *conclusion you reach after reading*, never a filter you apply before.
> - **The only files skippable unread** are mechanically non-logical by extension/location:
>   `*.test.*`, `*.spec.*`, `__snapshots__`, fixtures, `*.csv`/`*.json` data, lockfiles, and
>   auto-generated barrels (e.g. `routesImporter`-generated `index.js`). Every `.ts`/`.js`/`.tsx`/
>   `.vue` source file is read.
> - **"Read in full" = the whole body, in order, no skip-to-symbol.** For a file bigger than one
>   read-window, read it sequentially across calls until you can **name every top-level export /
>   method and its mechanism** — the completeness test is "can I list all public members," not "did
>   I find the one I came for." (This is what catches the buried `TODO`, the legacy shim, the
>   PICKUP gap in a 2500-line god-model.)
> - **Recheck is diff-bounded** (§Recheck): it does not re-read the whole module — it reads in full
>   every file changed since the stamped SHA, plus every file backing a landmark/behavior it is
>   re-verifying.

1. **Enumerate the module, then account for every file.** *First action of build/rebuild:* resolve
   the `fe-homes` + `be-homes` globs to a concrete file list (`git ls-files -- <glob>` / `find`).
   That list is your coverage contract: by the time the doc is written, **every file on it is
   either (a) anchored as a landmark, (b) cross-linked to another module, or (c) consciously
   dismissed by a mechanical category above** (test/fixture/generated). A source file you cannot
   place in one of those three buckets is a file you have not read — go read it. The doc itself is
   the coverage record; there is no separate manifest.
   **Then close the gap the globs can't see** — the homes globs are the *staleness* anchor, not a
   *completeness* guarantee: a too-narrow glob hides real module files (the classic "colocated under
   another module's tree"). So also **grep the domain terms across both whole repos** (e.g.
   `rate|Rate|charge-template|quote-template`) and reconcile every hit to one of: *in-homes*
   (already accounted), *owned-elsewhere* (cross-link), or *missing-home* → **widen the glob and
   read the file**. A hit you had to widen for is a file the previous globs were hiding (this is how
   a stray `routes/additional-charges/` or a colocated `routes/rates/charges.js` surfaces). Tighten
   the globs so they resolve the full set before you stamp frontmatter.
2. **Find the spine first — as a business flow that crosses the stack.** Before drafting
   anything, read the module's core code **on both sides of the stack** (the domain FE that
   drives it *and* the BE that transforms it — see §FE surface) and state its **narrative spine**
   in one or two sentences. The spine is the central data model + the transformation the module
   exists to perform **+ how it is driven and seen** — the domain story as a user triggers it,
   the system transforms it, and the result renders back (e.g. *"a PO tracks the tension between
   *ordered* lines and *shipped* allocations; the buyer edits lines in the PO view → `PATCH
   /purchase-orders/:id` → the allocation reconciler recomputes status → the view re-renders how
   far ordered→shipped has progressed"*). A spine that stops at the BE transformation is
   half-written — it can't show the flow. **Derive it from the code, then put it to the user and
   correct it** — they hold the operational centre-of-gravity that line-counts can't reveal
   (which subsystem is the heart vs the plumbing). The spine is what every part narrates
   *toward*; skip it and the doc degrades into a method-listing that reads like nothing. In a
   deep-dive the spine becomes the door's **Headline**; each part is one **movement of the flow**.
   **Default part-seams to the module's business concerns *or user modes*, not its code structure**
   — the spine is a domain story, so its movements are domain concerns, flow stages, or the user
   modes both stacks share (browse/view/create/edit/track — see §Deep-dive "Pick the axis where both
   stacks agree"; concerns then nest under the `view` mode). A code-shaped split (Subsystem by method
   cluster) is the fallback only when no domain axis exists (see the *Precedence* rule in `_shapes.md`).
   **State the spine's axis from both stacks at once** — if the FE decomposes by mode and the BE by
   concern, the spine is the mode story and the concerns are its `view`-mode facets; don't ship a
   BE-only concern split with the FE appended.
3. **Read the source — every in-scope file, bodies not signatures, on both sides of the stack.**
   Read the full file list from step 1 (per the coverage rules above) *before* drafting — the read
   is not scoped to files you already plan to cite; classify each file (landmark / cross-link /
   dismiss) only after opening it. Then draft `index.md`:
   the **Scope** section (three tables — Owns / Does NOT own / Adjacent, see §Layout), what the
   module does, its **behaviors** (cross-stack flows where they cross, symbol-anchored — see
   §Behaviors), and a **Key landmarks** table — `symbol · path · what it does`. For every
   landmark that carries logic, **read its body** — the "what it does" column is the
   *mechanism* (the transformation, guard, or data-shape it produces), never the symbol name
   restated. Grepping a signature proves *it exists*, not *what it does*; `✅` means you read
   it, so only cite `✅` on a body you opened. Anchor on the **symbol name** (line is derived,
   not stored as truth). Before writing a landmark, grep its symbol across other
   `modules/*/index.md` — owned elsewhere → cross-link, don't duplicate; genuine conflict →
   grill for the owner.
   **Cover the FE decision surface too (§FE surface).** A module with `fe-homes` gets an **FE
   landmarks** inventory alongside the BE one — the domain views, `store/<Domain>` module, query
   files, and router entries — each row naming the **endpoint it calls** so the flows in
   §Behaviors have their seam. Read the FE bodies (the view's data-fetch + the store
   action/query), don't just list files — the store file grabbed in passing is not FE coverage.
   Only stamp `verified-fe` once you have actually read FE bodies this pass (§Frontmatter).
4. **Reader-roles pass** (§Reader-roles): integrator → external-contract sections;
   operator → `NN-operations.md`; newcomer → seed `docs/CONTEXT.md` terms. Each fires only
   when the module has that surface.
5. **Scan for candidate problems** — the cited signal checklist (§Detection). List each
   as a candidate with its symbol anchor. Write nothing you can't anchor.
6. **Grill the problems** (one at a time, recommend each): which candidates are real,
   what's actually wrong, what matters. Promote survivors to registered problems
   (assign `P#`). Discard the rest.
7. Write `problems.md`. `index.md` last (it indexes the parts).

## Recheck

**Shape gate — do this FIRST, before any edit.** Re-judge the shape (step 4 below) as the
opening move. If the diagnosed shape differs from the current one, **stop and ask the user
which shape to use before touching a single file** — the answer decides where every behavior
and landmark lands, so editing first wastes work and pre-commits a structure the user hasn't
chosen. Only once the shape is settled (unchanged, or confirmed) do the drift-check edits below
proceed. Never bump the verified-date or refresh a line ahead of the shape decision.

**Spine before shape — do not let file structure pick the axis.** Before proposing *any* split,
restate the module's **narrative spine** (§Build 1) from source — the central data model + the
transformation the module exists to perform — and put it to the user. The spine is a *domain*
story, so its movements are the candidate part-seams; derive the shape from the spine, not from
the file tree. **Red flag: a proposed split that maps 1:1 to the big files** (one part per fat
route/service file) is almost always a code-structure split wearing a concern label — the
god-object is a *trigger* to split, not the *axis* (§Deep-dive Precedence). When your parts line
up with file boundaries, stop and re-derive from the lifecycle/concern the domain sees. Order:
**state spine → derive concern-shaped parts → ask the user to confirm the shape → only then edit.**

1. **Drift-check landmarks + behaviors — both stacks.** Recheck is **diff-bounded** (not a
   re-read of the whole module): using the stamped `verified-fe`/`verified-be` SHAs, read **in
   full** (per §Build's coverage rules — whole body, no skip-to-symbol) every in-scope file
   *changed since the stamp* (`git diff --name-only <sha>..HEAD -- <homes-globs>`), plus every file
   backing a landmark/behavior you are re-verifying. A **new** file the diff surfaces under the
   homes globs is a file to read + account for (landmark / cross-link / dismiss), exactly as on
   build. Then: grep each landmark's symbol (FE **and**
   BE): found → refresh the line silently; renamed / moved file / gone → **flag drift**, grill,
   fix or retire the entry. For each `## Behaviors` entry, re-read its anchored symbol's body →
   does the stated given/when/then still hold? Outcome changed (a guard added/removed, a whitelist
   field moved) → **flag behavior drift**, fix the scenario.
   **Endpoint / contract drift:** for each cross-stack flow, grep its **endpoint string** on both
   ends — the FE caller and the BE route. FE calls a path the BE renamed/removed (or vice-versa) →
   **flag FE↔BE contract drift** as flow drift and fix the anchor. This is the *living-doc* gate on
   the contract; `/review`'s Boundary axis remains the *pre-merge* gate — complementary, not duplicate.
   **FE unverified:** module has `fe-homes` but this recheck did not read FE bodies → do **not**
   stamp `verified-fe`; flag "FE unverified" so the gap can't hide behind a green timestamp
   (§Frontmatter). Same rule for `verified-be`.
   Also cross-grep against other modules' `index.md` → duplicate ownership = **boundary
   conflict**, grill for the owner, demote the loser to a cross-link.
   **Engineer lens (if present):** re-run the arch sub-parts' **grep-verified coupling counts** and
   **test-coverage columns** — both silently rot as code changes (a new caller, a deleted spec). Refresh
   the numbers; a coverage flip (❌→✅) may retire a candidate, a fan-in jump may reshape a seam.
   **Reader-roles lens (diff-scoped, §Reader-roles):** a changed file that is a lens surface —
   an external-format parser, a `config.get`/system-config/env read, a money write — → re-verify
   that lens's output (contract table still matches the parser, config-inventory row still true,
   idempotency note still holds). Do NOT re-run the full pass on recheck.
2. **Rescan** for new candidate problems (§Detection); grill promotions.
3. **Reconcile status**: any `open`/`proposed` problem now fixed in code → move to
   `## Solved` with its proposal back-link.
4. **Re-judge shape** (do NOT skip — this is where a flat doc that outgrew itself gets
   caught). Re-run the §Deep-dive complexity bar against the *current* code, reusing the
   drift-check reads (core line-counts, subsystem count) — don't assume the last shape
   still fits. Flat doc now clears the bar (god-object / >1 subsystem / coexisting
   systems) → **flag it and offer the deep-dive split** (name the shape + proposed parts);
   don't silently restructure. **Whenever the re-judged shape differs from the current one
   (including a code-shaped doc that should become domain-shaped per the *Precedence* rule) —
   stop and ask the user which shape to use; name the current shape, the diagnosed shape, and
   why, and let them choose. Never switch shape silently.** Deep-dive that fell below the bar
   → note it may re-flatten.
   Landmarks unchanged is NOT evidence the shape is right — judge structure explicitly.
   Also **re-confirm the spine** (§Build 1): does the doc still narrate the module's central
   transformation, or has it drifted into a method-listing? A doc that only says *which*
   symbols exist, not *how* they work, fails the story bar even with zero landmark drift —
   flag it and offer to deepen the logic-bearing parts (read bodies, not signatures).

## Rebuild — regenerate from code, keep the registry sacred

Only when the user **explicitly** asks (§Mode). Recheck edits in place; rebuild throws away
`index.md` + parts and regenerates them from source. That is destructive, and **there is no
git safety net on the vault yet** — so guard it, in this exact order:

1. **Auto-backup first.** Copy the whole module dir to `modules/.bak/<slug>-<YYYY-MM-DD>/`
   before touching anything. This is the only recovery path until the vault is on git.
2. **Confirm the blast radius — name what dies vs survives.** State it concretely and wait for
   a yes: *"Rebuild `shipments`: regenerates `index.md` + 6 parts from code (backed up to
   `.bak/`); `problems.md` preserved — N problems, M candidates kept, no `P#` renumbered.
   Proceed?"* Never rebuild on an implied yes.
3. **`problems.md` is sacred — never regenerated.** The `P#` IDs are permanent handles that
   `technical-proposal` back-links (`[[shipments#P3]]`); regenerating the registry would
   renumber/drop IDs and silently rot every proposal link. Rebuild **preserves the registry
   verbatim** — it may *re-verify evidence anchors* and *add* new candidates/problems, but
   **never renumbers, reuses, or deletes a `P#`**. Retiring an ID needs its own explicit
   confirmation (move to `## Solved`, keep the number).
4. **Regenerate `index.md` + parts** via §Build (spine → shape → parts → landmarks, all
   `✅`-verified), then **re-stamp frontmatter** `verified-fe`/`verified-be` to current HEADs.

## Registry — `problems.md`

Each registered problem: **`P#`** (never reused) · title · **status**
`open` → `proposed` → `solved` · **source** `explicit`\|`detected` · **axis**
`money`\|`auth`\|`provenance`\|`perf`\|`correctness`\|`debt` (for the `PROBLEMS.md` rollup's
group-by-axis view) · **stack** `fe`\|`be`\|`cross` (which stack owns the fix — feeds the
per-stack architecture lens, §Two-lenses) · **evidence** (`symbol@path` or metric/incident) ·
**proposals** (back-links). Solved problems live in a `## Solved` section (keeps the live list
present-tense). Detected-but-unpromoted items sit in `## Candidates` with **no ID** until you
promote them (tag candidates with their `stack` too). No severity field.

## Detection — cited signal checklist

Only surface a candidate you can anchor to a symbol: `TODO`/`FIXME`/`HACK` markers,
dead/unreachable code, functions with no test coverage, tight coupling / circular deps,
duplicated logic, unhandled error paths, `@deprecated`/legacy-shadow markers, **a documented
behavior on an auth / provenance / money axis with no test covering it** (§Behaviors),
**an unguarded money write** (money-axis mutation with no idempotency key / dedupe /
single-flight guard — double-submit writes twice), **an unpinned external format** (a parser of
externally-produced data whose column/field names are hardcoded but documented nowhere —
pair with the §Reader-roles contract table), **config asymmetry / silent fallback** (half a
feature runtime-editable while its pair needs a deploy; or a missing env var that degrades
silently instead of failing fast). Anything
you can't cite → raise in conversation, don't write it.

See [TEMPLATES.md](TEMPLATES.md) for file skeletons.
