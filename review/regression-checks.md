# Regression checks — behavior drift from a rebuilt implementation

Playbook for the Regression axis. Read it when a diff rebuilds or rewrites an existing feature —
old implementation deleted or heavily rewritten, replaced by new code covering the same feature.

## The failure mode

A rebuild changes *how* a feature is implemented. Along the way, it can quietly change *what it
does* too — three examples: a field that used to be editable becomes read-only, a value that
used to persist stops persisting, a filter that used to exist has nowhere to live in the new
shape. None of this shows up as a spec violation, because the spec describes the new feature,
not everything the old one happened to do. The code can pass Standards and Spec cleanly and
still ship a silent capability loss.

This is not the same question Spec asks. Spec checks the diff against the ticket. Regression
checks the diff against the old code's own prior behavior — the only source of truth for this
axis is what the deleted or rewritten code actually did, not what anyone wrote down about it.

## Detection — find the rebuilt paths

For every path in the diff — DELETED, MODIFIED, or ADDED — it's a candidate. Don't filter to only
DELETED files: a path can be rewritten in place (same file, most lines changed) just as easily as
replaced by a differently-named one.

A path renamed with only minor changes needs no special handling. Once a rename changes enough
content to matter, git's own similarity detection reports it as a plain delete+add instead of a
rename, so it already appears as a normal candidate above.

A changed path that's genuinely incremental — a small fix, an added field, a new optional
parameter — isn't a rebuild candidate; there's no old behavior being replaced, just extended.
Judge by substance (does most of the file's logic change, does an old implementation disappear),
not by line count alone.

## Reading old and new behavior

For each candidate path:

- **Old behavior**: the full file content at the merge-base, not just the `-` lines in the diff
  hunk. A heavily rewritten file's hunks are hard to reconstruct mentally into "what it used to
  do" — read the whole pre-image file instead.
- **New behavior**: the full file content at the PR head, same reasoning.

Read both in full before comparing. A diff hunk shows what changed; it doesn't show what a field,
button, or code path used to do in context — that requires the whole file.

## Cross-checking — the companion system

Many rebuilds are one half of a paired migration across two independently-deployed systems (a
frontend rebuild paired with a backend contract change). The counterpart's current contract often
lives only on an **unmerged companion PR's own branch** — not on the counterpart repo's `dev`/`main`
integration branch. This is the reverse of Boundary's usual case, where the counterpart's change is
already merged.

**Finding the companion:** look for a companion PR named in this PR's own body — a common
convention is a line like "companion PR: owner/repo#1234". If found, fetch and read that exact
branch. If the body names none but the diff still touches behavior that depends on a counterpart
system, ask the user for a PR reference or a branch name — never guess, never silently skip.

**Once found:** apply the same rule [boundary-checks.md](boundary-checks.md) already states —
establish that the branch you're reading is the one that pairs with this change, not the
counterpart's default branch. A dropped field that looks like a FE regression can be entirely
explained by the backend deriving it server-side instead; check before flagging it as lost.

## Verify before reporting

A claim only becomes a finding once it's grounded against the real code — never report a
speculative "this might be an issue, worth checking" as if it were settled. If a claim can't be
verified from here (the counterpart isn't readable, the behavior is ambiguous), say so explicitly
as a finding of its own, the same way Boundary degrades honestly when a counterpart is unreadable.

## What to compare

For each candidate path, old vs. new:

1. **Fields and controls** — removed, renamed, or changed from editable to read-only (or the
   reverse)
2. **Required vs. optional** — a field that gained or lost a requirement
3. **Defaults** — a value that used to be user-set now hardcoded, or the reverse
4. **Validation rules** — tightened, loosened, or moved to a different point in the flow
5. **What's sent on save** — compare against the actual mutation/request body, not just the form
6. **Display format** — a raw value vs. a formatted one, a column shown vs. hidden
7. **Filters, sorting, search** — a capability that existed and has nowhere to live in the new
   shape
8. **Persistence** — a value that used to survive a reload/reopen and no longer does, or the
   reverse
9. **Navigation and routing** — where an action lands the user afterward
10. **Permission gates** — who could do this before vs. now

## Severity

Two tiers only, same as Boundary.

- **Definite difference** — verified by reading both the old and new code. State what changed and
  where.
- **Needs manual verification** — could not be fully verified: a companion system wasn't readable,
  or the old behavior is ambiguous from the code alone. State exactly what a human needs to check.

## Output

```markdown
### Definite differences (N)

1. **<file:line>** — <short description>
   - old behavior: <what it did, at <old-file:line>>
   - new behavior: <what it does now, at <new-file:line>>

### Needs manual verification (N)

1. **<file:line>** — <why not verifiable> — check <what, where>
```

If both buckets are empty, say "No regression issues found." No padding.
