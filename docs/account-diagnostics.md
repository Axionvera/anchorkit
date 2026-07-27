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
minimumBalanceXlm = 2 (base) + (subentryCount + 2) × 0.5
```

plus a human-readable `explanation` string for UI tooltips.

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
