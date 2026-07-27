# Stellar Expert links & transaction hash parser (issue #10)

AnchorKit centralizes all stellar.expert explorer links and transaction-hash
parsing in `packages/stellar-kit/src/explorer.ts`. The UI never hardcodes
explorer URLs — it imports the helpers below.

## Helpers

| Function | Purpose |
| --- | --- |
| `buildAccountLink(pk, network?)` | Stellar Expert account URL (throws on invalid key). |
| `buildTransactionLink(hash, network?)` | Stellar Expert transaction URL (throws on invalid hash). |
| `parseTransactionHash(input, network?)` | Safe (non-throwing) tx hash parser → `{ ok, value | error }`. |
| `parseAccountId(input, network?)` | Safe public-key parser → `{ ok, value | error }`. |
| `explorerBaseUrl(network)` | Per-network base (`/testnet`, `/public`, `/futurenet`). |
| `getStellarExpertAccountUrl(pk, network?)` | Backwards-compatible alias for `buildAccountLink`. |

## Network awareness

`network` is `"testnet" | "mainnet" | "futurenet"`. Testnet →
`stellar.expert/explorer/testnet`, mainnet → `stellar.expert/explorer/public`.

## Invalid input

- `buildAccountLink` / `buildTransactionLink` **throw** on invalid input.
- `parseTransactionHash` / `parseAccountId` return `{ ok:false, error }` so
  callers can branch without try/catch. Invalid hashes (non-64-hex) and invalid
  public keys (not 56-char base32 `G…`) are rejected by the shared validators.

## Example

```ts
import { parseTransactionHash, buildAccountLink } from "@anchorkit/stellar-kit";

const r = parseTransactionHash("d".repeat(64), "testnet");
if (r.ok) console.log(r.value.url); // https://stellar.expert/explorer/testnet/tx/dddd…

buildAccountLink("GABC…", "mainnet");
```
