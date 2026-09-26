# Drawing forms

The vocabulary for every visual drawn anywhere — in chat, at a grilling
checkpoint, or inside a document. `show-me`, `grill-me` and `plan-in-docs` cite
this file rather than restating it; it is the authority and they are not.

## Surface rule

| where the drawing lands                                    | notation                |
| ---------------------------------------------------------- | ----------------------- |
| terminal, chat, a grilling checkpoint                        | ASCII, fenced, 72 cols  |
| working document — plan, module doc, ticket, commit message  | ASCII, fenced, 72 cols  |
| share-out artifact — proposal, HTML page, slide              | mermaid                 |

A working document is read by agents with no session context and pasted into
surfaces that render nothing. ASCII survives that; mermaid arrives as dead text.

Always fence the block — unfenced lines reflow and the diagram collapses. A
drawing that will not fit 72 columns splits into two stacked diagrams; never
shrink the labels to make it fit.

Pad every box to one fixed inner width, so its right wall lands on one column on
every row. A wall that follows each row's longest label is the most common way a
drawing comes out wrong. A sequence's lanes hold one column each for the whole
drawing; a label too long for its gap breaks onto its own row inside that gap.

Generate every individual box — a Pseudocode box, a State/ER entity or state
box — with [scripts/box.py](scripts/box.py). Don't hand-type its border.
Pass it a JSON array of `{"title", "lines"}` on stdin. It pads every line to
one fixed width, builds the border to match, and fails loudly if a box
would misalign. Its own check replaces steps 1–3 below for that one box.

What it does not draw still needs the checklist run by hand: the
cardinality edge between two ER entities, a state machine's transition
arrows, a sequence's lanes, a tree's branches.

Column math by eye is unreliable — do not trust it. Run this checklist
before showing a connector between boxes or any non-box diagram (sequence,
call tree, file tree, component tree), and again every time you copy,
paste, or retype one into a new place — a verbatim copy still needs the
check, because "it's just a copy" is exactly how an unverified diagram gets
carried forward unchanged:

1. List every border character (`┌┐└┘│┬┴├┤▼►◄▲`) in the diagram with its row
   number and column index. Do this for the actual text, not from memory or
   by eye — script it (e.g. enumerate characters in each line) rather than
   counting columns by reading the drawing.
2. Group the listed positions by the box or connector line they belong to.
3. For each group, confirm every row in it shares the same column for its
   left wall, right wall, and corners. A vertical connector that spans
   several rows (an arrow's shaft, a merge line) is a group too, not only a
   box — its column must match on every row it appears on, including the
   corner it terminates into.
4. Check for a blank row inside a connector's span — a row where that
   column should carry `│` but has a space instead. That is a broken line,
   not a stylistic gap, even when the rows above and below it are correctly
   aligned.
5. Fix any column that disagrees or any blank mid-connector row, then redo
   steps 1–4 on the corrected diagram. Repeat until nothing disagrees.

A drawing that skips this checklist is not done — that includes a diagram
you are only relaying (a plan's diagram going into a ticket, a ticket's
diagram going into a report), not only one you are drawing for the first
time.

A drawing that was approved in a terminal goes into a working document
character-for-character. Re-authoring it in another notation makes it a new
drawing that nobody signed off. The one deliberate exception is a share-out
document, where presentation outranks the transcript.

## Pick the form

Draw one **target state** and one **delta**. A single diff block often carries
both, and then it is one block, not two.

| what the change touches            | target state    | delta                |
| ---------------------------------- | --------------- | -------------------- |
| new or moved files, a refactor     | file tree       | tree diff            |
| a new call on an existing path     | call tree       | call-tree diff       |
| UI structure                       | component tree  | component-tree diff  |
| a path crossing 3+ components      | sequence        | today / tomorrow     |
| data model or state machine        | state or ER     | before / after block |
| logic inside one unit              | pseudocode      | pseudocode diff      |

A change can touch more than one row — draw one target-state+delta pair per
row that actually applies, not only the first match. A change adding a
table, crossing three services, and introducing new methods draws a
State-or-ER diagram, a sequence, and pseudocode, not a single pick between
them.

A section assembled from 2+ distinct forms this way gets a `###` sub-heading
per form, using that form's own name from this file exactly (`File tree`,
`Sequence`, `Pseudocode`, …), so a truncated read still lands on the right
block. A section settling only one form stays unheaded — the heading earns
its place by telling blocks apart, not by habit.

Use a diff when the surrounding shape already exists and the point is what
changes. Show the whole block when most of it is new, when omitted context would
hide ownership or order, or when a copyable target shape is the deliverable.

Some changes have no shape — a flag flip, a copy change, a dependency bump.
Draw nothing. A drawing produced to satisfy a rule teaches the reader to skim
the ones that matter.

Keep only the calls, files, props, states and boundaries the current question
needs.

## The forms

**Pseudocode** — logic or an algorithm. Two cases:

A freestanding sketch, not yet tied to any file, shows its full logic:

```text
on(save)
  if content is unchanged
    return cached result
  write new content
  return fresh result
```

A method belonging to a file this plan adds or changes is boxed under that
file's real name, title-bar style.

Above every method, add a concise doc comment in that file's own real
language convention (`/** */` for TS/JS, `"""..."""` for Python, `///` for
Rust, …). Add it always, even when the signature looks obvious — the body
below is about to be omitted.

The body itself is elided — no internal logic. The one exception is a
`calls:` line naming another method this same change adds or modifies. A
call into anything existing or external stays out, however central it is
to what the method does.

A module-level constant or type declaration is exempt from elision. It has
no body to elide in the first place, so it's shown in full, always.

Methods that share a file and share a state — all new, or the same side of
a before/after pair (see below) — share one box instead of repeating the
title bar.

A class wrapping the shown methods (`class Foo extends Bar { … }`) gets its
own line only when it carries a contract beyond its methods — a meaningful
base class, a shape, an invariant, or its own static fields that aren't
methods. A pure method-bag flattens under the file title with no class
line at all.
Generate the box itself with [scripts/box.py](scripts/box.py) — see its
docstring for the input format:

```text
┌─ rate-limiter.dao.ts ─────────────┐
│ /** Acquires a lease for key. */  │
│ async tryAcquire(key, config)     │
│                                   │
│ /** Pauses a key until a time. */ │
│ async pause(key, until)           │
└───────────────────────────────────┘
```

`SafeHttpError` earns its wrapper: the class itself is the contract (what
it carries, what it extends), not just a home for its constructor:

```text
┌─ safe-http-client.ts ────────────────┐
│ /** Error thrown when no response    │
│  *  ever arrives. */                 │
│ class SafeHttpError extends Error {  │
│   constructor(code, message, cause?) │
│ }                                    │
└──────────────────────────────────────┘
```

A method whose input signature, return type, semantics, or logic actually
changes gets two boxes — `before`/`after` — under the same before/after rule
the delta shapes use elsewhere in this file, each box following the same
doc-comment-and-elision rule on its own:

```text
┌─ task-request.dao.ts ─ before ───────┐
│ /** Marks a task retryable. */       │
│ async retry(task, executionDuration) │
└──────────────────────────────────────┘
┌─ task-request.dao.ts ─ after ────────┐
│ /** Marks a task retryable after a   │
│  *  computed delay. */               │
│ async retry(task, executionDuration, │
│             delayMs)                 │
└──────────────────────────────────────┘
```

**Call tree** — runtime control flow:

```text
submitForm
  createSession
    persistPrompt
    launchAgent
  navigateToSession
```

**Component tree** — UI structure, with the state and module boundaries that
matter:

```tsx
<SessionPage> (apps/example/src/routes/session.tsx)
  useSessionEvents()
  <SessionToolbar>
    <RunSkillButton> (packages/ui)
```

**File tree** — file responsibility or the span of a refactor:

```text
src/
├── commands/       # parses user actions
├── sessions/       # owns session state
└── transport/      # sends API requests
```

**Sequence** — a path across components. In ASCII, one lane per participant and
one arrow per step:

```text
User          UI            Daemon         Store
 │ command     │              │              │
 ├────────────►│ expanded     │              │
 │             ├─────────────►│ read state   │
 │             │              ├─────────────►│
 │             │   stream     │◄─────────────┤
 │             │◄─────────────┤              │
```

Mermaid `sequenceDiagram` is the same form on a share-out surface.

**State or ER** — a data model or a machine, drawn as boxes and labelled edges.
An entity carries its name in a title row, its fields under the separator, and
its cardinality on the edge. Generate each entity's or state's own box with
[scripts/box.py](scripts/box.py) — pad a field's name and its PK/FK marker to
line up yourself before passing the row, since the script only guarantees the
outer wall. The cardinality edge or transition arrow connecting two boxes is
placed and checked by hand, following the checklist above:

```text
┌──────────────────┐        ┌──────────────────┐
│ Session          │        │ Prompt           │
├──────────────────┤   1  * ├──────────────────┤
│ id            PK │────────│ id            PK │
│ userId        FK │        │ sessionId     FK │
│ createdAt        │        │ body             │
└──────────────────┘        └──────────────────┘
```

A machine puts one state per box and the transition on its arrow:

```text
┌───────────┐  deliver   ┌───────────┐
│ PENDING   │───────────►│ SENT      │
└───────────┘            └───────────┘
      │ fail
      ▼
┌───────────┐
│ FAILED    │
└───────────┘
```

Mermaid `erDiagram` on a share-out surface.

## Delta shapes

Match the diff to the form it modifies.

Component change:

```diff
 <SessionPage>
   useSessionEvents()
   <SessionToolbar>
+    <RunSkillButton />
   <SessionTimeline>
+    <SkillResultCard />
```

File layout change:

```diff
 src/
 ├── commands/
+│   └── show-me.ts       # expands the slash command
 ├── sessions/
-└── transport.ts
+└── transport/
+    ├── client.ts
+    └── stream.ts
```

Call-tree change:

```diff
 submitForm
   createSession
     persistPrompt
+    expandSkillMention
     launchAgent
   navigateToSession
+    subscribeToEvents
```

Control-flow change:

```diff
 on(save)
-  write content
+  if content is unchanged
+    return cached result
+  write new content
+  invalidate cache
```

Today / tomorrow, for a path that crosses services — two stacked blocks under
the headings `today` and `tomorrow`, same participants in the same order, so the
difference is the only thing that moves.
