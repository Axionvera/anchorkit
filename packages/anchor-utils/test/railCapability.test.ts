/**
 * Tests for anchor-utils rail capability parse/validate helpers (issue #54).
 */

import { describe, it, expect } from "vitest";
import {
  parseAnchorCapabilityMatrix,
  isAnchorCapabilityMatrixValid,
  parseAnchorRailCapability,
  isAnchorRailCapabilityValid,
  parseAnchorAssetCapability,
  isAnchorAssetCapabilityValid,
} from "../src/railCapability";

// ─── Shared valid stubs ───────────────────────────────────────────────────────

const validRail = {
  railId: "SEPA",
  name: "SEPA Credit Transfer",
  state: "mock",
  depositSupported: true,
  withdrawalSupported: true,
  currencies: ["EUR"],
  countries: ["DE"],
};

const validAsset = {
  code: "XLM",
  issuer: null,
  enabled: true,
  depositEnabled: true,
  withdrawalEnabled: true,
};

const validMatrix = {
  anchorName: "Test Anchor",
  overallState: "mock",
  isMock: true,
  depositState: "mock",
  withdrawalState: "mock",
  rails: [validRail],
  assets: [validAsset],
};

// ─── parseAnchorCapabilityMatrix ──────────────────────────────────────────────

describe("parseAnchorCapabilityMatrix", () => {
  it("returns success for a valid matrix", () => {
    const result = parseAnchorCapabilityMatrix(validMatrix);
    expect(result.success).toBe(true);
  });

  it("returns failure for a matrix missing anchorName", () => {
    const { anchorName: _, ...bad } = validMatrix;
    const result = parseAnchorCapabilityMatrix(bad);
    expect(result.success).toBe(false);
  });

  it("returns failure for null input", () => {
    expect(parseAnchorCapabilityMatrix(null).success).toBe(false);
  });

  it("never throws on invalid input", () => {
    expect(() => parseAnchorCapabilityMatrix(undefined)).not.toThrow();
    expect(() => parseAnchorCapabilityMatrix("bad")).not.toThrow();
    expect(() => parseAnchorCapabilityMatrix(42)).not.toThrow();
  });
});

describe("isAnchorCapabilityMatrixValid", () => {
  it("returns true for a valid matrix", () => {
    expect(isAnchorCapabilityMatrixValid(validMatrix)).toBe(true);
  });

  it("returns false for an empty object", () => {
    expect(isAnchorCapabilityMatrixValid({})).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAnchorCapabilityMatrixValid(null)).toBe(false);
  });
});

// ─── parseAnchorRailCapability ────────────────────────────────────────────────

describe("parseAnchorRailCapability", () => {
  it("returns success for a valid rail", () => {
    expect(parseAnchorRailCapability(validRail).success).toBe(true);
  });

  it("returns failure for a rail with empty railId", () => {
    const bad = { ...validRail, railId: "" };
    expect(parseAnchorRailCapability(bad).success).toBe(false);
  });

  it("returns failure for a rail with invalid state", () => {
    const bad = { ...validRail, state: "not-a-state" };
    expect(parseAnchorRailCapability(bad).success).toBe(false);
  });

  it("never throws", () => {
    expect(() => parseAnchorRailCapability(null)).not.toThrow();
  });
});

describe("isAnchorRailCapabilityValid", () => {
  it("returns true for a valid rail", () => {
    expect(isAnchorRailCapabilityValid(validRail)).toBe(true);
  });

  it("returns false for an invalid rail", () => {
    expect(isAnchorRailCapabilityValid({ railId: "X" })).toBe(false);
  });
});

// ─── parseAnchorAssetCapability ───────────────────────────────────────────────

describe("parseAnchorAssetCapability", () => {
  it("returns success for a valid native asset", () => {
    expect(parseAnchorAssetCapability(validAsset).success).toBe(true);
  });

  it("returns success for a valid issued asset", () => {
    const issued = {
      ...validAsset,
      code: "USDC",
      issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    };
    expect(parseAnchorAssetCapability(issued).success).toBe(true);
  });

  it("returns failure for an asset with an empty code", () => {
    const bad = { ...validAsset, code: "" };
    expect(parseAnchorAssetCapability(bad).success).toBe(false);
  });

  it("never throws", () => {
    expect(() => parseAnchorAssetCapability(undefined)).not.toThrow();
  });
});

describe("isAnchorAssetCapabilityValid", () => {
  it("returns true for a valid asset", () => {
    expect(isAnchorAssetCapabilityValid(validAsset)).toBe(true);
  });

  it("returns false for an empty object", () => {
    expect(isAnchorAssetCapabilityValid({})).toBe(false);
  });
});
