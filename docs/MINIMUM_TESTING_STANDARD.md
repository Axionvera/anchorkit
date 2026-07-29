# Minimum Testing Standard

AnchorKit changes should include the smallest meaningful verification set that proves the changed behavior. This standard helps contributors decide when to add unit tests, integration tests, negative-path tests, fixtures, screenshots, or manual verification notes.

Docs-only changes can use a no-test justification, but changes to payments, anchors, escrow flows, diagnostics, validators, examples, or web UI should normally include targeted evidence.

## Baseline For Every PR

Every pull request should document:

- Affected packages, apps, contracts, docs, examples, scripts, or fixtures.
- Tests added or updated, or a specific no-test justification.
- Commands run and current CI status.
- Any manual verification, screenshots, or residual risk.

Use [TEST_EVIDENCE_REQUIREMENT.md](./TEST_EVIDENCE_REQUIREMENT.md) for the PR evidence format.

## Area-Specific Minimums

| Change area | Minimum expected evidence |
| ----------- | ------------------------- |
| Payment utilities and payment intents | Unit tests for happy path, invalid asset/amount, malformed destination, and unsupported network or testnet/mainnet assumptions. |
| Anchor and SEP helpers | Tests for supported anchor metadata, missing fields, invalid URLs, network mismatch, and error normalization. |
| Escrow flows and Soroban contract logic | Contract tests for valid state transitions, unauthorized callers, invalid timestamps, missing vaults, and terminal-state rejection. Use `pnpm contract:test` when `contracts/` changes. |
| Diagnostics and status mapping | Unit tests for each severity/status bucket, unknown inputs, stale data, and degraded dependency cases. |
| Validators and schemas | Positive and negative tests for required fields, boundary values, unsafe strings, and rejected malformed payloads. |
| Fixtures and examples | Example validation or fixture tests proving examples still parse and match the documented API shape. |
| Web UI | Build/type evidence plus screenshots or manual verification for visible state, loading/empty/error states, and responsive layout when UI changes. |
| Documentation-only | Link/render review and a no-runtime-change justification. Update README or docs index when adding a new guide. |

## Happy-Path Expectations

Happy-path tests should prove the intended successful behavior with realistic AnchorKit inputs:

- Valid Stellar testnet account or fixture data where account behavior is documented.
- Valid payment intent or anchor metadata for package utilities.
- Valid escrow state transition for contract behavior.
- Valid UI state for dashboard flows, including the expected label or output.

A happy-path-only PR is usually insufficient when the issue touches validation, security, balances, signing assumptions, network selection, escrow state, callbacks, or external URLs.

## Negative-Path Expectations

Add at least one negative-path test when the change rejects, guards, validates, normalizes, or routes around unsafe input. Useful negative cases include:

- Empty or malformed Stellar addresses.
- Unsupported assets, networks, anchors, or callback URLs.
- Missing required fields in schema or fixture data.
- Unauthorized contract caller or missing admin authorization.
- Expired, future, duplicate, or out-of-order timestamps.
- Dashboard loading, empty, and error states.

## Manual Verification And Screenshots

Manual verification is acceptable when automated coverage is impractical, especially for visual-only UI or documentation behavior. Include:

- Browser, viewport, and route inspected.
- Before/after screenshot or short description of visible behavior.
- Any limitation, such as mock-only data or testnet-only behavior.
- Confirmation that no production/mainnet flow was exercised.

## No-Test Justification

A no-test justification must name why tests are not useful for the change:

- `Docs-only: added testing guidance and README link; no runtime behavior changed.`
- `Template-only: updated PR checklist text; verified Markdown links by inspection.`
- `Comment-only: clarified an existing code comment without changing behavior.`

Do not use `small change` or `CI will catch it` as a substitute for evidence.

## Commands Reference

Common commands:

```bash
pnpm verify
pnpm verify:full
pnpm test
pnpm typecheck
pnpm build
pnpm check:examples
pnpm check:boundaries
pnpm contract:test
pnpm contract:build
```

Run the smallest command set that covers the changed area, and explain any skipped command.

## Related Guides

- [Local Verification](./LOCAL_VERIFICATION.md)
- [Test Evidence PR Requirement](./TEST_EVIDENCE_REQUIREMENT.md)
- [Failing CI Response Guide](./FAILING_CI_RESPONSE_GUIDE.md)
- [Issue Approval Readiness Checklist](./ISSUE_APPROVAL_READINESS.md)