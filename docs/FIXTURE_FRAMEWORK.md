# Shared Test Fixtures

AnchorKit provides a shared fixture framework for deterministic, reusable test data. Fixtures are consumed by package tests, web examples, and documentation.

## Fixture location

All shared fixtures live under `packages/stellar-kit/test/fixtures/`:

```
packages/stellar-kit/test/fixtures/
├── index.ts        # Re-exports everything — single import point
├── accounts.ts     # Funded/unfunded AccountInfo objects
├── payments.ts     # Valid/invalid PaymentIntent fixtures
├── assets.ts       # Native + issued asset fixtures
├── anchors.ts      # Deposit/withdrawal requests + lifecycle records
├── escrow.ts       # Escrow milestone lifecycle fixtures
├── readiness.ts    # Transaction readiness scenarios
├── receipts.ts     # Transaction receipt fixtures
└── secrets.ts      # Runtime-generated fake secrets + well-known public keys
```

## Usage in tests

Import from the shared fixtures index:

```ts
import {
  FUNDED_ACCOUNT_INFO,
  VALID_PAYMENT_INTENT,
  ESCROW_MILESTONE_DRAFT,
  BALANCE_MODEL_KNOWN,
} from "./fixtures";
```

Or import from individual modules:

```ts
import { FUNDED_ACCOUNT } from "./fixtures/accounts";
import { makeFakeSecret } from "./fixtures/secrets";
```

## Adding new fixtures

1. Add the fixture to the appropriate category file (e.g. `accounts.ts`).
2. Export it from `index.ts`.
3. If it is a JSON fixture intended for schema validation, add an entry to `examples/registry.ts`.
4. Import in tests — never duplicate inline data.

## Rules

- **No real secret keys.** Use `makeFakeSecret()` or `makeFakeKeypair()` for runtime-generated values.
- **No real user data.** All public keys are testnet Friendbot accounts or synthetic values.
- **Deterministic where possible.** Use fixed timestamps and known public keys for snapshot-friendly tests.
- **Runtime-generated secrets only.** The `secrets.ts` module generates S-prefixed 56-char keys at test time to avoid secret scanner false positives.

## Example: `examples/` JSON fixtures

The `examples/` directory contains JSON fixture files validated by `packages/validators/test/examples.test.ts` against Zod schemas. The registry (`examples/registry.ts`) maps each file to its schema and expected validation outcome.

## Categories

| Module | Fixtures | Key types |
|--------|----------|-----------|
| `accounts` | `FUNDED_ACCOUNT_INFO`, `UNFUNDED_ACCOUNT_INFO`, `NETWORK_ERROR_ACCOUNT_INFO`, etc. | `AccountInfo` |
| `payments` | `VALID_PAYMENT_INTENT`, `INVALID_PAYMENT_INTENT_BAD_AMOUNT`, etc. | `PaymentIntent` |
| `assets` | `NATIVE_ASSET`, `ISSUED_ASSET_USDC`, etc. | `StellarAsset` |
| `anchors` | `VALID_DEPOSIT_REQUEST`, `DEPOSIT_LIFECYCLE`, etc. | `DepositRequestMetadata`, `AnchorTransactionRecord` |
| `escrow` | `ESCROW_MILESTONE_DRAFT`, `ESCROW_MILESTONES_HAPPY_PATH`, etc. | `Milestone` |
| `readiness` | `READY_INTENT`, `BALANCE_MODEL_KNOWN`, `READINESS_SCENARIOS` | `PaymentIntent`, `AccountBalanceModel` |
| `receipts` | `RECEIPT_CONFIRMED`, `RECEIPTS_ARRAY`, etc. | `TransactionReceipt` |
| `secrets` | `makeFakeSecret()`, `FRIENDBOT_PUBLIC_KEY`, `SAMPLE_TX_HASH` | `string` |
