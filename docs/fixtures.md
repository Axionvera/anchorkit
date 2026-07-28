# Shared Fixture Framework (issue #59)

`@anchorkit/fixtures` is the single home for deterministic test fixtures used
across AnchorKit's TypeScript packages — accounts, payments, assets, anchor
requests/lifecycles, escrow events/milestones, account diagnostics, and
deliberately invalid inputs. It replaces fixtures that used to be duplicated
or hand-rolled inside `anchor-utils`, `stellar-kit`, and `validators` tests.

## Why a separate package

Before this package existed, sample data lived in a few different places:

- `packages/anchor-utils/src/fixtures.ts` (shipped as part of the public
  `anchor-utils` runtime package, even though it's only test/demo data);
- `packages/stellar-kit/test/fixtures/escrowEvents.ts` (private to one
  package's tests);
- ad-hoc literals inlined directly in `validators` and `stellar-kit` test
  files.

Centralizing fixtures in `@anchorkit/fixtures`:

- removes duplication (the same friendbot key, sample tx hash, and escrow
  contract id no longer need to be re-typed in five places);
- keeps fixtures deterministic (fixed ISO timestamps, no `Date.now()`);
- gives every package a single, low-level dependency (`types` only) to pull
  test data from, without creating a dependency cycle;
- makes "no real secrets in fixtures" a one-file rule to audit instead of a
  repo-wide grep.

## No real secrets or user data

Every value in this package is either:

- a public, well-known testnet address (e.g. the Stellar Laboratory
  friendbot operator), or
- a synthetic value that has never held real funds and was never derived
  from a real user's key material.

**No secret key (`S...`) belonging to a real account is ever committed here.**
Where a test needs a structurally valid secret key (e.g.
`packages/stellar-kit/test/keys.test.ts`), it is generated at test-run time
via `Keypair.random()`, never hardcoded.

This mirrors the same rule already enforced for `examples/` — see
[Examples](./examples.md) and
[docs/ARCHITECTURE.md §7](./ARCHITECTURE.md#7-examples-boundary).

## Modules

| Module             | Exports                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `constants.ts`      | Shared public keys, the sample transaction hash, the escrow contract id, and a base timestamp |
| `assets.ts`         | `sampleNativeAsset`, `sampleIssuedAsset`                                                     |
| `accounts.ts`       | Funded/unfunded `AccountInfo` fixtures, plus `fundedAccounts` / `unfundedAccounts` arrays     |
| `payments.ts`       | `samplePaymentIntent`, `invalidPaymentIntent`                                                |
| `anchors.ts`        | `sampleDepositRequest`, `sampleWithdrawalRequest`, `buildDepositLifecycle`, `buildWithdrawalLifecycle` |
| `escrow.ts`         | Raw escrow event fixtures (`milestoneCreatedRaw`, ..., `allEscrowEventsRaw`) and `sampleMilestoneLifecycle()` |
| `diagnostics.ts`    | Deterministic `AccountInfo` inputs for funded / unfunded / unavailable diagnostics states     |
| `invalid.ts`        | `invalidDepositRequest`, `invalidWithdrawalRequest`, `invalidAnchorAssetConfig`, `invalidCallbackUrl`, `invalidAmount` |
| `index.ts`          | Re-exports every module above                                                                |

## Usage

```typescript
import {
  sampleDepositRequest,
  buildDepositLifecycle,
  invalidDepositRequest,
} from "@anchorkit/fixtures";
import { validateDepositRequest } from "@anchorkit/validators";

const ok = validateDepositRequest(sampleDepositRequest);   // ok.ok === true
const bad = validateDepositRequest(invalidDepositRequest); // bad.ok === false

const timeline = buildDepositLifecycle(); // 4 deterministic records
```

## Relationship to `examples/`

`examples/*.json` and `@anchorkit/fixtures` describe overlapping data
(friendbot key, sample deposit/withdrawal shapes, escrow events, etc.), but
serve different purposes:

| | `examples/` | `@anchorkit/fixtures` |
| --- | --- | --- |
| Format | JSON files | TypeScript values |
| Consumer | `scripts/check-examples.mts`, `examples/registry.ts`, docs | Package test suites (`import`able) |
| Purpose | Executable documentation / schema-drift guard | Shared test data across packages |

Where a fixture mirrors an example file, its module doc comment says so.
Keep both in sync when the underlying shape changes — see
[Examples](./examples.md).

## Package boundary

`@anchorkit/fixtures` depends only on `@anchorkit/types` (branded type casts,
no runtime coupling). It must not depend on `config`, `validators`,
`stellar-kit`, or `anchor-utils`, so any package can import it — including as
a test-only dependency — without introducing a cycle. See
[docs/ARCHITECTURE.md §5.3](./ARCHITECTURE.md#53-anchorkitfixtures).

`@anchorkit/anchor-utils` re-exports the lifecycle/invalid fixtures it used
to own directly from `@anchorkit/fixtures`, so existing imports (including
the `apps/web` anchors page) keep working unchanged.

## Adding a new fixture

1. Add the value to the appropriate module (or create a new one for a new
   domain).
2. Re-export it from `src/index.ts` if you added a new module.
3. Add a smoke assertion in `packages/fixtures/test/fixtures.test.ts`.
4. If the fixture mirrors (or should mirror) an `examples/*.json` file, note
   that relationship in the module's doc comment.
5. Run `pnpm --filter=@anchorkit/fixtures build && pnpm --filter=@anchorkit/fixtures test`.
