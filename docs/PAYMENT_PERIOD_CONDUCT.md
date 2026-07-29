# Payment-Period Conduct Note

AnchorKit contributors should keep payment-period communication sparse, factual, and tied to verifiable work. This note applies to GrantFox OSS / Maybe Rewarded issues after a PR is opened, merged, or waiting for campaign evaluation.

## Conduct Expectations

- Ask for the official claim or payment step once in the merged PR when the process is unclear.
- Do not post repeated complaints across unrelated issues, pull requests, discussions, or maintainer channels.
- Do not pressure individual maintainers for private exceptions or faster manual payment.
- Do not treat merge, deployment-bot comments, or pending CI as proof of payment approval.
- Keep follow-up comments short and link the issue, PR, acceptance criteria evidence, and testing/CI evidence.
- Wait for the documented GrantFox evaluation process or maintainer guidance before following up again.

## Self-Review Before Payment Follow-Up

Before asking about payment, confirm:

| Check | Evidence to review |
| ----- | ------------------ |
| Issue scope | The PR closes the exact issue and did not drift into unrelated work. |
| Acceptance criteria | Every criterion is mapped in a completion or traceability table. |
| Tests and CI | Commands run, no-test justification, and CI status are clear. |
| Docs/examples | User-facing docs, examples, screenshots, or README links are updated when required. |
| Review state | Maintainer feedback is resolved and remaining risks are documented. |
| Claim process | Any official GrantFox claim step has been followed once. |

Use [CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md](./CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md), [TEST_EVIDENCE_REQUIREMENT.md](./TEST_EVIDENCE_REQUIREMENT.md), and [ACCEPTANCE_CRITERIA_TRACEABILITY.md](./ACCEPTANCE_CRITERIA_TRACEABILITY.md) for evidence.

## Good Follow-Up

```md
Thanks for merging this. Is there an official GrantFox reward claim or payment step I should follow for the merged `Maybe Rewarded` issue #NNN?
```

A good follow-up asks for process, not special treatment. It does not repeat the same request across multiple channels.

## When CI Or Review Is Still Unclear

If CI is failing, pending, or unrelated to the branch, summarize the status using [FAILING_CI_RESPONSE_GUIDE.md](./FAILING_CI_RESPONSE_GUIDE.md) before asking about payment.

If acceptance criteria are partial or blocked, state that clearly instead of framing the PR as fully reward-ready.

## Related Guides

- [Contributor Payment Expectations](./CONTRIBUTOR_PAYMENT_EXPECTATIONS.md)
- [GrantFox Contribution Workflow](./GRANTFOX_WORKFLOW.md)
- [Issue Approval Readiness Checklist](./ISSUE_APPROVAL_READINESS.md)
- [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md)