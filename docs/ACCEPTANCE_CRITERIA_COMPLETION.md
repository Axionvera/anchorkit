# Acceptance criteria completion table

> How to show a reviewer exactly which parts of an issue your PR delivers,
> with evidence, before payment day.

## Why this exists

Issues in this repo are written with an **Acceptance Criteria** checklist.
Contributors sometimes deliver only part of that checklist without making it
obvious which lines are done, which are partial, and which weren't
attempted. That makes review slower and makes it hard for a GrantFox
reviewer to confirm reward-readiness.

Every PR that closes or references an issue with an Acceptance Criteria
section must include a **completion table** in the PR description mapping
each criterion to its status, evidence, and tests.

## Table format

Copy this table into your PR description (under "Issue scope"), with one
row per acceptance criterion from the issue, in the same order they appear
in the issue body.

| Acceptance Criterion                  | Status             | Implementation Evidence                                                | Tests                                                      | Notes                                                                |
| ------------------------------------- | ------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| _Paste the exact criterion text here_ | ✅ / 🟡 / ❌ / N/A | File(s) + function/component name, or a link to the specific diff hunk | Test file + test name, or "manual — see Testing performed" | Anything a reviewer needs to know that doesn't fit the other columns |

### Columns

- **Acceptance Criterion** — copy the criterion text verbatim from the
  issue. Don't paraphrase; a reviewer should be able to match rows back to
  the issue without re-reading the whole thing.
- **Status** — use the legend below. One status per row.
- **Implementation Evidence** — point at the actual code, not a
  description of it. A file path plus function/component name is usually
  enough (`packages/anchor-utils/src/status.ts` → `mapStatusToHeadline`).
  Link to a specific commit or diff hunk if that's clearer than prose.
- **Tests** — name the test file and test case(s) that cover this
  criterion. If the criterion was verified manually instead of with an
  automated test (common for UI/visual criteria), say so explicitly and
  describe what you did under "Testing performed" in the PR body.
- **Notes** — trade-offs, deliberate scope cuts, follow-up issue links,
  anything a reviewer would otherwise have to ask about.

## Status legend

| Symbol      | Meaning                                                                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Done     | Fully implemented and tested per the criterion as written.                                                                                                                                                                          |
| 🟡 Partial  | Some but not all of the criterion is delivered. The Notes column must explain what's missing and why.                                                                                                                               |
| ❌ Not done | Attempted but not delivered, or explicitly out of scope for this PR. The Notes column must explain the reason.                                                                                                                      |
| N/A         | The criterion doesn't apply to this change (e.g. it was already satisfied before this PR, or the issue itself is ambiguous and this row covers a criterion that turned out to be a duplicate of another). Explain briefly in Notes. |

A PR does not need every row to be ✅ to be mergeable — partial delivery is
normal for `hard`-labelled issues. What matters is that **every row has an
honest status and every non-✅ row has a reason**, so a reviewer (and a
GrantFox campaign reviewer) can evaluate the PR without guessing.

## Handling incomplete criteria

If any row is 🟡 or ❌:

1. Say so plainly in the Notes column — don't leave a criterion looking
   done when it isn't.
2. If the remaining work is real and worth tracking, open a follow-up
   issue and link it in the Notes column and in the PR's "Risk /
   follow-ups" section.
3. If a criterion turned out to be wrong, redundant, or already satisfied
   elsewhere, say that too — reviewers would rather see "N/A, already
   covered by X" than a criterion silently dropped.

Silently omitting a criterion from the table is treated the same as
leaving an Acceptance Criteria checkbox unchecked with no explanation:
reviewers will ask for it before merge.

## Worked example

Issue acceptance criteria:

```
- [ ] Deposit metadata is validated with a Zod schema.
- [ ] Invalid callback URLs are rejected in production.
- [ ] Status transitions cannot skip states.
```

Completion table for a PR that implements the first two but leaves the
third for a follow-up:

| Acceptance Criterion                              | Status      | Implementation Evidence                                           | Tests                                                                                                            | Notes                                                                                                                                               |
| ------------------------------------------------- | ----------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deposit metadata is validated with a Zod schema.  | ✅ Done     | `packages/anchor-utils/src/schemas.ts` → `DepositMetadataSchema`  | `packages/anchor-utils/src/schemas.test.ts` → `"rejects missing asset_code"`, `"accepts valid deposit metadata"` |                                                                                                                                                     |
| Invalid callback URLs are rejected in production. | ✅ Done     | `packages/anchor-utils/src/validators.ts` → `validateCallbackUrl` | `packages/anchor-utils/src/validators.test.ts` → `"rejects http:// in prod"`                                     | localhost still allowed in dev, per existing `SECURITY_NOTES.md` guidance                                                                           |
| Status transitions cannot skip states.            | ❌ Not done | —                                                                 | —                                                                                                                | Requires a transition-DAG change touching `contracts/treasury-escrow`; scoped out to keep this PR reviewable. Tracked in #<follow-up-issue-number>. |

## Where this applies

- Referenced from `.github/PULL_REQUEST_TEMPLATE.md`, under "Issue scope."
- Linked from the root [`README.md`](../README.md) docs index.
- Applies to any PR that closes or references an issue containing an
  Acceptance Criteria section — not just `hard`-labelled or GrantFox
  issues, though it's most load-bearing there.
