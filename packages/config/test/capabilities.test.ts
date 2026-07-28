import { describe, it, expect } from "vitest";
import { MODULE_CAPABILITIES } from "../src/capabilities";
import { CAPABILITY_STATES } from "@anchorkit/types";
import type { CapabilityModuleId } from "@anchorkit/types";

const EXPECTED_MODULE_IDS: CapabilityModuleId[] = [
  "accounts",
  "payments",
  "anchors",
  "escrow",
  "diagnostics",
  "network-config",
];

describe("MODULE_CAPABILITIES", () => {
  it("has exactly 6 entries", () => {
    expect(MODULE_CAPABILITIES).toHaveLength(6);
  });

  it("contains all expected module ids", () => {
    const ids = MODULE_CAPABILITIES.map((m) => m.id);
    for (const expected of EXPECTED_MODULE_IDS) {
      expect(ids).toContain(expected);
    }
  });

  it("has no duplicate module ids", () => {
    const ids = MODULE_CAPABILITIES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every entry a valid state from CAPABILITY_STATES", () => {
    for (const entry of MODULE_CAPABILITIES) {
      expect(CAPABILITY_STATES).toContain(entry.state);
    }
  });

  it("gives every entry a non-empty label", () => {
    for (const entry of MODULE_CAPABILITIES) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("gives every entry a non-empty description", () => {
    for (const entry of MODULE_CAPABILITIES) {
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("gives docsHref as a non-empty string when present", () => {
    for (const entry of MODULE_CAPABILITIES) {
      if (entry.docsHref !== undefined) {
        expect(entry.docsHref.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
