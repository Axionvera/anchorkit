# Network-aware asset registry (issue #23)

AnchorKit provides a typed, network-aware asset registry on top of the shared
`StellarAsset` primitives. It distinguishes native XLM, issued assets,
testnet-only assets, and unsupported assets, and returns a typed
`ASSET_UNSUPPORTED` error for assets that are structurally valid but not
permitted on the target network.

## Core types

```ts
type AssetSupport = "supported" | "testnetOnly" | "unsupported";

interface RegistryEntry {
  asset: StellarAsset;
  networks: StellarNetwork[];   // networks where the asset is allowed
  testnetOnly?: boolean;         // demo/testnet issued asset
  note?: string;
}

interface AssetLookupResult {
  asset: StellarAsset;
  network: StellarNetwork;
  support: AssetSupport;
  entry: RegistryEntry | null;
  error: { code: "ASSET_UNSUPPORTED"; message: string } | null;
}
```

## API

- `createAssetRegistry(entries)` — build a registry (native XLM is always
  supported implicitly; no need to list it).
- `lookupAsset(asset, network, registry?)` — returns the support state without
  throwing.
- `validateAssetOnNetwork(asset, network, registry?)` — validates structure AND
  network support; throws `ASSET_INVALID` or `ASSET_UNSUPPORTED`.
- `checkAssetOnNetwork(asset, network, registry?)` — safe variant returning
  `{ ok: true, value } | { ok: false, code, error }`.
- `DEFAULT_TESTNET_REGISTRY` — MVP registry defaulting to safe testnet examples
  (native XLM + a demo testnet USDC).

## Behaviour

| Asset | testnet | mainnet | futurenet |
| --- | --- | --- | --- |
| Native XLM | supported | supported | supported |
| Registered testnet USDC | supported | testnetOnly (error) | testnetOnly (error) |
| Unregistered issued asset | unsupported (error) | unsupported (error) | unsupported (error) |

## Configuration

The default MVP registry is testnet-first. For production, build your own
registry and pass it explicitly:

```ts
import { createAssetRegistry, validateAssetOnNetwork } from "@anchorkit/stellar-kit";

const registry = createAssetRegistry([
  {
    asset: { type: "issued", code: "USDC", issuer: "GA5ZSEJ..." },
    networks: ["mainnet", "testnet"],
  },
]);

const asset = validateAssetOnNetwork(input, "mainnet", registry);
```

Example fixtures live in `examples/assets-registry.testnet.json`.

## UI

`apps/web/app/assets/page.tsx` lets you paste an asset string, pick a network,
and see the support state (including the `ASSET_UNSUPPORTED` message for
disallowed assets), plus the list of registered assets.

## Notes

- No secrets are involved — issuers are public Stellar accounts.
- The MVP ships only testnet demo assets by default; consumers supply
  mainnet production lists via a custom registry.
