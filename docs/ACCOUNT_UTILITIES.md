# Account Utilities

Implemented in `packages/stellar-kit/src/keys.ts` and `packages/stellar-kit/src/accounts.ts`.

## Keypair generation

```ts
import { generateTestnetKeypair, secretKeyToRedactedString } from "@anchorkit/stellar-kit";

const kp = generateTestnetKeypair();
console.log("public", kp.publicKey);
console.log("secret (redacted)", secretKeyToRedactedString(kp.secretKey));
```

- Returns a branded `StellarPublicKey` / `StellarSecretKey`.
- Underlying implementation uses `@stellar/stellar-sdk/Keypair.random()`.
- Does not touch the network.

## Validation

| Function | Input | Behaviour |
| --- | --- | --- |
| `validatePublicKey(str)` | any string | Zod SafeParseReturnType |
| `isPublicKeyValid(str)` | any string | boolean |
| `assertPublicKeyValid(str)` | any string | Throws typed `StellarKitError` |
| `validateSecretKey(str)` | any string | Zod SafeParseReturnType |
| `validateSecretKeyQuietly(str)` | any string | `{ valid, errorCode }`, no allocations beyond a few |
| `isSecretKeyValid(str)` | any string | boolean |

Validation checks:
- Exact length 56 characters
- Correct prefix (`G` for public, `S` for secret)
- Characters drawn from `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567` (RFC4648 base32, no padding)

**Important**: These checks are structural only. A key can pass validation and still not be a
valid Stellar keypair (e.g. the CRC checksum inside the strkey is wrong). `Keypair.fromSecret`
in `getPublicKeyFromSecret` will catch those cases and throw a redacted error.

## Redaction helpers

```ts
redactSecretKey(secret);        // { __redacted: true, prefix, suffix }
formatRedactedSecret(redacted); // "SCAB••••••••••ZU5R"
secretKeyToRedactedString(str); // directly returns formatted version
```

Use these anywhere a secret would be surfaced (errors, UI, debug output).

## Loading account data

```ts
import { loadAccount, getAccountStatus } from "@anchorkit/stellar-kit";

const info = await loadAccount("GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR");
// info.status ∈ {"funded","unfunded","unknown","error"}
// info.balances.native, info.balances.assets[]
```

`loadAccount` maps common Horizon failures into deterministic AccountStatus values:

- Horizon returns a 404 → `unfunded`
- Horizon timeout / DNS fail → `unknown`
- Other Horizon error → `error`
- Success → `funded` plus balances, sequence, subentry count, last modified ledger.

## Links

- `getTestnetFriendbotUrl(pubkey) → string | null` — direct link to fund a testnet account.
- `getStellarExpertAccountUrl(pubkey, network?) → string | null`
- `getHorizonAccountUrl(pubkey, network?) → string | null`
