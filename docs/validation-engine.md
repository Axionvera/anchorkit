# Anchor Validation Engine

AnchorKit provides a **shared validation engine** for anchor deposit/withdrawal
request metadata, anchor asset configuration, and callback URLs. It is the
uniform surface UI forms, package helpers, and SEP-style servers should use to
validate input (issue #6).

> Implementation:
> - `packages/validators/src/validationEngine.ts` — the engine.
> - `packages/validators/src/index.ts` — Zod schemas (`DepositRequestMetadataSchema`, etc.).
> - `packages/anchor-utils/src/index.ts` — re-exports `validateAnchorRequest` + engine helpers.

## Why an engine (not just Zod)

The underlying Zod schemas already exist, but raw `safeParse` results force
callers to inspect Zod's internal `ZodError`. The engine wraps each schema in a
stable, consumer-friendly `ValidationResult<T>`:

```ts
type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

interface ValidationError {
  code: AnchorValidationErrorCode; // stable, branchable
  message: string;                 // user-safe, no secrets
  field?: string;                  // path, e.g. "account"
}
```

This keeps error handling consistent across deposit, withdrawal, asset config,
and callback validation, and makes errors safe to surface in a UI.

## Validators

| Function | Validates | Error code on failure |
|---|---|---|
| `validateDepositRequest(input)` | `DepositRequestMetadata` | `INVALID_DEPOSIT_METADATA` |
| `validateWithdrawalRequest(input)` | `WithdrawalRequestMetadata` | `INVALID_WITHDRAWAL_METADATA` |
| `validateAnchorAssetConfig(input)` | `AnchorAssetConfig` | `INVALID_ASSET_CONFIG` |
| `validateCallbackUrl(input)` | `string` (URL) | `INVALID_CALLBACK_URL` |
| `validateAmount(input)` | `string` (Stellar amount) | `INVALID_AMOUNT` |
| `validateAnchorRequest(kind, input)` | deposit or withdrawal by `kind` | per kind |

`validateAnchorRequest(kind, input)` is a convenience dispatcher so callers
don't branch on `kind` before validating.

## Usage

```ts
import { validateAnchorRequest, firstErrorMessage } from '@anchorkit/anchor-utils';

const result = validateAnchorRequest('deposit', draft);
if (!result.ok) {
  // result.errors: ValidationError[] — safe to show users
  console.error(result.errors.map((e) => `[${e.code}] ${e.message}`).join('; '));
} else {
  // result.value: DepositRequestMetadata
  submit(result.value);
}

// Or just the first user-safe message:
const msg = firstErrorMessage(result);
```

## What is validated

- **Deposit metadata**: asset code, positive amount, valid Stellar `account`
  (G…, 56 base32 chars), optional memo/email/rail.
- **Withdrawal metadata**: same plus a non-empty external `dest`.
- **Anchor asset config**: code/issuer, `schema` enum, enabled flags, optional
  min/max/fee fields.
- **Callback URL**: must be a valid URL; HTTPS required in production
  (`localhost` allowed for testing).
- **Amount**: Stellar amount rules (max 7 decimals, within configured bounds).

These rules live in the Zod schemas in `packages/validators/src/index.ts`.

## Fixtures & tests

- Valid samples: `packages/anchor-utils/src/fixtures.ts` (`sampleDepositRequest`,
  `sampleWithdrawalRequest`).
- Invalid samples: same file (`invalidDepositRequest`,
  `invalidWithdrawalRequest`, `invalidAnchorAssetConfig`, `invalidCallbackUrl`,
  `invalidAmount`).
- Tests: `packages/validators/test/validationEngine.test.ts` (16 tests, valid +
  invalid paths) and `packages/anchor-utils/test/anchor.test.ts` (18 tests).

## Web demo

`apps/web/app/anchors/page.tsx` has a "Validation engine" panel that runs
`validateAnchorRequest` / `validateCallbackUrl` live and renders typed errors
with their codes and field paths.

## Compatibility

- The engine is additive; existing `parse*Metadata` / `is*Valid` helpers in
  `anchor-utils` still exist and remain usable.
- MVP/testnet oriented: amount bounds and memo limits come from
  `DEFAULT_ENV_CONFIG` in `@anchorkit/config`.
