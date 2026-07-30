# Capability States & Exports

Every module shown on the dashboard has a state describing the readiness of that dashboard surface. No module should silently appear more complete than its backing integration.

For the repository-wide matrix, MVP limitations, unsupported features, testnet assumptions, and planned work, read the public roadmap and capability disclaimer.

## Capability States

- **`implemented`** — The specifically described capability is present and tested. This does not by itself mean independently audited, hosted, or ready for production/mainnet use.
- **`mock`** — The UI or data shape exists, but the end-to-end flow is backed by local state, simulation, or fixtures rather than a real integration.
- **`testnet-only`** — The scoped capability works against Stellar testnet; it is not supported for mainnet.
- **`experimental`** — Preview code exists but may change or break without notice and can be disabled by default.
- **`unavailable`** — The dashboard module is not built. Its card is disabled rather than linked to a missing route.

A module can contain lower-level utilities with a different scope. For example, account diagnostic helpers exist in `@anchorkit/stellar-kit`, while a standalone Diagnostics dashboard page is unavailable. Likewise, the Rust escrow contract exists separately from the mock-only Escrow web page.

---

## Where the Capability Metadata Lives

- **Type definitions**: [`packages/types/src/index.ts`](../packages/types/src/index.ts) (`CapabilityState`, `CAPABILITY_STATES`, `ModuleCapability`, `PackageCapability`).
- **Dashboard module registry**: [`packages/config/src/capabilities.ts`](../packages/config/src/capabilities.ts) (`MODULE_CAPABILITIES`).
- **Package capability metadata**:
  - `@anchorkit/stellar-kit` -> [`packages/stellar-kit/src/capabilities.ts`](../packages/stellar-kit/src/capabilities.ts) (`STELLAR_KIT_CAPABILITIES`)
  - `@anchorkit/anchor-utils` -> [`packages/anchor-utils/src/capabilities.ts`](../packages/anchor-utils/src/capabilities.ts) (`ANCHOR_UTILS_CAPABILITIES`)
  - `@anchorkit/config` -> [`packages/config/src/capabilities.ts`](../packages/config/src/capabilities.ts) (`CONFIG_PACKAGE_CAPABILITIES`)
  - `@anchorkit/types` -> [`packages/types/src/capabilities.ts`](../packages/types/src/capabilities.ts) (`TYPES_PACKAGE_CAPABILITIES`)
  - `@anchorkit/validators` -> [`packages/validators/src/capabilities.ts`](../packages/validators/src/capabilities.ts) (`VALIDATORS_PACKAGE_CAPABILITIES`)
  - `@anchorkit/fixtures` -> [`packages/fixtures/src/capabilities.ts`](../packages/fixtures/src/capabilities.ts) (`FIXTURES_PACKAGE_CAPABILITIES`)
- **Dashboard rendering**: [`apps/web/app/dashboard/page.tsx`](../apps/web/app/dashboard/page.tsx) uses `CapabilityHealthSummary` and `CapabilityBadge` from [`apps/web/components/ui.tsx`](../apps/web/components/ui.tsx).

Private, non-published workspaces such as `@anchorkit/integration-tests` do **not**
export capability metadata. Capability metadata is for published packages and
dashboard modules only.

---

## Dashboard Module States

| Module                | State          | Description                                                                                                           | Docs                       |
| :-------------------- | :------------- | :-------------------------------------------------------------------------------------------------------------------- | :------------------------- |
| Accounts              | `testnet-only` | Creates disposable testnet keys, validates keys locally, and reads testnet Horizon account data.                      | Roadmap: capability matrix |
| Payments              | `mock`         | Builds and validates payment intents and simulates readiness; it does not construct, sign, or submit transactions.    | Roadmap: capability matrix |
| Anchors               | `mock`         | Demonstrates local deposit/withdrawal metadata and fixture-backed SEP-style lifecycles; it is not an SEP server.      | Roadmap: capability matrix |
| Escrow                | `mock`         | Steps through an in-memory milestone and fixture events; it does not connect to or deploy the separate Rust contract. | Roadmap: capability matrix |
| Diagnostics           | `unavailable`  | No standalone dashboard route exists; scoped account diagnostics remain available on the Accounts page.               | Roadmap: capability matrix |
| Network configuration | `unavailable`  | Network presets exist in the config package, but no standalone dashboard route or switching workflow exists.          | Roadmap: capability matrix |

---

## Package-Level Capability Exports

AnchorKit packages self-describe their capability readiness. Each major package exports a `PackageCapability` object mapping capabilities to explicit states:

| Package                   | Overall State  | Key Features                                                                                                                                                                                       |
| :------------------------ | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@anchorkit/stellar-kit`  | `testnet-only` | Keypair management, account loading, spendable balance parsing, payment intent validation, readiness engine, severity mapping, secret redaction, Soroban smart contract RPC client, vault manager. |
| `@anchorkit/anchor-utils` | `implemented`  | Zod validators for anchor deposit/withdrawal, payment rail configuration, callback URL validation, lifecycle state transitions, mock record generation, and fixtures.                              |
| `@anchorkit/config`       | `implemented`  | Network configs (testnet, mainnet, futurenet), feature flag definitions and gates, environment configuration resolution.                                                                           |
| `@anchorkit/types`        | `implemented`  | Core type definitions, error taxonomy, escrow event types, capability state types, severity types, asset display types.                                                                            |
| `@anchorkit/validators`   | `implemented`  | Stellar Zod schemas, anchor schemas, escrow schemas, receipt schemas, and a uniform validation engine with mapped error codes.                                                                     |
| `@anchorkit/fixtures`     | `implemented`  | Well-known constants, account/asset/payment/anchor/escrow/diagnostics fixtures, and intentionally invalid inputs for negative testing.                                                             |

---

## Package-Level Capability Types

The package-level capabilities are governed by the following interfaces:

```ts
export type PackageName =
  "stellar-kit" | "anchor-utils" | "config" | "types" | "validators" | "fixtures";

export interface PackageFeatureCapability {
  id: string;
  label: string;
  state: CapabilityState;
  description: string;
}

export interface PackageCapability {
  packageName: PackageName;
  overallState: CapabilityState;
  features: PackageFeatureCapability[];
  docsHref?: string;
}
```

---

## Update Procedure

### Adding/Updating a Dashboard Module

1. Add the new module ID to `CapabilityModuleId` in `packages/types/src/index.ts` if it is new.
2. Add or update the corresponding entry in `MODULE_CAPABILITIES` in `packages/config/src/capabilities.ts`.
3. Add/update assertions in `packages/config/test/capabilities.test.ts`.
4. Update the **Dashboard Module States** table in this document and the matrix in `ROADMAP.md`.
5. Run lint, typecheck, tests, and build.

### Adding/Updating Package Capabilities

1. Create or edit `src/capabilities.ts` in the target package.
2. Export `[PACKAGE_NAME]_CAPABILITIES` as a `PackageCapability` object.
3. Export it in the package's primary entrypoint `src/index.ts`.
4. Add a test suite verifying its structure under `test/capabilities.test.ts`.
5. Update the **Package-Level Capability Exports** table in this document.
6. Add or update the package health array in `apps/web/app/dashboard/page.tsx`.
7. Update `apps/web/test/dashboard-package-health.test.ts` to expect the new package.
8. Verify that it builds and passes all tests.
