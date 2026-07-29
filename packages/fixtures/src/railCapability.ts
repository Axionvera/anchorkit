/**
 * Rail capability matrix fixtures (issue #54).
 *
 * Pre-built `AnchorCapabilityMatrix` instances for deterministic testing.
 * These fixtures cover valid configurations, all-disabled rails, and
 * experimental-only states.
 */

import type {
  AnchorCapabilityMatrix,
  AnchorRailCapability,
  AnchorAssetCapability,
} from "@anchorkit/types";

// ─── Reusable rail stubs ──────────────────────────────────────────────────────

export const mockSepaRail: AnchorRailCapability = {
  railId: "SEPA",
  name: "SEPA Credit Transfer",
  state: "mock",
  depositSupported: true,
  withdrawalSupported: true,
  currencies: ["EUR"],
  countries: ["DE", "FR", "ES"],
};

export const mockAchRail: AnchorRailCapability = {
  railId: "ACH",
  name: "ACH Bank Transfer",
  state: "mock",
  depositSupported: true,
  withdrawalSupported: true,
  currencies: ["USD"],
  countries: ["US"],
};

export const experimentalWireRail: AnchorRailCapability = {
  railId: "WIRE",
  name: "International Wire Transfer",
  state: "experimental",
  depositSupported: true,
  withdrawalSupported: false,
  currencies: ["USD", "EUR"],
  countries: ["US", "DE"],
  note: "Experimental deposit-only wire rail.",
};

export const unavailableCardRail: AnchorRailCapability = {
  railId: "CARD",
  name: "Card Payment",
  state: "unavailable",
  depositSupported: false,
  withdrawalSupported: false,
  currencies: ["USD"],
  countries: ["US"],
  note: "Card rails are not available.",
};

// ─── Reusable asset stubs ─────────────────────────────────────────────────────

export const mockXlmAsset: AnchorAssetCapability = {
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

export const mockUsdcAsset: AnchorAssetCapability = {
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

export const disabledEurcAsset: AnchorAssetCapability = {
  code: "EURC",
  issuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP",
  enabled: true,
  depositEnabled: true,
  withdrawalEnabled: false,
  depositMinAmount: "5.00",
  depositMaxAmount: "25000.00",
  note: "EURC withdrawal is not yet enabled.",
};

// ─── Full matrix fixtures ─────────────────────────────────────────────────────

/**
 * A complete, valid mock anchor capability matrix covering all rail states and
 * typical deposit/withdrawal asset configurations.
 */
export const mockAnchorCapabilityMatrix: AnchorCapabilityMatrix = {
  anchorName: "Mock Anchor (fixture)",
  overallState: "mock",
  isMock: true,
  depositState: "mock",
  withdrawalState: "mock",
  rails: [mockSepaRail, mockAchRail, experimentalWireRail, unavailableCardRail],
  assets: [mockXlmAsset, mockUsdcAsset, disabledEurcAsset],
  experimentalBehaviours: {
    wire_deposit: "Wire deposit is experimental.",
    eurc_deposit: "EURC deposit is experimental.",
  },
  disabledBehaviours: {
    card_payments: "Card rails unavailable.",
    eurc_withdrawal: "EURC withdrawal not yet supported.",
    wire_withdrawal: "Wire withdrawal not yet supported.",
  },
  docsHref: "/docs#anchors",
};

/**
 * A capability matrix where every rail is `unavailable` — used to test
 * that UI correctly renders a fully-disabled anchor.
 */
export const allDisabledRailsMatrix: AnchorCapabilityMatrix = {
  anchorName: "Disabled Anchor (fixture)",
  overallState: "unavailable",
  isMock: true,
  depositState: "unavailable",
  withdrawalState: "unavailable",
  rails: [
    { ...mockSepaRail, state: "unavailable", depositSupported: false, withdrawalSupported: false },
    { ...mockAchRail, state: "unavailable", depositSupported: false, withdrawalSupported: false },
  ],
  assets: [
    { ...mockXlmAsset, enabled: false, depositEnabled: false, withdrawalEnabled: false },
    { ...mockUsdcAsset, enabled: false, depositEnabled: false, withdrawalEnabled: false },
  ],
  disabledBehaviours: {
    all_rails: "All rails are disabled in this fixture.",
  },
};

/**
 * A capability matrix with only experimental rails — useful for testing that
 * `experimental` state is surfaced correctly in the UI.
 */
export const experimentalOnlyMatrix: AnchorCapabilityMatrix = {
  anchorName: "Experimental Anchor (fixture)",
  overallState: "experimental",
  isMock: true,
  depositState: "experimental",
  withdrawalState: "unavailable",
  rails: [experimentalWireRail],
  assets: [disabledEurcAsset],
  experimentalBehaviours: {
    wire_deposit: "Wire deposit is experimental.",
  },
};
