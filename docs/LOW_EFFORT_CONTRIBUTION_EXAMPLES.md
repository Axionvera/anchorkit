# Low-Effort Contribution Examples

This guide shows contribution patterns that can be merged yet still fall short of issue evaluation expectations. Use it with the acceptance criteria audit template when preparing a GrantFox or campaign-labeled PR.

## Superficial Documentation Change

Insufficient example:

- Adds one sentence to the README without linking the issue, naming changed behavior, or explaining how the doc helps users.
- Leaves stale examples, broken links, or package-specific docs unchanged.

Improved alternative:

- Updates the relevant README and package guide together.
- Links the new or changed guide from the docs index.
- Names the exact workflow, command, API, or limitation the issue requested.
- Adds a short verification note proving links and headings resolve.

## Partial Implementation

Insufficient example:

- Implements the easiest visible branch of a feature but leaves required package exports, dashboard states, examples, or error handling untouched.
- Claims the issue is complete without mapping each acceptance criterion to evidence.

Improved alternative:

- Lists every acceptance criterion and marks incomplete items honestly.
- Keeps the diff scoped to the issue while covering all required paths.
- Adds follow-up notes only for work that is explicitly out of scope or blocked by a maintainer decision.

## Missing-Test Submission

Insufficient example:

- Changes validation, transaction readiness, escrow state, balances, or API contracts without a unit, fixture, integration, or static regression test.
- Says tests were skipped without explaining the risk.

Improved alternative:

- Adds focused tests for the changed behavior and at least one negative or boundary case.
- Uses fixtures or static checks when runtime execution is unavailable.
- Explains any test gap in the PR body and names the safest manual/static verification performed.

## Failing-CI Submission

Insufficient example:

- Leaves CI red and asks reviewers to infer it is unrelated.
- Fixes unrelated files to make the branch look more substantial.

Improved alternative:

- Fixes branch-caused failures before requesting review.
- If a failure is repository-wide, links the failing log and explains why the changed files cannot cause it.
- Avoids unrelated refactors, formatting churn, dependency bumps, or generated output unless the issue requires them.

## Unsafe Or Unverifiable Work

Insufficient example:

- Includes screenshots, logs, tokens, wallet secrets, personal data, internal prompts, or private endpoints as proof.
- Requires reviewers to trust an unshared local environment.

Improved alternative:

- Uses public code, tests, docs, fixtures, and CI-visible evidence.
- Redacts sensitive values and keeps private context out of the repository.
- Documents environment assumptions without exposing credentials.