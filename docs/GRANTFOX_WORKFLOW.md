# GrantFox Contribution Workflow

This document is authoritative for how contributors, maintainers, and campaign reviewers
interact during a GrantFox OSS campaign on AnchorKit.

## 1. Discover an eligible issue

Issues eligible for GrantFox carry all three labels:

- `GrantFox OSS`
- `Maybe Rewarded`
- `Official Campaign | FWC26`

They also follow [ISSUE_STANDARD.md](./ISSUE_STANDARD.md). Anything without all three labels is
a normal open-source issue and will not be rewarded.

## 2. Apply by commenting on the issue

Write a short application comment containing:

1. Relevant experience (Stellar, Rust/TypeScript, prior OSS links) — one paragraph is enough.
2. A 1–4 bullet approach plan to the scope.
3. Estimated time to open the first PR draft.

Do **not** open a PR until you are assigned.

## 3. Wait to be assigned

A maintainer will reply on the issue thread either:
- accepting you and adding you as Assignee,
- declining you with a short reason so you can pick another ticket.

Only the single assigned contributor on an issue is eligible for a reward. Co-authored work
requires explicit maintainer approval at assignment time and will usually be split into
sub-issues instead.

## 4. Implement and open the PR

- Open your PR from a feature branch on your fork.
- PR title line 1: `[#NNN] One-line summary` where NNN is the issue number.
- PR body must reference the issue with `Closes #NNN` or `Fixes #NNN`.
- PR body must also check off the Acceptance Criteria from the issue, linking to commits or
  files where each was delivered.
- Paste the full [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) into your
  PR description as a pre-review self-check. Do not mark items you haven’t verified; the
  maintainer will finish marking them.

## 5. Maintainer review

Maintainers evaluate:

- Stellar and Soroban correctness.
- Security impact (R0–R6 secret rules, mainnet guards).
- Test coverage and quality.
- Documentation updates.
- No secret leakage anywhere.
- No mainnet risk introduced.
- Match against issue acceptance criteria exactly.

Expect 1–3 rounds of review. Address feedback with new fixup commits that you then squash or
rebase at the end.

## 6. Merge

Once the maintainer marks every checklist item satisfied, CI passes, and there are no
outstanding comments, the PR is merged.

## 7. Reward readiness

**Important**:
> Completing an issue, passing CI, and merging do **not** guarantee reward-readiness.

Reward-readiness is decided by the GrantFox campaign reviewer against:
- The issue original scope.
- The maintainer’s final review notes.
- The quality of tests, docs, security review, and lack of follow-up bugs reported against the
  merged work within a short window.

If your merged PR is judged “not yet rewardable” you’ll receive a clear written explanation
with steps for an earn-out follow-up PR.
