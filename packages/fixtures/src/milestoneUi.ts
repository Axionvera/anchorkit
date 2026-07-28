/**
 * Milestone UI state model fixtures (issue #100).
 *
 * Provides pre-built `MilestoneUiInfo` objects for every milestone status,
 * covering both admin and non-admin viewer contexts.
 */
import type {
  Milestone,
  MilestoneAction,
  MilestoneUiInfo,
} from "@anchorkit/types";
import { getMilestoneUiInfo } from "@anchorkit/types";

const EVIDENCE_HASH =
  "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9";
const DISPUTE_HASH =
  "0000000000000000000000000000000000000000000000000000000000000001";

// ─── Milestone stubs ────────────────────────────────────────────────────────

function ms(
  status: Milestone["status"],
  overrides?: Partial<Milestone>,
): Milestone {
  return {
    id: "1",
    title: "Milestone stub",
    amount: "5000.0000000",
    status,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    ...overrides,
  } as Milestone;
}

// ─── Per-status milestone stubs ─────────────────────────────────────────────

export const MILESTONE_DRAFT = ms("draft");
export const MILESTONE_ACTIVE = ms("active");
export const MILESTONE_EVIDENCE = ms("evidence_submitted", {
  evidenceHash: EVIDENCE_HASH,
});
export const MILESTONE_APPROVED = ms("approved", {
  evidenceHash: EVIDENCE_HASH,
  approvedAt: "2026-01-21T09:00:00.000Z",
});
export const MILESTONE_DISPUTED = ms("disputed", {
  evidenceHash: DISPUTE_HASH,
  disputedAt: "2026-02-02T12:00:00.000Z",
  disputeReason: "Evidence did not include the required accessibility audit.",
});
export const MILESTONE_READY = ms("ready_for_release", {
  evidenceHash: EVIDENCE_HASH,
  approvedAt: "2026-01-21T09:00:00.000Z",
});
export const MILESTONE_RELEASED = ms("released", {
  evidenceHash: EVIDENCE_HASH,
  approvedAt: "2026-01-21T09:00:00.000Z",
  releasedAt: "2026-01-23T10:00:00.000Z",
});

// ─── Full lifecycle ─────────────────────────────────────────────────────────

export const ALL_MILESTONES: Milestone[] = [
  MILESTONE_DRAFT,
  MILESTONE_ACTIVE,
  MILESTONE_EVIDENCE,
  MILESTONE_APPROVED,
  MILESTONE_DISPUTED,
  MILESTONE_READY,
  MILESTONE_RELEASED,
];

// ─── Pre-derived UI infos ───────────────────────────────────────────────────

/** UI info snapshots as seen by an admin viewer. */
export function allMilestoneUiInfosAdmin(): MilestoneUiInfo[] {
  return ALL_MILESTONES.map((m) => getMilestoneUiInfo(m, true));
}

/** UI info snapshots as seen by a non-admin viewer. */
export function allMilestoneUiInfosNonAdmin(): MilestoneUiInfo[] {
  return ALL_MILESTONES.map((m) => getMilestoneUiInfo(m, false));
}

/** Full lifecycle of UI infos for milestone 1 (draft → released). */
export function milestoneLifecycleUiInfosAdmin(): MilestoneUiInfo[] {
  return [
    getMilestoneUiInfo(MILESTONE_DRAFT, true),
    getMilestoneUiInfo(MILESTONE_ACTIVE, true),
    getMilestoneUiInfo(MILESTONE_EVIDENCE, true),
    getMilestoneUiInfo(MILESTONE_APPROVED, true),
    getMilestoneUiInfo(MILESTONE_READY, true),
    getMilestoneUiInfo(MILESTONE_RELEASED, true),
  ];
}

/** All actions that should appear as allowed for each status (admin view). */
export const EXPECTED_ALLOWED_ACTIONS_ADMIN: Record<
  Milestone["status"],
  MilestoneAction[]
> = {
  draft: ["assign_amount"],
  active: ["submit_evidence"],
  evidence_submitted: ["approve", "dispute"],
  approved: ["mark_ready_for_release"],
  disputed: ["none"],
  ready_for_release: ["release"],
  released: ["none"],
};
