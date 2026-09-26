# Deep-dive mode

For modules above the complexity bar: a god-object core of roughly 600+ lines, more than one
subsystem, or coexisting systems. Below the bar, stay single-page — `index.md` plus
`problems.md`, no parts.

The move is one meta-step, not a fixed template:

> Diagnose the module's dominant axis by reading code. Pick the matching skeleton. Write the
> door plus one part per axis-element, every landmark `✅`-verified.

## 1. Diagnose the dominant axis

Read the source — never infer from filenames. Ask: what is the one organizing principle a reader
most needs? It's usually one of the shapes below. Weigh these signals: the number of distinct
responsibility clusters; whether two code paths do the same job (a migration); whether data flows
through ordered stages; whether one entity aggregates many concerns; line counts and import
counts.

## 2. Shape library → skeleton

The catalogue of shapes — each with a tell-tale, a diagram, pros/cons, and when/how — lives in
[`modules/_shapes.md`](../../../modules/_shapes.md), the human-facing reference and also the
vault glossary. Read it to pick a skeleton. In brief, the shapes are: **Subsystem**, **Parallel
systems / migration** (spine plus per-system), **Pipeline** (per-stage), **Hub / aggregation**
(per-concern), **Dual-flow** (per-flow), **Layered substrate** (per-layer), **Mode / surface**
(per user-mode), and **Flat** (no parts).

Shapes compose. A parallel-systems module often also has a pipeline — document the pipeline once
as a spine, then show where each system implements each step. Pick the axis that carries the most
reader value as the top-level split, and fold the rest inside parts.

**New shape?** If a module fits none of the catalogue, that's a new shape. Add it to
`modules/_shapes.md` — definition, tell-tale, Mermaid diagram, toy example, pros/cons, when, how —
in the same pass, then use it. Keep that file the single source of truth for shapes.

### Worked examples

- **shipments** → *Hub*: one shipment record aggregates many concerns (the 4079-line
  `ShipmentService` is a *trigger* to split, not the axis). Parts are the business concerns —
  read/auth, lifecycle, journey, milestones, cargo-containers, parties. The FE store folded
  per-concern; house-jobs and shareable-shipments graduated to sibling modules. It was mis-shaped
  once as *Subsystem*, split by method cluster — corrected per the business-concern Precedence
  rule.
- **tracking** → *Parallel-systems + Pipeline*: a legacy `store/models` versus a new service
  layer. Parts are the lifecycle spine, the new system, the legacy system, and
  persistence/routes.

## 3. The door (`index.md`)

Opens with Scope (owns, does-not-own, adjacent) as always, then the headline — the dominant axis
stated plainly, e.g. "two systems, mid-migration" — then a Read-in-order list of the parts.
Detailed, symbol-anchored landmark tables live *in* each part, not the door. The door routes to
them; it never carries its own copy (see `STYLE.md`'s "The door does not re-list landmarks").

## 4. Each part

- One axis-element: a subsystem, system, stage, concern, flow, or layer.
- Narrative plus a **Key landmarks** table (`symbol · path · what it does`), `✅` per verified
  row.
- Cross-link seams to other modules (`[[owner]]`) and to problems (`[[owner#P#]]`). Never
  re-document another module's owned symbols.

### File naming — encode read-order in the filename

Parts sort alphabetically in every file tree, so the read-order must live in the name, or the
door's sequence is lost. Convention:

- **Parts:** `NN-slug.md`, zero-padded from `01`, in door read-order (`01-companies-core.md`,
  `02-connections-links.md`, …). This is the default — use it for every deep-dive.
- **Orientation** (only if the module needs a primer before part 1): `00-orientation.md`.
- **Appendices:** `appendix-<letter>-<slug>.md` (`appendix-a-…`), sorted after the numbered
  parts.
- **Fixed names:** `index.md` (the door) and `problems.md` stay bare — never prefix them.
- **Slug** is the kebab-case of the axis-element, matching the door's link text.
- **Engineer lens (phase 2):** `be-architecture/` and `fe-architecture/` are folders, each a mini
  deep-dive — door `index.md` plus `NN-slug.md` sub-parts, one per stack seam. Not mode parts,
  not flat files. See `SKILL.md`'s Two lenses section and [ARCH-TEMPLATE.md](ARCH-TEMPLATE.md).

Do not invent a per-module scheme. Some existing modules use a legacy `part-N-slug.md` variant
(`checklist`, `shipments`) — grandfathered, don't copy it into new modules. On recheck, if a
module's parts lack the `NN-` prefix, rename them and rewrite intra-module links in the same
pass.

## Readability conventions — scan-first, prose-second

A deep-dive part is a reference page a tired reader scans, not an essay. Density is the enemy — a
wall of prose with code-refs comma-run through it forces the eye to parse every word to find the
one symbol it needs.

**"Scan-first" is not "tables-only" — it governs order, not content.** A part still tells the
spine's story. The reader just shouldn't have to read prose to navigate it. Order every part:
TL;DR line → `## Behaviours` (one `###` per behaviour by default, never a numbered list; a
decision table only for a true matrix, symbol-anchored — see `SKILL.md`'s Behaviours section) →
spine narrative (how this movement works, with a flow or data diagram if there's a pipeline or an
association tree) → the `Key landmarks` table as evidence for the narrative → seams.

Behaviors lead because a tired reader wants *what the code does* before *how*. The narrative and
landmarks are the proof beneath the behavior spec. The narrative carries the mechanism; the table
anchors it to symbols. A part that is only tables — what the anti-example produced — is
technically compliant with "group tables over group prose," yet reads like nothing. That rule
kills symbol-soup sentences; it does not replace the story with a grid.

Hold these four rules — they cut scan time without dropping a single fact:

1. **TL;DR line.** Every part opens with one bold sentence — what this part is, and why a reader
   should care — before any heading. Never bury the "so what" mid-paragraph.
2. **No symbol soup.** A prose sentence carries at most 3 code refs. More than that, break to a
   bullet list (one symbol per bullet) or a table. Never comma-run a family of symbols inside one
   sentence.
3. **Group tables over group prose.** Endpoint groups, metric families, config variants, enum
   cases, step-by-step methods, and the Scope owns/does-not-own lists go in a table (`Group |
   Symbols | Does`, `Area | What | Part`, `Concern | Owner | Why`, or similar), not a paragraph.
   If you're writing "A (`x`), B (`y`), C (`z`)…," it's a table.
4. **Flow diagram for any pipeline.** A lifecycle, ordered-stage, or request path gets an ASCII
   box-arrow diagram (`register → fetch → compare → merge → apply`) up top, before the per-stage
   detail. One glance gives the mental model.

Lead bullets with a bold action verb, then the detail (`**resolves** recipient by
precedence…`), so the eye scans the verb column. Keep the `Key landmarks` and comparison tables
you already write — extend them, don't bury them under prose.

## The verification bar

Deep dives are only worth it if the facts are true. Hold this bar — it repeatedly overturns
surface-scan framing:

1. **`✅` means you read the body, not the signature.** Stamp a landmark or claim only after you
   opened the file and read the mechanism — for a logic-bearing landmark, that means reading its
   body, not grepping its name. A signature grep proves it exists; it does not tell you what it
   does, and a "what it does" column written from the name alone is a method-listing, not a fact.
   No `✅` on inference.

   **"Read the body" means the whole file, in order, no skip-to-symbol.** Opening a file and
   jumping to the one method you came for is not a read — that is how a buried `TODO`, a legacy
   shim, or an unhandled case in a 2500-line god-object stays invisible. For a file bigger than
   one read-window, read it sequentially across calls until you can name every top-level export
   or method and its mechanism. The completeness test is "can I list all public members," not
   "did I find the one I was looking for." This bar is the per-file half of `SKILL.md`'s
   file-complete coverage rule — every in-scope file read in full, "presentation/type-only" a
   post-read conclusion, never a pre-read skip.
2. **Test framing claims with evidence, not vibes.** "Dead code," "dual system," "unused," and
   "god-object" are hypotheses until checked:
   - **Import or call-site count** — `grep -rl` the symbol across the repo, excluding tests, to
     prove active, dead, or which-of-two-is-used. This is what corrected a "3 competing
     factories" claim to "1 active, 1 unwired, 1 near-dead."
   - **Line count** — run `wc -l` before writing "N-line god-file."
   - **Directory existence** — confirm coexisting directories or versions actually exist.
3. **Existence is not relationship — trace, don't count.** Import counts prove what's alive. They
   do not prove how two live components relate. Before calling components "peers," "competing,"
   or "parallel systems," read one call site where they are used together, and establish the
   direction: peers, layered (A wraps B), or split (A builds, B sends). Naming collisions — three
   symbols named `*Builder` — are a trap, not evidence of peer roles: a thing with a `buildX`
   method that *returns content* is not a peer of one that *sends* it. This is what corrected
   "three email builders" to "legacy monolith vs new build/send split" — `MailTemplate` builds,
   `EmailV2` sends, verified by reading `CustomsNotificationService`.
4. **Re-derive; don't refine a prior.** When deep-diving a module you already surface-scanned,
   re-derive the framing from source. Don't inherit and merely extend the scan's wording ("two
   systems" to "three") — that carries its errors forward.
5. **Correct the registry inline.** When a deep read contradicts an earlier `problems.md` entry —
   its severity, mechanism, or line count — rewrite that `P#`'s evidence in the same pass and note
   the correction. Don't leave a stale or overstated problem. Downgrade a debunked one (e.g. "live
   DoS" to "dead commented code") rather than deleting the ID.
6. **Feed new anchored findings back** into `## Candidates`, or promote via grilling. A deep read
   surfaces problems the scan missed — anchor each to a symbol.

## Links & anchors (portable across Obsidian, VS Code, GitHub)

- Cross-module: `[[owner]]`, `[[owner#P3]]` — wikilinks, which resolve correctly across the
  vault, including from a deep-dive module's folder-note `index.md`.
- Problem anchors are stable IDs. Keep each problem heading as `### <slug>-P<n>`, with the title
  on the next bold line, so the `#<slug>-p<n>` anchor survives a retitle.
- After writing, sweep the module's links: confirm every relative target exists, and every
  `#anchor` matches a heading.
