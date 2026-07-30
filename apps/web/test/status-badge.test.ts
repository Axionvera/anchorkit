import { describe, expect, it } from "vitest";
import {
  badgeClasses,
  badgeSizeClasses,
  getAccountDiagnosticSeverity,
  getStatusSeverity,
  STATUS_BADGE_SIZES,
  STATUS_BADGE_VARIANTS,
} from "@anchorkit/stellar-kit";
import type { BadgeTone, StatusBadgeDomain } from "@anchorkit/types";

const WEB_EXAMPLE_STATUSES: readonly [StatusBadgeDomain, string][] = [
  ["receipt", "confirmed"],
  ["anchor", "pending_user"],
  ["readiness", "blocked"],
  ["transactionReadiness", "warning"],
  ["validationUi", "loading"],
  ["account", "unfunded"],
  ["diagnostic", "unavailable"],
  ["milestone", "disputed"],
];

describe("shared status badge web integration (issue #198)", () => {
  it.each(WEB_EXAMPLE_STATUSES)(
    "resolves %s:%s to a complete display mapping",
    (domain, status) => {
      const severity = getStatusSeverity(domain, status);
      expect(severity).not.toBeNull();
      expect(severity?.label.length).toBeGreaterThan(0);
      expect(severity?.headline.length).toBeGreaterThan(0);
      expect(severity?.detail.length).toBeGreaterThan(0);
    }
  );

  it("provides classes for every variant and size", () => {
    const tones: BadgeTone[] = ["neutral", "amber", "blue", "green", "red"];
    for (const tone of tones) {
      for (const variant of STATUS_BADGE_VARIANTS) {
        expect(badgeClasses(tone, variant).length).toBeGreaterThan(0);
      }
    }
    for (const size of STATUS_BADGE_SIZES) {
      expect(badgeSizeClasses(size).length).toBeGreaterThan(0);
    }
  });

  it("keeps diagnostic invalid and unavailable states distinct", () => {
    const invalid = getAccountDiagnosticSeverity("invalid");
    const unavailable = getAccountDiagnosticSeverity("unavailable");
    expect(invalid.label).toBe("Invalid");
    expect(unavailable.label).toBe("Unavailable");
    expect(invalid.level).not.toBe(unavailable.level);
  });
});
