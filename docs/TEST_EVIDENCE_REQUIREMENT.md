# Test Evidence PR Requirement

AnchorKit pull requests must include enough verification evidence for maintainers and campaign reviewers to understand what was tested, what was not tested, and why the evidence matches the issue scope.

This requirement applies to code, contracts, examples, fixtures, documentation, and workflow changes. Docs-only changes still need a short verification note explaining that no runtime behavior changed.

## Required PR Evidence

Every PR should include the following evidence in the pull request description:

| Required item | What to provide |
| ------------- | --------------- |
| Affected packages or apps | Check each touched workspace in the PR template and list any extra paths. |
| Tests added or updated | Name the test files, snapshots, fixtures, examples, or manual cases changed. |
| Commands run | Include exact commands such as `pnpm verify`, `pnpm test`, `pnpm build`, or `pnpm contract:test`. |
| CI status | State whether GitHub checks are passing, failing, pending, skipped, or unrelated. |
| No-test justification | Explain why no test was added when the change is docs-only, configuration-only, or otherwise not testable. |
| Residual risk | Mention anything reviewers should re-check, especially security, mainnet-safety, or contract behavior. |

## Matching Evidence To Scope

Use evidence that covers the actual files and behavior changed:

- Package utility or validator changes should include unit tests and `pnpm typecheck` when public types change.
- Fixture, schema, or example changes should include `pnpm check:examples` when examples are affected.
- Cross-package import changes should include `pnpm check:boundaries` when ownership boundaries are involved.
- Web UI changes should include screenshots or manual verification steps plus relevant app build/test evidence.
- Soroban contract changes should include `pnpm contract:test`; use `pnpm contract:build` when WASM build compatibility matters.
- Documentation-only changes should state that no runtime tooling was required and identify the docs reviewed.

## Acceptable No-Test Justifications

A no-test justification is acceptable only when it is specific:

- `Docs-only: updated README and docs guide; no runtime behavior changed.`
- `Comment-only: clarified existing API docs; no code path changed.`
- `Workflow-only: changed issue template copy; verified rendered Markdown and links.`

Avoid vague explanations such as `not needed`, `small change`, or `CI will catch it`. If the issue requested test coverage, a no-test justification is usually not enough.

## CI Status Language

Use clear status language:

- `Passing`: all required checks completed successfully.
- `Pending`: checks are still running; update the PR when they finish.
- `Failing, fixed in <commit>`: the failure was caused by the PR and the fix has been pushed.
- `Failing, unrelated`: include the job link and log line showing a runner, dependency, or upstream failure unrelated to the diff.
- `Skipped`: explain why the check did not run and whether a maintainer needs to trigger it.

See [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md) when checks fail.

## Example PR Evidence Block

```md
## Testing performed

- Affected packages/apps: `packages/validators`, `docs/`
- Tests added/updated: `packages/validators/src/payment-intent.test.ts`
- Commands run: `pnpm test --filter=@anchorkit/validators`, `pnpm typecheck`
- CI status: pending at submission; will update when complete
- No-test justification: N/A, tests were added
- Residual risk: reviewer should confirm testnet-only wording remains accurate
```

## Related Guides

- [Local Verification](./LOCAL_VERIFICATION.md)
- [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md)
- [Acceptance Criteria Completion](./ACCEPTANCE_CRITERIA_COMPLETION.md)
- [Issue Approval Readiness Checklist](./ISSUE_APPROVAL_READINESS.md)