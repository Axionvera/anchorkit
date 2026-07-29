# Issue Approval Readiness Checklist

Use this checklist before asking reviewers or campaign evaluators to treat an issue as ready. A merged pull request is still subject to evaluation, payment-period review, and any campaign-specific acceptance rules.

## Contributor Checklist

- The implementation addresses every acceptance criterion in the issue, not only the title or the easiest visible symptom.
- The pull request body links the issue and explains the files, packages, examples, or docs that changed.
- Tests cover the changed behavior, including at least one negative or boundary case when the issue touches validation, security, transactions, balances, escrow state, or API contracts.
- Any skipped test is named in the PR with a short reason and the manual or static verification used instead.
- CI is passing, or every failing check is explained with evidence that the failure is unrelated to the branch.
- Documentation, examples, fixtures, and generated references are updated when behavior, commands, public APIs, or contributor workflow changes.
- Known limitations are stated plainly, especially for testnet-only flows, simulated dashboard behavior, incomplete integrations, or unsupported mainnet paths.
- No secret keys, bearer tokens, private endpoints, internal prompt/context, or personally identifying data are included in code, tests, docs, logs, or screenshots.

## Reviewer Checklist

- Compare the final diff against the issue scope and call out extra unrelated files before approval.
- Confirm the tests or static checks actually exercise the acceptance criteria rather than only importing the edited file.
- Verify docs links resolve from the README or relevant package docs when a new guide is added.
- Check whether the PR changes a public package boundary, CLI command, environment variable, or dashboard behavior that needs release notes.
- Re-read any security-sensitive path for unsafe logging, mainnet bypasses, missing authorization, transaction signing assumptions, or silent fallback behavior.
- Leave a clear note when an issue is merged but still awaiting campaign/payment evaluation.

## Ready For Evaluation Summary

A PR is ready to present for issue evaluation when it can answer these questions in one pass:

1. Which acceptance criteria are satisfied?
2. Which tests or checks prove them?
3. Which docs or examples changed?
4. Which limitations remain?
5. Are all CI failures either fixed or proven unrelated?
6. Is the work scoped to this issue only?

If any answer is missing, keep the issue in review instead of treating it as approval-ready.