# Contributor Self-Review Template

Use this template before marking an AnchorKit pull request ready for maintainer review. It helps contributors prove that the issue scope, tests, CI, documentation, examples, and acceptance criteria have been reviewed objectively.

Copy the checklist into the PR description or a review comment for non-trivial GrantFox / Maybe Rewarded issues.

## Self-Review Summary

| Area | Evidence | Status |
| ---- | -------- | ------ |
| Original issue | Link the issue and confirm the PR uses `Closes #NNN`. | `Ready` / `Needs work` |
| Affected packages/apps | List each touched workspace, docs path, contract, script, example, or config file group. | `Ready` / `Needs work` |
| Acceptance criteria | Link or paste the completion table showing every criterion and its status. | `Ready` / `Needs work` |
| Implementation completeness | Explain why the diff solves the requested behavior instead of only touching adjacent copy or scaffolding. | `Ready` / `Needs work` |
| Tests added or updated | List test files, fixtures, manual cases, screenshots, or no-test justification. | `Ready` / `Needs work` |
| Commands run | List exact commands and results, or explain why runtime tooling was not required. | `Ready` / `Needs work` |
| CI status | State `passing`, `pending`, `failing-fixed`, `failing-unrelated`, or `skipped` with evidence. | `Ready` / `Needs work` |
| Docs and examples | List docs/examples updated or explain why no user-facing docs changed. | `Ready` / `Needs work` |
| Security and safety | Confirm secret handling, mainnet-safety wording, callbacks, auth, or contract admin logic were checked when relevant. | `Ready` / `Needs work` |
| Residual risk | Note anything the reviewer should double-check. | `Ready` / `Needs work` |

## Acceptance Criteria Review

Use this table when the issue has explicit acceptance criteria:

| Acceptance criterion | Evidence | Tests / verification | Status | Notes |
| -------------------- | -------- | -------------------- | ------ | ----- |
| Paste exact criterion. | Link files, functions, docs, or commits. | Name automated/manual evidence. | `Complete` / `Partial` / `Blocked` / `Not started` | Add scope notes. |
| Paste exact criterion. |  |  |  |  |
| Paste exact criterion. |  |  |  |  |

Do not mark the PR ready when any required row is `Partial`, `Blocked`, or `Not started` unless the PR explicitly documents why the incomplete item is outside the approved issue scope.

## Test And CI Review

Answer these before requesting review:

- Which packages, apps, examples, docs, contracts, or scripts changed?
- What tests were added or updated for the changed behavior?
- What exact commands were run?
- What is the current CI status?
- If no tests were added, what specific no-test justification applies?
- If checks are failing, is the failure fixed, unrelated, or still blocking?

## Docs And Examples Review

Check whether the change affects:

- README usage, scripts, setup, or capability descriptions.
- `/docs` guides and cross-links.
- Examples, fixtures, screenshots, or public API snippets.
- Testnet, mock, dashboard-only, or not-production disclaimers.

## Ready-For-Review Decision

Use one of these outcomes:

- `Ready`: every acceptance criterion is complete, evidence is linked, and CI/test status is clear.
- `Needs work`: at least one required behavior, test, doc, example, or CI item is missing.
- `Needs maintainer input`: completion depends on an issue clarification, repository permission, unavailable fixture, or campaign decision.

## Related Guides

- [Acceptance Criteria Completion](./ACCEPTANCE_CRITERIA_COMPLETION.md)
- [Acceptance Criteria Audit Template](./ACCEPTANCE_CRITERIA_AUDIT_TEMPLATE.md)
- [Test Evidence PR Requirement](./TEST_EVIDENCE_REQUIREMENT.md)
- [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md)
- [Issue Approval Readiness Checklist](./ISSUE_APPROVAL_READINESS.md)