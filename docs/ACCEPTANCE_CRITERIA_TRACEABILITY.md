# Acceptance Criteria Traceability Table

Use this table when an AnchorKit issue spans multiple packages, apps, contracts, docs, examples, or behavior changes. It extends the basic completion table by showing how each acceptance criterion maps to concrete repository surfaces and verification evidence.

## When To Use This

Use the traceability table when a PR changes more than one area, such as:

- A package utility plus README or examples.
- A dashboard UI state plus fixture or validator behavior.
- A Soroban contract change plus docs and tests.
- A GrantFox / Maybe Rewarded issue with several acceptance criteria.

For small docs-only changes, the simpler acceptance criteria completion table may be enough.

## Traceability Table Format

Copy one row per acceptance criterion into the PR description or a review comment.

| Acceptance criterion | Affected package/app/contract | Files or symbols | Behavior delivered | Tests / verification | Docs / examples | CI status | Status |
| -------------------- | ----------------------------- | ---------------- | ------------------ | -------------------- | --------------- | --------- | ------ |
| Paste exact criterion. | `packages/validators`, `apps/web`, `contracts/treasury-escrow`, `docs/`, etc. | File paths plus exported function, component, script, route, or contract entrypoint. | Explain the user-visible or reviewer-visible behavior that satisfies the criterion. | Test files, test names, commands, screenshots, manual checks, or no-test justification. | Linked guide, README row, fixture, example, screenshot, or `Not applicable`. | `Passing`, `Pending`, `Failing-fixed`, `Failing-unrelated`, or `Skipped`. | `Complete`, `Partial`, `Blocked`, or `Not started`. |

## Field Guidance

### Acceptance criterion

Paste the exact issue checkbox text. Do not paraphrase away important scope words such as `all`, `negative path`, `examples`, `CI`, `contract`, or `README`.

### Affected package/app/contract

Name each affected surface:

- `apps/web` for dashboard behavior.
- `packages/types`, `packages/config`, `packages/fixtures`, `packages/validators`, `packages/stellar-kit`, or `packages/anchor-utils` for workspace package changes.
- `contracts/treasury-escrow` for Soroban contract changes.
- `docs/`, `examples/`, `.github/`, or `scripts/` when workflow/documentation surfaces change.

### Files or symbols

Point reviewers at exact files and symbols, not only broad folders. Examples:

- `packages/validators/src/payment-intent.ts::parsePaymentIntent`
- `apps/web/app/payments/page.tsx::PaymentsPage`
- `contracts/treasury-escrow/src/lib.rs::release_funds`
- `docs/MINIMUM_TESTING_STANDARD.md`

### Tests / verification

Map tests to the criterion they prove. Use `Not applicable` only with a specific no-test justification, such as docs-only or template-only work.

### Docs / examples

List the docs, fixtures, examples, screenshots, or README rows that changed. If no documentation was needed, explain why the behavior is internal or already documented.

## Example

| Acceptance criterion | Affected package/app/contract | Files or symbols | Behavior delivered | Tests / verification | Docs / examples | CI status | Status |
| -------------------- | ----------------------------- | ---------------- | ------------------ | -------------------- | --------------- | --------- | ------ |
| Add validation for unsupported assets. | `packages/validators` | `packages/validators/src/payment-intent.ts::parsePaymentIntent` | Rejects unsupported asset codes before a payment intent is accepted. | `packages/validators/src/payment-intent.test.ts`; `pnpm test --filter=@anchorkit/validators`; negative case for unsupported code. | `docs/PAYMENT_INTENT_UTILITIES.md` updated with rejection behavior. | `Passing` | `Complete` |
| Update dashboard error copy. | `apps/web` | `apps/web/app/payments/page.tsx::PaymentErrorState` | Displays a testnet-only error when payment intent validation fails. | Manual dashboard check at `/payments`; screenshot attached. | README unchanged because the behavior is already covered by dashboard docs. | `Pending` | `Complete` |
| Add contract deadline rejection. | `contracts/treasury-escrow` | `contracts/treasury-escrow/src/lib.rs::release_funds` | Rejects release before deadline unless milestone is validated. | `pnpm contract:test`; `test_release_before_deadline_rejected`. | `docs/SOROBAN_ESCROW_CONTRACT.md` updated. | `Passing` | `Complete` |

## Related Guides

- [Acceptance Criteria Completion](./ACCEPTANCE_CRITERIA_COMPLETION.md)
- [Acceptance Criteria Audit Template](./ACCEPTANCE_CRITERIA_AUDIT_TEMPLATE.md)
- [Contributor Self-Review Template](./CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md)
- [Test Evidence PR Requirement](./TEST_EVIDENCE_REQUIREMENT.md)
- [Minimum Testing Standard](./MINIMUM_TESTING_STANDARD.md)