import { describe, it, expect } from "vitest";
import { ANCHOR_UTILS_CAPABILITIES } from "../src/capabilities";
import { CAPABILITY_STATES } from "@anchorkit/types";

describe("ANCHOR_UTILS_CAPABILITIES", () => {
  it("has the correct package name", () => {
    expect(ANCHOR_UTILS_CAPABILITIES.packageName).toBe("anchor-utils");
  });

  it("has a valid overall state", () => {
    expect(CAPABILITY_STATES).toContain(ANCHOR_UTILS_CAPABILITIES.overallState);
  });

  it("has a non-empty list of features", () => {
    expect(ANCHOR_UTILS_CAPABILITIES.features.length).toBeGreaterThan(0);
  });

  it("gives every feature a unique ID", () => {
    const ids = ANCHOR_UTILS_CAPABILITIES.features.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every feature a valid state from CAPABILITY_STATES", () => {
    for (const feature of ANCHOR_UTILS_CAPABILITIES.features) {
      expect(CAPABILITY_STATES).toContain(feature.state);
    }
  });

  it("gives every feature a non-empty label and description", () => {
    for (const feature of ANCHOR_UTILS_CAPABILITIES.features) {
      expect(feature.label.trim().length).toBeGreaterThan(0);
      expect(feature.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("optionally provides a valid docsHref", () => {
    if (ANCHOR_UTILS_CAPABILITIES.docsHref !== undefined) {
      expect(ANCHOR_UTILS_CAPABILITIES.docsHref.trim().length).toBeGreaterThan(0);
    }
  });
});
