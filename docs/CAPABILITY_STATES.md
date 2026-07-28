# Capability States

Every module surfaced on the dashboard has a `state` describing how ready it is for real use. This is the single source of truth for what's implemented, mocked, or not yet built — no module should ever silently pretend to be more complete than it is.

## States

- **`implemented`** — Fully built and usable in production.
- **`mock`** — UI and flow exist, but backed by mock data rather than a real integration.
- **`testnet-only`** — Works against Stellar testnet only; not yet safe or configured for mainnet.
- **`experimental`** — Early, may change or break without notice.
- **`unavailable`** — Not yet built. Shown on the dashboard as a disabled card rather than hidden, so the module's existence and roadmap status stay visible.

## Where this lives

- Type definitions: `packages/types/src/index.ts` (`CapabilityState`, `CAPABILITY_STATES`, `ModuleCapability`).
- Registry (source of truth): `packages/config/src/capabilities.ts` (`MODULE_CAPABILITIES`).
- Dashboard rendering: `apps/web/app/dashboard/page.tsx`, using `CapabilityBadge` from `apps/web/components/ui.tsx`.

## Current module states

| Module | State | Description | Docs |
|---|---|---|---|
| Accounts | testnet-only | Create testnet keypairs, validate keys, and load Horizon account data. | [#accounts](/docs#accounts) |
| Payments | mock | Build a payment intent and check readiness. Submission is a demo-mode mock. | [#payments](/docs#payments) |
| Anchors | mock | Mock deposit and withdrawal lifecycle with SEP-style status badges. | [#anchors](/docs#anchors) |
| Escrow | testnet-only | Soroban treasury-escrow contract milestone workflow, deployed on testnet. | [#escrow](/docs#escrow) |
| Diagnostics | unavailable | Network and account diagnostics tooling is not yet implemented. | [#diagnostics](/docs#diagnostics) |
| Network configuration | experimental | Switch and inspect Stellar network configuration (testnet/futurenet). | [#network-config](/docs#network-config) |

> Update this table whenever `MODULE_CAPABILITIES` changes. The registry in `packages/config/src/capabilities.ts` is authoritative — this table should mirror it, not the other way around.

## Adding a new module

1. Add the module id to `CapabilityModuleId` in `packages/types/src/index.ts`.
2. Add an entry to `MODULE_CAPABILITIES` in `packages/config/src/capabilities.ts` with `id`, `label`, `state`, `description`, and `docsHref`.
3. Add/update the corresponding test case in `packages/config/test/capabilities.test.ts`.
4. Update the table above.
