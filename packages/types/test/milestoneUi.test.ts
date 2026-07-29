import { describe, it, expect } from "vitest";
import {
  getMilestoneActionRules,
  getMilestoneAllowedActions,
  isMilestoneActionAllowed,
  getMilestoneEvidenceDisplay,
  getMilestoneUiInfo,
  MILESTONE_ACTION_LABELS,
  MILESTONE_ACTIONS,
} from "../src/milestoneUi";
import type {
  Milestone,
  MilestoneAction,
  MilestoneEvidenceDisplay,
  MilestoneStatus,
  MilestoneUiInfo,
} from "../src/milestoneUi";

// ─── Helpers ────────────────────────────────────────────────────────────────

function ms(
  status: MilestoneStatus,
  overrides?: Partial<Milestone>,
): Milestone {
  return {
    id: "1",
    title: "Test milestone",
    amount: "5000.0000000",
    status,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    ...overrides,
  } as Milestone;
}

// ─── Milestone action rules per status ──────────────────────────────────────

describe("getMilestoneActionRules", () => {
  it("returns rules for draft status", () => {
    const rules = getMilestoneActionRules("draft");
    expect(rules.find((r) => r.action === "assign_amount")?.availability).toBe("admin_only");
    expect(rules.find((r) => r.action === "submit_evidence")?.availability).toBe("hidden");
    expect(rules.find((r) => r.action === "approve")?.availability).toBe("hidden");
    expect(rules.find((r) => r.action === "dispute")?.availability).toBe("hidden");
    expect(rules.find((r) => r.action === "mark_ready_for_release")?.availability).toBe("hidden");
    expect(rules.find((r) => r.action === "release")?.availability).toBe("hidden");
  });

  it("allows submit_evidence for active", () => {
    const rules = getMilestoneActionRules("active");
    expect(rules.find((r) => r.action === "submit_evidence")?.availability).toBe("admin_only");
  });

  it("allows approve and dispute for evidence_submitted", () => {
    const rules = getMilestoneActionRules("evidence_submitted");
    expect(rules.find((r) => r.action === "approve")?.availability).toBe("admin_only");
    expect(rules.find((r) => r.action === "dispute")?.availability).toBe("admin_only");
  });

  it("allows mark_ready_for_release for approved", () => {
    const rules = getMilestoneActionRules("approved");
    expect(rules.find((r) => r.action === "mark_ready_for_release")?.availability).toBe("admin_only");
  });

  it("disputed shows only none action", () => {
    const rules = getMilestoneActionRules("disputed");
    const visible = rules.filter((r) => r.availability !== "hidden");
    expect(visible).toHaveLength(1);
    expect(visible[0].action).toBe("none");
    expect(visible[0].availability).toBe("allowed");
  });

  it("allows release for ready_for_release", () => {
    const rules = getMilestoneActionRules("ready_for_release");
    expect(rules.find((r) => r.action === "release")?.availability).toBe("admin_only");
  });

  it("released shows only none action", () => {
    const rules = getMilestoneActionRules("released");
    const visible = rules.filter((r) => r.availability !== "hidden");
    expect(visible).toHaveLength(1);
    expect(visible[0].action).toBe("none");
  });

  it("release action is hidden for released", () => {
    const rules = getMilestoneActionRules("released");
    expect(rules.find((r) => r.action === "release")?.availability).toBe("hidden");
  });
});

// ─── Allowed actions per status and role ────────────────────────────────────

describe("getMilestoneAllowedActions", () => {
  it("returns assign_amount for draft when admin", () => {
    expect(getMilestoneAllowedActions("draft", true)).toEqual(["assign_amount"]);
  });

  it("returns empty for draft when not admin", () => {
    expect(getMilestoneAllowedActions("draft", false)).toEqual([]);
  });

  it("returns submit_evidence for active when admin", () => {
    expect(getMilestoneAllowedActions("active", true)).toEqual(["submit_evidence"]);
  });

  it("returns empty for active when not admin", () => {
    expect(getMilestoneAllowedActions("active", false)).toEqual([]);
  });

  it("returns approve and dispute for evidence_submitted when admin", () => {
    const actions = getMilestoneAllowedActions("evidence_submitted", true);
    expect(actions).toContain("approve");
    expect(actions).toContain("dispute");
  });

  it("returns empty for evidence_submitted when not admin", () => {
    expect(getMilestoneAllowedActions("evidence_submitted", false)).toEqual([]);
  });

  it("returns mark_ready_for_release for approved when admin", () => {
    expect(getMilestoneAllowedActions("approved", true)).toEqual(["mark_ready_for_release"]);
  });

  it("returns empty for approved when not admin", () => {
    expect(getMilestoneAllowedActions("approved", false)).toEqual([]);
  });

  it("returns none for disputed regardless of role", () => {
    expect(getMilestoneAllowedActions("disputed", true)).toEqual(["none"]);
    expect(getMilestoneAllowedActions("disputed", false)).toEqual(["none"]);
  });

  it("returns release for ready_for_release when admin", () => {
    expect(getMilestoneAllowedActions("ready_for_release", true)).toEqual(["release"]);
  });

  it("returns empty for ready_for_release when not admin", () => {
    expect(getMilestoneAllowedActions("ready_for_release", false)).toEqual([]);
  });

  it("returns none for released regardless of role", () => {
    expect(getMilestoneAllowedActions("released", true)).toEqual(["none"]);
    expect(getMilestoneAllowedActions("released", false)).toEqual(["none"]);
  });
});

// ─── isMilestoneActionAllowed ───────────────────────────────────────────────

describe("isMilestoneActionAllowed", () => {
  it("allows release only when status is ready_for_release and admin", () => {
    expect(isMilestoneActionAllowed("release", "ready_for_release", true)).toBe(true);
    expect(isMilestoneActionAllowed("release", "ready_for_release", false)).toBe(false);
  });

  it("blocks release for released even for admin", () => {
    expect(isMilestoneActionAllowed("release", "released", true)).toBe(false);
  });

  it("allows approve on evidence_submitted only for admin", () => {
    expect(isMilestoneActionAllowed("approve", "evidence_submitted", true)).toBe(true);
    expect(isMilestoneActionAllowed("approve", "evidence_submitted", false)).toBe(false);
  });

  it("allows assign_amount only on draft for admin", () => {
    expect(isMilestoneActionAllowed("assign_amount", "draft", true)).toBe(true);
    expect(isMilestoneActionAllowed("assign_amount", "active", true)).toBe(false);
    expect(isMilestoneActionAllowed("assign_amount", "draft", false)).toBe(false);
  });
});

// ─── Evidence hash display ──────────────────────────────────────────────────

describe("getMilestoneEvidenceDisplay", () => {
  const VALID_HASH = "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9";

  it("returns not_submitted when evidenceHash is undefined", () => {
    const result = getMilestoneEvidenceDisplay(ms("active"));
    expect(result.state).toBe("not_submitted");
    expect(result.label).toBe("Not submitted");
    expect(result.truncated).toBeUndefined();
  });

  it("returns not_submitted when evidenceHash is empty string", () => {
    const result = getMilestoneEvidenceDisplay(ms("active", { evidenceHash: "" }));
    expect(result.state).toBe("not_submitted");
  });

  it("returns submitted for valid 64-char hex hash", () => {
    const result = getMilestoneEvidenceDisplay(ms("evidence_submitted", { evidenceHash: VALID_HASH }));
    expect(result.state).toBe("submitted");
    expect(result.truncated).toBe("5fece…57e9");
    expect(result.fullHash).toBe(VALID_HASH);
  });

  it("returns invalid for non-hex hash", () => {
    const result = getMilestoneEvidenceDisplay(ms("evidence_submitted", { evidenceHash: "not-a-hash" }));
    expect(result.state).toBe("invalid");
    expect(result.fullHash).toBe("not-a-hash");
  });

  it("returns invalid for hash of wrong length", () => {
    const result = getMilestoneEvidenceDisplay(ms("evidence_submitted", { evidenceHash: "abc123" }));
    expect(result.state).toBe("invalid");
  });

  it("truncates long invalid hashes", () => {
    const longHash =
      "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
    const result = getMilestoneEvidenceDisplay(ms("evidence_submitted", { evidenceHash: longHash }));
    expect(result.state).toBe("invalid");
    expect(result.truncated?.endsWith("…")).toBe(true);
  });
});

// ─── MilestoneUiInfo ────────────────────────────────────────────────────────

describe("getMilestoneUiInfo", () => {
  it("marks isReleased correctly", () => {
    const info = getMilestoneUiInfo(ms("released"), true);
    expect(info.isReleased).toBe(true);
    expect(info.isDisputed).toBe(false);
  });

  it("marks isDisputed correctly", () => {
    const info = getMilestoneUiInfo(ms("disputed"), true);
    expect(info.isDisputed).toBe(true);
    expect(info.isReleased).toBe(false);
  });

  it("sets isReleased and isDisputed false for other statuses", () => {
    for (const status of ["draft", "active", "evidence_submitted", "approved", "ready_for_release"] as MilestoneStatus[]) {
      const info = getMilestoneUiInfo(ms(status), true);
      expect(info.isReleased).toBe(false);
      expect(info.isDisputed).toBe(false);
    }
  });

  it("derives allowedActions from status and role", () => {
    expect(getMilestoneUiInfo(ms("draft"), true).allowedActions).toEqual(["assign_amount"]);
    expect(getMilestoneUiInfo(ms("draft"), false).allowedActions).toEqual([]);
  });

  it("derives evidence display", () => {
    const info = getMilestoneUiInfo(
      ms("evidence_submitted", {
        evidenceHash: "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9",
      }),
      true,
    );
    expect(info.evidence.state).toBe("submitted");
  });
});

// ─── Constants ──────────────────────────────────────────────────────────────

describe("MILESTONE_ACTION_LABELS", () => {
  it("has a label for every action", () => {
    for (const action of MILESTONE_ACTIONS) {
      expect(MILESTONE_ACTION_LABELS[action]).toBeDefined();
      expect(typeof MILESTONE_ACTION_LABELS[action]).toBe("string");
    }
  });
});
