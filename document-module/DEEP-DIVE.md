# Deep-dive mode

For modules above the complexity bar (god-object ~600+‑line core · >1 subsystem · coexisting
systems). Below the bar → single-page `index.md` + `problems.md`, no parts.

The move is one meta-step, **not** a fixed template:

> **Diagnose the module's dominant axis by reading code → pick the matching skeleton →
> write the door + one part per axis-element, every landmark `✅`-verified.**

## 1. Diagnose the dominant axis

Read the source (and the graphify graph if present) — never infer from filenames. Ask: *what
is the one organizing principle a reader most needs?* It's usually one of the shapes below.
Signals to weigh: number of distinct responsibility clusters; whether two code paths do the
same job (migration); whether data flows through ordered stages; whether one entity aggregates
many concerns; line counts + import counts.

## 2. Shape library → skeleton

The catalogue of shapes — each with tell-tale, diagram, pros/cons, when/how — lives in
**[`modules/_shapes.md`](../../../modules/_shapes.md)** (the human-facing reference; also the
vault glossary). Read it to pick a skeleton. In brief, the shapes are: **Subsystem**,
**Parallel systems / migration** (spine + per-system), **Pipeline** (per-stage), **Hub /
aggregation** (per-concern), **Dual-flow** (per-flow), **Layered substrate** (per-layer), and
**Flat** (no parts).

Shapes **compose**: a parallel-systems module often also has a pipeline (document the pipeline
once as a spine, then show where each system implements each step). Pick the axis that carries
the most reader value as the top-level split; fold the rest inside parts.

> **New shape?** If a module fits none of the catalogue, that's a new shape — **add it to
> `modules/_shapes.md`** (def · tell-tale · Mermaid diagram · toy example · pros/cons · when ·
> how) in the same pass, then use it. Keep that file the single source of truth for shapes.

### Worked examples
- **shipments** → *Hub*: one shipment record aggregates many concerns (the 4079-line
  `ShipmentService` is a *trigger* to split, not the axis). Parts = business concerns: read/auth ·
  lifecycle · journey · milestones · cargo-containers · parties; FE store folded per-concern;
  house-jobs + shareable-shipments graduated to sibling modules. (Was mis-shaped as *Subsystem*
  split by method cluster — corrected per the business-concern *Precedence* rule.)
- **tracking** → *Parallel-systems + Pipeline*: legacy `store/models` vs new service layer.
  Parts = lifecycle spine · new-system · legacy-system · persistence/routes.

## 3. The door (`index.md`)

Opens with **Scope** (owns / does-not-own / adjacent) as always, then the **headline** (the
dominant axis stated plainly — e.g. "two systems, mid-migration"), a **Read-in-order** list of
the parts, and a **consolidated landmarks table** (quick index → which part). Detailed,
symbol-anchored landmark tables live *in* each part, not the door.

## 4. Each part

- One axis-element (a subsystem / system / stage / concern / flow / layer).
- Narrative + a **Key landmarks** table (`symbol · path · what it does`), `✅` per verified row.
- Cross-link seams to other modules (`[owner](../owner/index.md)`) and to problems
  (`[owner#P#](../owner/problems.md)`); never re-document another module's owned symbols.

### File naming — encode read-order in the filename
Parts sort alphabetically in every file tree, so the **read-order must live in the name** or
the door's sequence is lost. Convention:

- **Parts:** `NN-slug.md`, zero-padded from `01`, in door read-order (`01-companies-core.md`,
  `02-connections-links.md`, …). This is the default — use it for every deep-dive.
- **Orientation** (only if the module needs a primer before part 1): `00-orientation.md`.
- **Appendices:** `appendix-<letter>-<slug>.md` (`appendix-a-…`), sorted after numbered parts.
- **Fixed names:** `index.md` (door) and `problems.md` stay bare — never prefix them.
- **Slug** = kebab-case of the axis-element, matching the door's link text.
- **Engineer lens (phase 2):** `be-architecture/` + `fe-architecture/` are *folders*, each a mini
  deep-dive (door `index.md` + `NN-slug.md` sub-parts, one per stack seam). Not mode parts, not flat
  files → see §Two-lenses + [ARCH-TEMPLATE.md](ARCH-TEMPLATE.md).

Do NOT invent a per-module scheme. Some existing modules use a legacy `part-N-slug.md` variant
(checklist, shipments) — grandfathered, don't copy it into new modules. On **recheck**, if a
module's parts lack the `NN-` prefix, rename them and rewrite intra-module links in the same
pass (sweep §Links after).

## Readability conventions — scan-first, prose-second

A deep-dive part is a **reference page a tired reader scans**, not an essay. Density is the
enemy: a wall of prose with code-refs comma-run through it forces the eye to parse every word
to find the one symbol it needs.

**"Scan-first" is not "tables-only" — it governs order, not content.** A part still *tells the
spine's story*; the reader just shouldn't have to read prose to navigate it. Order every part:
**TL;DR line → `## Behaviors` (numbered bold-lead list by default, decision table only for a true
matrix, symbol-anchored — the *what*, see SKILL.md §Behaviors) → spine narrative (how this movement works, with a flow/data diagram if
there's a pipeline or association tree) → `Key landmarks` table as the evidence for the narrative
→ seams.** Behaviors lead because a tired reader wants *what the code does* before *how* — the
narrative + landmarks are the proof beneath the behavior spec.
The narrative carries the mechanism; the table anchors it to symbols. A part that is *only*
tables (what the anti-example produced) is technically compliant with "group tables over group
prose" yet reads like nothing — that rule kills symbol-soup *sentences*, it does not replace
the story with a grid. Hold these four rules — they cut scan-time without dropping a
single fact:

1. **TL;DR line.** Every part opens with **one bold sentence** — *what this part is + why a
   reader should care* — before any heading. The "so what" is never buried mid-paragraph.
2. **No symbol soup.** A prose sentence carries **≤3 code refs**. More than that → break to a
   bullet list (one symbol per bullet) or a table. Never comma-run a family of symbols inside a
   sentence.
3. **Group tables over group prose.** Endpoint groups, metric families, config variants,
   enum cases, step-by-step methods, and the **Scope owns / does-not-own lists** → a table
   (`Group | Symbols | Does`, `Area | What | Part`, `Concern | Owner | Why`, or similar), not a
   paragraph. If you're writing "A (`x`), B (`y`), C (`z`)…", it's a table.
4. **Flow diagram for any pipeline.** A lifecycle / ordered-stage / request path gets an ascii
   box-arrow diagram (`register → fetch → compare → merge → apply`) up top, before the
   per-stage detail. One glance = the mental model.

Lead bullets with the **bold action verb**, then the detail (`**resolves** recipient by
precedence…`), so the eye scans the verb column. Keep the `Key landmarks` and comparison tables
you already write — those are the model, extend them, don't bury them under prose.

## The verification bar

Deep dives are only worth it if the facts are true. Hold this bar — it repeatedly overturns
surface-scan framing:

1. **`✅` = read the body, not the signature.** Only stamp a landmark/claim after you opened
   the file and read the *mechanism* — for a logic-bearing landmark that means reading its
   body, not grepping its name. A signature grep proves *it exists*; it does not tell you what
   it does, and a "what it does" column written from the name alone is a method-listing, not a
   fact. No `✅` on inference.
   **"Read the body" = the whole file, in order, no skip-to-symbol.** Opening a file and jumping to
   the one method you came for is not a read — that is how a buried `TODO`, a legacy shim, or an
   unhandled case in a 2500-line god-object stays invisible. For a file bigger than one read-window,
   read it sequentially across calls until you can **name every top-level export/method and its
   mechanism**; the completeness test is "can I list all public members," not "did I find the one I
   was looking for." (This bar is the per-file half of §Build's file-complete coverage rule — every
   in-scope file read in full, "presentation/type-only" a post-read conclusion, never a pre-read
   skip.)
2. **Test framing claims with evidence, not vibes.** "Dead code", "dual system", "unused",
   "god-object" are *hypotheses* until checked:
   - **import / call-site count** — `grep -rl` the symbol across the repo (excluding tests) to
     prove active / dead / which-of-two-is-used. (This is what corrected a "3 competing
     factories" claim to "1 active, 1 unwired, 1 near-dead".)
   - **line count** — `wc -l` before writing "N-line god-file".
   - **directory existence** — confirm coexisting dirs/versions actually exist.
3. **Existence ≠ relationship — trace, don't count.** Import counts prove what's *alive*; they
   do NOT prove how two live components *relate*. Before calling components "peers / competing /
   parallel systems", **read one call site where they are used together** and establish the
   direction: peers, layered (A wraps B), or split (A builds → B sends). Naming collisions
   (three symbols named `*Builder`) are a trap, not evidence of peer roles — a thing with a
   `buildX` method that *returns content* is not a peer of one that *sends* it. (This is what
   corrected "three email builders" to "legacy monolith vs new build/send split" — MailTemplate
   *builds*, EmailV2 *sends*, verified by reading `CustomsNotificationService`.)
4. **Re-derive; don't refine a prior.** When deep-diving a module you already surface-scanned,
   re-derive the framing from source — don't inherit and merely extend the scan's wording
   ("two systems" → "three") or you carry its errors forward.
5. **Correct the registry inline.** When a deep read contradicts an earlier `problems.md`
   entry (severity, mechanism, line count), rewrite that `P#`'s evidence in the same pass and
   note the correction — don't leave a stale/overstated problem. Downgrade debunked ones
   (e.g. "live DoS" → "dead commented code") rather than deleting the ID.
6. **Feed new anchored findings back** into `## Candidates` (or promote via grilling) — a deep
   read surfaces problems the scan missed; anchor each to a symbol.

## Links & anchors (portable across Obsidian / VS Code / GitHub)

- Cross-module: `[owner](../owner/index.md)`, `[owner#P3](../owner/problems.md)` — relative
  paths, **not** `[[wikilinks]]` (folder/`index.md` notes don't resolve as wikilinks).
- Problem anchors are stable IDs: keep each problem heading as `### <slug>-P<n>` with the
  title on the next bold line, so `#<slug>-p<n>` anchors survive retitling.
- After writing, sweep the module's links: every relative target exists, every `#anchor`
  matches a heading.
