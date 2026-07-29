# Evaluation-Readiness Dashboard

Use this dashboard before requesting review, moving a pull request out of draft, or following up during a GrantFox payment period.

A contribution is evaluation-ready when the issue scope is complete, the required verification has been performed, the pull request contains clear evidence, and any remaining limitations are documented.

## Readiness Dashboard

| Area                   | Evaluation-ready when                                                                                              | Guidance                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Testing standard       | The applicable testing requirements have been followed, including a valid no-test justification where appropriate. | [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md)                                                                  |
| CI workflow            | Local verification has been completed and the available CI status is reported accurately.                          | [Local Verification](./LOCAL_VERIFICATION.md) · [Pull-request workflow](../.github/workflows/trigger-auto-merge.yml)       |
| PR evidence            | The pull request explains the scope, affected areas, testing performed, results, limitations, and risks.           | [Pull Request Template](../.github/PULL_REQUEST_TEMPLATE.md) · [Test Evidence Requirement](./TEST_EVIDENCE_REQUIREMENT.md) |
| Acceptance criteria    | Every issue criterion is mapped to implementation, documentation, tests, or verification evidence.                 | [Acceptance Criteria Traceability Table](./ACCEPTANCE_CRITERIA_TRACEABILITY.md)                                            |
| Self-review            | The complete branch diff has been checked for scope, quality, tests, documentation, and residual risk.             | [Contributor Self-Review Template](./CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md)                                                  |
| Payment-period conduct | Payment follow-up happens only after scope, evidence, review status, and CI status have been checked.              | [Payment-Period Conduct Note](./PAYMENT_PERIOD_CONDUCT.md)                                                                 |
| Contributor conduct    | Communication remains respectful, accurate, and consistent with project expectations.                              | [Code of Conduct](../CODE_OF_CONDUCT.md)                                                                                   |

## Evaluation-Readiness Checklist

Before requesting evaluation, confirm that:

- [ ] The branch contains only changes required for the assigned issue.
- [ ] Every acceptance criterion is addressed.
- [ ] The applicable testing standard has been followed.
- [ ] Test commands and results are recorded in the pull request.
- [ ] `pnpm verify` has passed, or any limitation is explained.
- [ ] The current CI status is described accurately.
- [ ] The pull request template is complete.
- [ ] Documentation and examples match the contribution.
- [ ] The complete diff has been self-reviewed.
- [ ] Known risks, limitations, and follow-up work are documented.
- [ ] Payment-period communication follows the project guidance.

A checked item should represent evidence, not an assumption.

## Testing and CI Evidence

Follow the [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md) for the area changed.

Pull-request evidence should state:

- tests added or updated;
- commands executed;
- whether each command passed;
- packages, apps, examples, or contracts covered;
- manual verification performed; and
- any valid no-test justification.

Use the [Test Evidence Requirement](./TEST_EVIDENCE_REQUIREMENT.md) for the expected format.

Run the commands described in [Local Verification](./LOCAL_VERIFICATION.md). The standard repository verification command is:

```bash
pnpm verify
```
