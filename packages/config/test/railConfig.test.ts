/**
 * Tests for anchor rail configuration and capability matrix helpers (issue #54).
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_ANCHOR_CAPABILITY_MATRIX,
  getRailsByState,
  getDepositEnabledAssets,
  getWithdrawalEnabledAssets,
  findRailById,
  findAssetByCode,
  isRailDepositReady,
  isRailWithdrawalReady,
} from "../src/railConfig";
import { ANCHOR_RAIL_CAPABILITY_STATES } from "@anchorkit/types";

describe("DEFAULT_ANCHOR_CAPABILITY_MATRIX", () => {
  it("has a non-empty anchorName", () => {
    expect(DEFAULT_ANCHOR_CAPABILITY_MATRIX.anchorName.trim().length).toBeGreaterThan(0);
  });

  it("has a valid overallState", () => {
    expect(ANCHOR_RAIL_CAPABILITY_STATES).toContain(
      DEFAULT_ANCHOR_CAPABILITY_MATRIX.overallState
    );
  });

  it("has at least one rail", () => {
    expect(DEFAULT_ANCHOR_CAPABILITY_MATRIX.rails.length).toBeGreaterThan(0);
  });

  it("has at least one asset", () => {
    expect(DEFAULT_ANCHOR_CAPABILITY_MATRIX.assets.length).toBeGreaterThan(0);
  });

  it("marks isMock as true", () => {
    expect(DEFAULT_ANCHOR_CAPABILITY_MATRIX.isMock).toBe(true);
  });

  it("every rail has a valid state", () => {
    for (const rail of DEFAULT_ANCHOR_CAPABILITY_MATRIX.rails) {
      expect(ANCHOR_RAIL_CAPABILITY_STATES).toContain(rail.state);
    }
  });

  it("every rail has a non-empty currencies and countries list", () => {
    for (const rail of DEFAULT_ANCHOR_CAPABILITY_MATRIX.rails) {
      expect(rail.currencies.length).toBeGreaterThan(0);
      expect(rail.countries.length).toBeGreaterThan(0);
    }
  });

  it("every asset has a non-empty code", () => {
    for (const asset of DEFAULT_ANCHOR_CAPABILITY_MATRIX.assets) {
      expect(asset.code.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate rail IDs", () => {
    const ids = DEFAULT_ANCHOR_CAPABILITY_MATRIX.rails.map((r) => r.railId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate asset codes", () => {
    const codes = DEFAULT_ANCHOR_CAPABILITY_MATRIX.assets.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("getRailsByState", () => {
  it("returns only rails matching the given state", () => {
    const mocks = getRailsByState(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "mock");
    expect(mocks.length).toBeGreaterThan(0);
    for (const r of mocks) {
      expect(r.state).toBe("mock");
    }
  });

  it("returns an empty array when no rails match", () => {
    const result = getRailsByState(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "testnet-only");
    expect(result).toEqual([]);
  });
});

describe("getDepositEnabledAssets", () => {
  it("returns only enabled assets with depositEnabled true", () => {
    const assets = getDepositEnabledAssets(DEFAULT_ANCHOR_CAPABILITY_MATRIX);
    expect(assets.length).toBeGreaterThan(0);
    for (const a of assets) {
      expect(a.enabled).toBe(true);
      expect(a.depositEnabled).toBe(true);
    }
  });
});

describe("getWithdrawalEnabledAssets", () => {
  it("returns only enabled assets with withdrawalEnabled true", () => {
    const assets = getWithdrawalEnabledAssets(DEFAULT_ANCHOR_CAPABILITY_MATRIX);
    expect(assets.length).toBeGreaterThan(0);
    for (const a of assets) {
      expect(a.enabled).toBe(true);
      expect(a.withdrawalEnabled).toBe(true);
    }
  });
});

describe("findRailById", () => {
  it("returns the matching rail for a known ID", () => {
    const rail = findRailById(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "SEPA");
    expect(rail).toBeDefined();
    expect(rail?.railId).toBe("SEPA");
  });

  it("returns undefined for an unknown rail ID", () => {
    expect(findRailById(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "NONEXISTENT")).toBeUndefined();
  });
});

describe("findAssetByCode", () => {
  it("returns the matching asset for a known code (case-insensitive)", () => {
    const asset = findAssetByCode(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "usdc");
    expect(asset).toBeDefined();
    expect(asset?.code).toBe("USDC");
  });

  it("returns undefined for an unknown asset code", () => {
    expect(findAssetByCode(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "BOGUS")).toBeUndefined();
  });
});

describe("isRailDepositReady", () => {
  it("returns true for a mock SEPA rail that supports deposit", () => {
    expect(isRailDepositReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "SEPA")).toBe(true);
  });

  it("returns false for an unavailable CARD rail", () => {
    expect(isRailDepositReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "CARD")).toBe(false);
  });

  it("returns false for an unknown rail ID", () => {
    expect(isRailDepositReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "NONEXISTENT")).toBe(false);
  });
});

describe("isRailWithdrawalReady", () => {
  it("returns true for a mock ACH rail that supports withdrawal", () => {
    expect(isRailWithdrawalReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "ACH")).toBe(true);
  });

  it("returns false for the experimental WIRE rail (withdrawal not supported)", () => {
    expect(isRailWithdrawalReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "WIRE")).toBe(false);
  });

  it("returns false for an unavailable CARD rail", () => {
    expect(isRailWithdrawalReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "CARD")).toBe(false);
  });

  it("returns false for an unknown rail ID", () => {
    expect(isRailWithdrawalReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "NONEXISTENT")).toBe(false);
  });
});
