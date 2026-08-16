# Boundary checks — contract drift between two systems

Playbook for the Boundary axis. Read it when a diff touches code that crosses a
boundary between independently-deployed systems.

## The failure mode

Two systems agree on a contract that neither of them enforces. One side changes;
the other still compiles, still passes its own tests, and breaks at runtime.

```ts
// consumer:
type EntitlementResponse = {
  data: { entitled: boolean };  // WRONG — the producer sends `enabled`
};
```

The type checker is satisfied on both sides, because neither side type-checks the
other. Keys, casing, nullability, wrapper shape, enum values and request payload
shapes are all common drift surfaces.

This applies wherever a contract spans a deployment boundary: a frontend and its
API, two services over HTTP or a queue, a client library and its server, a job
producer and its worker, a schema and everything reading it. The two sides ship
separately, so nothing fails at build time.

## Detection — find the boundary-touching hunks

**Do not filter by directory.** Boundary code is scattered, and conventions
differ by age of the code. Detect by content signals in the diff.

The general shape is: one side **declares or emits** a contract, the other
**consumes** it. Look for either.

Producer signals — code that defines what goes over the wire:

- Route or handler registration, and the file naming a framework uses for it
- Schema and validator definitions, and types derived from them
- Serialisation: whatever writes the response or message body
- Error-shape helpers and error middleware
- Message or event publication, and its payload construction

Consumer signals — code that depends on the shape:

- HTTP or RPC call sites, and generated client calls
- Data-fetching wrappers that name an endpoint
- Type or model declarations for a request, response, payload or DTO
- String-literal unions and enums mirroring the other side's values
- Error handlers assuming a specific error shape
- Message or event handlers and their payload destructuring

*Examples in a TypeScript/Express/Zod/TanStack Query stack, which is what this
was written against:* `router.get/post/...`, `*.controller.ts`, `z.object`,
`z.enum`, `z.infer<typeof …>`, `res.json(...)`, `res.status(4xx).json(...)` on
the producer side; `axios.<verb>`, `fetch(`, `useQuery`, `useMutation`,
`*Response`, `*Request`, `*Payload`, `*Dto` on the consumer side. These are
illustrations, not the definition — on an unfamiliar stack, read the surrounding
code and work out its equivalents before concluding there is no boundary here.

**Tests are a signal too.** A changed fixture or expected payload that disagrees
with a changed type or schema is drift, and it often surfaces there first —
someone updates the assertion to make the suite pass without touching the other
side of the contract.

A changed file with none of these signals is usually not boundary-relevant. Note
it and move on.

**Skip generated files.** Build output, lockfiles and generated clients or type
declarations carry exactly the consumer signals above, in volume, and none of it
is authored. Drift in a generated file is a symptom of drift in its source.

## Cross-checking — find the counterpart

A boundary bug is usually **one-sided**: the producer renamed a field, or the
consumer started reading one, and the other side is untouched and therefore not
in the diff. So having found one side, go looking for the other whether or not it
changed.

**Primary: address-based matching.** Extract the endpoint path, queue name, topic
or event name from the call site and search the counterpart system for it.
Normalise parameterised forms before searching — `/users/:id` and `/users/${id}`
are the same route.

**Fallback: name-based matching.** Search for the type name or a distinctive key.
Lower confidence and prone to false hits; say so when you use it.

**Check which revision of the counterpart you are reading.** A counterpart on the
wrong branch produces confident wrong verdicts, which is worse than not running
at all — it reports drift that does not exist, or misses drift that does. Before
comparing, establish that the counterpart is on the branch that pairs with this
change rather than on its default branch, and say which revision you compared
against. Its uncommitted changes count: if the other side is dirty, that working
tree is the contract, not its last commit.

A counterpart may also be the only side that changed — the producer's work landed
first and this diff is the consumer catching up, or the reverse. Read the
counterpart's recent commits before concluding the two sides disagree.

**Degrade honestly.** If the counterpart system is not readable from here — not
checked out, not in scope, a third-party API — report the shape this side
expects and where the counterpart would need checking. Do not guess, and do not
stay silent: "this changes a contract and I could not see the other side" is a
finding.

## What to compare

For each matched pair:

1. **Key names** — `entitled` vs `enabled`, `userId` vs `user_id`
2. **Casing convention** — mixed `camelCase`/`snake_case` across the boundary
3. **Required vs optional** — optional on one side, always sent on the other
4. **Nullability** — `null` vs absent vs a zero value
5. **Wrapper shape** — `{ data: … }` vs a bare object vs `{ result, meta }`
6. **Array vs single**
7. **Primitive type** — number vs string for ids, dates, decimals
8. **Enum drift** — one side missing a value the other emits
9. **Request or message body shape**, validated against the producer's schema
10. **Query and path parameters** — names and types on both sides
11. **Error shape** — the consumer's error handling against what the producer
    actually returns on failure

Where the producer has a schema, that schema is the contract. Where it does not,
trace the handler through to what it actually writes.

## Direction matters

Reviewing a **consumer** change: verify the shape it now expects against what the
producer sends.

Reviewing a **producer** change: the blast radius is every consumer, and they are
not in the diff. Report in two groups.

- **Typed consumers** (high confidence) — they declare a type for this contract
  or destructure specific keys. Silent bugs hide here; flag a disagreement as
  definite.
- **Untyped call sites** (lower confidence) — they use it without declaring a
  shape. Not necessarily broken, but worth listing for manual review.

## Severity

Two tiers only.

- **Definite mismatch** — verified by inspecting both sides. Include a proposed
  one-line fix as a diff snippet. Do not apply it.
- **Needs manual verification** — could not be verified: address not found,
  counterpart not readable, untyped consumer, ambiguous match. State exactly what
  a human needs to check and where.

## Output

```markdown
### Definite mismatches (N)

1. **<file:line>** — <short description>
   - consumer expects: `<shape>`
   - producer sends:   `<shape>` (at `<file:line>`)
   - Fix:
     ```diff
     - <old line>
     + <new line>
     ```

### Needs manual verification (N)

1. **<file:line>** — <why not verifiable> — check <what, where>
```

If both buckets are empty, say "No boundary issues found." No padding.
