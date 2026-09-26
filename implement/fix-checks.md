# Fix checks

Read this file every round of the review–fix loop, after the round's fixes exist
— whether you wrote them or `/review` applied one directly as a documented breach
— and before you commit them. Apply each rule whose condition a fix matches. Each
rule is a fix mistake a past loop shipped and a later round had to catch.

## 1. Search for the finding's condition, not its code

State the finding's shape as a sentence that names nothing in this file. Then
search for that shape in four places: the round's diff, the adjacent call sites
that handle the same failure mode, every reader of a value the fix changes, and
every document that restates a rule the fix changes. The last two can sit
outside the diff. Searching for the literal code again finds only exact repeats.

- A mirror-image `if`/`else` branch with the same shape, five lines from the one the finding named.
- A caller one layer up with the same too-broad catch the fix narrowed.
- A fast path and a fallback in the same function that both read the value the fix recomputed.
- A second instructions file that restates the boundary the fix corrected.

## 2. Before you gate or remove an effect, list every reason it exists

Trace every reader of what the effect writes, and everything that waits for it
to finish. A gate scoped to the one reason the finding named removes the effect
for every other reason too.

- A write that serves both rate-limit backoff and circuit-breaker health.
- A call removed from a batch to stop a duplicate request, when the batch also awaited that call before a dependent step ran.

## 3. A correctness fix's test must fail without the fix

`git stash` only the fix's own hunk, not the test. Run that one test file and
confirm it fails. Then `git stash pop` and confirm it passes. If the test still
passes with the fix reverted, strengthen the fixture or the assertion until it
fails. Skip this for a rename, a comment fix, or a change with no behaviour to
revert.

## 4. A rewritten test keeps what it tested

When a fix restructures a test file, read the new version against the old one.
Confirm every earlier action and assertion still appears. When a test asserts
that a call was not made, and that call sits in a branch with another effect,
also assert that the other effect still happens.

- Wrapping a story in a function dropped the click its assertion depended on, and the test passed with nothing to check.
- A "did not pause" assertion stayed green while the fix also swallowed the thrown retry delay.

## 5. Check a fix against its source, not its shape

For a Standards finding, compare the edit to the cited rule's exact text. Before
you write a fix's line in the review queue, read the diff line the commit
contains, not the commit message.

- Arrange and Assert markers added, when the rule requires Act as well.
- A test renamed to an outcome-when-condition form whose condition never happens, when the rule wants the condition that produces the outcome.
- A rename described in the commit message that the diff never applied.

## 6. A disproved example is not a disproved claim

When a finding shows that one example for a claim is wrong, check whether the
claim holds through another mechanism before you rewrite the claim as false.

- An overlap cited through a path that turned out unreachable, when the overlap was real through a different one.
