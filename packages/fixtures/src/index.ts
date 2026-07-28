/**
 * @anchorkit/fixtures — shared, deterministic test fixtures (issue #59).
 *
 * Centralizes account, payment, asset, anchor, escrow, and diagnostics
 * fixtures previously duplicated across `anchor-utils`, `stellar-kit`, and
 * `validators` tests. Every value is synthetic or public testnet data — see
 * `docs/fixtures.md` for the no-real-secrets rule and module overview.
 */

export * from "./constants";
export * from "./assets";
export * from "./accounts";
export * from "./payments";
export * from "./anchors";
export * from "./escrow";
export * from "./diagnostics";
export * from "./invalid";
