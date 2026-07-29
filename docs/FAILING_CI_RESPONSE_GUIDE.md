# Failing CI Response Guide

This guide explains how AnchorKit contributors should respond when a pull request has failing checks. Failing CI can block maintainer approval and GrantFox reward-readiness even when the implementation looks correct in review.

## First Response

When a check fails:

1. Open the failing GitHub Actions job and identify the exact workspace, command, and first useful error.
2. Decide whether the failure is caused by your PR, a missing dependency/cache, or an unrelated upstream issue.
3. Reproduce the smallest relevant command locally when possible.
4. Push a scoped fix or leave a concise comment explaining why the failure is unrelated and what evidence supports that claim.

Avoid retry-only fixes unless the log shows a transient network, cache, or runner problem.

## Common AnchorKit Commands

Use the command that matches the failing job instead of running unrelated checks first.

| Failure area | Command to run | Notes |
| ------------ | -------------- | ----- |
| Full repository verification | `pnpm verify` | Runs format check, lint, typecheck, tests, and build. |
| Expanded verification | `pnpm verify:full` | Includes the fuller verification path documented in local setup. |
| Formatting | `pnpm format:check` | Use `pnpm format` only when the diff should be reformatted. |
| Lint | `pnpm lint` | Usually maps to ESLint or package lint scripts through Turbo. |
| TypeScript types | `pnpm typecheck` | Useful for package boundary and exported type failures. |
| Unit tests | `pnpm test` | Runs workspace tests through Turbo. |
| Build | `pnpm build` | Catches package/app build failures. |
| Examples | `pnpm check:examples` | Use when README, examples, or sample payloads change. |
| Package boundaries | `pnpm check:boundaries` | Use when imports or package ownership changes. |
| Soroban contract tests | `pnpm contract:test` | Required for `contracts/treasury-escrow` behavior changes. |
| Soroban contract build | `pnpm contract:build` | Required when a contract build artifact or WASM compatibility is relevant. |

## Package Failures

For package failures under `packages/`:

- Check whether the edited package exports changed types, constants, validators, fixtures, or utilities.
- Run the package-related test, typecheck, and boundary command that matches the failure.
- Update downstream examples or docs if the public API changed.
- Do not hide a package break by weakening types, removing exports, or skipping tests.

## App Failures

For failures under `apps/web`:

- Check whether the error is build-time, type-level, lint-related, or a failing UI/test assertion.
- Include screenshots or manual verification notes when the change affects visible behavior.
- Keep testnet and mock/fixture limitations clear; do not imply mainnet support or live payment submission.
- Verify that UI changes still respect security and capability disclaimers.

## Dependency And Environment Issues

Dependency failures usually need evidence before being marked unrelated:

- Confirm the Node and pnpm versions match `package.json` (`node >=20`, `pnpm >=9`).
- Confirm the command was run after `pnpm install` in a clean checkout.
- If a lockfile or package manifest changed, explain why and keep the diff scoped.
- If the runner cannot download dependencies, link the log section showing the network or registry error.
- Do not commit generated dependency caches, local `.turbo` output, or `node_modules`.

## Workflow Or Runner Failures

If GitHub Actions itself fails before repository code runs:

- Link the failing job and the line showing the runner or workflow setup problem.
- Re-run only when the failure is clearly transient.
- Ask a maintainer for workflow help only when the log shows permissions, secrets, or repository-level configuration that contributors cannot change.

## What To Put In The PR

Update the PR description or a follow-up comment with:

- The failing check name.
- The command or log section that failed.
- The local command you ran, or why local reproduction was not possible.
- The commit that fixes the failure, or evidence that the failure is unrelated.
- Any remaining risk for reviewers.

## Approval And Reward Readiness

A PR with failing checks can still be merged in rare cases, but contributors should not assume it is reward-ready. GrantFox review can consider whether tests and CI support the completed issue scope. If CI is failing for an unrelated reason, leave clear evidence so maintainers and campaign reviewers do not have to infer it from a noisy log.

Related docs:

- [Local Setup](./LOCAL_SETUP.md)
- [Local Verification](./LOCAL_VERIFICATION.md)
- [Contributor Guide](./CONTRIBUTOR_GUIDE.md)
- [Contributor Payment Expectations](./CONTRIBUTOR_PAYMENT_EXPECTATIONS.md)