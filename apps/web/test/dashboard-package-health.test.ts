import { describe, it, expect } from "vitest";
import { CONFIG_PACKAGE_CAPABILITIES } from "@anchorkit/config";
import { STELLAR_KIT_CAPABILITIES } from "@anchorkit/stellar-kit";
import { ANCHOR_UTILS_CAPABILITIES } from "@anchorkit/anchor-utils";
import { TYPES_PACKAGE_CAPABILITIES } from "@anchorkit/types";
import { VALIDATORS_PACKAGE_CAPABILITIES } from "@anchorkit/validators";
import { FIXTURES_PACKAGE_CAPABILITIES } from "@anchorkit/fixtures";
import { CAPABILITY_STATES } from "@anchorkit/types";
import type { PackageCapability } from "@anchorkit/types";

const ALL_PACKAGE_CAPABILITIES: PackageCapability[] = [
  STELLAR_KIT_CAPABILITIES,
  ANCHOR_UTILS_CAPABILITIES,
  CONFIG_PACKAGE_CAPABILITIES,
  TYPES_PACKAGE_CAPABILITIES,
  VALIDATORS_PACKAGE_CAPABILITIES,
  FIXTURES_PACKAGE_CAPABILITIES,
];

const EXPECTED_PACKAGES = [
  "stellar-kit",
  "anchor-utils",
  "config",
  "types",
  "validators",
  "fixtures",
] as const;

describe("dashboard package health", () => {
  it("contains exactly 6 packages", () => {
    expect(ALL_PACKAGE_CAPABILITIES).toHaveLength(6);
  });

  it("includes every expected package name", () => {
    const names = ALL_PACKAGE_CAPABILITIES.map((p) => p.packageName);
    for (const expected of EXPECTED_PACKAGES) {
      expect(names).toContain(expected);
    }
  });

  it("has no duplicate package names", () => {
    const names = ALL_PACKAGE_CAPABILITIES.map((p) => p.packageName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("gives every package a valid overall state", () => {
    for (const pkg of ALL_PACKAGE_CAPABILITIES) {
      expect(CAPABILITY_STATES).toContain(pkg.overallState);
    }
  });

  it("gives every package features with valid states", () => {
    for (const pkg of ALL_PACKAGE_CAPABILITIES) {
      for (const feature of pkg.features) {
        expect(CAPABILITY_STATES).toContain(feature.state);
      }
    }
  });

  it("gives every feature a non-empty label", () => {
    for (const pkg of ALL_PACKAGE_CAPABILITIES) {
      for (const feature of pkg.features) {
        expect(feature.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every feature a unique id within its package", () => {
    for (const pkg of ALL_PACKAGE_CAPABILITIES) {
      const ids = pkg.features.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
