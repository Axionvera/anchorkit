/**
 * Anchor Rails Capability Matrix types (issue #54).
 *
 * These types describe which payment rails, assets, deposit flows, and
 * withdrawal flows are available, disabled, or experimental for an anchor.
 * They are designed to be consumed by the web dashboard, test fixtures,
 * and validators without creating circular dependencies.
 */

import type { CapabilityState } from "./index";

// ─── Rail capability ─────────────────────────────────────────────────────────

/**
 * A single rail's capability state.
 * Extends `CapabilityState` with an `"unsupported"` value specifically for
 * rails that are structurally known but explicitly not offered by this anchor.
 */
export type AnchorRailCapabilityState = CapabilityState | "unsupported";

export const ANCHOR_RAIL_CAPABILITY_STATES: readonly AnchorRailCapabilityState[] = [
  "implemented",
  "mock",
  "testnet-only",
  "experimental",
  "unavailable",
  "unsupported",
] as const;

/**
 * Capability descriptor for a single payment rail offered (or not) by an anchor.
 */
export interface AnchorRailCapability {
  /** Stable rail identifier, e.g. "SEPA", "ACH", "WIRE". */
  railId: string;
  /** Human-readable display name. */
  name: string;
  /** Readiness state for this rail. */
  state: AnchorRailCapabilityState;
  /** Whether deposit flows are supported on this rail. */
  depositSupported: boolean;
  /** Whether withdrawal flows are supported on this rail. */
  withdrawalSupported: boolean;
  /** ISO 4217 currency codes accepted on this rail. */
  currencies: string[];
  /** ISO 3166-1 alpha-2 country codes where this rail operates. */
  countries: string[];
  /**
   * Optional note for experimental or disabled rails explaining why the
   * state is not `implemented`.
   */
  note?: string;
}

// ─── Asset capability ─────────────────────────────────────────────────────────

/**
 * Capability descriptor for a supported anchor asset.
 */
export interface AnchorAssetCapability {
  /** Asset code (e.g. "USDC", "XLM"). */
  code: string;
  /** Issuer public key — `null` for native XLM. */
  issuer: string | null;
  /** Whether the asset is active. */
  enabled: boolean;
  /** Whether deposit is available for this asset. */
  depositEnabled: boolean;
  /** Whether withdrawal is available for this asset. */
  withdrawalEnabled: boolean;
  /**
   * Minimum deposit amount as a decimal string.
   * Undefined means no minimum is enforced.
   */
  depositMinAmount?: string;
  /**
   * Maximum deposit amount as a decimal string.
   * Undefined means no maximum is enforced.
   */
  depositMaxAmount?: string;
  /**
   * Minimum withdrawal amount as a decimal string.
   * Undefined means no minimum is enforced.
   */
  withdrawalMinAmount?: string;
  /**
   * Maximum withdrawal amount as a decimal string.
   * Undefined means no maximum is enforced.
   */
  withdrawalMaxAmount?: string;
  /** Fixed fee as a decimal string, if any. */
  feeFixed?: string;
  /** Percentage fee (0–100), if any. */
  feePercent?: string;
  /**
   * Optional note for disabled or experimental assets.
   */
  note?: string;
}

// ─── Capability matrix ────────────────────────────────────────────────────────

/**
 * The full capability matrix for an anchor integration.
 *
 * Aggregates rail capabilities, asset capabilities, and top-level deposit
 * and withdrawal readiness into a single queryable structure. The web
 * dashboard renders this as a capability card on the Anchors page.
 */
export interface AnchorCapabilityMatrix {
  /** Human-readable anchor name (e.g. "Mock Anchor", "Circle USDC Anchor"). */
  anchorName: string;
  /** Overall readiness state of the anchor integration. */
  overallState: AnchorRailCapabilityState;
  /** Whether this matrix entry represents a mock/demo anchor. */
  isMock: boolean;
  /** Top-level deposit flow readiness. */
  depositState: AnchorRailCapabilityState;
  /** Top-level withdrawal flow readiness. */
  withdrawalState: AnchorRailCapabilityState;
  /** Payment rails supported by this anchor. */
  rails: AnchorRailCapability[];
  /** Assets supported by this anchor. */
  assets: AnchorAssetCapability[];
  /**
   * Any experimental behaviours that are not yet fully supported.
   * Keyed by feature id; value is a human-readable description.
   */
  experimentalBehaviours?: Record<string, string>;
  /**
   * Any explicitly disabled behaviours.
   * Keyed by feature id; value is the reason it is disabled.
   */
  disabledBehaviours?: Record<string, string>;
  /** Docs link for this anchor's capability page. */
  docsHref?: string;
}
