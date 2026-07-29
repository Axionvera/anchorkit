# Contributor Guide

AnchorKit is an open-source project under `stellar-commons-labs`. We welcome contributions via
GitHub issues and pull requests, including those tracked by **GrantFox** OSS campaigns.

## Code of conduct

By participating you agree to the [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md). Keep discussions
technical, constructive, and respectful.

## What can I work on?

- Issues labelled `good first issue` are intended for new contributors.
- Issues labelled `expert` require Stellar or Soroban domain knowledge.
- `GrantFox OSS` + `Maybe Rewarded` + `Official Campaign | FWC26` are issues participating in
  the GrantFox campaign. See [GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md).

Start with the [DEVELOPER_JOURNEY.md](./DEVELOPER_JOURNEY.md) walkthrough to understand how the
monorepo modules fit together before diving into an issue.

## GrantFox campaign contributors

If you are contributing through a GrantFox campaign, read
[GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md) **before** applying for an issue. Key rules:

1. **Apply before working.** Comment on the issue with your experience, approach, and timeline.
2. **Wait for assignment.** Do not open a PR until a maintainer assigns you.
3. **One issue at a time.** Focus on the assigned issue; apply for more after completing it.
4. **PR must reference the issue.** Use `Closes #NNN` in the PR body.
5. **Merge does not guarantee reward.** The campaign reviewer evaluates reward-readiness
   post-merge against scope, quality, and security standards.

See [GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md) for the full process.

## Quick contribution loop

1. Find an issue, or open a new one following the [ISSUE_STANDARD.md](./ISSUE_STANDARD.md).
2. Comment on the issue to apply. Wait for an assignment before starting work.
3. Fork the repo, create a branch, run `pnpm install`.
4. Implement, add tests, update docs if needed.
5. Run `pnpm verify` locally (format, lint, typecheck, test, build). See
   [LOCAL_VERIFICATION.md](./LOCAL_VERIFICATION.md). If you changed `contracts/`,
   also run `pnpm contract:test` or `pnpm verify:full`. Record affected packages, tests added,
   commands run, CI status, and no-test justifications using
   [TEST_EVIDENCE_REQUIREMENT.md](./TEST_EVIDENCE_REQUIREMENT.md).
6. Open a PR referencing the issue number (e.g. `Closes #42`).
7. Respond to maintainer review and update your branch.

## Branch and PR conventions

- Use branches: `feat/<short-slug>`, `fix/<short-slug>`, `docs/<short-slug>`, `chore/<short-slug>`.
- Keep commits small and rebased on `main`. One PR should close one issue scope when possible.
- PR title should summarise the change; the body should reference the issue, explain design
  choices, and list any risks.
- Every PR must use the
  [PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md) — GitHub pre-fills it
  automatically when you open a PR. Complete every section: issue reference, affected
  packages/apps, testing performed, screenshots for `apps/web` UI changes, security impact,
  and documentation impact. Do not delete sections that don't apply — mark them N/A instead so
  reviewers know they were considered.
- For GrantFox issues, review the criteria in
  [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) and
  [REVIEWER_QUALITY_CHECKLIST.md](./REVIEWER_QUALITY_CHECKLIST.md), and paste the self-check into your
  PR description.

## Tests are expected

- For any TypeScript utility change: add or update a Vitest test under `packages/*/test/`.
- For any contract state transition change: add a Rust test under `contracts/treasury-escrow/src/test.rs`.
- For UI-only changes: add a short note on how you tested manually.

## Security awareness

Before working on any module listed as **CRITICAL** or **HIGH** in the
[security module map](./SECURITY_MODULE_MAP.md), read the relevant section of
[SECURITY_THREAT_MODEL.md](./SECURITY_THREAT_MODEL.md) and the R0–R6 rules in
[SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md).

## Documentation

- If you add or remove a public package API, update the relevant docs under `/docs` (`*.md`).
- If you add a new page to the dashboard, add a short paragraph in the dashboard overview doc
  and link to the source.

## How to get help

- GitHub issue threads for implementation questions on your assigned issue.
- PR review comments for feedback on your implementation.
- Maintainers will try to respond within 3 working days.

We prioritise assigned contributors over drive-by PRs that have no linked issue.
