# Reader-roles pass

`SKILL.md`'s sections serve the *developer* reader: caller to behaviors, developer to landmarks,
refactorer to problems and architecture. Four more reader roles fall outside that set, and were
historically missed — see the gap register and decisions in `docs/IMPROVEMENT.md`.

Run this after Behaviors are drafted (Build step 4 in [MODES.md](MODES.md)). Walk each role
below. An output fires only when the module actually has that surface — never manufacture an
empty section.

## Integrator — contracts

(IMPROVEMENT #1, #3, #9, plus external contracts.)

- **External formats.** Does the module parse externally-produced data — a provider CSV, EDI, a
  webhook payload, an uploaded file — or emit a format an external party consumes? Pin the
  contract next to the behavior that consumes it: an `## External contract` section listing the
  exact column or field names the parser reads (✅ from parser code, kept inline per `STYLE.md`),
  plus what happens on format drift — a silent row-drop, or an error. File coverage cannot see
  these. The format lives outside the repo; the parser is the only witness.
- **DTO/payload shapes.** Per endpoint, list the domain-meaningful request/response fields — never
  an exhaustive schema dump, since that's what drifts. Keep it inline under the behavior, or in
  the landmarks table.
- **Error catalogue.** List the user-visible error strings each endpoint can return, with cause
  and fix, so support can map a reported message without grepping.
- **Business-constants registry.** One table of the module's magic numbers: value, where, and why
  if known — caps, batch sizes, debounces, thresholds.

## Security reviewer — risk surface

(IMPROVEMENT #2, #14, #10, #5, #18.)

- **Authz matrix.** One table: endpoint × user-type × role × gate-location. A missing gate
  becomes a visible hole, and a candidate.
- **External-egress inventory.** What leaves the boundary, to whom, containing what — third-party
  AI, integrations, outbound email with attachments.
- **Blast-radius map.** What breaks downstream when this module fails, per dependency direction.
  Seams say ownership; this says impact.
- **Async guarantees.** Every event-driven behavior states sync or async, its delivery guarantee,
  and its silent-failure mode.
- **Assumption register.** Hard-baked assumptions — country, currency, timezone, vendor names —
  and where each is baked in.

## Operator / on-call — operations part

(IMPROVEMENT #16, #17, #15, #19, #20.)

Add an `NN-operations.md` part when the module carries config knobs, manual procedures, or a
money/queue path someone answers for:

- **Config inventory** (knob, kind, key/location, value/shape) and an **honest runbook** —
  record the real state, even "no formal procedure — raw SQL."
- **Undo/recovery per write surface.** Every documented write gets its documented reverse, or an
  explicit "no undo exists" — which is a candidate on a money axis.
- **Multi-user collision semantics.** Two operators on the same entity: last-write-wins, clobber,
  or guarded?
- **Quota/cost envelope.** What the module spends or consumes — API rate limits, per-call cost
  order-of-magnitude — and why its caps are what they are.
- **Observability state.** What watches this path. "Nothing" is a finding, and a candidate.
- **Negative-space assertions.** State the verified absences — "zero crons, zero feature flags,
  zero queues" — so readers can tell "not documented" from "doesn't exist."
- **Incident/investigation cross-links.** Link the module's records in `incidents/` and
  `investigations/` from the door or the ops part.

## Newcomer — wayfinding

(IMPROVEMENT #4, #8, #13, #22, plus terms.)

- **Terms.** Domain terms the doc uses that this module's `glossary.md` lacks → add entries there:
  tight one-sentence definitions, avoid-aliases, domain terms only. Seed, never redefine an
  existing entry — see `SKILL.md`'s intro.
- **Navigation map.** Per FE-surface row, the route path plus the click path — e.g. "Admin
  dashboard → Customs card" — so a non-developer can find the screen.
- **ER diagram.** One small ASCII ER diagram per model family, when relationships span more than
  two models. Mermaid renders as dead text for a zero-context reader — see
  [show-me/FORMS.md](../show-me/FORMS.md).
- **Ownership.** An `owner:` frontmatter field on `index.md` — the person or team to ask, current
  state, not history.
- **Persona entry points.** One routing line per persona on the door — e.g. "support → ops part
  plus error catalogue; integrator → contract sections."

## Coverage manifest

(IMPROVEMENT #15.) Stamp which lenses were verified in `index.md` frontmatter — `lenses:
[contracts, risk, ops, wayfinding]` — listing only what this pass actually verified, so absence
is visible, not ambiguous.

## Recheck scope

Recheck runs this pass diff-scoped only (see [MODES.md](MODES.md)'s Recheck section): a changed
file that *is* a lens surface — an external-format parser, a DTO/schema file, a route/middleware
gate, a `config.get`/system-config/env read, a money write, an event handler — gets that lens's
output re-verified. The full pass runs only on build or rebuild. Parked (LATER) and declined (NO)
lenses are listed in `docs/IMPROVEMENT.md` — consult it before proposing a new lens.
