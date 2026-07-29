import { describe, it, expect } from "vitest";
import { VALIDATION_UI_STATES } from "@anchorkit/types";
import { badgeClasses, alertClasses, getValidationUiStateSeverity } from "@anchorkit/stellar-kit";

/**
 * `ValidationStateBadge`/`ValidationStateAlert` (components/ui.tsx) are thin
 * wrappers around `getValidationUiStateSeverity` + `badgeClasses`/
 * `alertClasses` — the same functions this suite exercises directly. This
 * mirrors the logic-only, no-DOM-rendering convention used by
 * `capability-badge.test.ts`, verifying every state the shared components
 * can receive resolves to real, distinct styling instead of rendering JSX.
 */
describe("ValidationStateBadge/ValidationStateAlert styling", () => {
  it("resolves badge classes for every validation UI state", () => {
    for (const state of VALIDATION_UI_STATES) {
      const severity = getValidationUiStateSeverity(state);
      const cls = badgeClasses(severity.tone);
      expect(typeof cls).toBe("string");
      expect(cls.length).toBeGreaterThan(0);
    }
  });

  it("resolves alert classes for every validation UI state (Alert's widened SeverityLevel tone)", () => {
    for (const state of VALIDATION_UI_STATES) {
      const severity = getValidationUiStateSeverity(state);
      const cls = alertClasses(severity.level);
      expect(typeof cls).toBe("string");
      expect(cls.length).toBeGreaterThan(0);
    }
  });

  it("gives every state a non-empty label and defaulted headline/detail copy", () => {
    for (const state of VALIDATION_UI_STATES) {
      const severity = getValidationUiStateSeverity(state);
      expect(severity.label.trim().length).toBeGreaterThan(0);
      expect(severity.headline.trim().length).toBeGreaterThan(0);
      expect(severity.detail.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps warning and blocked visually distinct", () => {
    const warning = getValidationUiStateSeverity("warning");
    const blocked = getValidationUiStateSeverity("blocked");
    expect(badgeClasses(warning.tone)).not.toBe(badgeClasses(blocked.tone));
    expect(alertClasses(warning.level)).not.toBe(alertClasses(blocked.level));
  });
});
