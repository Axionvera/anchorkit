/**
 * Network-aware Stellar asset registry and validation layer (issue #23).
 *
 * Sits on top of the existing `assets.ts` primitives and the shared
 * `StellarAssetSchema`. The registry records which assets are known/supported
 * on which networks, distinguishes testnet-only assets (e.g. demo issued
 * assets) from mainnet assets, and returns a typed `ASSET_UNSUPPORTED` error
 * for assets that are structurally valid but not permitted on the target
 * network.
 *
 * The MVP defaults to safe testnet examples.
 */

import type { StellarAsset, StellarNetwork } from "@anchorkit/types";
import { isNativeAsset, validateAsset } from "./assets";
import { createStellarError } from "./errors";

/** How an asset is treated on a given network. */
export type AssetSupport = "supported" | "testnetOnly" | "unsupported";

/** A single registry entry: an asset plus the networks it is allowed on. */
export interface RegistryEntry {
  asset: StellarAsset;
  /** Networks where the asset is generally available. */
  networks: StellarNetwork[];
  /** When true, the asset is only meaningful on testnet (demo/issued asset). */
  testnetOnly?: boolean;
  /** Human-readable note, surfaced in UI / diagnostics. */
  note?: string;
}

/** A registry is just an indexed collection of entries, keyed by asset string. */
export interface AssetRegistry {
  entries: RegistryEntry[];
  /** Fast lookup by `assetToString`. */
  byKey: Map<string, RegistryEntry>;
}

/** The result of looking an asset up against the registry on a network. */
export interface AssetLookupResult {
  asset: StellarAsset;
  network: StellarNetwork;
  support: AssetSupport;
  entry: RegistryEntry | null;
  /** Present when support === "unsupported". */
  error: { code: "ASSET_UNSUPPORTED"; message: string } | null;
}

/** Canonical key for an asset (reuses existing `assetToString` semantics). */
function assetKey(asset: StellarAsset): string {
  if (isNativeAsset(asset)) return "XLM";
  return `${asset.code}:${asset.issuer}`;
}

/**
 * Build a registry from a list of entries. Native XLM is always implicitly
 * supported on every network, so it does not need to be listed.
 */
export function createAssetRegistry(entries: RegistryEntry[]): AssetRegistry {
  const byKey = new Map<string, RegistryEntry>();
  for (const entry of entries) {
    byKey.set(assetKey(entry.asset), entry);
  }
  return { entries, byKey };
}

/**
 * Look up an asset on a network. This does NOT validate the asset structure
 * (use `validateAssetOnNetwork` for that). It reports the registry support
 * state and returns a typed `ASSET_UNSUPPORTED` error when the asset is not
 * permitted on the target network.
 */
export function lookupAsset(
  asset: StellarAsset,
  network: StellarNetwork,
  registry: AssetRegistry = DEFAULT_TESTNET_REGISTRY
): AssetLookupResult {
  // Native XLM is universally supported.
  if (isNativeAsset(asset)) {
    return {
      asset,
      network,
      support: "supported",
      entry: null,
      error: null,
    };
  }

  const entry = registry.byKey.get(assetKey(asset)) ?? null;

  if (!entry) {
    return {
      asset,
      network,
      support: "unsupported",
      entry: null,
      error: {
        code: "ASSET_UNSUPPORTED",
        message: `Asset ${asset.code}:${asset.issuer} is not in the asset registry for network "${network}".`,
      },
    };
  }

  if (entry.testnetOnly && network !== "testnet") {
    return {
      asset,
      network,
      support: "testnetOnly",
      entry,
      error: {
        code: "ASSET_UNSUPPORTED",
        message: `Asset ${asset.code}:${asset.issuer} is testnet-only and not supported on "${network}".`,
      },
    };
  }

  if (!entry.networks.includes(network)) {
    return {
      asset,
      network,
      support: "unsupported",
      entry,
      error: {
        code: "ASSET_UNSUPPORTED",
        message: `Asset ${asset.code}:${asset.issuer} is not supported on network "${network}".`,
      },
    };
  }

  return { asset, network, support: "supported", entry, error: null };
}

/**
 * Validate an asset's structure AND its registry support for a network.
 * Throws `ASSET_INVALID` for structurally invalid assets, and
 * `ASSET_UNSUPPORTED` for valid-but-disallowed assets. Returns the asset when
 * both checks pass.
 */
export function validateAssetOnNetwork(
  asset: unknown,
  network: StellarNetwork,
  registry: AssetRegistry = DEFAULT_TESTNET_REGISTRY
): StellarAsset {
  const parsed = validateAsset(asset);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw createStellarError("ASSET_INVALID", firstIssue?.message ?? "Invalid asset configuration");
  }

  const result = lookupAsset(parsed.data, network, registry);
  if (result.support === "unsupported" || result.support === "testnetOnly") {
    throw createStellarError(
      "ASSET_UNSUPPORTED",
      result.error?.message ?? "Asset is not supported on this network"
    );
  }

  return parsed.data;
}

/**
 * Safe variant of `validateAssetOnNetwork` — never throws, returns a typed
 * result so callers can branch without try/catch.
 */
export function checkAssetOnNetwork(
  asset: unknown,
  network: StellarNetwork,
  registry: AssetRegistry = DEFAULT_TESTNET_REGISTRY
):
  | { ok: true; value: StellarAsset }
  | { ok: false; code: "ASSET_INVALID" | "ASSET_UNSUPPORTED"; error: string } {
  const parsed = validateAsset(asset);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      code: "ASSET_INVALID",
      error: firstIssue?.message ?? "Invalid asset configuration",
    };
  }

  const result = lookupAsset(parsed.data, network, registry);
  if (result.support === "unsupported" || result.support === "testnetOnly") {
    return {
      ok: false,
      code: "ASSET_UNSUPPORTED",
      error: result.error?.message ?? "Asset is not supported on this network",
    };
  }

  return { ok: true, value: parsed.data };
}

/**
 * Default MVP registry. Defaults to safe testnet examples — a couple of
 * well-known testnet issued assets plus the implicit native XLM. Mainnet is
 * intentionally empty in the MVP; consumers may supply their own registry for
 * production asset lists.
 */
export const DEFAULT_TESTNET_REGISTRY: AssetRegistry = createAssetRegistry([
  {
    asset: {
      type: "issued",
      code: "USDC",
      issuer: "GC5HTWCIAUD72MGI7AHMJEF5ZJRKXS7II2PYVYOJEYKN4UYH6QTPCPZV",
    } as StellarAsset,
    networks: ["testnet"],
    testnetOnly: true,
    note: "Demo testnet USDC (issuer is a generated testnet account).",
  },
]);
