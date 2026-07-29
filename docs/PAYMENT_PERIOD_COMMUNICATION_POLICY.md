# Payment-Period Communication Policy

This is the canonical policy for how AnchorKit contributors should communicate
after a PR is opened, merged, or awaiting GrantFox OSS / Maybe Rewarded campaign
evaluation. It exists because community channels can get flooded with repeated
complaints when contributors expect automatic payment as soon as a PR merges.

**A merge is not a payment approval.** Payment decisions are made through the
documented [GrantFox evaluation process](./GRANTFOX_WORKFLOW.md#8-merge-and-reward-readiness),
not automatically on merge.

## Policy

1. **Ask once.** If the claim or payment step is unclear, ask a single, specific
   question on the merged PR or the linked issue. Include the issue number, the
   merged PR link, and a short summary of the acceptance-criteria and test
   evidence already in the PR.
2. **Do not repeat the request.** Do not re-post the same question across other
   issues, PRs, discussions, Discord, or maintainer DMs. Repeated posts do not
   speed up evaluation — they add noise reviewers have to filter out.
3. **Do not treat merge or bot activity as a payment signal.** A merge, a CI
   pass, or an automated deployment comment confirms the code was accepted into
   the repository. It does not confirm reward eligibility.
4. **Self-review before you follow up.** Before asking about payment, verify the
   PR against the checklist below. Most payment-period disputes trace back to a
   gap here, not to a slow review.
5. **Follow the documented process, not a private exception.** Do not ask an
   individual maintainer to fast-track or manually approve a reward outside the
   [GrantFox contribution flow](../CONTRIBUTING.md#grantfox-contribution-flow).
6. **If a PR isn't rewarded, treat it as evaluation feedback.** Compare the
   outcome against the issue's acceptance criteria and testing evidence, and
   raise at most one focused, evidence-based follow-up.

## Self-Review Checklist

| Check | Evidence to confirm |
| ----- | -------------------- |
| Scope | The PR closes the exact issue (`Closes #NNN`) and contains no unrelated changes. |
| Acceptance criteria | Every criterion in the issue is met and mapped, e.g. in [ACCEPTANCE_CRITERIA_COMPLETION.md](./ACCEPTANCE_CRITERIA_COMPLETION.md). |
| Tests / CI | Test commands, CI status, or a documented no-test justification are included. |
| Docs | User-facing docs, examples, or README entries are updated where the issue requires it. |
| Review feedback | Maintainer review comments are resolved, not just acknowledged. |
| Claim step | Any official GrantFox claim/payment step has already been followed once. |

## Tone

Maintainers and reviewers will engage professionally and expect the same in
return. This policy is firm, not punitive: contributors who ask once, with
evidence, and then wait for the documented process will get a clear answer.
Contributors who escalate with repeated complaints instead of evidence should
expect maintainers to point back to this policy rather than respond further.

## Related Guides

- [GrantFox Contribution Workflow](./GRANTFOX_WORKFLOW.md) — the full assignment,
  review, and reward-readiness process.
- [Contributor Payment Expectations](./CONTRIBUTOR_PAYMENT_EXPECTATIONS.md) — what
  a merge does and does not guarantee.
- [Payment-Period Conduct Note](./PAYMENT_PERIOD_CONDUCT.md) — a short conduct
  checklist covering the same period.
- [Acceptance Criteria Completion](./ACCEPTANCE_CRITERIA_COMPLETION.md)
- [Issue Approval Readiness Checklist](./ISSUE_APPROVAL_READINESS.md)
