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
file's real name, title-bar style. Above every method: a concise doc comment
in that file's own real language convention (`/** */` for TS/JS, `"""..."""`
for Python, `///` for Rust, …) — always, even when the signature looks
obvious, since the body below is about to be omitted. The body itself is
elided — no internal logic — except a `calls:` line naming another method
this same change adds or modifies; a call into anything existing or external
stays out, however central it is to what the method does. A module-level
constant or type declaration is exempt from elision — it has no body to
elide in the first place, so it's shown in full, always. Methods that share
a file and share a state — all new, or the same side of a before/after pair
(see below) — share one box instead of repeating the title bar. A class
wrapping the shown methods (`class Foo extends Bar { … }`) gets its own line
only when it carries a contract beyond its methods — a meaningful base
class, a shape, an invariant, or its own static fields that aren't methods.
A pure method-bag flattens under the file title with no class line at all:

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
its cardinality on the edge:

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
