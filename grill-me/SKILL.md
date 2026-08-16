---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.

## Ending the session

Either side ends it. Keep asking until the design tree is exhausted, or until the user calls stop.

When you run out of questions, do not close on the spot. Say you have no further questions, name
anything still open, and wait for one reply. Close only on the user's confirmation.

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

Drop the **Open / deferred** heading when nothing is open. An early stop and an exhausted tree use
the same marker — the open list is what tells them apart.

The ledger is a record, not a re-litigation. One line per decision. Do not restate the reasoning.
Do not reopen a settled branch. Do not suggest a next skill. Do not write the ledger to a file —
`plan-in-docs` owns durable plan documents.

This section applies to standalone grilling only. A skill that borrows the interview method and
ends by producing a document — `plan-in-docs`, `technical-proposal`, `incident-report`,
`module-inventory`, `triage` — inherits the method and not the marker. Its document is its
finish signal.
