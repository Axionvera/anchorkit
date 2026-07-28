# Contributing to AnchorKit

Thanks for your interest in contributing! AnchorKit is a community-driven
Stellar developer toolkit and we welcome contributions large and small — from
typo fixes in the docs to entire new packages.

Before opening your first PR, please read:

- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [docs/CONTRIBUTOR_GUIDE.md](./docs/CONTRIBUTOR_GUIDE.md)
- [docs/MAINTAINER_REVIEW_CHECKLIST.md](./docs/MAINTAINER_REVIEW_CHECKLIST.md) — your
  PR reviewer will apply this checklist to every review, so it’s worth reading
  up front.
- If you are contributing under a GrantFox campaign, also read
  [docs/GRANTFOX_WORKFLOW.md](./docs/GRANTFOX_WORKFLOW.md) and
  [docs/ISSUE_STANDARD.md](./docs/ISSUE_STANDARD.md).

## Quick start

Clone and install dependencies:

```bash
git clone git@github.com:stellar-commons-labs/anchorkit.git
cd anchorkit
pnpm install
```

Create a feature branch:

```bash
git checkout -b feat/my-feature
```

Run lint, typecheck, tests, and format before pushing:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm contract:test
pnpm format
```

Start the web dashboard during development:

```bash
pnpm web:dev
```

## Conventions

- **Types first.** New public APIs get a Zod schema in `packages/validators`,
  then branded types in `packages/types`, then runtime helpers in
  `stellar-kit` / `anchor-utils`.
- **No secret leakage.** Before committing, `git diff -U0` and grep for
  `S[A-Z2-7]{55}` to catch accidental secret key commits.
- **Tests are required** for anything beyond a docs or obvious one-line fix.
- **Docs are required** for any new public function or change in user-facing
  behaviour. Pick the right file under `/docs/`.

## Pull request template

Every PR is pre-filled from
[.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md). Fill in **every**
section before requesting review — issue reference, affected packages/apps, testing performed,
screenshots (for `apps/web` UI changes), security impact, documentation impact, and the
maintainer review self-check. PRs with unfilled or deleted sections will be sent back for
completion before review starts.

## GrantFox contribution flow

1. Comment on an issue that carries the `GrantFox OSS` + `Maybe Rewarded` +
   `Official Campaign | FWC26` labels to apply.
2. Wait until a maintainer assigns you to the issue before starting work.
3. Open a PR that closes the issue with `Closes #NNN` and runs the full CI
   suite clean.
4. Maintainers will review using the checklist. Merging is a prerequisite for
   reward consideration but does not itself guarantee reward-readiness.
