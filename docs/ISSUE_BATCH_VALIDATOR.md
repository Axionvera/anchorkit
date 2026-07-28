# GrantFox Issue Batch Validator

`scripts/validate-issue-batch.mts` validates a GrantFox issue batch JSON file
against [ISSUE_STANDARD.md](./ISSUE_STANDARD.md) and `.github/LABELS.yml`
*before* any issues are created via `gh issue create` (see
[AUTOMATION_RUNBOOK.md](./AUTOMATION_RUNBOOK.md#batch-issue-creation)).

## Usage

```bash
pnpm validate:issues path/to/batch.json
```

The batch file must be a top-level JSON array of `{title, labels, body}`
objects, matching the format `AUTOMATION_RUNBOOK.md` uses for batch issue
creation.

Exits `0` and prints a success line if every entry passes. Exits `1` and
prints every violation, grouped by entry, if any entry fails.

## What it checks

1. **Required fields** — every entry must have a non-empty `title`, a
   non-empty `labels` array, and a non-empty `body`.
2. **Unsupported labels** — every label must exist in `.github/LABELS.yml`.
   This is the check `AUTOMATION_RUNBOOK.md`'s troubleshooting table already
   names as the most common batch failure ("Issues created without labels").
3. **Campaign label taxonomy** — for any entry carrying all three campaign
   labels (`GrantFox OSS`, `Maybe Rewarded`, `Official Campaign | FWC26`),
   checks it also has at least one scope label, at least one type label, and
   at most one difficulty label, per `ISSUE_STANDARD.md`'s labelling rules.
4. **Required sections** — campaign-labelled entries must include all eight
   `ISSUE_STANDARD.md` sections (Summary, Background, Proposed scope,
   Acceptance criteria, Tests required, Docs required, Security and Stellar
   correctness notes, Estimate), matched as markdown headings.
5. **Weak acceptance criteria** — flags checkbox lines under "Acceptance
   criteria" containing vague, unverifiable phrasing (e.g. "improve UX",
   "handle edge cases") that `ISSUE_STANDARD.md` explicitly calls out as
   non-compliant.

Non-campaign entries (missing one or more of the three campaign labels) skip
checks 3–5, since `ISSUE_STANDARD.md` only applies to GrantFox-ready issues.

## Examples

See `examples/issue-batches/valid-batch.json` and
`examples/issue-batches/invalid-batch.json`. The invalid example is modeled
on real label mistakes seen in practice (`monorepo`, `feature`,
`developer-experience` — none of which exist in `.github/LABELS.yml`).

## Tests

`scripts/validate-issue-batch.test.ts` covers: a fully compliant batch,
unsupported labels, missing required fields, missing standard sections, weak
acceptance criteria, and that non-campaign issues are exempt from the
section/criteria checks. Run via `pnpm test` (turbo runs it at the workspace
root) or `npx vitest run scripts/validate-issue-batch.test.ts` directly.
