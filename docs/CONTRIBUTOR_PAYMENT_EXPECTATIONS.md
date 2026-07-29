# Contributor Payment Expectations

This guide sets expectations for AnchorKit contributors working on GrantFox OSS / Maybe Rewarded issues. It is not a payment promise; it explains how to keep a merged PR easy to evaluate and how to communicate during the payment period.

## What A Merge Means

A merged PR means the repository maintainers accepted the code or documentation change for AnchorKit. It does not automatically guarantee a GrantFox reward.

Campaign reviewers can still evaluate:

- Whether the PR fully satisfies the issue acceptance criteria.
- Whether the implementation is meaningful for the affected package, app, contract, example, or documentation area.
- Whether tests, CI results, screenshots, or manual verification support the change.
- Whether the PR stayed in scope and avoided unrelated churn.
- Whether follow-up fixes were needed before or after merge.

## Before Asking About Payment

Self-review the merged PR before posting follow-up comments:

| Check | What to verify |
| ----- | -------------- |
| Issue link | The PR body uses `Closes #NNN` or otherwise links the exact issue. |
| Acceptance criteria | Every issue checkbox is complete or clearly explained. |
| Test evidence | Commands, CI, screenshots, or a docs-only justification are included. |
| Scope | The diff avoids unrelated formatting, generated files, and broad rewrites. |
| Review feedback | Maintainer comments are resolved or acknowledged. |
| Payment process | Any documented GrantFox claim step has been followed once. |

Use the acceptance criteria completion table and issue approval readiness checklist when the PR is non-trivial.

## Communication During The Payment Period

For a concise conduct checklist, see [PAYMENT_PERIOD_CONDUCT.md](./PAYMENT_PERIOD_CONDUCT.md).

Keep payment-period communication calm, sparse, and verifiable:

- Ask once in the merged PR if the official claim or payment step is unclear.
- Include the issue number, merged PR link, and a short summary of verification evidence.
- Do not post repeated complaints across unrelated issues, PRs, discussions, or maintainer channels.
- Do not pressure individual maintainers for a private exception.
- Do not assume a Vercel, CI, or automation comment is a payment instruction.
- Wait for the documented review period or maintainer guidance before following up again.

Repeated complaint threads make reward review harder because reviewers must separate evaluation evidence from noise. Keep the record focused on the merged work and the documented process.

## If A PR Is Not Rewarded

If a merged PR is not rewarded, treat the result as evaluation feedback rather than a dispute by default. Compare the decision with the original issue scope, acceptance criteria, testing evidence, and review history.

A useful follow-up includes:

- The exact criterion or evidence that may have been missed.
- A link to the merged PR and relevant review comment.
- A short correction or additional evidence if it exists.
- A willingness to improve future submissions instead of reopening the same complaint repeatedly.

## Related Guides

- [GrantFox Contribution Workflow](./GRANTFOX_WORKFLOW.md)
- [Acceptance Criteria Completion](./ACCEPTANCE_CRITERIA_COMPLETION.md)
- [Acceptance Criteria Audit Template](./ACCEPTANCE_CRITERIA_AUDIT_TEMPLATE.md)
- [Issue Approval Readiness Checklist](./ISSUE_APPROVAL_READINESS.md)
- [Low-Effort Contribution Examples](./LOW_EFFORT_CONTRIBUTION_EXAMPLES.md)