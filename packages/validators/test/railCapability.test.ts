/**
 * Tests for anchor rail capability matrix Zod schemas (issue #54).
 */

import { describe, it, expect } from "vitest";
import {
  AnchorRailCapabilitySchema,
  AnchorAssetCapabilitySchema,
  AnchorCapabilityMatrixSchema,
} from "../src/schemas/railCapability";

// ─── Valid stubs ─────────────────────────────────────────────────────────────

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
  code: "USDC",
  issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  enabled: true,
  depositEnabled: true,
  withdrawalEnabled: true,
  feeFixed: "0.50",
  feePercent: "0.2",
};

const validNativeAsset = {
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

// ─── AnchorRailCapabilitySchema ───────────────────────────────────────────────

describe("AnchorRailCapabilitySchema", () => {
  it("accepts a valid mock rail", () => {
    expect(AnchorRailCapabilitySchema.safeParse(validRail).success).toBe(true);
  });

  it("accepts an unavailable rail", () => {
    const rail = { ...validRail, state: "unavailable", depositSupported: false, withdrawalSupported: false };
    expect(AnchorRailCapabilitySchema.safeParse(rail).success).toBe(true);
  });

  it("accepts an experimental rail with a note", () => {
    const rail = { ...validRail, state: "experimental", note: "Experimental only." };
    expect(AnchorRailCapabilitySchema.safeParse(rail).success).toBe(true);
  });

  it("accepts the 'unsupported' state", () => {
    const rail = { ...validRail, state: "unsupported" };
    expect(AnchorRailCapabilitySchema.safeParse(rail).success).toBe(true);
  });

  it("rejects a rail with an empty railId", () => {
    const bad = { ...validRail, railId: "" };
    expect(AnchorRailCapabilitySchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a rail with an empty currencies array", () => {
    const bad = { ...validRail, currencies: [] };
    expect(AnchorRailCapabilitySchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a rail with an empty countries array", () => {
    const bad = { ...validRail, countries: [] };
    expect(AnchorRailCapabilitySchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a rail with an invalid state", () => {
    const bad = { ...validRail, state: "unknown-state" };
    expect(AnchorRailCapabilitySchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a rail missing required fields", () => {
    expect(AnchorRailCapabilitySchema.safeParse({ railId: "SEPA" }).success).toBe(false);
  });
});

// ─── AnchorAssetCapabilitySchema ──────────────────────────────────────────────

describe("AnchorAssetCapabilitySchema", () => {
  it("accepts a valid issued asset", () => {
    expect(AnchorAssetCapabilitySchema.safeParse(validAsset).success).toBe(true);
  });

  it("accepts a native asset with null issuer", () => {
    expect(AnchorAssetCapabilitySchema.safeParse(validNativeAsset).success).toBe(true);
  });

  it("accepts an asset with optional amount bounds and note", () => {
    const asset = {
      ...validAsset,
      depositMinAmount: "5.00",
      depositMaxAmount: "50000.00",
      withdrawalMinAmount: "5.00",
      withdrawalMaxAmount: "50000.00",
      note: "Some note.",
    };
    expect(AnchorAssetCapabilitySchema.safeParse(asset).success).toBe(true);
  });

  it("rejects an asset with an empty code", () => {
    const bad = { ...validAsset, code: "" };
    expect(AnchorAssetCapabilitySchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an asset with a code longer than 12 chars", () => {
    const bad = { ...validAsset, code: "VERYLONGCODE1" };
    expect(AnchorAssetCapabilitySchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an asset missing required boolean fields", () => {
    const bad = { code: "XLM", issuer: null };
    expect(AnchorAssetCapabilitySchema.safeParse(bad).success).toBe(false);
  });
});

// ─── AnchorCapabilityMatrixSchema ─────────────────────────────────────────────

describe("AnchorCapabilityMatrixSchema", () => {
  it("accepts a minimal valid matrix", () => {
    expect(AnchorCapabilityMatrixSchema.safeParse(validMatrix).success).toBe(true);
  });

  it("accepts a matrix with experimental and disabled behaviours", () => {
    const full = {
      ...validMatrix,
      experimentalBehaviours: { wire_deposit: "Experimental wire deposit." },
      disabledBehaviours: { card_payments: "Cards unavailable." },
      docsHref: "/docs#anchors",
    };
    expect(AnchorCapabilityMatrixSchema.safeParse(full).success).toBe(true);
  });

  it("accepts an empty rails array", () => {
    const m = { ...validMatrix, rails: [] };
    expect(AnchorCapabilityMatrixSchema.safeParse(m).success).toBe(true);
  });

  it("accepts an empty assets array", () => {
    const m = { ...validMatrix, assets: [] };
    expect(AnchorCapabilityMatrixSchema.safeParse(m).success).toBe(true);
  });

  it("rejects a matrix with an empty anchor name", () => {
    const bad = { ...validMatrix, anchorName: "" };
    expect(AnchorCapabilityMatrixSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a matrix with an invalid overallState", () => {
    const bad = { ...validMatrix, overallState: "bogus" };
    expect(AnchorCapabilityMatrixSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a matrix with an invalid rail inside rails array", () => {
    const bad = {
      ...validMatrix,
      rails: [{ railId: "", name: "Bad", state: "mock", depositSupported: true, withdrawalSupported: true, currencies: [], countries: [] }],
    };
    expect(AnchorCapabilityMatrixSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects when anchorName is missing", () => {
    const { anchorName: _, ...bad } = validMatrix;
    expect(AnchorCapabilityMatrixSchema.safeParse(bad).success).toBe(false);
  });
});
