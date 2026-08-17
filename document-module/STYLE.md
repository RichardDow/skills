# Vault prose style — write for future-you to understand, then skim

Every doc in this vault gets reopened weeks later by someone who first needs to *understand*
something, then find one detail. Serve both, in that order: prose carries the understanding,
structure carries the lookup. Optimise for comprehension first and scan speed second — and
never pay for either with detail loss (depth folds, it never dies).

## The three rules

### 1. Prose-first — bullets and tables earn their place

- **Prose is the default.** A doc is paragraphs that make and connect claims. Reasoning — why
  it's shaped this way, causality, tradeoffs, the argument — is *always* prose. Keep paragraphs
  to ~3–4 sentences.

- **A bullet list earns its place** only when the items are ≥3 true parallel peers with no
  reasoning between them (a set of endpoints, files, ordered steps). The moment a bullet needs
  a *because / therefore / but*, it's a sentence in a paragraph. Bullets that do remain open
  with a **bold lead** naming the item, and carry a **blank line between items** (loose lists
  scan faster — applies inside `[!details]-` folds too).

- **A table earns its place** only when every cell is indexed by two dimensions *and* stays
  short — a word, a number, a symbol. The moment a cell wants 2–3 sentences, that content is
  prose. Reference surfaces are the legitimate exception and stay tabular: landmark tables, the
  scope tables, contract/field lists, symbol families.

- **The test, when unsure:** could a competent colleague follow the whole argument by reading
  only the prose, ignoring every bullet and table? If not, load-bearing content is trapped in
  fragments — move it into sentences.

- **By document type.** A proposal or any argument-shaped doc is almost entirely prose — usually
  only a comparison matrix and a decisions log as tables. A reference/module doc keeps its
  reference tables, but its behaviour and "how it works" narrative is prose, not a bullet dump.

### 2. Depth stays inline, always visible

- Deep detail (edge-case behaviour, field lists, precedence ladders, SQL specifics, long
  enumerations) stays **inline and always visible** — as prose under the claim it refines, or
  as a plain always-visible table placed where it's referenced. **No collapsible folds** — no
  `> [!details]-` callouts. The reader sees one document, in one reading order, with nothing
  hidden behind a click.

- Shortening a doc by deleting detail is still forbidden — inline it, don't cut it. Order it
  coarse-first, deepest last, so the skim still works top-down.

- The headline must stand alone: a reader skimming only the bold leads and `###` titles gets a
  correct (coarser) picture; the prose and tables beneath refine it.

### 3. Links — subject-only inline

- A link stays inline **only when the linked thing is what the sentence is about**
  ("[invoices-finance](../invoices-finance/index.md) consumes these DTOs").

- Aside references ("see also", "mirrors", "same formula as", "problem owned by X") move to a
  plain **`See also:`** line at section end — a bold lead-in, then semicolon-separated
  `subject — [link]` pairs:

  **See also:** FE mirror of this formula — [03 · FE compute](./03-fe-compute.md); ladder
  duplication — [problems.md#candidates](./problems.md#candidates).

- Landmark tables keep their links — tables are reference surface, not prose.

## Behaviours — one section per behaviour

- A module/part's observable behaviours go under a `## Behaviours` heading, **one `###`
  sub-section per behaviour** — never a numbered list, never a bullet dump.

- The `###` title is a **short outcome phrase** (≈3–6 words) so the heading rail scans and the
  anchor stays clean and stable (`#queue-is-derived-not-stored`). The prose body opens by
  stating the full observable outcome, then gives the mechanism, and ends anchored to the
  realising symbol(s): `→ \`symbol\` ✅`.

- **Cross-reference a behaviour by its heading anchor** (`[01#assign-to-me-re-points-the-tasks]`),
  never by an ordinal like `B2` — positions renumber, headings don't.

## Plain Markdown only

- **No Obsidian callouts of any kind** — no `> [!details]`, `> [!info]`, `> [!tip]`,
  `> [!warning]`. Warnings/tips become a **bold-lead sentence** in prose; see-also asides use
  the `See also:` line above. The doc reads identically in Obsidian, GitHub, and raw.

- Existing conventions unchanged: bold one-line lead under each H1, nav-links line,
  ✅/⚠ verification markers, landmark tables, scope tables.

## Anchoring & markers

- **Anchor on the symbol name only — never a line number.** Write `\`getSeaCargoReport\``, not
  `getSeaCargoReport@HouseJob.js:107`. Line numbers rot on every edit above them; the symbol is
  the durable handle and the line is derived. This applies to landmark tables, behaviour
  anchors, problem evidence, and prose alike.

- **`✅` is a bare marker — no inline date.** `✅` means "I read the body this pass"; the
  *when* lives once in `index.md` frontmatter (`verified-fe` / `verified-be` SHAs). Don't write
  `✅ (2026-07-06)` — it's a second timestamp that drifts.

- **H1 carries no ordinal.** Title the part `# Customs — HS codes`, not `# Customs · 03 —`.
  Read-order lives in the filename (`04-hs-codes.md`) and the nav breadcrumb; duplicating it in
  the H1 is how numbering silently goes out of sync when a part is inserted.

- **The door does not re-list landmarks.** Each landmark lives in exactly one part's
  `Key landmarks` table; `index.md` routes to parts via Scope + read-order, it does not carry a
  consolidated copy (which duplicates and rots).

## Rollout

- **No mass retrofit.** Any skill pass that edits a file (recheck, rebuild, sweep,
  proposal cross-link) restyles the **whole file** to this guide in the same pass.

- Restyle is mechanical: facts, verified shas, and `P#` IDs untouched.
