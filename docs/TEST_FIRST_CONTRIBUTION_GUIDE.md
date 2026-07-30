# Test-First Contribution Guide (issue #159)

## Principle

AnchorKit follows a test-first approach: before writing implementation code, write a test that defines the expected behavior. This ensures every change has a verifiable success criterion before any implementation begins.

## When tests are required

Tests are required for any change that affects runtime behavior — new functions, modified logic, contract changes, UI components, examples, fixtures, or schemas. Documentation-only, comment-only, and workflow-only changes may use a no-test justification.

See [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md#tests-are-expected) and [MINIMUM_TESTING_STANDARD.md](./MINIMUM_TESTING_STANDARD.md) for detailed area-specific expectations.

## Expected test types

| Area                                         | Test type                             | Tool                                  |
| -------------------------------------------- | ------------------------------------- | ------------------------------------- |
| Package utilities (`packages/*`)             | Unit tests                            | Vitest                                |
| Cross-package flows (`tests/integration`)    | Integration tests through public APIs | `pnpm test:integration`               |
| Contract logic (`contracts/treasury-escrow`) | Rust unit/integration tests           | `cargo test` via `pnpm contract:test` |
| Web UI (`apps/web`)                          | Unit tests + manual verification      | Vitest                                |
| Examples and fixtures                        | Schema validation                     | `pnpm check:examples`                 |
| Cross-package imports                        | Boundary checks                       | `pnpm check:boundaries`               |

## Test-first workflow

1. **Write a failing test first** — Express the expected behavior as a test assertion. Run it to confirm it fails.
2. **Implement until it passes** — Write the minimum code to satisfy the test. Run the test again to confirm it passes.
3. **Add negative-path tests** — Cover error cases, invalid inputs, and edge cases.
4. **Verify the full suite** — Run `pnpm verify` and any area-specific commands.

## Example: validator for anchor deposit requests

Start with a test that defines the expected behavior for an invalid input:

```ts
import { validateAnchorRequest } from "@anchorkit/anchor-utils";

it("rejects a deposit request with a missing asset code", () => {
  const result = validateAnchorRequest("deposit", {
    amount: "500.00",
    account: "GABC...PUB",
  });
  expect(result.ok).toBe(false);
  expect(result.errors[0].code).toBe("INVALID_DEPOSIT_METADATA");
});
```

This test will fail until `validateAnchorRequest` checks for the required `assetCode` field. Implement the check, then confirm the test passes. Add a happy-path test for a complete valid request once the negative case works.

## Example: diagnostics state mapping

Start with a test that defines the expected behavior for an edge case:

```ts
import { diagnoseAccount } from "@anchorkit/stellar-kit";

it("returns 'invalid' state for a malformed public key", async () => {
  const result = await diagnoseAccount("NOT_A_KEY", { network: "testnet" });
  expect(result.state).toBe("invalid");
  expect(result.balances).toBeUndefined();
});
```

Write the guard in `diagnoseAccount` that detects the malformed key before making any network call, then confirm the test passes.

## Happy-path and negative-path expectations

Every new or modified function should include:

- A **happy-path test** proving intended successful behavior with realistic inputs.
- At least one **negative-path test** when the change rejects, guards, validates, or handles errors.

See [MINIMUM_TESTING_STANDARD.md](./MINIMUM_TESTING_STANDARD.md#happy-path-expectations) for happy-path guidance and [MINIMUM_TESTING_STANDARD.md](./MINIMUM_TESTING_STANDARD.md#negative-path-expectations) for negative-path cases.

## No-test justification

When no automated test is added, include a specific justification explaining why. Acceptable justifications name the exact reason tests do not apply.

See [TEST_EVIDENCE_REQUIREMENT.md](./TEST_EVIDENCE_REQUIREMENT.md#acceptable-no-test-justifications) for acceptable justifications and the required PR evidence format.

## Local verification

Run the following before opening a PR:

```bash
pnpm verify
```

For changes touching fixtures, boundaries, or contracts, also run:

```bash
pnpm verify:full
```

See [LOCAL_VERIFICATION.md](./LOCAL_VERIFICATION.md) for the full command reference and per-area guidance.

## Related documentation

- [MINIMUM_TESTING_STANDARD.md](./MINIMUM_TESTING_STANDARD.md) — area-specific minimums and evidence expectations
- [TEST_EVIDENCE_REQUIREMENT.md](./TEST_EVIDENCE_REQUIREMENT.md) — PR evidence format and acceptable no-test justifications
- [LOCAL_VERIFICATION.md](./LOCAL_VERIFICATION.md) — local verification commands
- [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) — contribution workflow
- [MEANINGFUL_WORK_EXAMPLES.md](./MEANINGFUL_WORK_EXAMPLES.md) — worked examples of acceptable and insufficient contributions
