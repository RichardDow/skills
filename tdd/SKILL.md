---
name: tdd
description: Test-driven development with red-green-refactor loop. Use when user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development.
group: build-implement
---

# Test-Driven Development

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification - "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" - treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes - they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

## Workflow

### 1. Planning

When exploring the codebase, use the project's domain glossary so that test names and interface vocabulary match the project's language, and respect ADRs in the area you're touching.

Before writing any code:

- [ ] Confirm with user what interface changes are needed
- [ ] Confirm with user which behaviors to test (prioritize)
- [ ] Identify opportunities for [deep modules](deep-modules.md) (small interface, deep implementation)
- [ ] **A render/output decision with 3+ independent conditions is itself a seam, not an implementation detail of whatever calls it.** When what a component renders, executes, or returns depends on 3 or more independently-varying conditions (entity state × action state × retry/failure state is a real example that cost two review rounds when it wasn't caught here), write that decision as its own pure function — inputs the plain booleans/values the conditions turn on, output the decision — before the template or caller exists, not extracted after a reviewer names a bug living inside it. Test every condition combination that matters directly against the pure function; the caller then becomes thin wiring around an already-verified decision.
- [ ] **When a fixture can encode a state the real system provably never produces, build it through a smart-constructor helper that enforces the real invariant, not a raw object literal every test can hand-edit into an impossible shape.** For example, a `failedResult(reason)` helper that always sets `success: false` alongside the reason, rather than a literal a test could edit into `{ success: true, reason: '...' }` — a shape the real system can never emit but a raw literal doesn't stop anyone from writing.
- [ ] Design interfaces for [testability](interface-design.md)
- [ ] List the behaviors to test (not implementation steps)
- [ ] **When a plan supplies a numbered/enumerated Acceptance Criteria list, map every line to at least one test or story assertion as an explicit pass before considering the suite complete** — don't rely on organic coverage while writing tests one behavior at a time. A gap here surfaces late and is easy to miss twice: one ticket's own AC-evidence gap was found once by one review round, then found again — different AC lines — by a later round.
- [ ] Read the *whole* governing agent-instructions file — global and any repo-level `CLAUDE.md`/`AGENTS.md` covering the changed files — not just its Code clarity & comments section (parameter shapes included). Apply what it says as you write the GREEN code below, not only at a later pass: its own lessons file of patterns past review loops have actually caught, if it points to one, and whatever further standards it points to for the area you're about to touch — a `spec/`-style directory, per-path instructions files, a security- or correctness-specific guide. Where the repo states its own precedence rule (e.g. "the spec wins on conflict"), follow that rule. Don't wait for a review skill to catch a violation the repo's own written standard already told you about up front. Do this whether `/tdd` is running standalone or nested inside `/implement`; don't rely on the wrapping skill to have done it.
- [ ] **When a component reads one status object through two separate expressions for two different UI signals (a disabled attribute, a tooltip), assert both — even when the backend's own construction keeps the underlying fields in lockstep.** Each expression is a separate line the frontend could get wrong; testing one doesn't prove the other's wiring is correct. A `ready` boolean driving a button's `disabled` and a `missing`/`files` pair driving a tooltip through an unrelated helper function is a real example — a regression in the `isReady:` line alone would leave a tooltip-only assertion green.
- [ ] Determine where and how this repo wants a test like this named and placed — unit vs. integration filename pattern, a colocated test vs. a separate test package — from the repo's own test-conventions doc, not habit carried over from another repo.
- [ ] Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm with the user exactly which behaviors matter most. Focus testing effort on critical paths and complex logic, not every possible edge case.

**Unattended (called from `/implement --unattended` or a sandbox run):** skip every "confirm with user" and "get user approval" item above — nobody is here to answer, and a checklist item with no one to check it stalls the run to its cap. Decide the interface and the behaviors-to-test list yourself, with the most reasonable default, and record the choice plus the alternative you didn't take in the review queue.

### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

This is your tracer bullet - proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:

- [ ] One test at a time
- [ ] Only enough code to pass current test
- [ ] Don't anticipate future tests
- [ ] Keep tests focused on observable behavior

### 4. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

## Checklist Per Cycle

- [ ] Test describes behavior, not implementation
- [ ] Test uses public interface only
- [ ] Test would survive internal refactor
- [ ] Code is minimal for this test
- [ ] No speculative features added
- [ ] New/changed function signatures follow the governing agent-instructions file's parameter-shape rule — fix it now, this cycle isn't GREEN until it does
- [ ] This cycle's code doesn't repeat a pattern the lessons file (read during Planning) already flags — fix it now, don't wait for a later pass to catch it
- [ ] Code just written matches the repo's own standards read during Planning for the area touched — fix it now, don't leave a standards or security review to find what the repo already documented
- [ ] If this repo provides a cheap, local mechanical check whose own trigger condition this cycle's code meets (a hook-safety script for a new DB write path, a citation checker after moving code a doc cites, a lint rule) — run it now, this cycle isn't done until it's clean. Excludes an expensive whole-suite check (CRAP scoring, mutation testing) — those need a coverage run and stay owned by /implement's Quality passes, not this per-cycle gate.
- [ ] Every doc comment and test name describing this function's behavior still matches it after this cycle's change — not just the function body. A shared condition's own JSDoc, or a sibling test's name claiming parity with it, goes stale exactly as often as the code it describes and is easy to miss because nothing fails when it does.
- [ ] A test (or a written manual-verification procedure) asserting a signing/formatting/algorithmic result calls the real function that produces it, never a hand-rolled reimplementation of the same logic. A test that recomputes its own HMAC/hash/format string inline instead of calling the production function under test can pass identically whether that function is correct, broken, or reverted — and it can end up strictly subsumed by an adjacent assertion once the reimplementation is traced back to what it actually depends on.
- [ ] Ambient state a test sets up (an env var, a global flag) is set/restored in the describe block's own `beforeEach`/`afterEach`, not inline per test — a failed assertion mid-test skips any inline restore below it and leaks the state into later tests in the same file/worker.
- [ ] A test asserting an action did NOT happen (a call count staying at zero, a spy never called) is verified by breaking the fix under test and confirming the test fails for that exact reason — not just by reading green once. A test that never actually attempts the action reads green identically whether the fix works, is broken, or was never applied; the same discipline applies to a fix reported done (by a subagent, a prior round, or your own commit message) — confirm the behavior directly rather than trusting the report.
- [ ] When a test's assertion depends on a specific field value, pass that value explicitly at the call site, even when it happens to match a shared fixture's current default. A fixture default is free to change later; an implicit dependency on it silently stops proving what the test claims — this pattern recurred three times across one ticket's own review rounds before it stopped being reintroduced.
- [ ] When a value driving a test's expected outcome is derived from another input via a branching function (not a literal), test at least one case for each branch of that derivation, not just the primary path already covered elsewhere. A condition can be provably correct everywhere tested and still silently wrong for an untested derivation branch — confirmed by a mutation pass that found hardcoding a derived value in place of its real derivation left the suite green.
- [ ] When adding a new early-return/shortcut branch to an existing decision ("if X, short-circuit to result Y"), add a test where the new condition and a pre-existing condition are both true at once, not just each tested in isolation. The combination is exactly the case isolated tests of each condition don't reach — a real gap here survived a full mutation pass on two files across three review rounds, caught only by a fourth, deliberately independent round's own separate mutation run.
