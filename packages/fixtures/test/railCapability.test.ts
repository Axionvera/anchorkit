/**
 * Tests for rail capability matrix fixtures (issue #54).
 */

import { describe, it, expect } from "vitest";
import {
  mockSepaRail,
  mockAchRail,
  experimentalWireRail,
  unavailableCardRail,
  mockXlmAsset,
  mockUsdcAsset,
  disabledEurcAsset,
  mockAnchorCapabilityMatrix,
  allDisabledRailsMatrix,
  experimentalOnlyMatrix,
} from "../src/railCapability";
import { ANCHOR_RAIL_CAPABILITY_STATES } from "@anchorkit/types";

// ─── Rail fixtures ────────────────────────────────────────────────────────────

describe("mockSepaRail", () => {
  it("has railId SEPA and state mock", () => {
    expect(mockSepaRail.railId).toBe("SEPA");
    expect(mockSepaRail.state).toBe("mock");
  });

  it("supports deposit and withdrawal", () => {
    expect(mockSepaRail.depositSupported).toBe(true);
    expect(mockSepaRail.withdrawalSupported).toBe(true);
  });
});

describe("experimentalWireRail", () => {
  it("has state experimental", () => {
    expect(experimentalWireRail.state).toBe("experimental");
  });

  it("supports deposit but not withdrawal", () => {
    expect(experimentalWireRail.depositSupported).toBe(true);
    expect(experimentalWireRail.withdrawalSupported).toBe(false);
  });
});

describe("unavailableCardRail", () => {
  it("has state unavailable", () => {
    expect(unavailableCardRail.state).toBe("unavailable");
  });

  it("does not support deposit or withdrawal", () => {
    expect(unavailableCardRail.depositSupported).toBe(false);
    expect(unavailableCardRail.withdrawalSupported).toBe(false);
  });
});

// ─── Asset fixtures ────────────────────────────────────────────────────────────

describe("mockXlmAsset", () => {
  it("has code XLM and null issuer", () => {
    expect(mockXlmAsset.code).toBe("XLM");
    expect(mockXlmAsset.issuer).toBeNull();
  });

  it("is enabled for deposit and withdrawal", () => {
    expect(mockXlmAsset.depositEnabled).toBe(true);
    expect(mockXlmAsset.withdrawalEnabled).toBe(true);
  });
});

describe("disabledEurcAsset", () => {
  it("has depositEnabled true but withdrawalEnabled false", () => {
    expect(disabledEurcAsset.depositEnabled).toBe(true);
    expect(disabledEurcAsset.withdrawalEnabled).toBe(false);
  });
});

// ─── Matrix fixtures ─────────────────────────────────────────────────────────

describe("mockAnchorCapabilityMatrix", () => {
  it("has a non-empty anchor name", () => {
    expect(mockAnchorCapabilityMatrix.anchorName.trim().length).toBeGreaterThan(0);
  });

  it("has isMock true", () => {
    expect(mockAnchorCapabilityMatrix.isMock).toBe(true);
  });

  it("has 4 rails", () => {
    expect(mockAnchorCapabilityMatrix.rails).toHaveLength(4);
  });

  it("has 3 assets", () => {
    expect(mockAnchorCapabilityMatrix.assets).toHaveLength(3);
  });

  it("every rail has a valid state", () => {
    for (const rail of mockAnchorCapabilityMatrix.rails) {
      expect(ANCHOR_RAIL_CAPABILITY_STATES).toContain(rail.state);
    }
  });

  it("has no duplicate rail IDs", () => {
    const ids = mockAnchorCapabilityMatrix.rails.map((r) => r.railId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has experimental and disabled behaviour records", () => {
    expect(mockAnchorCapabilityMatrix.experimentalBehaviours).toBeDefined();
    expect(mockAnchorCapabilityMatrix.disabledBehaviours).toBeDefined();
    expect(
      Object.keys(mockAnchorCapabilityMatrix.experimentalBehaviours!).length
    ).toBeGreaterThan(0);
    expect(
      Object.keys(mockAnchorCapabilityMatrix.disabledBehaviours!).length
    ).toBeGreaterThan(0);
  });
});

describe("allDisabledRailsMatrix", () => {
  it("has overallState unavailable", () => {
    expect(allDisabledRailsMatrix.overallState).toBe("unavailable");
  });

  it("has all rails with depositSupported false", () => {
    for (const rail of allDisabledRailsMatrix.rails) {
      expect(rail.depositSupported).toBe(false);
      expect(rail.withdrawalSupported).toBe(false);
    }
  });

  it("has all assets disabled", () => {
    for (const asset of allDisabledRailsMatrix.assets) {
      expect(asset.enabled).toBe(false);
    }
  });
});

describe("experimentalOnlyMatrix", () => {
  it("has overallState experimental", () => {
    expect(experimentalOnlyMatrix.overallState).toBe("experimental");
  });

  it("has exactly one rail", () => {
    expect(experimentalOnlyMatrix.rails).toHaveLength(1);
  });

  it("the single rail is the experimental wire rail", () => {
    expect(experimentalOnlyMatrix.rails[0]!.railId).toBe("WIRE");
    expect(experimentalOnlyMatrix.rails[0]!.state).toBe("experimental");
  });
});
