# Account diagnostics pipeline (issue #1)

AnchorKit exposes a shared `diagnoseAccount` / `diagnoseAccountInfo` pipeline in
`packages/stellar-kit/src/diagnostics.ts` so packages, UI, tests, and docs can
run account diagnostics without duplicating logic or touching secrets.

## Result type

```ts
interface AccountDiagnostic {
  input: string;              // the (possibly invalid) public key supplied
  state: AccountDiagnosticState; // funded | unfunded | invalid | unavailable | unknown
  isValidPublicKey: boolean;  // structural validity of the key
  expertUrl: string | null;   // Stellar Expert link (null when key invalid)
  reserve: ReserveInfo | null;// min-balance awareness (funded accounts only)
  balances: AccountBalanceModel; // total / reserve / spendable / unavailable
  account: AccountInfo | null;// raw account data (never includes secrets)
  error: string | null;       // user-safe error message
}
```

States go beyond the raw `AccountStatus`:

- `invalid` — input is not a valid public key (no network call).
- `unavailable` — network/parse failure (degrades gracefully, no throw).
- `unknown` — catch-all when status can't be determined.

## Reserve awareness

`computeReserve(subentryCount)` returns the Stellar minimum balance:

```
minimumBalanceXlm = (BASE_ENTRY_COUNT + subentryCount) × STELLAR_BASE_RESERVE_XLM
                  = (2 + subentryCount) × 0.5
```

plus a human-readable `explanation` string for UI tooltips.

A bare account therefore reserves **1 XLM** (2 base entries × 0.5), and each
additional subentry — a trustline, offer, signer, or data entry — adds 0.5 XLM.

### Reserve assumptions

- The base reserve is treated as a constant 0.5 XLM. It is a network parameter
  that validators can change; this model does not read it from the ledger.
- The two base entries are part of the entry count, not an extra flat charge on
  top of it.
- Sponsored reserves are not modelled: an account whose entries are sponsored by
  another account has a lower effective minimum balance than reported here.

## Spendable balance model

`computeBalanceModel(info)` splits the native balance into what can actually be
spent:

```ts
interface AccountBalanceModel {
  state: "known" | "unknown";
  total: string | null;       // full native balance
  reserve: string | null;     // locked by the minimum balance
  spendable: string | null;   // total - reserve, never negative
  unavailable: string | null; // the locked portion
  explanation: string;        // carries no amounts when state is "unknown"
}
```

Amounts are decimal strings normalized to 7 places. For every `"known"` model
the invariant `spendable + unavailable === total` holds.

| Account | Result |
|---|---|
| Funded, 100 XLM, 3 subentries | `total 100`, `reserve 2.5`, `spendable 97.5` |
| Funded, 0.5 XLM, no subentries | `spendable 0` — clamped, never negative |
| Unfunded | all amounts `0`, with the amount needed to exist |
| Network error / no balances | `state: "unknown"`, **every amount `null`** |

### Do not overstate

Two limits are deliberate, and both are why `unknown` carries no numbers:

- **`unknown` is not zero.** When account data is unavailable the model reports
  `null`, never a placeholder figure a user might act on.
- **Selling liabilities are not subtracted.** Horizon reports them but
  `AccountBalances` does not carry them, so for an account with open offers the
  real spendable amount is lower. Treat `spendable` as an upper bound.

## Payment readiness

`estimateTransactionReadinessSync` accepts an optional `sourceBalances` model.
It is opt-in: omit it and readiness behaves exactly as before.

- Native payment above the spendable balance → `INSUFFICIENT_FUNDS`, severity
  `error`, so `ready` becomes `false`.
- Balance unknown → `SPENDABLE_UNKNOWN`, severity `info`. **Never an error** —
  an unavailable balance is not evidence that funds are missing.
- Issued-asset payments are not checked against the XLM reserve.

The async `estimateTransactionReadiness` fills this in automatically by loading
the source account in full, at no extra network cost.

## Usage

```ts
import { diagnoseAccount } from "@anchorkit/stellar-kit";

const diag = await diagnoseAccount("GABC…", { network: "testnet" });
if (diag.state === "funded") {
  console.log(diag.reserve?.minimumBalanceXlm, diag.expertUrl);
}
```

For already-loaded data, use the synchronous `diagnoseAccountInfo(info)`.

## Safety

Only the public key is carried through. No secret keys, friendbot secrets, or
internal values are included in the diagnostic output.
