# Architecture-lens template (the core-8)

The per-stack architecture lens (`be-architecture/` + `fe-architecture/`) is a **mini-deep-dive folder**
— a door + one `NN-slug.md` sub-part per structural seam of that stack. Read this before writing one.
Reference implementation: `modules/purchase-orders/be-architecture/` + `fe-architecture/`.

**Golden rule:** this lens exists to make *refactoring targets* legible. A sub-part that only lists which
symbols exist (a "cluster index") is the shallow failure it must avoid. Depth comes from three things a
plain index omits: a **flow trace**, **grep-verified coupling**, and an **extraction seam with a target +
a reversible sequence**. Those cost real body-reads and call-site greps — pay it.

---

## Diagnose the scope-unit first (from code, not the mode parts)

The sub-parts are one-per-**seam of the stack**, diagnosed from source — **never** a copy of the mode
parts (that re-fragments the cross-cutting structures the lens exists to surface). The natural unit
differs:

| Stack | Typical unit | Tell |
|---|---|---|
| **BE** | god-service/store **method-clusters** | one fat service/store; clusters = read · write · a domain mechanism · integration |
| **FE (store-driven)** | the **Vuex/store family** | a god-store + nested modules; modal/wizard/board state cut across modes |
| **FE (query-based)** | **component / version families** | no domain store; vue-query + components; multiple coexisting view versions |

If a mode "part" is actually pure single-stack **mechanism** (a derivation engine) or a stack-only
**integration** with no user mode → it belongs *here*, not in the mode lens. Move it; slim the mode part
to its behavior contract.

---

## The door — `be-architecture/index.md` / `fe-architecture/index.md`

```markdown
← [module door](../index.md) · lens: **BE architecture** (engineer / refactoring view — pair with [fe-architecture](../fe-architecture/index.md))

# <Module> — BE architecture (door)

> **How the server side is built, re-aggregated by internal structure — not by mode. <one-line shape:
> e.g. "two stacks coexist mid-migration">. This lens makes extraction seams + stack debt visible; each
> part links *up* to the mode behaviours it must keep green.**

## The shape — <the dominant structural fact>
<ascii/mermaid diagram of the god-object(s) / stacks / families>

## Cluster map (the extraction seams → parts)
| # | Cluster | <legacy home> | <new home> | Refactor headline |
| [01](./01-slug.md) | **<seam>** | … | … | … |

## Preserves (regression contract)
Any refactor must keep the mode behaviours green: [[00-orientation]] · [[mode-part]] · …

## <God-objects / size + test-coverage table>
| Object | Lines | Tests | Note |
```

Light `lens:` header only — **no module frontmatter** on arch doors.

---

## Each sub-part — the core-8

Order is fixed; **do not number the headings** (the numbers are this template's scaffold, not the
reader's — numbered headings render as confusing gaps like `2 → 4 → 5`). Use the bare names below.

```markdown
← [be-arch door](./index.md) · cluster: **<Name>** · preserves: [[mode-part]] · [[mode-part]]

# BE cluster · <Name>

**<TL;DR — one bold sentence: what this cluster is + why it's a refactor target.>**

> **Preserves.** <the mode behaviours this must keep green — the acceptance tests for any refactor>.

## Flow + shape
<ascii or (optional) mermaid trace of what actually happens — query/include-tree, control flow,
state-shape for FE stores, SQL for query-builders. The thing a shallow index omits.>

## Inventory + coverage
| Symbol | Path:line | <substrate/role> | Test |
|--- (one row per symbol; the **Test** column ✅/❌ is grep-verified from spec files — it gates the
     refactor sequence: you can't safely delete untested code) ---|

## Coupling (grep-verified, excl. tests)
| Symbol | Callers (fan-in) | Where |
|--- (counts from `grep -rl <sym> src | grep -v test`; state whether the blast radius is small/wide
     and whether risk is behavioural or structural) ---|

## Extraction seam + target
<where you'd cut + the blast radius, then a target-interface sketch:>
```ts
// target: services/<Thing>Service.ts
method(args): ReturnType   // what it'd expose
```

## Safe refactor sequence (→ `/request-refactor-plan`)
1. <3–6 tiny, reversible, tests-green-between steps — characterise first when untested>
… (a sketch that HANDS OFF to /request-refactor-plan for the executable plan; do not write the full RFC here)

## Anti-goals / invariants
- **<load-bearing thing that looks like debt but must be preserved>** — so a refactorer doesn't "fix" it.
```

---

## Rules that keep it deep, not shallow

1. **`✅` = read the body / ran the grep.** Coverage column, coupling counts, and line anchors are all
   verified, never inferred. A "what it does" written from the symbol name is an index, not a fact.
2. **Coupling is grep-verified.** `grep -rl <symbol> src --include=… | grep -v test | wc -l` — the count
   *proves* god-object / dead / small-blast-radius instead of asserting it.
3. **Coverage gates the sequence.** Untested code → step 1 of the refactor sequence is "characterise in
   tests first". Surface the coverage asymmetry (e.g. "new stack tested, legacy stack not") — it's often
   the spine of the whole lens.
4. **The seam ends in a target + a capped sequence.** Stop at the sketch; `/request-refactor-plan` owns
   the executable plan. The arch doc documents *where to cut*, not the full cut.
5. **Terminology defined once, here.** Engineer jargon lives in this lens with a one-line definition at
   first use; strip it from the product/mode lens.
6. **`preserves:` links up only.** Sub-parts link up to mode behaviours; mode parts never link down.
</content>
