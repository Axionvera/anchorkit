# Acceptance Criteria Audit Template

Use this template in pull request descriptions or review comments when an AnchorKit issue has multiple acceptance criteria. The goal is to make completeness visible before a PR is treated as ready for evaluation.

## Audit Table

| Acceptance criterion | Implementation evidence | Test evidence | Documentation impact | Status |
| --- | --- | --- | --- | --- |
| Paste the exact criterion from the issue. | Link files, functions, components, docs, examples, or commits that satisfy it. | Name the unit, integration, static, fixture, or manual check that proves it. | Say `Updated`, `Not applicable`, or name the changed doc/example. | `Complete`, `Partial`, `Blocked`, or `Not started`. |

## Status Rules

- `Complete`: the criterion is implemented, covered by appropriate evidence, and scoped to the issue.
- `Partial`: some behavior is present, but tests, docs, edge cases, or one required path are still missing.
- `Blocked`: completion depends on a maintainer decision, unavailable fixture, upstream API, or issue clarification.
- `Not started`: the criterion has not been addressed and should not be hidden behind unrelated work.

## Required Notes

- List every incomplete criterion with a short follow-up plan or explicit reason it is out of scope.
- Call out any failing CI check and whether it is branch-caused or unrelated, with evidence.
- State when no documentation changed and why that is safe.
- Mention unsupported testnet, mock, dashboard-only, or non-production behavior when relevant.
- Avoid broad claims like "all criteria met" unless every row above is marked `Complete`.

## Example

| Acceptance criterion | Implementation evidence | Test evidence | Documentation impact | Status |
| --- | --- | --- | --- | --- |
| Add validation for unsupported Stellar assets. | `packages/stellar-kit/src/assets.ts` rejects unknown assets before building operations. | `packages/stellar-kit/test/assets.test.ts` covers supported, unknown, and malformed assets. | `docs/asset-registry.md` documents the supported asset list. | `Complete` |
| Keep mainnet behavior disabled by default. | The new guard reads the existing testnet-first network flag. | Static check confirms no mainnet fallback path was added. | `docs/STELLAR_TESTNET_USAGE.md` already covers this default. | `Complete` |
| Add dashboard copy for the new error. | Not implemented yet. | No UI test exists yet. | Not applicable until UI copy exists. | `Partial` |