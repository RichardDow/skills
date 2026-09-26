# Build, Recheck, Rebuild

Read the section for the mode `SKILL.md`'s auto-detect chose (or the user named). You need only
one section per run — these three modes never run together.

## Build — code-first facts, grill the problems

> **Coverage first.** Read every in-scope file, in full, before you make a claim about it. Skip
> this and a file stays *in scope but never opened* — grepped, not read, or skimmed to the symbol
> you expected. That produces a confident-wrong landmark, ownership call, or lineage label. Real
> examples from one rebuild: a "pricing" view that was actually a Stripe subscription table.
> Stores labelled "legacy Vuex" that were Pinia. A controller documented as "customer cards" that
> also held a booking engine. A whole legacy endpoint family never enumerated. Every one was a
> file inside the homes globs whose body nobody read. So:
>
> - **File-complete, not claim-complete.** Build and rebuild read **every** file the `fe-homes`
>   and `be-homes` globs resolve, in full — not only the ones you end up citing. You cannot
>   dismiss a file as "just presentation," "just types," or "just wiring" to avoid reading it.
>   That label is a *conclusion you reach after reading*, never a filter you apply before.
> - **The only files skippable unread** are mechanically non-logical by extension or location:
>   `*.test.*`, `*.spec.*`, `__snapshots__`, fixtures, `*.csv`/`*.json` data, lockfiles, and
>   auto-generated barrels (e.g. a `routesImporter`-generated `index.js`). Read every other
>   `.ts`/`.js`/`.tsx`/`.vue` source file.
> - **"Read in full" means the whole body, in order, no skip-to-symbol.** For a file bigger than
>   one read-window, read it sequentially across calls. Stop only once you can **name every
>   top-level export or method and its mechanism** — the completeness test is "can I list all
>   public members," not "did I find the one I came for." This is what catches the buried `TODO`,
>   the legacy shim, the gap in a 2500-line god-model.
> - **Recheck is diff-bounded** (see below) — it does not re-read the whole module. It reads in
>   full every file changed since the stamped SHA, plus every file backing a landmark or behavior
>   it is re-verifying.

1. **Enumerate the module, then account for every file.** First action of build or rebuild:
   resolve the `fe-homes` and `be-homes` globs to a concrete file list (`git ls-files -- <glob>` or
   `find`). That list is your coverage contract. By the time the doc is written, every file on it
   is either (a) anchored as a landmark, (b) cross-linked to another module, or (c) consciously
   dismissed by a mechanical category above (test/fixture/generated). A source file you cannot
   place in one of those three buckets is a file you have not read — go read it. The doc itself is
   the coverage record; there is no separate manifest.

   Then close the gap the globs can't see. The homes globs are the *staleness* anchor, not a
   *completeness* guarantee — a too-narrow glob hides real module files, the classic "colocated
   under another module's tree." So also **grep the domain terms across both whole repos** (e.g.
   `rate|Rate|charge-template|quote-template`) and reconcile every hit to one of: *in-homes*
   (already accounted), *owned-elsewhere* (cross-link), or *missing-home* (**widen the glob and
   read the file**). A hit you had to widen for is a file the previous globs were hiding — this is
   how a stray `routes/additional-charges/` or a colocated `routes/rates/charges.js` surfaces.
   Tighten the globs so they resolve the full set before you stamp frontmatter.

2. **Find the spine first — as a business flow that crosses the stack.** Before drafting
   anything, read the module's core code on both sides of the stack — the domain FE that drives
   it and the BE that transforms it, see `SKILL.md`'s FE surface section — and state its
   **narrative spine** in one or two sentences. The spine is the central data model, the
   transformation the module exists to perform, and how it is driven and seen: the domain story
   as a user triggers it, the system transforms it, and the result renders back. Example: *"a PO
   tracks the tension between ordered lines and shipped allocations; the buyer edits lines in the
   PO view → `PATCH /purchase-orders/:id` → the allocation reconciler recomputes status → the
   view re-renders how far ordered→shipped has progressed."* A spine that stops at the BE
   transformation is half-written — it can't show the flow.

   Derive the spine from the code, then put it to the user and let them correct it. They hold the
   operational centre of gravity that line counts can't reveal — which subsystem is the heart and
   which is the plumbing. The spine is what every part narrates toward. Skip it and the doc
   degrades into a method-listing that reads like nothing. In a deep-dive, the spine becomes the
   door's **Headline**, and each part narrates one movement of the flow.

   Default part-seams to the module's business concerns or user modes, not its code structure —
   the spine is a domain story, so its movements are domain concerns, flow stages, or the user
   modes both stacks share (browse/view/create/edit/track — see the Deep-dive mode section for
   "pick the axis where both stacks agree"; concerns then nest under the `view` mode). A
   code-shaped split (Subsystem by method cluster) is the fallback only when no domain axis
   exists (see the Precedence rule in `modules/_shapes.md`).

   State the spine's axis from both stacks at once. If the FE decomposes by mode and the BE by
   concern, the spine is the mode story and the concerns are its `view`-mode facets. Don't ship a
   BE-only concern split with the FE appended.

3. **Read the source — every in-scope file, bodies not signatures, on both sides of the stack.**
   Read the full file list from step 1, per the coverage rules above, before drafting. The read is
   not scoped to files you already plan to cite — classify each file (landmark / cross-link /
   dismiss) only after opening it. Then draft `index.md`: the Scope section (three tables — Owns,
   Does NOT own, Adjacent — see `SKILL.md`'s Layout section), what the module does, its behaviors
   (cross-stack flows where they cross, symbol-anchored — see `SKILL.md`'s Behaviours section),
   and a Key landmarks table (`symbol · path · what it does`).

   For every landmark that carries logic, read its body. The "what it does" column is the
   *mechanism* — the transformation, guard, or data-shape it produces — never the symbol name
   restated. Grepping a signature proves it exists, not what it does. `✅` means you read it, so
   only cite `✅` on a body you opened. Anchor on the symbol name — the line is derived, never
   stored as truth. Before writing a landmark, grep its symbol across other `modules/*/index.md`.
   Owned elsewhere → cross-link, don't duplicate. Genuine conflict → grill for the owner.

   Cover the FE decision surface too (see `SKILL.md`'s FE surface section). A module with
   `fe-homes` gets an FE landmarks inventory alongside the BE one — the domain views,
   `store/<Domain>` module, query files, and router entries — each row naming the endpoint it
   calls, so the flows in Behaviours have their seam. Read the FE bodies (the view's data-fetch
   and the store action/query) — don't just list files. A store file grabbed in passing is not FE
   coverage. Only stamp `verified-fe` once you have actually read FE bodies this pass (see
   `SKILL.md`'s Frontmatter section).

4. **Reader-roles pass.** Read [READER-ROLES.md](READER-ROLES.md) and run it: integrator →
   external-contract sections; operator → `NN-operations.md`; newcomer → seed this module's
   `glossary.md` terms. Each role fires only when the module has that surface.

5. **Scan for candidate problems** — the cited signal checklist in `SKILL.md`'s Detection
   section. List each as a candidate with its symbol anchor. Write nothing you can't anchor.

6. **Grill the problems**, one at a time, recommending each: which candidates are real, what's
   actually wrong, what matters. Promote survivors to registered problems (assign `P#`). Discard
   the rest.

7. Write `problems.md`. Write `index.md` last — it indexes the parts.

## Recheck

**Shape gate — do this first, before any edit.** Re-judge the shape (step 4 below) as the opening
move. If the diagnosed shape differs from the current one, stop and ask the user which shape to
use before touching a single file. The answer decides where every behavior and landmark lands, so
editing first wastes work and pre-commits a structure the user hasn't chosen. Only once the shape
is settled — unchanged, or confirmed — do the drift-check edits below proceed. Never bump the
verified-date or refresh a line ahead of the shape decision.

**Spine before shape — do not let file structure pick the axis.** Before proposing any split,
restate the module's narrative spine (Build step 2) from source — the central data model and the
transformation the module exists to perform — and put it to the user. The spine is a domain
story, so its movements are the candidate part-seams. Derive the shape from the spine, not from
the file tree. Red flag: a proposed split that maps 1:1 to the big files (one part per fat
route/service file) is almost always a code-structure split wearing a concern label — the
god-object is a *trigger* to split, not the *axis* (see DEEP-DIVE.md's Precedence rule). When your
parts line up with file boundaries, stop and re-derive from the lifecycle or concern the domain
sees. Order: state spine → derive concern-shaped parts → ask the user to confirm the shape → only
then edit.

1. **Drift-check landmarks and behaviors, both stacks.** Recheck is diff-bounded — it is not a
   re-read of the whole module. Using the stamped `verified-fe`/`verified-be` SHAs, read in full
   (per Build's coverage rules — whole body, no skip-to-symbol) every in-scope file changed since
   the stamp (`git diff --name-only <sha>..HEAD -- <homes-globs>`), plus every file backing a
   landmark or behavior you are re-verifying. A new file the diff surfaces under the homes globs
   is a file to read and account for (landmark / cross-link / dismiss), exactly as on build.

   Then grep each landmark's symbol, FE and BE. Found → refresh the line silently. Renamed, moved,
   or gone → flag drift, grill, fix or retire the entry. For each Behaviours entry, re-read its
   anchored symbol's body: does the stated given/when/then still hold? Outcome changed — a guard
   added or removed, a whitelist field moved — → flag behavior drift, fix the scenario.

   **Endpoint and contract drift:** for each cross-stack flow, grep its endpoint string on both
   ends — the FE caller and the BE route. FE calls a path the BE renamed or removed, or vice
   versa, → flag FE↔BE contract drift as flow drift and fix the anchor. This is the *living-doc*
   gate on the contract. `/review`'s Boundary axis remains the *pre-merge* gate — complementary,
   not duplicate.

   **FE unverified:** the module has `fe-homes` but this recheck did not read FE bodies → do not
   stamp `verified-fe`. Flag "FE unverified" so the gap can't hide behind a green timestamp (see
   `SKILL.md`'s Frontmatter section). Same rule for `verified-be`.

   Also cross-grep against other modules' `index.md`. Duplicate ownership is a boundary conflict —
   grill for the owner, demote the loser to a cross-link.

   **Engineer lens, if present:** re-run the arch sub-parts' grep-verified coupling counts and
   test-coverage columns. Both silently rot as code changes — a new caller, a deleted spec.
   Refresh the numbers. A coverage flip (❌→✅) may retire a candidate. A fan-in jump may reshape
   a seam.

   **Reader-roles lens, diff-scoped:** a changed file that is a lens surface — an external-format
   parser, a `config.get`/system-config/env read, a money write — → re-verify that lens's output
   (the contract table still matches the parser, the config-inventory row still holds, the
   idempotency note still holds). Do not re-run the full reader-roles pass on recheck.

2. **Rescan** for new candidate problems (see `SKILL.md`'s Detection section). Grill promotions.

3. **Reconcile status.** Any `open` or `proposed` problem now fixed in code → move to `## Solved`
   with its proposal back-link.

4. **Re-judge shape.** Do not skip this — it's where a flat doc that outgrew itself gets caught.
   Re-run the Deep-dive mode complexity bar (see `SKILL.md`) against the *current* code, reusing
   the drift-check reads (core line counts, subsystem count). Don't assume the last shape still
   fits.

   A flat doc that now clears the bar (god-object, more than one subsystem, coexisting systems) →
   flag it and offer the deep-dive split, naming the shape and the proposed parts. Don't silently
   restructure. Whenever the re-judged shape differs from the current one — including a
   code-shaped doc that should become domain-shaped per the Precedence rule — stop and ask the
   user which shape to use. Name the current shape, the diagnosed shape, and why, and let them
   choose. Never switch shape silently. A deep-dive that fell below the bar → note it may
   re-flatten.

   Landmarks unchanged is NOT evidence the shape is right — judge structure explicitly. Also
   re-confirm the spine (Build step 2): does the doc still narrate the module's central
   transformation, or has it drifted into a method-listing? A doc that only says *which* symbols
   exist, not *how* they work, fails the story bar even with zero landmark drift. Flag it and
   offer to deepen the logic-bearing parts — read bodies, not signatures.

## Rebuild — regenerate from code, keep the registry sacred

Only when the user explicitly asks (see `SKILL.md`'s Mode section). Recheck edits in place;
rebuild throws away `index.md` and its parts and regenerates them from source. That is
destructive — the vault is a git repo, but recovering a rebuilt module from git history is slower
than a direct restore. Guard it, in this exact order:

1. **Auto-backup first.** Copy the whole module directory to
   `modules/.bak/<slug>-<YYYY-MM-DD>/` before touching anything. This is the faster recovery
   path — git history is the fallback if the backup itself is ever lost.
2. **Confirm the blast radius — name what dies and what survives.** State it concretely and wait
   for a yes: *"Rebuild `shipments`: regenerates `index.md` plus 6 parts from code (backed up to
   `.bak/`); `problems.md` preserved — N problems, M candidates kept, no `P#` renumbered.
   Proceed?"* Never rebuild on an implied yes.
3. **`problems.md` is sacred — never regenerated.** Its `P#` IDs are permanent handles that
   `technical-proposal` back-links (`[[shipments#P3]]`). Regenerating the registry would
   renumber or drop IDs and silently rot every proposal link. Rebuild preserves the registry
   verbatim — it may re-verify evidence anchors and add new candidates or problems, but it never
   renumbers, reuses, or deletes a `P#`. Retiring an ID needs its own explicit confirmation: move
   it to `## Solved`, keep the number.
4. **Regenerate `index.md` and its parts** via Build (spine → shape → parts → landmarks, all
   `✅`-verified), then re-stamp frontmatter — `verified-fe`/`verified-be` — to current HEADs.
