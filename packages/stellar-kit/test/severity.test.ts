import { describe, it, expect } from "vitest";
import type {
  AccountStatus,
  AccountDiagnosticState,
  AnchorTransactionStatus,
  MilestoneStatus,
  ReadinessState,
  SeverityLevel,
  TransactionReadinessState,
  TransactionReceiptStatus,
} from "@anchorkit/types";
import { VALIDATION_UI_STATES } from "@anchorkit/types";
import {
  getReceiptSeverity,
  getAnchorSeverity,
  getReadinessSeverity,
  getTransactionReadinessSeverity,
  getAccountSeverity,
  getAccountDiagnosticSeverity,
  getMilestoneSeverity,
  getValidationUiStateSeverity,
  getStatusSeverity,
  badgeClasses,
  badgeSizeClasses,
  alertClasses,
  BADGE_TONE_CLASSES,
  BADGE_TONE_CLASSES_SOLID,
  BADGE_SIZE_CLASSES,
  ALERT_TONE_CLASSES,
  SEVERITY_LEVELS,
  BADGE_TONES,
  STATUS_BADGE_DOMAINS,
  STATUS_BADGE_VARIANTS,
  STATUS_BADGE_SIZES,
} from "../src/severity";
import {
  RECEIPT_SEVERITY_ENTRIES,
  ANCHOR_SEVERITY_ENTRIES,
  READINESS_SEVERITY_ENTRIES,
  TRANSACTION_READINESS_SEVERITY_ENTRIES,
  ACCOUNT_SEVERITY_ENTRIES,
  ACCOUNT_DIAGNOSTIC_SEVERITY_ENTRIES,
  MILESTONE_SEVERITY_ENTRIES,
  VALIDATION_UI_STATE_SEVERITY_ENTRIES,
} from "./fixtures";

// ─── Receipt severity ───────────────────────────────────────────────────────

describe("getReceiptSeverity", () => {
  it.each(RECEIPT_SEVERITY_ENTRIES)("maps %s to %s", (status, expectedLevel) => {
    const result = getReceiptSeverity(status);
    expect(result.level).toBe(expectedLevel);
    expect(result.label).toBeTruthy();
    expect(result.headline).toBeTruthy();
    expect(result.detail).toBeTruthy();
  });

  it("confirmed maps to success", () => {
    const result = getReceiptSeverity("confirmed");
    expect(result.level).toBe("success");
    expect(result.tone).toBe("green");
    expect(result.action).toBe("none");
  });

  it("failed maps to error", () => {
    const result = getReceiptSeverity("failed");
    expect(result.level).toBe("error");
    expect(result.tone).toBe("red");
  });
});

// ─── Anchor severity ────────────────────────────────────────────────────────

describe("getAnchorSeverity", () => {
  it.each(ANCHOR_SEVERITY_ENTRIES)("maps %s to %s", (status, expectedLevel) => {
    const result = getAnchorSeverity(status);
    expect(result.level).toBe(expectedLevel);
    expect(result.label).toBeTruthy();
    expect(result.headline).toBeTruthy();
    expect(result.detail).toBeTruthy();
  });

  it("completed maps to success", () => {
    const result = getAnchorSeverity("completed");
    expect(result.level).toBe("success");
    expect(result.tone).toBe("green");
  });

  it("pending_user maps to warning", () => {
    const result = getAnchorSeverity("pending_user");
    expect(result.level).toBe("warning");
    expect(result.action).toBe("review_details");
  });
});

// ─── Readiness severity ─────────────────────────────────────────────────────

describe("getReadinessSeverity", () => {
  it.each(READINESS_SEVERITY_ENTRIES)("maps %s to %s", (state, expectedLevel) => {
    const result = getReadinessSeverity(state);
    expect(result.level).toBe(expectedLevel);
    expect(result.label).toBeTruthy();
    expect(result.headline).toBeTruthy();
    expect(result.detail).toBeTruthy();
  });

  it("ready maps to success with green tone", () => {
    const result = getReadinessSeverity("ready");
    expect(result.level).toBe("success");
    expect(result.tone).toBe("green");
    expect(result.action).toBe("none");
  });

  it("blocked maps to blocked with red tone", () => {
    const result = getReadinessSeverity("blocked");
    expect(result.level).toBe("blocked");
    expect(result.tone).toBe("red");
    expect(result.action).toBe("review_details");
  });

  it("unsafe-network maps to blocked with enable_mainnet action", () => {
    const result = getReadinessSeverity("unsafe-network");
    expect(result.level).toBe("blocked");
    expect(result.action).toBe("enable_mainnet");
    expect(result.docLink).toContain("SECURITY_NOTES");
  });
});

describe("getTransactionReadinessSeverity", () => {
  it.each(TRANSACTION_READINESS_SEVERITY_ENTRIES)("maps %s to %s", (state, expectedLevel) => {
    const result = getTransactionReadinessSeverity(state);
    expect(result.level).toBe(expectedLevel);
    expect(result.label).toBeTruthy();
    expect(result.headline).toBeTruthy();
    expect(result.detail).toBeTruthy();
  });

  it("keeps invalid, blocked, and unavailable semantically distinct", () => {
    expect(getTransactionReadinessSeverity("invalid").level).toBe("error");
    expect(getTransactionReadinessSeverity("blocked").level).toBe("blocked");
    expect(getTransactionReadinessSeverity("unavailable").level).toBe("unknown");
  });
});

// ─── Account severity ───────────────────────────────────────────────────────

describe("getAccountSeverity", () => {
  it.each(ACCOUNT_SEVERITY_ENTRIES)("maps %s to %s", (status, expectedLevel) => {
    const result = getAccountSeverity(status);
    expect(result.level).toBe(expectedLevel);
    expect(result.label).toBeTruthy();
    expect(result.headline).toBeTruthy();
    expect(result.detail).toBeTruthy();
  });

  it("unfunded maps to warning with fund_account action", () => {
    const result = getAccountSeverity("unfunded");
    expect(result.level).toBe("warning");
    expect(result.action).toBe("fund_account");
  });
});

describe("getAccountDiagnosticSeverity", () => {
  it.each(ACCOUNT_DIAGNOSTIC_SEVERITY_ENTRIES)("maps %s to %s", (state, expectedLevel) => {
    const result = getAccountDiagnosticSeverity(state);
    expect(result.level).toBe(expectedLevel);
    expect(result.label).toBeTruthy();
  });

  it("represents invalid and unavailable diagnostics without collapsing them", () => {
    expect(getAccountDiagnosticSeverity("invalid").label).toBe("Invalid");
    expect(getAccountDiagnosticSeverity("unavailable").label).toBe("Unavailable");
  });
});

// ─── Milestone severity ─────────────────────────────────────────────────────

describe("getMilestoneSeverity", () => {
  it.each(MILESTONE_SEVERITY_ENTRIES)("maps %s to %s", (status, expectedLevel) => {
    const result = getMilestoneSeverity(status);
    expect(result.level).toBe(expectedLevel);
    expect(result.label).toBeTruthy();
    expect(result.headline).toBeTruthy();
    expect(result.detail).toBeTruthy();
  });

  it("disputed maps to error with contact_support action", () => {
    const result = getMilestoneSeverity("disputed");
    expect(result.level).toBe("error");
    expect(result.tone).toBe("red");
    expect(result.action).toBe("contact_support");
  });

  it("released maps to success", () => {
    const result = getMilestoneSeverity("released");
    expect(result.level).toBe("success");
    expect(result.action).toBe("none");
  });
});

// ─── Validation UI state severity ───────────────────────────────────────────

describe("getValidationUiStateSeverity", () => {
  it.each(VALIDATION_UI_STATE_SEVERITY_ENTRIES)("maps %s to %s", (state, expectedLevel) => {
    const result = getValidationUiStateSeverity(state);
    expect(result.level).toBe(expectedLevel);
    expect(result.label).toBeTruthy();
    expect(result.headline).toBeTruthy();
    expect(result.detail).toBeTruthy();
  });

  it("loading maps to info with blue tone", () => {
    const result = getValidationUiStateSeverity("loading");
    expect(result.level).toBe("info");
    expect(result.tone).toBe("blue");
  });

  it("ready maps to success with green tone", () => {
    const result = getValidationUiStateSeverity("ready");
    expect(result.level).toBe("success");
    expect(result.tone).toBe("green");
    expect(result.action).toBe("none");
  });

  it("warning and blocked map to visually distinct tones", () => {
    const warning = getValidationUiStateSeverity("warning");
    const blocked = getValidationUiStateSeverity("blocked");
    expect(warning.tone).toBe("amber");
    expect(blocked.tone).toBe("red");
    expect(warning.tone).not.toBe(blocked.tone);
    expect(warning.level).not.toBe(blocked.level);
  });
});

// ─── Unified getStatusSeverity ──────────────────────────────────────────────

describe("getStatusSeverity", () => {
  it("dispatches to receipt mapping", () => {
    const result = getStatusSeverity("receipt", "confirmed");
    expect(result).not.toBeNull();
    expect(result!.level).toBe("success");
  });

  it("dispatches to anchor mapping", () => {
    const result = getStatusSeverity("anchor", "failed");
    expect(result).not.toBeNull();
    expect(result!.level).toBe("error");
  });

  it("dispatches to readiness mapping", () => {
    const result = getStatusSeverity("readiness", "blocked");
    expect(result).not.toBeNull();
    expect(result!.level).toBe("blocked");
  });

  it("dispatches to transaction-readiness mapping", () => {
    expect(getStatusSeverity("transactionReadiness", "unavailable")?.level).toBe("unknown");
  });

  it("dispatches to account mapping", () => {
    const result = getStatusSeverity("account", "funded");
    expect(result).not.toBeNull();
    expect(result!.level).toBe("success");
  });

  it("dispatches to account diagnostic mapping", () => {
    expect(getStatusSeverity("diagnostic", "invalid")?.level).toBe("error");
  });

  it("dispatches to milestone mapping", () => {
    const result = getStatusSeverity("milestone", "disputed");
    expect(result).not.toBeNull();
    expect(result!.level).toBe("error");
  });

  it("dispatches to validationUi mapping", () => {
    const result = getStatusSeverity("validationUi", "blocked");
    expect(result).not.toBeNull();
    expect(result!.level).toBe("blocked");
  });

  it("returns null for unknown domain", () => {
    const result = getStatusSeverity("unknown_domain" as any, "foo" as any);
    expect(result).toBeNull();
  });

  it("returns null for unknown status in valid domain", () => {
    const result = getStatusSeverity("receipt", "nonexistent" as any);
    expect(result).toBeNull();
  });
});

// ─── Badge classes ──────────────────────────────────────────────────────────

describe("badgeClasses", () => {
  it("returns a string for each tone", () => {
    for (const tone of BADGE_TONES) {
      const cls = badgeClasses(tone);
      expect(typeof cls).toBe("string");
      expect(cls.length).toBeGreaterThan(0);
    }
  });

  it("returns different classes for default vs solid for colored tones", () => {
    for (const tone of ["amber", "blue", "green", "red"]) {
      const defaultCls = badgeClasses(tone as any, "default");
      const solidCls = badgeClasses(tone as any, "solid");
      expect(defaultCls).not.toBe(solidCls);
    }
  });
});

describe("badgeSizeClasses", () => {
  it("returns classes for every shared badge size", () => {
    for (const size of STATUS_BADGE_SIZES) {
      expect(badgeSizeClasses(size)).toBe(BADGE_SIZE_CLASSES[size]);
      expect(badgeSizeClasses(size).length).toBeGreaterThan(0);
    }
  });
});

// ─── Alert classes ──────────────────────────────────────────────────────────

describe("alertClasses", () => {
  it("returns a string for each severity level", () => {
    for (const level of SEVERITY_LEVELS) {
      const cls = alertClasses(level);
      expect(typeof cls).toBe("string");
      expect(cls.length).toBeGreaterThan(0);
    }
  });
});

// ─── Completeness checks ───────────────────────────────────────────────────

describe("severity mapping completeness", () => {
  it("covers all receipt statuses", () => {
    const allStatuses: TransactionReceiptStatus[] = [
      "confirmed",
      "pending",
      "failed",
      "rejected",
      "unknown",
    ];
    for (const status of allStatuses) {
      const result = getReceiptSeverity(status);
      expect(result).toBeDefined();
      expect(result.level).toBeTruthy();
    }
  });

  it("covers all anchor statuses", () => {
    const allStatuses: AnchorTransactionStatus[] = [
      "pending_user",
      "pending_anchor",
      "pending_stellar",
      "completed",
      "failed",
      "refunded",
    ];
    for (const status of allStatuses) {
      const result = getAnchorSeverity(status);
      expect(result).toBeDefined();
      expect(result.level).toBeTruthy();
    }
  });

  it("covers all readiness states", () => {
    const allStates: ReadinessState[] = ["ready", "warnings", "unsafe-network", "blocked"];
    for (const state of allStates) {
      const result = getReadinessSeverity(state);
      expect(result).toBeDefined();
      expect(result.level).toBeTruthy();
    }
  });

  it("covers all transaction readiness states", () => {
    const allStates: TransactionReadinessState[] = [
      "valid",
      "invalid",
      "blocked",
      "warning",
      "unavailable",
    ];
    for (const state of allStates) {
      expect(getTransactionReadinessSeverity(state)).toBeDefined();
    }
  });

  it("covers all account statuses", () => {
    const allStatuses: AccountStatus[] = ["funded", "unfunded", "unknown", "error"];
    for (const status of allStatuses) {
      const result = getAccountSeverity(status);
      expect(result).toBeDefined();
      expect(result.level).toBeTruthy();
    }
  });

  it("covers all account diagnostic states", () => {
    const allStates: AccountDiagnosticState[] = [
      "funded",
      "unfunded",
      "invalid",
      "unavailable",
      "unknown",
    ];
    for (const state of allStates) {
      expect(getAccountDiagnosticSeverity(state)).toBeDefined();
    }
  });

  it("covers all milestone statuses", () => {
    const allStatuses: MilestoneStatus[] = [
      "draft",
      "active",
      "evidence_submitted",
      "approved",
      "disputed",
      "ready_for_release",
      "released",
    ];
    for (const status of allStatuses) {
      const result = getMilestoneSeverity(status);
      expect(result).toBeDefined();
      expect(result.level).toBeTruthy();
    }
  });

  it("covers all validation UI states", () => {
    for (const state of VALIDATION_UI_STATES) {
      const result = getValidationUiStateSeverity(state);
      expect(result).toBeDefined();
      expect(result.level).toBeTruthy();
    }
  });
});

// ─── Consistency checks ────────────────────────────────────────────────────

describe("severity mapping consistency", () => {
  it("all entries have non-empty strings", () => {
    const domains: Array<{
      domain:
        | "receipt"
        | "anchor"
        | "readiness"
        | "transactionReadiness"
        | "account"
        | "diagnostic"
        | "milestone"
        | "validationUi";
      entries: readonly [string, SeverityLevel][];
    }> = [
      { domain: "receipt", entries: RECEIPT_SEVERITY_ENTRIES },
      { domain: "anchor", entries: ANCHOR_SEVERITY_ENTRIES },
      { domain: "readiness", entries: READINESS_SEVERITY_ENTRIES },
      { domain: "transactionReadiness", entries: TRANSACTION_READINESS_SEVERITY_ENTRIES },
      { domain: "account", entries: ACCOUNT_SEVERITY_ENTRIES },
      { domain: "diagnostic", entries: ACCOUNT_DIAGNOSTIC_SEVERITY_ENTRIES },
      { domain: "milestone", entries: MILESTONE_SEVERITY_ENTRIES },
      { domain: "validationUi", entries: VALIDATION_UI_STATE_SEVERITY_ENTRIES },
    ];

    for (const { domain, entries } of domains) {
      for (const [status] of entries) {
        const result = getStatusSeverity(domain, status);
        expect(result).not.toBeNull();
        expect(result!.label.length).toBeGreaterThan(0);
        expect(result!.headline.length).toBeGreaterThan(0);
        expect(result!.detail.length).toBeGreaterThan(0);
      }
    }
  });

  it("severity levels are valid", () => {
    const validLevels: SeverityLevel[] = [
      "info",
      "success",
      "warning",
      "blocked",
      "error",
      "unknown",
    ];
    for (const level of SEVERITY_LEVELS) {
      expect(validLevels).toContain(level);
    }
  });

  it("BADGE_TONE_CLASSES has entries for all tones", () => {
    for (const tone of BADGE_TONES) {
      expect(BADGE_TONE_CLASSES[tone]).toBeTruthy();
      expect(BADGE_TONE_CLASSES_SOLID[tone]).toBeTruthy();
    }
  });

  it("ALERT_TONE_CLASSES has entries for all severity levels", () => {
    for (const level of SEVERITY_LEVELS) {
      expect(ALERT_TONE_CLASSES[level]).toBeTruthy();
    }
  });

  it("exports every shared badge domain and visual variant", () => {
    expect(STATUS_BADGE_DOMAINS).toEqual([
      "receipt",
      "anchor",
      "readiness",
      "transactionReadiness",
      "validationUi",
      "account",
      "diagnostic",
      "milestone",
    ]);
    expect(STATUS_BADGE_VARIANTS).toEqual(["default", "solid"]);
    expect(STATUS_BADGE_SIZES).toEqual(["sm", "md"]);
  });
});
