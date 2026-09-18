---
name: plan-in-docs
description: Write a plan document into the project's vault, under plans/<YYYY-MM-DD>/<slug>.md, shaping it through a grill-me style interview first. Tracks lifecycle status (draft/active/done/abandoned). Use when the user says "/plan-in-docs", "write a plan", "plan this out", "save this as a plan", "update the plan", or wants to list or update existing plans — including a change to an already-written plan file, not only a new one.
group: planning-design
---

# plan-in-docs

One plan = one markdown file under `<vault>/plans/<creation-date>/`, grouped by day. See [Location](#location) for how `<vault>` is resolved.

Prose style: follow the project's documentation style guide where it has one.

## Location

- Target dir: `<vault>/plans/`, where `<vault>` is resolved below. `PLANS_DIR`
  env overrides all of it.
- **Exactly one vault per project, recorded in project memory/state — never
  discovered by searching a repo's own tree.** A user with more than one
  vault (e.g. a work vault and a separate personal vault) records which repo
  maps to which. Anchor to the repo actually being worked in, not the
  session's working directory — a session can write to a repo it never `cd`'d
  into, and once it does, the working directory stops being a reliable
  signal. Take the most recently **written or edited** file this conversation
  (a file merely read or inspected doesn't count), resolve its repo root with
  `git rev-parse --show-toplevel`, and look up which vault that repo maps to
  in project memory.
- **Never treat a `docs/plans/` folder found inside the repo itself as
  evidence of a vault.** A directory sitting there — untracked, stray, left
  by unrelated work — is not a signal; only the recorded mapping is. A vault
  genuinely living inside a repo (a standalone project with no separate
  vault of its own) is still a recorded mapping, not something discovered by
  walking the tree and hoping.
- If nothing has been written yet this session (a cold start), resolve the
  repo from the working directory instead, same rule.
- If the most recent writes span more than one repo, and those repos map to
  different vaults, ask which vault the plan is for rather than picking one.
- No mapping recorded for this repo yet: ask which vault it belongs to (or
  whether it needs a new one) rather than guessing or falling back to a
  walk-up.
- Subdir per creation date: `<vault>/plans/$(date +%F)/` — plans made the same day share a dir. Create it if missing.
- Filename: short kebab-case slug of the plan title, e.g. `<vault>/plans/2026-07-06/webhook-gc-fix.md`.
- A `<vault>/plans/PAST/` dir holds legacy pre-skill plans — leave them alone and exclude from list/resume.

## Write a plan (default)

1. **Grill first.** Read [grill-me](../grill-me/SKILL.md) and follow it. That file is the only copy of the interview method and of the rule for when an interview may end; do not work from a summary of it.
2. **Print the closing check.** The closing check is `grill-me`'s, and an implementation plan adds ten required rows to it: every file to touch is named; every new symbol is named, meaning file, function, type or config key; every edit site is located as `file:function` rather than as a region of the codebase; no step defers a decision to implementation time; every failure mode has a decided behaviour, or an explicit out-of-scope; no two `Decisions` entries state directly conflicting requirements — check every entry against every other, not just each one in isolation; the plan's own `Technical Requirements` pseudocode is checked line-by-line against its own `Acceptance Criteria` and `Background` motivating scenarios, specifically hunting for narrowing (a conditional that silently covers less than an AC promises) or omission (a `Background` paragraph cites a failure scenario as the plan's own motivation, but the pseudocode covers only its most obvious variant) — nothing else catches this gap until a review round does; the plan carries complete `Description`/`Background`/`Technical Requirements`/`Acceptance Criteria` sections matching its target issue type; every automated Acceptance Criteria line was individually confirmed by the user, not batch-derived from `Decisions`; and no step introduces a function, method, or supporting type that nothing reachable from a live entry point calls by the end of its own ticket (**No function ships ahead of a real caller**, below). Print the table with the evidence for each row and let the user attack a row before anything is written.

   An unmet row removes *your* authority to close the interview or write the file. It never removes the user's right to stop — asking "shall I write it now?" is not a way around the row. When the user stops with rows unmet, write the plan and carry every unmet row into `## Open questions`.

   Rules this file already carries are cited, never restated: **Pin the values, not just the knobs** for a config value, **Numbers trace to measurements** and **A claim that something cannot be measured has to prove itself** for a quantity, **Mark the steps an agent cannot run** for a host-only step, **No function ships ahead of a real caller** for a step that would add an uncalled symbol, **Technical Requirements (implementation plans)** for the files this work must not touch, **Estimate (implementation plans)** for the acceptance criteria list, and **Description (implementation plans)**/**Background (implementation plans)**/**Technical Requirements (implementation plans)**/**Acceptance Criteria (implementation plans)** together for the ticket content itself. The nine rows apply to implementation plans only, the same distinction the estimate step draws.
3. **Preview the handoff.** The plan file is the whole of what a zero-context agent receives — an unattended run gets the ticket, a branch name and this path, and nothing else. Before writing, list what the grilling settled that the draft will *not* carry: the conversation itself, options considered and rejected, constraints said out loud, the reason a step sits where it does. Ask which of them need to land. Do not re-render the draft — the user is about to read it.
4. **Write the file** once the tree is resolved:

```md
---
title: Fix webhook GC thrash
date: 2026-07-06
status: draft
estimate: 3.5h
estimate_split: agent 1h / review 2h / buffer 0.5h
slack: https://<workspace>.slack.com/archives/C0000000/p1234567890
jira: https://<org>.atlassian.net/browse/PROJ-1234
---

## Description

One plain sentence stating what changed, then labeled **Devs:**/**Internal:**/
**External:** impact lines for a shareholder reader.

## Background

Why/what's broken, the situation prompting the work, and any constraint that
shaped the approach.

## Decisions

Key decisions from the grilling, with the reasoning that settled each — each
entry led by a bold **Label:** naming what it decided.

## Technical Requirements

What was built, precisely — file, function, symbol names, no register
constraint — then a short "why this approach" line, then the target state and
the delta in ASCII, as drawn and approved during the grilling. Closes with a
bolded **Must not touch:** line naming the files this work must not touch.

## Acceptance Criteria

Every verifiable condition — automated ones first, manual ones after.

## Steps

- [ ] Ordered, checkable steps — each small enough to verify.

## Open questions

Rows the closing check left unmet, each marked blocking or non-blocking.

## Time

| ticket | forecast (agent/review/buffer) | agent | review | rework |
| --- | --- | --- | --- | --- |
| TBD | 1h / 0.5h / 0h | — | — | — |

## Risks

What could go wrong and the fallback — each entry led by a bold **Label:**
naming the risk.
```

5. Tell the user the file path. Sections are a default, not a straitjacket — drop or add as the plan demands.

- **Description (implementation plans).** One plain sentence stating what changed, then labeled **Devs:**/**Internal:**/**External:** impact lines for a shareholder reader (product, leadership) — no jargon, no symbol or function names. [create-jira-task](../create-jira-task/SKILL.md) owns the exact shape and register; this section *is* the ticket's Description field, extracted verbatim, not a separate copy of it. Before drafting the impact lines, always ask which audiences apply — never infer it. Ask: "Which audiences does this change affect — Devs, Internal, External, or None (no user-facing effect)? Pick any combination of the first three, or None alone." Suggest candidates from what the change actually does, but the decision is the user's, every time, even when it looks obvious. This section replaces the plan's old target-definition job (there is no separate `## Goal`) — the precise, symbol-level statement of what was built belongs in `Technical Requirements` instead, where register is unconstrained.
- **Decisions (implementation plans).** Key decisions from the grilling, with the reasoning that settled each. Each entry opens with a run-in head — a short bold label naming what it decided (`**Scope:**`, `**Naming:**`), the same `**Label:**` convention `Description`'s audience lines already use — followed by the reasoning on the same line. Plan-only; never sent to the ticket.
- **Risks (implementation plans).** What could go wrong and the fallback. Same run-in-head convention as `Decisions` — a short bold label per risk, prose following on the same line. Plan-only; never sent to the ticket.
- **Background (implementation plans).** Why/what's broken, the situation prompting the work, and any constraint that shaped the approach — in the same plain, jargon-free register as **Description** (no symbol or function names; see that section's bar, not restated here). A technical fact worth keeping — a precedent, a specific mechanism, a symbol-level citation — belongs in `Decisions` instead, which already carries reasoning-with-evidence and never reaches the ticket. This *is* the ticket's Background field, extracted verbatim.
- **Technical Requirements (implementation plans).** Three things, in order: the precise, symbol-level statement of what was built (Description's old `## Goal` job moved here, where no shareholder-register constraint applies); a short "why this approach" line, authored directly as part of writing this section — not mechanically distilled from `Decisions`, just the plain takeaway a reader who never sees `Decisions` still needs; and the target-state diagram, character-for-character in ASCII — see [show-me/FORMS.md](../show-me/FORMS.md) for which form fits and why the notation is fixed. "Character-for-character" governs the diagram's shape, not a license to keep a plan slug inside it: the two-tier reference rule (see **Cross-plan references in prose** below) still applies to every annotation and comment inside the diagram, and to the `Must not touch` closing line, exactly as it applies to prose elsewhere in this section — a sibling gets its ticket key or a plain phrase, never its plan slug, because a Jira reader can't resolve either kind of mention any differently just because it sits inside a box-drawing line. A same-length ticket key substitutes cleanly without breaking alignment; check alignment after substituting anything else. Add an **Open:** line only when a blocking `Open questions` entry or an accepted-but-unmitigated `Risks` entry genuinely exists — never one restating a mere caveat about confidence in the design. Closes with the files this work must not touch: an unattended run quietly widening scope is the failure that surfaces only at review, so that list is hard even though the diagram itself is indicative. A plan whose grilling settled no diagram carries the prose two parts without one — never draw a diagram to fill the heading. This section *is* the ticket's Technical Requirements field, extracted verbatim; `Decisions` stays plan-only and is never itself copied to the ticket.
- **Acceptance Criteria (implementation plans).** Every verifiable condition, automated ones first, then manual ones. An automated condition is a plain declarative sentence, distilled from `Decisions`' load-bearing testable claims once it's settled (e.g. "`delayMs = min(capMs, baseMs * 2^retryCount)`"). Never write the automated list straight to the file from your own read of `Decisions` without a check. Draft the full candidate list first, each line naming the `Decisions` claim it distills from, and present the whole list in one pass — each line its own accept/edit/reject choice — rather than one line per turn. Only the accepted lines (as accepted or as edited) go in the file. A manual one keeps starting "Manually confirm/verify...", authored by the **estimate** skill — see **Estimate (implementation plans)** below. This section *is* the ticket's Acceptance Criteria field, extracted verbatim — there is no separate `## Manual verification` heading; write the manual entries directly here.
- **Multi-ticket plans.** `Decisions`/`Steps`/`Open questions`/`Time`/`Risks` stay single and shared. `Description`/`Background`/`Technical Requirements`/`Acceptance Criteria` repeat once per ticket — each ticket's four sections genuinely differ, so grouping them isn't the duplication a single-ticket plan avoids. Group under a heading keyed by the ticket's own key or slug (`## PROJ-1234`, or a short slug before it's filed), never a generic "Ticket" label, with the four as `###` subheadings beneath it.
- **Open questions.** The section carries the closing-check rows the plan is written without, one entry each, naming the unmet row and what would settle it. Mark every entry blocking or non-blocking: a blocking entry is one an unattended run must not paper over with a default, and `implement` reads that marker. Omit the whole section when nothing is unmet — never write the heading to fill it.
- **Mark the steps an agent cannot run.** Cutting a ticket, pushing, opening a PR, logging time and editing the plan itself all need the host: an unattended run is egress-locked out of the tracker and the vault sits outside its writable set. Put them in their own `### Before launching` or `### After the run` block rather than in the agent's numbered steps, so nothing gets attempted, denied, and filed as an escalation that reads like a real finding.
- **Numbers trace to measurements.** Every quantity in `Decisions`, `Technical Requirements` or `Risks` derives from a row in the plan's evidence section, and names the row it came from. A derivation starting from a quantity the evidence section does not measure is not allowed — add the measurement, or drop the claim. Showing the working is not sufficient on its own: one plan justified "about seven pages a fire" from an unmeasured intake rate while its own table three sections earlier implied twelve and a half, nothing reconciled the two, and the wrong figure survived into the implementation and into the arithmetic that sized a cap.
- **A claim that something cannot be measured has to prove itself.** A `Risks` entry resting on an unknown number names the data that would settle it and confirms that data is absent. One plan wrote "the snapshot carries no job `created_at`" and left its only unsupported figure unsupported — every job row carried `created_at`, the lag was derivable from the snapshot the plan itself cites, and measuring it a day later showed the risk was empty. By then the unmeasured fear had reached a code review as a finding and a redesign as a requirement.
- **Pin the values, not just the knobs.** A step introducing a config key states the value and where it came from. Leaving the number to the implementing run puts an unreviewed figure on a bound that governs cost or correctness: one plan named `listPageCap` and `getCap` without values, the run picked 25 and 150 from a Risks paragraph, and both became review findings.
- **No function ships ahead of a real caller.** The governing agent-instructions file's "Working style" section owns this rule; read it there. At grill time, when a `Technical Requirements`/pseudocode/`Steps` symbol has no caller reachable from a live entry point within its own ticket, relocate it to the sibling ticket that introduces the real caller if one already exists in this plan, otherwise drop it from the plan entirely — never write a step whose only justification is "a later ticket will need this."
- **Relationship frontmatter.** `supersedes: <path>` when this plan replaces an earlier one whole, and the earlier one goes `abandoned`. `reworks: <path>` when it changes part of a design that otherwise stands — the predecessor remains the authority for everything the rework does not touch, so the new plan opens by naming what still holds and then carries only the deltas. Never reach for `supersedes:` on a partial change: an agent reads the newest file alone and silently loses the parts that were still correct.
- **Link frontmatter (flat labelled keys).** Capture reference URLs — Slack threads, tickets, PRs, dashboards — as **flat frontmatter keys named after the link** (`slack:`, `jira:`, `pr:`, `figma:`), one URL per key. Obsidian renders these as clean clickable properties; a `links:` list-of-objects renders as raw JSON and is broken, so avoid it. Use a `2` suffix if you genuinely need two of a kind (`pr: …`, `pr2: …`). Omit any key with no link. A link may still *also* appear inline in `Background`/see-also when the sentence is genuinely about that thing — frontmatter is the index, prose is the argument.
- **Cross-plan references in prose — two tiers, because plan paths never reach the tracker.** In `Decisions`/`Steps`/`Open questions`/`Risks` (plan-only, never sent to a ticket): when a plan mentions a sibling plan by name, at least one mention of it in the file is a markdown link to that file (`[slug](./slug.md)`, or `../<date>/slug.md` across date folders; add `#heading` when the mention points at one specific section, e.g. "see that ticket's own `Decisions`"). Later bare mentions of the same sibling in the same file don't each need their own link — one clickable path in per referenced ticket is the bar. In `Description`/`Background`/`Technical Requirements`/`Acceptance Criteria` (sent to the ticket verbatim): never link or name a sibling by its plan slug — a Jira reader can't resolve "webhook-06," and the plan file itself is private. Reference the sibling by its real ticket key once filed, written as a real markdown link to its issue URL (`[PROJ-1234](<site>/browse/PROJ-1234)`, using the resolved site from **Resolve the instance**) — a bare key becomes plain text once converted to ADF and will not reliably become a link in the tracker's own issue view, whatever a legacy rendered-HTML preview might show. Before it's filed, use a plain descriptive phrase instead ("the delivery task ticket"). A batch of sibling plans written together (a multi-ticket body of work) is exactly where the slug habit is easy to carry into the wrong tier, since most mentions read as informal shorthand ("see webhook-08") rather than as a citation.
6. **Graduated from an idea?** If the project keeps an ideas dir (e.g. `docs/ideas/`) and the plan grew out of one, cross-link both ways: plan's `Background` links the idea file, and the idea gets a `plan: <relative path>` frontmatter field plus a one-line note in its body pointing at the plan. Leave the idea `alive` — the plan's status now carries the lifecycle.
7. **Time.** Every implementation plan carries a `## Time` table — one row per ticket, so a single-ticket plan gets one row too. `jira:` becomes a list of URLs when a plan has several tickets. Estimate calibration reads a ticket's forecast from its row when the table exists (older plans without one keep calibrating from `estimate_split:`) but always reads actuals from that ticket's worklogs — the table is a working ledger, never the calibration input, so a transcription slip in it can't become evidence.

   ```md
   ## Time

   | ticket | forecast (agent/review/buffer) | agent | review | rework |
   | --- | --- | --- | --- | --- |
   | PROJ-10101 | 1h / 0.5h / 0h | 1.25h | 0.75h | — |
   | PROJ-10102 | 1h / 1h / 0h | — | — | — |
   ```

   The row is seeded with its forecast when the ticket is queued (multi-ticket) or when `estimate:`/`estimate_split:` is set (single-ticket) — it exists before any work starts, so a ticket an unattended run never reached still shows up here. Its `ticket` column starts as `TBD` (or a short slug identifying which ticket, in a multi-ticket plan) until the ticket is actually filed — [create-jira-task](../create-jira-task/SKILL.md) replaces the placeholder with the real key as its own last step, so the column is never left stale once a key exists. Actuals are updated, not appended, as the running total rather than a log: `/implement` writes the agent cell at the end of an attended run, and `/push-and-pr`'s worklog step writes the review cell (and re-confirms agent if it moved) when it logs the ticket's Jira worklog. Both halves are measured — the tracker remains the record of actuals, this is the working ledger that feeds it.

8. **Estimate (implementation plans).** The plan doc is the source of truth for the ticket's **Original Estimate** — set it here, before the work. Derive it with the [estimate](../estimate/SKILL.md) skill, which owns the rules: agents write the code, so the forecast splits into agent execution and human review, and the human half is derived from the manual entries in the plan's `## Acceptance Criteria` section — the automated entries sitting alongside them don't count toward it. Record the summed figure as an `estimate:` frontmatter key, an `Nh` string at 0.5h granularity, and the breakdown as `estimate_split: agent <N>h / review <N>h / buffer <N>h` beside it — estimate calibration reads that key rather than opening plan bodies, so keep its shape fixed. The reasoning behind each figure stays in the plan body. A multi-ticket plan omits the frontmatter key and gives each ticket its own figure in `Steps`. Whatever files the ticket reads the value once and writes it once; it never changes after filing. Skip for non-implementation plans.

## Lifecycle

`status`: `draft` (still being shaped) → `active` (being executed) → `done` | `abandoned`.

- Promote/demote by editing `status:` in the file. When abandoning, add a one-line `**Abandoned:** reason` under the frontmatter.
- Never delete plans — abandoned ones stay in place as the record.
- While a plan is `active`, tick its `Steps` checkboxes as work lands.

## Other verbs

- **list**: `grep -r "^status:" <plans-dir> --include="*.md"` grouped by status; show path + title. Resolve `<plans-dir>` the way Location does — a bare relative path fails from a repo subdirectory.
- **resume `<plan>`**: read the file, report remaining unchecked steps, continue from there.
- **update `<plan>`**: a change to an already-written plan follows the same strict process as writing one — grill first on the delta, print the closing check for whatever it touches, then edit the file. Never make a direct Edit/Write to a plan file outside this skill; "update the plan" always means running this process, not a quick patch.
