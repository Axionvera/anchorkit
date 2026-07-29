# Contributor Self-Review Form

Complete this form before requesting maintainer review or expecting GrantFox payment approval.

The purpose of this form is to help contributors objectively check requirements, implementation completeness, tests, CI, documentation, and known limitations before presenting a contribution as complete.

Use it alongside the [Contributor Self-Review Template](./CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md). This form records the detailed assessment, while the template provides a shorter summary that can be copied into a pull request or review comment.

## Contribution Details

| Field                                                          | Contributor response |
| -------------------------------------------------------------- | -------------------- |
| Issue number and title                                         |                      |
| Pull request                                                   |                      |
| Branch                                                         |                      |
| Contributor                                                    |                      |
| Date reviewed                                                  |                      |
| Affected packages, apps, contracts, docs, examples, or scripts |                      |

## Self-Review Outcome

Select one outcome after completing every section:

- `Ready for review` — requirements are complete, evidence is provided, CI status is clear, and limitations are documented.
- `Needs more work` — one or more requirements, implementation areas, tests, documentation updates, or verification steps are incomplete.
- `Needs maintainer input` — an issue ambiguity, unavailable dependency, repository permission, or policy decision prevents completion.

Do not select `Ready for review` while a required item is marked `No`, `Partial`, `Blocked`, or `Not started`.

## 1. Requirements Review

Confirm that you understand and have addressed the complete issue.

| Review question                                                                                                 | Answer (`Yes` / `No` / `N/A`) | Evidence or notes |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------- |
| Did you read the complete issue description?                                                                    |                               |                   |
| Did you review every acceptance criterion?                                                                      |                               |                   |
| Did you review the issue labels, comments, linked documents, and maintainer instructions?                       |                               |                   |
| Did you identify the expected user-facing or repository behaviour?                                              |                               |                   |
| Did you identify every affected package, app, contract, document, example, test, script, or configuration area? |                               |                   |
| Did you resolve or document any ambiguity before presenting the work as complete?                               |                               |                   |
| Does the contribution remain within the approved issue scope?                                                   |                               |                   |

Requirements summary:

```text
Describe what the issue requires and how you interpreted the expected behaviour.
```

Out-of-scope items:

```text
List related work intentionally excluded from this contribution.
```

## 2. Implementation Completeness

Confirm that the implementation delivers the requested behaviour rather than partial scaffolding or adjacent changes.

| Review question                                                                                 | Answer (`Yes` / `No` / `N/A`) | Evidence or notes |
| ----------------------------------------------------------------------------------------------- | ----------------------------- | ----------------- |
| Does the implementation directly address the issue’s expected behaviour?                        |                               |                   |
| Is every required acceptance criterion implemented?                                             |                               |                   |
| Are all affected repository surfaces updated consistently?                                      |                               |                   |
| Are public exports, types, fixtures, examples, and documentation updated when required?         |                               |                   |
| Have placeholders, temporary code, debug output, and commented-out implementation been removed? |                               |                   |
| Have error, empty, loading, validation, and negative states been considered where relevant?     |                               |                   |
| Does the complete diff contain only changes needed for this issue?                              |                               |                   |
| Have unrelated formatting changes, generated-file churn, or dependency updates been excluded?   |                               |                   |

Implementation summary:

```text
Explain how the contribution solves the requested behaviour.
```

Files and behaviour delivered:

```text
List the important files, functions, components, documents, tests, or examples changed.
```

## 3. Testing Evidence

Record the testing performed for the changed behaviour.

| Review question                                                          | Answer (`Yes` / `No` / `N/A`) | Evidence or notes |
| ------------------------------------------------------------------------ | ----------------------------- | ----------------- |
| Were automated tests added or updated for changed behaviour?             |                               |                   |
| Were relevant happy paths tested?                                        |                               |                   |
| Were relevant negative, validation, error, or edge paths tested?         |                               |                   |
| Were affected packages, apps, contracts, examples, or scripts covered?   |                               |                   |
| Were manual checks performed for documentation or visible UI changes?    |                               |                   |
| Were screenshots or recordings included where visual evidence is useful? |                               |                   |
| If tests were not added, is a specific no-test justification provided?   |                               |                   |

Testing performed:

```text
List exact commands, test files, manual steps, screenshots, and results.
```

No-test justification, when applicable:

```text
Explain why automated testing is not appropriate for this change and what alternative verification was performed.
```

Follow the [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md) and [Test Evidence PR Requirement](./TEST_EVIDENCE_REQUIREMENT.md).

## 4. CI and Local Verification

Record the latest local and remote verification status.

| Verification item                         | Status                                            | Evidence or notes |
| ----------------------------------------- | ------------------------------------------------- | ----------------- |
| `pnpm verify`                             | `Passing` / `Failing` / `Not run` / `N/A`         |                   |
| `pnpm verify:full`, when required         | `Passing` / `Failing` / `Not run` / `N/A`         |                   |
| Contract tests, when `contracts/` changed | `Passing` / `Failing` / `Not run` / `N/A`         |                   |
| Pull-request CI                           | `Passing` / `Pending` / `Failing` / `Unavailable` |                   |
| Formatting and lint checks                | `Passing` / `Failing` / `Not run` / `N/A`         |                   |
| Type checking and build                   | `Passing` / `Failing` / `Not run` / `N/A`         |                   |

CI or verification notes:

```text
Link the CI run or describe failures, fixes, pending checks, and unrelated failures.
```

Do not describe CI as passing unless the latest available result confirms it. Follow the [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md) when checks are failing, pending, unavailable, or unrelated.

## 5. Documentation and Examples Review

Confirm that supporting material matches the contribution.

| Review question                                                                                      | Answer (`Yes` / `No` / `N/A`) | Evidence or notes |
| ---------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------- |
| Were affected README entries or documentation guides updated?                                        |                               |                   |
| Were commands, paths, links, and code examples checked for accuracy?                                 |                               |                   |
| Were public API examples or usage instructions updated when behaviour changed?                       |                               |                   |
| Were fixtures, sample payloads, screenshots, or examples updated where required?                     |                               |                   |
| Are testnet-only, mock-only, dashboard-only, experimental, or production limitations stated clearly? |                               |                   |
| Were documentation links checked?                                                                    |                               |                   |
| If documentation was not changed, is the reason recorded?                                            |                               |                   |

Documentation evidence:

```text
List documentation and examples changed, or explain why none were required.
```

## 6. Known Limitations and Residual Risk

Document everything reviewers should know before assessing the contribution.

| Limitation or risk | Impact | Mitigation or follow-up | Blocking?    |
| ------------------ | ------ | ----------------------- | ------------ |
|                    |        |                         | `Yes` / `No` |
|                    |        |                         | `Yes` / `No` |
|                    |        |                         | `Yes` / `No` |

Confirm that:

- [ ] Uncovered edge cases are listed.
- [ ] Areas with limited test coverage are disclosed.
- [ ] Assumptions and environment restrictions are disclosed.
- [ ] Unresolved dependencies or maintainer decisions are disclosed.
- [ ] Security, mainnet-safety, data-loss, compatibility, or migration risks are disclosed where relevant.
- [ ] Follow-up work is not presented as completed work.

Write `None identified` only after reviewing the complete diff.

## 7. Acceptance Criteria Mapping

Copy every acceptance criterion exactly from the issue and map it to evidence.

| Acceptance criterion       | Status                                             | Implementation evidence                        | Tests or verification              | Documentation or examples         | Notes                           |
| -------------------------- | -------------------------------------------------- | ---------------------------------------------- | ---------------------------------- | --------------------------------- | ------------------------------- |
| Paste the exact criterion. | `Complete` / `Partial` / `Blocked` / `Not started` | Link files, functions, components, or commits. | Name automated or manual evidence. | Link supporting docs or examples. | Add limitations or scope notes. |
| Paste the exact criterion. |                                                    |                                                |                                    |                                   |                                 |
| Paste the exact criterion. |                                                    |                                                |                                    |                                   |                                 |
| Paste the exact criterion. |                                                    |                                                |                                    |                                   |                                 |

Do not mark the contribution ready when a required criterion is `Partial`, `Blocked`, or `Not started`.

Use the [Acceptance Criteria Completion Table](./ACCEPTANCE_CRITERIA_COMPLETION.md) or [Acceptance Criteria Traceability Table](./ACCEPTANCE_CRITERIA_TRACEABILITY.md) when more detailed mapping is required.

## 8. Final Contributor Declaration

Before requesting review, confirm that:

- [ ] I reviewed the complete branch diff.
- [ ] I checked the contribution against the full issue requirements.
- [ ] Every acceptance criterion is complete.
- [ ] Implementation evidence is linked or described.
- [ ] Testing evidence or a valid no-test justification is provided.
- [ ] Local verification and CI status are reported accurately.
- [ ] Documentation and examples are complete or marked not applicable with a reason.
- [ ] Known limitations and residual risks are documented.
- [ ] The branch contains no unrelated work.
- [ ] I am not relying on merge status alone as evidence of payment eligibility.

Final decision:

```text
Ready for review / Needs more work / Needs maintainer input
```

Contributor explanation:

```text
Briefly explain the decision and identify any remaining action.
```

## Related Guides

- [Evaluation-Readiness Dashboard](./EVALUATION_READINESS.md)
- [Contributor Self-Review Template](./CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md)
- [Meaningful Implementation Checklist](./MEANINGFUL_IMPLEMENTATION_CHECKLIST.md)
- [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md)
- [Test Evidence PR Requirement](./TEST_EVIDENCE_REQUIREMENT.md)
- [Local Verification](./LOCAL_VERIFICATION.md)
- [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md)
- [Acceptance Criteria Completion](./ACCEPTANCE_CRITERIA_COMPLETION.md)
- [Acceptance Criteria Traceability Table](./ACCEPTANCE_CRITERIA_TRACEABILITY.md)
- [Contributor Payment Expectations](./CONTRIBUTOR_PAYMENT_EXPECTATIONS.md)
- [Payment-Period Conduct Note](./PAYMENT_PERIOD_CONDUCT.md)
