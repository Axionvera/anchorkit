/**
 * Tests for the anchor capability matrix integration in the web dashboard (issue #54).
 *
 * Verifies that `DEFAULT_ANCHOR_CAPABILITY_MATRIX` is structurally valid and
 * that the `@anchorkit/anchor-utils` parse helpers accept it, without
 * importing React or mounting the component (Next.js RSC compatibility).
 */

import { describe, it, expect } from "vitest";
import { DEFAULT_ANCHOR_CAPABILITY_MATRIX } from "@anchorkit/config";
import {
  isRailDepositReady,
  isRailWithdrawalReady,
} from "@anchorkit/config";
import { isAnchorCapabilityMatrixValid } from "@anchorkit/anchor-utils";
import { ANCHOR_RAIL_CAPABILITY_STATES } from "@anchorkit/types";

describe("DEFAULT_ANCHOR_CAPABILITY_MATRIX (web integration)", () => {
  it("is a valid AnchorCapabilityMatrix according to the validator", () => {
    expect(isAnchorCapabilityMatrixValid(DEFAULT_ANCHOR_CAPABILITY_MATRIX)).toBe(true);
  });

  it("exposes SEPA as deposit-ready", () => {
    expect(isRailDepositReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "SEPA")).toBe(true);
  });

  it("exposes ACH as withdrawal-ready", () => {
    expect(isRailWithdrawalReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "ACH")).toBe(true);
  });

  it("marks CARD as not deposit-ready (unavailable)", () => {
    expect(isRailDepositReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "CARD")).toBe(false);
  });

  it("marks WIRE as not withdrawal-ready (experimental, withdrawal unsupported)", () => {
    expect(isRailWithdrawalReady(DEFAULT_ANCHOR_CAPABILITY_MATRIX, "WIRE")).toBe(false);
  });

  it("all rail states are valid ANCHOR_RAIL_CAPABILITY_STATES", () => {
    for (const rail of DEFAULT_ANCHOR_CAPABILITY_MATRIX.rails) {
      expect(ANCHOR_RAIL_CAPABILITY_STATES).toContain(rail.state);
    }
  });

  it("at least one asset is deposit-enabled", () => {
    const depositEnabled = DEFAULT_ANCHOR_CAPABILITY_MATRIX.assets.filter(
      (a) => a.enabled && a.depositEnabled
    );
    expect(depositEnabled.length).toBeGreaterThan(0);
  });

  it("at least one asset is withdrawal-enabled", () => {
    const withdrawalEnabled = DEFAULT_ANCHOR_CAPABILITY_MATRIX.assets.filter(
      (a) => a.enabled && a.withdrawalEnabled
    );
    expect(withdrawalEnabled.length).toBeGreaterThan(0);
  });
});
