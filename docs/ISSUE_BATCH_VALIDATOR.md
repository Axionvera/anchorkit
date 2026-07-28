# GrantFox Issue Batch Validator

`scripts/validate-issue-batch.mts` validates a proposed issue-batch JSON file before any GitHub issues are created.

The validator checks batches against:

- `.github/LABELS.yml`;
- [`ISSUE_STANDARD.md`](./ISSUE_STANDARD.md);
- required GrantFox campaign labels;
- required issue-body sections;
- acceptance-criteria quality rules.

It is intended to be used before the issue-creation commands documented in [`AUTOMATION_RUNBOOK.md`](./AUTOMATION_RUNBOOK.md).

## Batch file format

A batch file must contain a JSON array.

Each entry must contain:

- `title`: non-empty issue title;
- `labels`: non-empty array of exact GitHub label names;
- `body`: complete Markdown issue body.

Example:

```json
[
  {
    "title": "Add account diagnostic retry policy",
    "labels": [
      "GrantFox OSS",
      "Maybe Rewarded",
      "Official Campaign | FWC26",
      "stellar",
      "enhancement",
      "expert"
    ],
    "body": "## Summary\nDocument and implement account diagnostic retry behaviour.\n\n## Background\nCurrent retry expectations are unclear.\n\n## Proposed scope\nAdd bounded retry rules and tests.\n\n## Acceptance criteria\n- [ ] Retry limits are documented.\n- [ ] Retry behaviour is covered by tests.\n\n## Tests required\nAdd unit tests for retry limits.\n\n## Docs required\nUpdate account diagnostic documentation.\n\n## Security and Stellar correctness notes\nRetries must not duplicate transaction submission.\n\n## Estimate\nMedium."
  }
]
```

Reference files are available at:

```text
examples/issue-batches/valid-batch.json
examples/issue-batches/invalid-batch.json
```

## Validate one batch

Run from the repository root:

```bash
pnpm validate:issues examples/issue-batches/valid-batch.json
```

To validate another batch:

```bash
pnpm validate:issues path/to/batch.json
```

The command exits with:

- code `0` when the batch is valid;
- code `1` when violations are found.

Validation does not create, edit, or delete GitHub issues.

## Validate individual issue files

AnchorKit also contains `scripts/validate-issues.mts`, which validates the older individual issue-file format under `issues/`.

Run:

```bash
pnpm validate:issue-files
```

This command is separate from the batch validator.

The individual format uses fields such as:

- `title`;
- `description`;
- `labels`;
- `complexity`;
- `acceptanceCriteria`.

Do not pass a batch file to `validate:issue-files`, and do not place batch-format arrays inside `issues/`.

## What the batch validator checks

### Required fields

Each entry must have:

```text
title
labels
body
```

### Known labels

Every label must exist in:

```text
.github/LABELS.yml
```

Label comparison is exact and case-sensitive.

### Campaign label rules

An issue is treated as a GrantFox campaign issue when it contains all three campaign labels:

```text
GrantFox OSS
Maybe Rewarded
Official Campaign | FWC26
```

Campaign issues must also have:

- at least one supported scope label;
- at least one supported type label;
- no more than one difficulty label.

Supported scope labels currently include:

```text
stellar
soroban
anchor
sep
wallet
payments
escrow
```

Supported type labels currently include:

```text
security
test
documentation
bug
enhancement
```

Difficulty labels are:

```text
good first issue
expert
```

### Required body sections

GrantFox campaign issues must contain:

```text
Summary
Background
Proposed scope
Acceptance criteria
Tests required
Docs required
Security and Stellar correctness notes
Estimate
```

Heading levels from `#` through `####` are accepted.

### Acceptance criteria

The acceptance-criteria section must contain checkbox items:

```markdown
- [ ] A specific, verifiable result
```

The validator rejects vague phrases such as:

```text
make it better
improve UX
works correctly
handle edge cases
should work well
```

Acceptance criteria should identify observable outputs, tests, documentation, or behaviour.

## Dry-run workflow

Before creating issues:

```bash
pnpm validate:issues path/to/batch.json
```

Then preview the planned issues:

```bash
jq -r '.[] | "Would create: \(.title) [\(.labels | join(", "))]"' path/to/batch.json
```

Only continue to `gh issue create` after both checks are satisfactory.

## Common failures

### Unsupported label

Example:

```text
Unsupported label "devops" — not defined in .github/LABELS.yml.
```

Resolution:

1. confirm the intended label name;
2. check `.github/LABELS.yml`;
3. correct the batch entry; or
4. add and synchronize the label through the maintainer label process before creating issues.

### Missing campaign section

Example:

```text
Campaign issue is missing the required "Tests required" section.
```

Resolution:

Add the missing Markdown section to the issue body.

### Weak acceptance criterion

Example:

```text
Weak, unverifiable acceptance criterion
```

Resolution:

Replace broad wording with a measurable result.

For example:

```markdown
- [ ] Unit tests cover failed and successful callback validation.
```

### Invalid JSON

Validate the JSON syntax:

```bash
jq empty path/to/batch.json
```

Then rerun:

```bash
pnpm validate:issues path/to/batch.json
```

## Safety rules

- Validate before creating any issue batch.
- Never store GitHub tokens in batch JSON.
- Never include private vulnerability details in a public issue batch.
- Never rerun a partially completed batch without checking which issues already exist.
- Keep the original batch file unchanged after creation so it can serve as the recovery record.

## Related documentation

- [Automation Runbook](./AUTOMATION_RUNBOOK.md)
- [Issue Standard](./ISSUE_STANDARD.md)
- [Issue Writing Guide](./ISSUE_WRITING_GUIDE.md)
- [GrantFox Workflow](./GRANTFOX_WORKFLOW.md)
- [Maintainer Guide](./MAINTAINER_GUIDE.md)
