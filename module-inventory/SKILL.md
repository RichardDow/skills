---
name: module-inventory
description: Carve a codebase into a confirmed list of cross-stack domain modules, using graphify graphs to validate cohesion and domain directories to set boundaries, then write a module-map the user approves. Use when the user wants to group features/services into logical modules, plan what to document, produce a module inventory, or prep a batch of /document-module runs. Stops at the confirmed list — delegates the actual docs to /document-module.
---

# module-inventory

Produce **one confirmed list of modules** for a codebase, then stop. Each module is a
**capability / domain noun**, not a folder — it may span repos and layers. The output feeds
`/document-module` (one run per module, separately). This skill owns the carve-up and the
sign-off; it does **not** write module docs.

## Core method — boundaries from domains, graph for validation

Graphify community detection alone does **not** give feature modules. Layered backends
cluster by **layer** (Services / Routes / Models…), not feature; a large frontend over-splits
(1000+ tiny communities, few named). So:

- **Feature boundaries** come from **domain-named directories** — FE `views/*` / route dirs,
  BE `routes/*` + `services/*`, or equivalent per stack.
- **Graphify** (`graphify-out/GRAPH_REPORT.md`, `graph.json`) is used to **validate**:
  god-nodes (shared cores → their own infra module), edges (does the cluster cohere), and
  named communities (naming hints). Don't treat its communities as the module list.

## Steps

1. **Detect inputs.** Find each `graphify-out/` (may be several — one per repo/stack root).
   Read `.graphify_root` for the analysed source root, `GRAPH_REPORT.md` for named
   communities + God Nodes + summary. If none exists, tell the user to run `/graphify`
   first — this skill needs it. Confirm the stack roots with the user if ambiguous.

2. **Cross-reference domain dirs.** List the domain-named dirs under each root
   (FE feature/view dirs, BE route + service dirs, state modules). Cross-map the **same
   domain noun** across stacks — that pairing is a candidate module.

3. **Draft the inventory.** Build the full candidate list, grouped in tiers (core domain →
   supporting/ops → CRM/access → finance/integrations → reference data → platform/infra).
   For each: `slug`, and its homes per stack. Map God Nodes to shared-core infra modules.

4. **Confirm — grill one fork at a time** (recommend each, put recommendation first):
   - **Axis** — cross-stack domain modules vs per-repo lists vs one repo first.
   - **Granularity + coverage** — coarse-merged vs fine-per-noun vs everything (incl. infra).
     If the user wants to *see* the list before choosing, show the full inventory first.
   - **Slugs** — flat kebab, matching any existing `modules/*` convention; flag
     modules that already have a docs folder (reuse the slug, don't rename).
   - **Execution** — how `/document-module` will be run later (one-at-a-time is safest;
     the user picks — this skill only records the intent).
   Explore the codebase to answer forks yourself where the answer is in the code.

5. **Write the module-map + memory. STOP.**
   - Write `<docs>/modules/MODULE_MAP.md` (or the repo's docs root): the confirmed table —
     `slug · capability · FE homes · BE homes · tier · existing-docs?`. This is the door
     `/document-module` reads to know each module's scope skeleton.
   - Save a project memory: the slug list, doc location, and the agreed execution rule.
   - Do **not** run `/document-module`. Report the list and hand off.

## Boundaries

- Stops at the confirmed list + map + memory. Never writes per-module docs (that's
  `/document-module`) and never redefines domain terms (that's `domain-modeling` /
  `CONTEXT.md`).
- A module = a capability with a **single owner**; a symbol lives in one module, others
  cross-link. Surface overlaps as a fork, don't duplicate.
- Every claimed home must be a real dir/symbol you saw — no invented paths.
