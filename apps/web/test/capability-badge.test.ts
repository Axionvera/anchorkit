import { describe, it, expect } from "vitest";
import {
  CAPABILITY_BADGE_STYLES,
  CAPABILITY_BADGE_LABELS,
  groupCapabilitiesByState,
} from "../components/ui";
import { CAPABILITY_STATES } from "@anchorkit/types";
import type { CapabilityState } from "@anchorkit/types";

describe("CapabilityBadge style/label maps", () => {
  it("has a style entry for every capability state", () => {
    for (const state of CAPABILITY_STATES) {
      expect(CAPABILITY_BADGE_STYLES[state]).toBeDefined();
      expect(CAPABILITY_BADGE_STYLES[state].trim().length).toBeGreaterThan(0);
    }
  });

  it("has a label entry for every capability state", () => {
    for (const state of CAPABILITY_STATES) {
      expect(CAPABILITY_BADGE_LABELS[state]).toBeDefined();
      expect(CAPABILITY_BADGE_LABELS[state].trim().length).toBeGreaterThan(0);
    }
  });

  it("gives each state a distinct style", () => {
    const values = Object.values(CAPABILITY_BADGE_STYLES);
    expect(new Set(values).size).toBe(values.length);
  });

  it("gives each state a distinct label", () => {
    const values = Object.values(CAPABILITY_BADGE_LABELS);
    expect(new Set(values).size).toBe(values.length);
  });

  it("maps unavailable to a visually muted style", () => {
    expect(CAPABILITY_BADGE_STYLES.unavailable).toContain("ink");
  });
});

describe("groupCapabilitiesByState", () => {
  it("correctly groups and counts capability states", () => {
    const input: { state: CapabilityState }[] = [
      { state: "implemented" },
      { state: "mock" },
      { state: "mock" },
      { state: "testnet-only" },
      { state: "experimental" },
      { state: "unavailable" },
      { state: "unavailable" },
      { state: "unavailable" },
    ];

    const result = groupCapabilitiesByState(input);
    expect(result).toEqual({
      implemented: 1,
      mock: 2,
      "testnet-only": 1,
      experimental: 1,
      unavailable: 3,
    });
  });

  it("returns zero counts for missing states", () => {
    const input: { state: CapabilityState }[] = [];
    const result = groupCapabilitiesByState(input);
    expect(result).toEqual({
      implemented: 0,
      mock: 0,
      "testnet-only": 0,
      experimental: 0,
      unavailable: 0,
    });
  });
});

