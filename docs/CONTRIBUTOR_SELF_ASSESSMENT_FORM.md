# Contributor Self-Assessment Form

Complete this form before submitting a pull request or before a payment-period review. It asks you to confirm scope, tests, CI, known limitations, and acceptance criteria completion against a structured yes/no checklist. Use it alongside the [Contributor Self-Review Template](./CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md) — the self-review template is for post-implementation checklist evidence, while this form is for pre-submission structured assessment.

## Self-Assessment Outcome

Pick one:

- `Ready for submission`: every required section is confirmed, evidence is attached, and limitations are documented.
- `Needs more work`: at least one item below is No or Partial and must be resolved before submission.
- `Needs maintainer input`: an ambiguity in scope, criteria, or repository policy blocks assessment.

## 1. Scope Confirmation

Confirm that the change matches the approved issue scope.

- [ ] I have read the full issue body, acceptance criteria, labels, comments, and linked docs.
- [ ] The diff only covers surfaces named in the issue (packages, apps, contracts, docs, examples, scripts, or config files).
- [ ] No unrelated formatting, generated file churn, dependency bumps, or broad rewrites are included.
- [ ] No hidden second-issue work is present.
- [ ] Any acceptance criterion I intentionally left incomplete is called out plainly below.

Scope notes (list out-of-scope changes or explain why a criterion was intentionally left incomplete):

```
```

## 2. Test Evidence

Confirm the testing performed for this change.

| Question | Answer (Yes / No / N/A) |
| -------- | ----------------------- |
| Did you add or update automated tests for every changed behaviour? | |
| If no tests were added, do you have a specific no-test justification matched to the changed behaviour? | |
| Did you test negative paths when the change touches validation, security, balances, network selection, callbacks, escrow state, or API contracts? | |
| Did you list the exact commands you ran and their results? | |
| For UI-only changes, did you include manual verification notes or screenshots? | |

Test evidence (paste commands, results, test files, or no-test justification):

```
```

## 3. CI Status

Confirm CI health and failure handling.

| Question | Answer (Yes / No / N/A) |
| -------- | ----------------------- |
| Did CI pass on your latest push? | |
| If CI is failing, did you document whether the failure is fixed, unrelated, or still blocking? | |
| Did you run `pnpm verify` locally (format, lint, typecheck, test, build)? | |
| If you changed `contracts/`, did you also run `pnpm contract:test` or `pnpm verify:full`? | |

CI notes (link to CI run, paste failing logs, or explain unrelated failures):

```
```

## 4. Known Limitations

Document anything the reviewer, maintainer, or campaign reviewer should know.

- [ ] I have identified edge cases the implementation does not cover.
- [ ] I have noted areas where test coverage is thinner than ideal.
- [ ] I have flagged assumptions (testnet-only, mock-only, dashboard-only, fixture-backed) relevant to this change.
- [ ] I have called out any unresolved question or dependency that blocks full completion.

Known limitations (list each limitation with its impact):

```
```

## 5. Acceptance Criteria Confirmation

Map every issue acceptance criterion to its completion status, evidence, and tests.

| Acceptance Criterion | Status | Implementation Evidence | Tests / Verification | Notes |
| -------------------- | ------ | ----------------------- | -------------------- | ----- |
| Paste exact criterion from the issue. | `Complete` / `Partial` / `Blocked` / `Not started` | Link files, functions, commits, or docs. | Name automated or manual evidence. | Add scope or limitation notes. |
| Paste exact criterion from the issue. | | | | |
| Paste exact criterion from the issue. | | | | |

Do not mark the change ready when any required criterion is `Partial`, `Blocked`, or `Not started` — either complete it, or document why it is outside the approved issue scope.

## 6. Final Assessment

Before marking the PR ready for review, confirm:

- [ ] Every acceptance criterion row above is `Complete` or intentionally scoped out with a note.
- [ ] Test evidence is attached or a no-test justification is provided.
- [ ] CI status is clear and failing checks are explained.
- [ ] Known limitations are documented above.

Self-assessment decision: `Ready for submission` / `Needs more work` / `Needs maintainer input`

## Related Guides

- [Contributor Self-Review Template](./CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md)
- [Meaningful Implementation Checklist](./MEANINGFUL_IMPLEMENTATION_CHECKLIST.md)
- [Test Evidence PR Requirement](./TEST_EVIDENCE_REQUIREMENT.md)
- [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md)
- [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md)
- [Acceptance Criteria Completion](./ACCEPTANCE_CRITERIA_COMPLETION.md)
- [Contributor Payment Expectations](./CONTRIBUTOR_PAYMENT_EXPECTATIONS.md)
- [GrantFox Reviewer Checklist](./GRANTFOX_REVIEWER_CHECKLIST.md)
