import { describe, it, expect } from "vitest";
import { FIXTURES_PACKAGE_CAPABILITIES } from "../src/capabilities";
import { CAPABILITY_STATES } from "@anchorkit/types";

describe("FIXTURES_PACKAGE_CAPABILITIES", () => {
  it("has the correct package name", () => {
    expect(FIXTURES_PACKAGE_CAPABILITIES.packageName).toBe("fixtures");
  });

  it("has a valid overall state", () => {
    expect(CAPABILITY_STATES).toContain(FIXTURES_PACKAGE_CAPABILITIES.overallState);
  });

  it("has a non-empty list of features", () => {
    expect(FIXTURES_PACKAGE_CAPABILITIES.features.length).toBeGreaterThan(0);
  });

  it("gives every feature a unique ID", () => {
    const ids = FIXTURES_PACKAGE_CAPABILITIES.features.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every feature a valid state from CAPABILITY_STATES", () => {
    for (const feature of FIXTURES_PACKAGE_CAPABILITIES.features) {
      expect(CAPABILITY_STATES).toContain(feature.state);
    }
  });

  it("gives every feature a non-empty label and description", () => {
    for (const feature of FIXTURES_PACKAGE_CAPABILITIES.features) {
      expect(feature.label.trim().length).toBeGreaterThan(0);
      expect(feature.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("optionally provides a valid docsHref", () => {
    if (FIXTURES_PACKAGE_CAPABILITIES.docsHref !== undefined) {
      expect(FIXTURES_PACKAGE_CAPABILITIES.docsHref.trim().length).toBeGreaterThan(0);
    }
  });
});
