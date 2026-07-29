# Anchor Rails Capability Matrix

This document describes the typed capability matrix for anchor rails, supported assets, deposit flows, withdrawal flows, and disabled or experimental behaviours.

## Overview

The capability matrix gives contributors a single-source-of-truth model for what the mock anchor supports. It prevents building unsupported flows by making the following explicit:

- Which **payment rails** exist and whether each is `mock`, `experimental`, `unavailable`, or `unsupported`.
- Which **assets** are enabled and whether **deposit** and **withdrawal** are supported per asset.
- Which **behaviours** are explicitly **experimental** or **disabled**, with a human-readable reason.

The matrix is rendered as a card on the **Anchors** dashboard page (`/anchors`).

---

## Types

All types are exported from `@anchorkit/types`.

### `AnchorRailCapabilityState`

Extends the base `CapabilityState` with one additional value:

| Value | Meaning |
| :--- | :--- |
| `implemented` | Fully implemented and tested |
| `mock` | UI/data shape exists; backed by local state, not a real integration |
| `testnet-only` | Works against Stellar testnet; not mainnet |
| `experimental` | Preview code; may change or be disabled without notice |
| `unavailable` | Not built; card is disabled |
| `unsupported` | Structurally known but explicitly not offered by this anchor |

### `AnchorRailCapability`

```ts
interface AnchorRailCapability {
  railId: string;               // stable id, e.g. "SEPA", "ACH"
  name: string;                 // display name
  state: AnchorRailCapabilityState;
  depositSupported: boolean;
  withdrawalSupported: boolean;
  currencies: string[];         // ISO 4217 codes
  countries: string[];          // ISO 3166-1 alpha-2 codes
  note?: string;                // explains non-implemented state
}
```

### `AnchorAssetCapability`

```ts
interface AnchorAssetCapability {
  code: string;                 // e.g. "USDC", "XLM"
  issuer: string | null;        // null for native XLM
  enabled: boolean;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  depositMinAmount?: string;
  depositMaxAmount?: string;
  withdrawalMinAmount?: string;
  withdrawalMaxAmount?: string;
  feeFixed?: string;
  feePercent?: string;
  note?: string;
}
```

### `AnchorCapabilityMatrix`

```ts
interface AnchorCapabilityMatrix {
  anchorName: string;
  overallState: AnchorRailCapabilityState;
  isMock: boolean;
  depositState: AnchorRailCapabilityState;
  withdrawalState: AnchorRailCapabilityState;
  rails: AnchorRailCapability[];
  assets: AnchorAssetCapability[];
  experimentalBehaviours?: Record<string, string>;
  disabledBehaviours?: Record<string, string>;
  docsHref?: string;
}
```

---

## Default Capability Matrix

The default matrix (`DEFAULT_ANCHOR_CAPABILITY_MATRIX`) is exported from `@anchorkit/config` and used by the web dashboard's Anchors page.

### Payment rails

| Rail | State | Deposit | Withdrawal | Currencies | Countries |
| :--- | :--- | :--- | :--- | :--- | :--- |
| SEPA | `mock` | ✓ | ✓ | EUR | DE, FR, ES, IT, NL, BE, AT, PT, IE, FI |
| ACH | `mock` | ✓ | ✓ | USD | US |
| WIRE | `experimental` | ✓ | ✗ | USD, EUR, GBP | US, GB, DE, FR |
| CARD | `unavailable` | ✗ | ✗ | USD, EUR | US, DE |

### Supported assets

| Asset | Deposit | Withdrawal | Notes |
| :--- | :--- | :--- | :--- |
| XLM (native) | ✓ | ✓ | Fee: 1.5 fixed + 0.1% |
| USDC | ✓ | ✓ | Fee: 0.50 fixed + 0.2% |
| EURC | ✓ | ✗ | Withdrawal experimental, currently disabled |

### Disabled behaviours

| Key | Reason |
| :--- | :--- |
| `card_payments` | Card payment rails are not available in this release |
| `eurc_withdrawal` | EURC withdrawal is not yet supported |
| `wire_withdrawal` | International wire withdrawal is not yet supported |

---

## Where the code lives

| Purpose | Location |
| :--- | :--- |
| Type definitions | `packages/types/src/railCapability.ts` |
| Zod schemas | `packages/validators/src/schemas/railCapability.ts` |
| Default matrix & query helpers | `packages/config/src/railConfig.ts` |
| Parse/validate utilities | `packages/anchor-utils/src/railCapability.ts` |
| Fixtures | `packages/fixtures/src/railCapability.ts` |
| Dashboard card component | `apps/web/components/CapabilityMatrixCard.tsx` |
| Dashboard page integration | `apps/web/app/anchors/page.tsx` |

---

## Query helpers (`@anchorkit/config`)

```ts
// Filter rails by state
getRailsByState(matrix, "mock")          // → AnchorRailCapability[]

// Filter assets by flow support
getDepositEnabledAssets(matrix)          // → AnchorAssetCapability[]
getWithdrawalEnabledAssets(matrix)       // → AnchorAssetCapability[]

// Lookup by ID / code
findRailById(matrix, "SEPA")             // → AnchorRailCapability | undefined
findAssetByCode(matrix, "USDC")          // → AnchorAssetCapability | undefined

// Readiness checks
isRailDepositReady(matrix, "SEPA")       // → boolean
isRailWithdrawalReady(matrix, "ACH")     // → boolean
```

## Validate helpers (`@anchorkit/anchor-utils`)

```ts
parseAnchorCapabilityMatrix(input)       // → SafeParseReturnType (never throws)
isAnchorCapabilityMatrixValid(input)     // → boolean
parseAnchorRailCapability(input)         // → SafeParseReturnType
isAnchorRailCapabilityValid(input)       // → boolean
parseAnchorAssetCapability(input)        // → SafeParseReturnType
isAnchorAssetCapabilityValid(input)      // → boolean
```

---

## Extending the matrix

To add a new rail or asset:

1. Add a `AnchorRailCapability` or `AnchorAssetCapability` entry to `DEFAULT_ANCHOR_CAPABILITY_MATRIX` in `packages/config/src/railConfig.ts`.
2. If the state is `experimental` or `unavailable`, add a matching entry to `experimentalBehaviours` or `disabledBehaviours`.
3. Add a fixture in `packages/fixtures/src/railCapability.ts` if needed for testing.
4. Update the table in this document.
5. Run `pnpm verify` to confirm all tests and types pass.
