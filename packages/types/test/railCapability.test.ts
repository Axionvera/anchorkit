/**
 * Tests for anchor rail capability types and constants (issue #54).
 * Validates `ANCHOR_RAIL_CAPABILITY_STATES` and the exported type contracts.
 */

import { describe, it, expect } from "vitest";
import { ANCHOR_RAIL_CAPABILITY_STATES, CAPABILITY_STATES } from "@anchorkit/types";

describe("ANCHOR_RAIL_CAPABILITY_STATES", () => {
  it("is a non-empty readonly array", () => {
    expect(Array.isArray(ANCHOR_RAIL_CAPABILITY_STATES)).toBe(true);
    expect(ANCHOR_RAIL_CAPABILITY_STATES.length).toBeGreaterThan(0);
  });

  it("contains all base CAPABILITY_STATES values", () => {
    for (const state of CAPABILITY_STATES) {
      expect(ANCHOR_RAIL_CAPABILITY_STATES).toContain(state);
    }
  });

  it("additionally contains 'unsupported'", () => {
    expect(ANCHOR_RAIL_CAPABILITY_STATES).toContain("unsupported");
  });

  it("has no duplicate entries", () => {
    expect(new Set(ANCHOR_RAIL_CAPABILITY_STATES).size).toBe(
      ANCHOR_RAIL_CAPABILITY_STATES.length
    );
  });
});
