# Soroban Escrow Storage Versioning & Migration Guide

This document explains the storage versioning system used by the
`treasury-escrow` Soroban contract, how to reason about migration, and what
TypeScript clients need to know when the on-chain layout changes.

## Storage version marker

Every initialized escrow contract stores a **storage version** in instance
storage under the key `ver` (symbol `"ver"`). The version is a `u32` integer
set at initialization time and read back via the public `storage_version()`
function.

```rust
pub const CURRENT_STORAGE_VERSION: u32 = 1;
```

| Version | Milestone | Date | Changes |
| --- | --- | --- | --- |
| 1 | MVP | 2026-07 | Initial storage layout: `Milestone` struct with 11 fields, `EscrowSummary`, admin + milestone count in instance storage. |

### Reading the version on-chain

```rust
let version: u32 = client.storage_version();
```

If the contract has not been initialized, `storage_version()` returns `0`.

### Reading the version off-chain (TypeScript)

```ts
import { Contract, rpc } from "@stellar/stellar-sdk";

const contract = new Contract(contractId);
const result = await server
  .contractExpression(contractId, "storage_version", [])
  .catch(() => null);

// result contains the u32 version
const version = result?.result?.value ?? 0;
```

## When to increment the version

Increment `CURRENT_STORAGE_VERSION` when **any** of the following change:

1. **Struct field layout** — Adding, removing, or reordering fields in
   `Milestone`, `EscrowSummary`, or any other `#[contracttype]`.
2. **Enum representation** — Changing the `#[repr(u32)]` values of
   `MilestoneStatus` or adding new variants that shift existing discriminants.
3. **Storage key layout** — Changing `MILESTONE_PREFIX`, the `MilestoneKey`
   structure, or how composite keys are encoded.
4. **Instance storage schema** — Adding or removing keys stored in instance
   storage (e.g., a new global config field).
5. **Persistent storage TTL or encoding** — Any change to how milestones are
   serialized or how persistent storage is keyed.

### What does NOT require a version bump

- Adding a new public function that reads existing storage.
- Adding a new public function that writes to **new** storage keys (does not
  conflict with existing data).
- Changes to event payloads (events are not part of storage layout).
- Bug fixes that change behaviour but not the on-disk struct layout.

## Migration assumptions

### No in-place migration

Soroban contracts do not support in-place storage migration. Once deployed, the
storage layout is immutable for that contract instance. If you need a new layout:

1. **Deploy a new contract** with the updated struct and `CURRENT_STORAGE_VERSION`.
2. **Migrate data off-chain** by reading milestones from the old contract and
   writing them to the new one via a migration script.
3. **Redirect clients** to the new contract address.

### Version checks at read time

Clients should call `storage_version()` and compare against the version they
expect. If the version is higher than the client knows about, the client should
refuse to decode milestones and display a "contract upgraded — please update
your client" message.

```ts
const expectedVersion = 1;
const onChainVersion = await getStorageVersion(contractId);

if (onChainVersion > expectedVersion) {
  throw new Error(
    `Contract storage version ${onChainVersion} is newer than client support (${expectedVersion}). ` +
    `Update @anchorkit/stellar-kit to the latest version.`
  );
}
```

### Version 0 = uninitialized

A `storage_version()` return value of `0` means the contract has not been
initialized. Callers should treat this as `NotInitialized`.

## TypeScript compatibility notes

### `@anchorkit/stellar-kit` escrow event mapper

The `mapEscrowEvents` function in `@anchorkit/stellar-kit` parses raw Soroban
events into typed discriminated unions. When the storage version changes:

1. The event **topic layout** may change (e.g., new topic fields).
2. The event **data layout** may change (e.g., new fields in the payload).
3. The mapper must be updated to handle the new layout.

**Recommendation:** Pin your `@anchorkit/stellar-kit` dependency to a version
that matches the contract's storage version. The package version and the storage
version are independent — always check `storage_version()` on-chain rather than
inferring from the npm package version.

### `EscrowSummary` and `Milestone` types

If the struct layout changes, the TypeScript types in `@anchorkit/types` must be
updated to match. A mismatch between on-chain layout and TypeScript types will
cause deserialization failures.

**Checklist for contract contributors:**

- [ ] Increment `CURRENT_STORAGE_VERSION` in `lib.rs`.
- [ ] Update `Milestone` or `EscrowSummary` structs in `lib.rs`.
- [ ] Add migration tests in `src/test.rs`.
- [ ] Update `@anchorkit/types` if the struct changed.
- [ ] Update `mapEscrowEvents` in `@anchorkit/stellar-kit` if events changed.
- [ ] Update this document with a new version row.
- [ ] Update `SOROBAN_ESCROW_CONTRACT.md` with the new layout.

## Version history

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 1 | 2026-07 | Axionvera | Initial MVP storage layout. Added `storage_version()` helper, version constant, and initialize-time version marker. |
