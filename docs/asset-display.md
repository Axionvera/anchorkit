# Asset display metadata resolver (issue #89)

AnchorKit provides a typed asset display metadata resolver that resolves an
asset's display information — code, issuer, display name, icon placeholder,
network support, and trust assumptions — consistently across all surfaces.

## Typed resolution states

Every resolved display returns one of four states:

| State | Meaning |
|-------|---------|
| `"native"` | Native XLM — universally supported, no issuer. |
| `"issued"` | Valid issued asset from the registry, permitted on the target network. |
| `"unsupported"` | Structurally valid but not permitted on the target network. |
| `"unknown"` | Structurally invalid or not parseable as a Stellar asset. |

## Core types

```ts
type AssetDisplayState = "native" | "issued" | "unsupported" | "unknown";

interface AssetIconPlaceholder {
  character: string;        // first char of asset code
  bgColor: string;          // Tailwind background class
}

interface AssetDisplayMetadata {
  displayName: string;       // "Stellar Lumens", "USD Coin"
  code: string;              // "XLM", "USDC"
  issuer: string | null;
  iconPlaceholder: AssetIconPlaceholder;
  networks: StellarNetwork[];
  trustNote: string;         // human-readable trust assumption
}

interface AssetDisplayInfo {
  state: AssetDisplayState;
  asset: StellarAsset;
  network: StellarNetwork;
  metadata: AssetDisplayMetadata | null;
  error: string | null;
}
```

## API

### `resolveAssetDisplay(asset, network, registry?)`

Resolves display metadata for a known valid `StellarAsset`.

```ts
import { resolveAssetDisplay } from "@anchorkit/stellar-kit";
import { getNativeAsset } from "@anchorkit/stellar-kit";

const xlm = getNativeAsset();
const info = resolveAssetDisplay(xlm, "testnet");
// info.state === "native"
// info.metadata.displayName === "Stellar Lumens"
// info.metadata.iconPlaceholder === { character: "X", bgColor: "bg-stellar-500" }
```

### `resolveAssetDisplaySafe(input, network, registry?)`

Safe variant that never throws — returns `"unknown"` state for structurally
invalid inputs.

```ts
import { resolveAssetDisplaySafe } from "@anchorkit/stellar-kit";

const info = resolveAssetDisplaySafe({ type: "bogus" }, "testnet");
// info.state === "unknown"
// info.metadata === null
// info.error !== null
```

## Behaviour

| Input | Network | State | Metadata | Error |
|-------|---------|-------|----------|-------|
| Native XLM | any | `"native"` | XLM icon, "Stellar Lumens", full network list | `null` |
| Registered USDC on testnet | testnet | `"issued"` | USDC icon, code, issuer | `null` |
| Registered USDC on mainnet | mainnet | `"unsupported"` | USDC icon + metadata | testnet-only message |
| Unregistered RANDOM:ISSUER | any | `"unsupported"` | generic metadata | "not in registry" message |
| Invalid object | any | `"unknown"` | `null` | validation error message |

## Icon placeholders

The resolver provides colour-coded icon placeholder data (no image URLs).

| Asset | Character | Background |
|-------|-----------|------------|
| Native XLM | `X` | `bg-stellar-500` (purple) |
| Issued asset | first char of code | `bg-blue-500` (blue) |
| Unknown | `?` | `bg-ink-400` (grey) |

## Trust assumptions

The resolver surfaces trust notes but does **not** imply asset trust or
verification beyond configured metadata. The notes are:

- **Native XLM:** "Native asset — no issuer trust required."
- **Issued asset:** "Issued by [ISSUER]. Verify the issuer address before
  transacting." (when no registry entry) or a note with supported networks.
- **Unknown:** "This asset is not in the registry. Verify the issuer and
  network support independently."

## UI components

Two React components are provided in `apps/web/components/AssetDisplay.tsx`:

- `AssetDisplayCompact` — horizontal row with icon, name, badge, network pill.
- `AssetDisplayDetail` — full card with metadata table, network list, trust
  note, and error block.

Both accept `{ info: AssetDisplayInfo }` and handle all four states.

## Fixtures

`packages/fixtures/src/assets.ts` provides:

- `sampleNativeAsset` — native XLM
- `sampleIssuedAsset` — USDC-like testnet issued asset
- `sampleUnknownAsset` — unregistered issued asset (unknown state)
- `sampleUnsupportedAsset` — testnet-only USDC (unsupported on mainnet)
- `sampleInvalidAsset` — structurally invalid asset

## Tests

`packages/stellar-kit/test/assetDisplay.test.ts` covers:

- Native XLM resolution on any network
- Registered issued asset resolution
- Testnet-only asset on mainnet (unsupported)
- Unregistered issued asset (unsupported)
- Custom registry integration
- Invalid input via `resolveAssetDisplaySafe`
- Non-object input handling
- Delegation to `resolveAssetDisplay` for valid inputs
