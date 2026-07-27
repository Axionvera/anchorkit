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

## Quick contribution loop

1. Find an issue, or open a new one following the [ISSUE_STANDARD.md](./ISSUE_STANDARD.md).
2. Comment on the issue to apply. Wait for an assignment before starting work.
3. Fork the repo, create a branch, run `pnpm install`.
4. Implement, add tests, update docs if needed.
5. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm contract:test` locally.
6. Open a PR referencing the issue number (e.g. `Closes #42`).
7. Respond to maintainer review and update your branch.

## Branch and PR conventions

- Use branches: `feat/<short-slug>`, `fix/<short-slug>`, `docs/<short-slug>`, `chore/<short-slug>`.
- Keep commits small and rebased on `main`. One PR should close one issue scope when possible.
- PR title should summarise the change; the body should reference the issue, explain design
  choices, and list any risks.

## Tests are expected

- For any TypeScript utility change: add or update a Vitest test under `packages/*/test/`.
- For any contract state transition change: add a Rust test under `contracts/treasury-escrow/src/test.rs`.
- For UI-only changes: add a short note on how you tested manually.

## Documentation

- If you add or remove a public package API, update the relevant docs under `/docs` (`*.md`).
- If you add a new page to the dashboard, add a short paragraph in the dashboard overview doc
  and link to the source.

## How to get help

- GitHub Discussions (if enabled) for questions.
- Comments on the issue you are assigned to for implementation questions.

Maintainers will try to respond within 3 working days. We prioritise assigned contributors over
drive-by PRs that have no linked issue.
