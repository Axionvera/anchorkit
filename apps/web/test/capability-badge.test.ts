import { describe, it, expect } from "vitest";
import {
  CAPABILITY_BADGE_STYLES,
  CAPABILITY_BADGE_LABELS,
} from "../components/ui";
import { CAPABILITY_STATES } from "@anchorkit/types";

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
