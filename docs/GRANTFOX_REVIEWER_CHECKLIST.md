# GrantFox Reviewer Checklist

Use this checklist when reviewing AnchorKit pull requests that reference `GrantFox OSS`, `Maybe Rewarded`, or campaign-labelled issues. It complements the maintainer review checklist by focusing on scope, test evidence, CI status, documentation/examples, and acceptance-criteria completion.

## Review Outcome

Choose one outcome before approving or merging:

- `Approve`: the PR is in scope, complete, tested, documented when needed, and CI evidence is clear.
- `Request changes`: one or more required issue criteria, tests, docs, examples, or CI explanations are missing.
- `Approve for repository, not reward-ready`: the change is acceptable for the repo, but reward-readiness still needs campaign review or missing evidence.
- `Needs maintainer input`: scope, assignment, permissions, or campaign process is unclear.

## Scope Check

- [ ] PR links the exact issue with `Closes #NNN` or an equivalent issue reference.
- [ ] The diff matches the issue body, not only the issue title.
- [ ] Unrelated formatting, generated files, dependency churn, and broad rewrites are absent or explained.
- [ ] The PR does not quietly include work for a second issue.
- [ ] Any incomplete or out-of-scope acceptance criterion is called out plainly.

## Meaningful Implementation Check

- [ ] The change updates the package, app, contract, doc, example, or workflow surface that the issue actually names.
- [ ] Cross-package behavior is integrated across all affected AnchorKit surfaces.
- [ ] The implementation does more than add placeholder copy, unused scaffolding, or happy-path-only behavior when the issue asks for complete behavior.
- [ ] Testnet-only, mock-only, dashboard-only, or unsupported production behavior remains clearly labelled.

## Tests And CI Check

- [ ] Tests or verification evidence map to each changed behavior.
- [ ] Negative-path tests are present when validation, security, balances, network selection, callbacks, escrow state, or API contracts changed.
- [ ] The PR lists exact commands run or a specific no-test justification.
- [ ] CI is passing, pending with a follow-up plan, or failing with evidence that the failure is fixed or unrelated.
- [ ] Screenshots or manual verification are included for visible UI changes.

Use [MINIMUM_TESTING_STANDARD.md](./MINIMUM_TESTING_STANDARD.md) and [TEST_EVIDENCE_REQUIREMENT.md](./TEST_EVIDENCE_REQUIREMENT.md) when evidence is unclear.

## Docs And Examples Check

- [ ] README, `/docs`, examples, fixtures, or screenshots are updated when user-facing behavior, commands, public APIs, or contributor workflow changed.
- [ ] New docs are linked from the README docs index or another discoverable guide.
- [ ] Examples still match exported APIs, package boundaries, and testnet/mainnet disclaimers.
- [ ] No internal prompt/context, credentials, private endpoints, or personal data appear in docs, logs, screenshots, or examples.

## Acceptance Criteria Check

- [ ] Every issue acceptance criterion appears in the PR body, traceability table, or review comment.
- [ ] Each criterion has implementation evidence and test/manual/static verification evidence.
- [ ] Criteria involving docs or examples name the exact changed guide, README row, example, fixture, or screenshot.
- [ ] Criteria marked `Partial`, `Blocked`, or `Not started` are not treated as complete.
- [ ] Campaign/reward-readiness claims are separated from repository merge approval.

## Review Comment Template

```md
## GrantFox reviewer checklist

Outcome: Approve / Request changes / Approve for repository, not reward-ready / Needs maintainer input

- Scope checked: yes/no — notes:
- Meaningful implementation checked: yes/no — notes:
- Tests and CI checked: yes/no — notes:
- Docs/examples checked: yes/no — notes:
- Acceptance criteria checked: yes/no — notes:
- Residual risk or campaign follow-up:
```

## Related Guides

- [Maintainer Review Checklist](./MAINTAINER_REVIEW_CHECKLIST.md)
- [Reviewer Quality Checklist](./REVIEWER_QUALITY_CHECKLIST.md)
- [Acceptance Criteria Traceability Table](./ACCEPTANCE_CRITERIA_TRACEABILITY.md)
- [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md)
- [Contributor Payment Expectations](./CONTRIBUTOR_PAYMENT_EXPECTATIONS.md)