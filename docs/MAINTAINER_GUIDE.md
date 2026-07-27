# Maintainer Guide

Maintainers are responsible for issue triage, PR reviews, releases, and enforcing the project’s
security and quality bar. This is the playbook.

## Triage

1. New issues should get labelled within 3 business days.
2. Apply scope labels (`stellar`, `soroban`, `anchor`, `sep`, `wallet`, `payments`, `escrow`)
   and type labels (`bug`, `documentation`, `test`, `enhancement`).
3. Mark `good first issue` or `expert` based on scope.
4. GrantFox campaign issues need `GrantFox OSS`, `Maybe Rewarded`, and
   `Official Campaign | FWC26` labels explicitly set by a maintainer before the campaign
   board will pick them up.
5. If an issue is unclear, ask the reporter for a reproduction or more context. Close stale
  non-reproducible issues with a polite note and the `needs-repro` label first, then close.

## Review

Use the checklist in [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) for
every PR. Do not merge until every box is addressed. Copy the checklist into a review comment
for transparency with GrantFox reviewers.

## Merging

- Require PR CI to pass (lint, typecheck, test, build, contract tests).
- Squash merge when the PR has many tiny commits; otherwise rebase merge is fine.
- Ensure the PR body contains `Closes #NNN` so the issue is closed on merge.

## GrantFox assignments

1. When a contributor applies by commenting on an issue:
   - Assess context (prior work, expertise, description of approach).
   - If acceptable, assign the issue via GitHub Assignees and reply confirming.
   - Otherwise reply politely and keep the issue open for others.
2. Do **not** assign the same issue to multiple contributors. The first accepted applicant is
   the assignee. If they stall, unassign after 14 days of inactivity.
3. Reward-readiness is **not guaranteed** by merging. Final decision is up to the campaign
   reviewer. Maintainers flag issues that fully meet scope + quality with a short note at the
   end of the merge commit body.

## Releases

- Use semver for packages (`0.x` MVP stage).
- Cut a GitHub release with changelog summarising merged PRs since the last release.
- Contract releases: tag the contract crate version, build the `.wasm`, and pin the
  corresponding SHA in `CONTRACTS.md` under `/docs` for auditability.

## Conflict of interest

Maintainers who are actively working on a campaign issue should not assign it to themselves
or review their own work without a second maintainer approving.
