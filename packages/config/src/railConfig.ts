/**
 * Default anchor rails configuration and capability matrix (issue #54).
 *
 * Provides the default mock anchor capability matrix used by the web
 * dashboard's Anchors page. Also exports helper functions for querying
 * rail and asset capabilities.
 */

import type {
  AnchorCapabilityMatrix,
  AnchorRailCapability,
  AnchorAssetCapability,
  AnchorRailCapabilityState,
} from "@anchorkit/types";

// ─── Default rail definitions ────────────────────────────────────────────────

/** SEPA Credit Transfer (EUR, Europe). */
const SEPA_RAIL: AnchorRailCapability = {
  railId: "SEPA",
  name: "SEPA Credit Transfer",
  state: "mock",
  depositSupported: true,
  withdrawalSupported: true,
  currencies: ["EUR"],
  countries: ["DE", "FR", "ES", "IT", "NL", "BE", "AT", "PT", "IE", "FI"],
  note: "Mock implementation only. No real SEPA transfers are initiated.",
};

/** ACH (USD, United States). */
const ACH_RAIL: AnchorRailCapability = {
  railId: "ACH",
  name: "ACH Bank Transfer",
  state: "mock",
  depositSupported: true,
  withdrawalSupported: true,
  currencies: ["USD"],
  countries: ["US"],
  note: "Mock implementation only. No real ACH transfers are initiated.",
};

/** WIRE transfer (multi-currency, global). */
const WIRE_RAIL: AnchorRailCapability = {
  railId: "WIRE",
  name: "International Wire Transfer",
  state: "experimental",
  depositSupported: true,
  withdrawalSupported: false,
  currencies: ["USD", "EUR", "GBP"],
  countries: ["US", "GB", "DE", "FR"],
  note: "Experimental — deposit-only. Withdrawal via wire is not yet supported.",
};

/** Card payment (disabled in MVP). */
const CARD_RAIL: AnchorRailCapability = {
  railId: "CARD",
  name: "Card Payment",
  state: "unavailable",
  depositSupported: false,
  withdrawalSupported: false,
  currencies: ["USD", "EUR"],
  countries: ["US", "DE"],
  note: "Card rails are not available in this release.",
};

// ─── Default asset definitions ────────────────────────────────────────────────

/** XLM (native Stellar asset). */
const XLM_ASSET: AnchorAssetCapability = {
  code: "XLM",
  issuer: null,
  enabled: true,
  depositEnabled: true,
  withdrawalEnabled: true,
  depositMinAmount: "10.0000000",
  depositMaxAmount: "100000.0000000",
  withdrawalMinAmount: "10.0000000",
  withdrawalMaxAmount: "100000.0000000",
  feeFixed: "1.5000000",
  feePercent: "0.1",
};

/** USDC (Circle USD Coin on Stellar testnet). */
const USDC_ASSET: AnchorAssetCapability = {
  code: "USDC",
  issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  enabled: true,
  depositEnabled: true,
  withdrawalEnabled: true,
  depositMinAmount: "5.00",
  depositMaxAmount: "50000.00",
  withdrawalMinAmount: "5.00",
  withdrawalMaxAmount: "50000.00",
  feeFixed: "0.50",
  feePercent: "0.2",
};

/** EURC (experimental, deposit-only for now). */
const EURC_ASSET: AnchorAssetCapability = {
  code: "EURC",
  issuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP",
  enabled: true,
  depositEnabled: true,
  withdrawalEnabled: false,
  depositMinAmount: "5.00",
  depositMaxAmount: "25000.00",
  note: "EURC withdrawal is experimental and currently disabled.",
};

// ─── Default capability matrix ────────────────────────────────────────────────

/**
 * Default mock anchor capability matrix.
 *
 * Represents the mock anchor used by the AnchorKit web dashboard's Anchors
 * page. All flows are backed by local state — no real anchor server is called.
 */
export const DEFAULT_ANCHOR_CAPABILITY_MATRIX: AnchorCapabilityMatrix = {
  anchorName: "Mock Anchor (AnchorKit Demo)",
  overallState: "mock",
  isMock: true,
  depositState: "mock",
  withdrawalState: "mock",
  rails: [SEPA_RAIL, ACH_RAIL, WIRE_RAIL, CARD_RAIL],
  assets: [XLM_ASSET, USDC_ASSET, EURC_ASSET],
  experimentalBehaviours: {
    wire_deposit: "International wire deposits are available experimentally for USD, EUR, GBP.",
    eurc_deposit: "EURC deposits are available experimentally. Withdrawals are not yet enabled.",
  },
  disabledBehaviours: {
    card_payments: "Card payment rails are not available in this release.",
    eurc_withdrawal: "EURC withdrawal is not yet supported.",
    wire_withdrawal: "International wire withdrawal is not yet supported.",
  },
  docsHref: "/docs#anchors",
};

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * Return only the rails in the matrix that match the given state.
 */
export function getRailsByState(
  matrix: AnchorCapabilityMatrix,
  state: AnchorRailCapabilityState
): AnchorRailCapability[] {
  return matrix.rails.filter((r) => r.state === state);
}

/**
 * Return only the assets that have deposit enabled.
 */
export function getDepositEnabledAssets(
  matrix: AnchorCapabilityMatrix
): AnchorAssetCapability[] {
  return matrix.assets.filter((a) => a.enabled && a.depositEnabled);
}

/**
 * Return only the assets that have withdrawal enabled.
 */
export function getWithdrawalEnabledAssets(
  matrix: AnchorCapabilityMatrix
): AnchorAssetCapability[] {
  return matrix.assets.filter((a) => a.enabled && a.withdrawalEnabled);
}

/**
 * Find a specific rail by its stable `railId`.
 * Returns `undefined` if no matching rail is found.
 */
export function findRailById(
  matrix: AnchorCapabilityMatrix,
  railId: string
): AnchorRailCapability | undefined {
  return matrix.rails.find((r) => r.railId === railId);
}

/**
 * Find a specific asset by its code (case-insensitive).
 * Returns `undefined` if no matching asset is found.
 */
export function findAssetByCode(
  matrix: AnchorCapabilityMatrix,
  code: string
): AnchorAssetCapability | undefined {
  return matrix.assets.find((a) => a.code.toUpperCase() === code.toUpperCase());
}

/**
 * Returns `true` if the given rail supports deposit flows and is not
 * `unavailable` or `unsupported`.
 */
export function isRailDepositReady(
  matrix: AnchorCapabilityMatrix,
  railId: string
): boolean {
  const rail = findRailById(matrix, railId);
  if (!rail) return false;
  return (
    rail.depositSupported &&
    rail.state !== "unavailable" &&
    rail.state !== "unsupported"
  );
}

/**
 * Returns `true` if the given rail supports withdrawal flows and is not
 * `unavailable` or `unsupported`.
 */
export function isRailWithdrawalReady(
  matrix: AnchorCapabilityMatrix,
  railId: string
): boolean {
  const rail = findRailById(matrix, railId);
  if (!rail) return false;
  return (
    rail.withdrawalSupported &&
    rail.state !== "unavailable" &&
    rail.state !== "unsupported"
  );
}
