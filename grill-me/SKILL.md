---
name: grill-me
description: Interview the user relentlessly about a plan or design until every branch is resolved or explicitly deferred. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
group: planning-design
---

Interview me relentlessly about every aspect of this plan until every branch is resolved or explicitly deferred. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer with a confidence score.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead. Skip
questions the conversation already answers.

## Ground external claims before interrogating them

A design under grill often carries claims from somewhere else — a linked review, a
bot's comment, a spec, a teammate's summary. Before turning one into a question,
verify it against its real source rather than taking the claim at face value: read
the actual file, function, or record the claim is about, not just the report
describing it.

Label what the read found. **GROUNDED** — confirmed or corrected by an actual read,
cited to what settled it. **UNVERIFIED** — still resting on the source's own
say-so. Score and question both the same way, but never let an unverified claim
read as settled fact in a recommendation — say plainly it hasn't been checked, and
check it before it becomes load-bearing for a decision.

A claim that turns out wrong on verification is itself a branch: interrogate the
corrected version, not the original.

## Score every recommendation

A recommended answer carries a confidence score — a rough percentage, not false
precision — every time, not only when asked. Score every option still live at that
question, not only the one recommended: a low score on the runner-up is part of the
same claim as a high score on the pick.

**The scores at one question are a distribution, not independent ratings — they sum
to 100.** They answer one question, "which of these is right," so a point added to
one option is a point taken from another. A set of options each scored on its own
merits without that constraint is a different, easier claim than the skill asks for.

State what holds the score down. A grounded read of the actual code or an existing
precedent in the design counts for more than an untested architectural judgment
call — say which one the score rests on, so a low score reads as "unverified" and
not as false modesty.

## Draw the shape as it changes

An interview builds understanding that evaporates when the session ends. When an
answer changes what files exist, what calls what, what crosses a boundary, or what
a piece of state does, redraw the shape and show it before asking the next
question. Draw ASCII — the terminal renders nothing else — picking the form from
[show-me/FORMS.md](../show-me/FORMS.md).

The trigger is the answer, not a question count. An interview that settles no
shape draws nothing, and a branch that moves nothing gets no redraw. Draw on
request at any point.

A skill that borrows this method and ends by producing a document carries the
approved drawing into that document character-for-character. The drawing is the
reader's transcript of what was agreed, not a diagram authored afterwards to fill
a section — which is why it is drawn here, while you can still be corrected, and
not later.

## Probe a reused system for side effects beyond its literal function

When a design routes a new caller through an existing pipeline, module, or shared
state (a task queue, an event bus, a class instance also used elsewhere), ask
whether that pipeline does anything beyond the literal function the design is
reusing it for — health/circuit-breaker state, metrics, a notification a
downstream system fires. A pipeline built for one kind of caller can carry an
assumption (every invocation is a real one) that a new, synthetic caller quietly
violates. Ask this as its own question, scored like any other, rather than folding
it into "does the reuse work" — reuse working and reuse being safe are different
claims.

## Track the unresolved branches

Keep a written list of the branches not yet settled. Each answer strikes one entry
off it and adds any branches that answer opened — an interview discovers its own
tree as it goes, so the list grows before it shrinks.

Put a one-line count above every question, after any drawing:
`Unresolved: 3 (2 deferred)`. Print the full list when branches are added, when the
user asks, and at the closing check. An addition means the interview just got
longer, which is the event worth showing; striking an entry is expected and needs
no announcement.

A branch the user defers leaves the live count and joins the deferred one. It stays
visible so they can pull it back, and it reaches the close ledger's **Open /
deferred** list rather than disappearing. A deferral that stayed in the live count
would stop the count ever reaching zero.

An entry restates the open decision. Never point at a question number: the list is
read after the message that raised the question has scrolled away, so "the question
12 fork" resolves to nothing at the moment it is needed.

## Ending the session

Either side ends it, but not on the same terms. The user may end it whenever they
like. You may end it only when the closing check passes.

**The closing check.** Running out of questions is a feeling, not a test, so it does
not qualify you to close. Before any claim that the design is complete — including
when the user asks whether it is — re-derive the unresolved set from the whole
transcript by asking what a zero-context agent would still have to guess. Then
confirm every file and symbol the design names was actually read during the
interview, and read the ones that were not rather than asking the user about them.

Report how many branches the pass found against the previous pass, so a design that
is growing rather than converging shows as a number. Print only the unmet rows when
rows are unmet. When every row holds, print the full table with the evidence for
each row — which file, which read, which decision settled it — so the user can
attack a row before anything is written.

A skill that borrows this method may add its own required rows. A row is unmet
exactly as a branch is unresolved; there is no second gate.

There is no cap on how many times the check may find more. The user's stop is the
only escape, and on a stop the check still runs so the record is accurate, but it
does not block.

Once the check passes, say you have no further questions, name anything still open,
and wait for one reply. Close only on the user's confirmation.

Close with exactly this shape:

````
---
## Grilling complete

**Resolved**
- <one line per settled decision>

**Open / deferred**
- <one line per branch the user declined or left unresolved>
---
````

Drop the **Open / deferred** heading when nothing is open. An early stop and a passed closing check
use the same marker — the open list is what tells them apart.

The ledger is a record, not a re-litigation. One line per decision. Do not restate the reasoning.
Do not reopen a settled branch. Do not suggest a next skill. Do not write the ledger to a file —
`plan-in-docs` owns durable plan documents.

This section applies to standalone grilling only. A skill that reads this file and ends by
producing a document — `plan-in-docs`, `technical-proposal`, `grill-with-docs` — inherits the
method and not the marker. Its document is its finish signal. A skill that never opens this file
inherits nothing from it and is not listed here.
