import type { Milestone, MilestoneStatus } from "./index";

/**
 * Actions a UI user can take on an escrow milestone.
 *
 * Each action maps 1:1 to a treasury-escrow contract entry point except
 * `"none"` which is a no-op for display-only statuses (e.g. released).
 */
export type MilestoneAction =
  | "assign_amount"
  | "submit_evidence"
  | "approve"
  | "dispute"
  | "mark_ready_for_release"
  | "release"
  | "none";

/**
 * Whether an action is available to the current user in the UI.
 *
 * - `"allowed"` — available and permitted for the current role.
 * - `"blocked"` — structurally valid but the current status or
 *   prerequisite prevents it. UI may show a disabled button with a reason.
 * - `"hidden"` — never relevant for the current status; not rendered at all.
 * - `"admin_only"` — requires admin privileges. UI may show the button
 *   but disable it for non-admin viewers with a lock indicator.
 */
export type MilestoneActionAvailability =
  | "allowed"
  | "blocked"
  | "hidden"
  | "admin_only";

/**
 * Describes one action's availability in a given milestone context.
 */
export interface MilestoneActionRule {
  action: MilestoneAction;
  availability: MilestoneActionAvailability;
  /** Human-readable explanation when `availability` is `"blocked"`. */
  reason?: string;
}

/**
 * Display-level state of an evidence hash for UI rendering.
 *
 * - `"not_submitted"` → no hash recorded; show a placeholder.
 * - `"submitted"` → hash present; show truncated + copy button.
 * - `"invalid"` → hash present but malformed; show with error styling.
 */
export type MilestoneEvidenceState = "not_submitted" | "submitted" | "invalid";

/**
 * Safe evidence-hash display info for the UI.
 */
export interface MilestoneEvidenceDisplay {
  state: MilestoneEvidenceState;
  /** Truncated hash for inline display (e.g. `"5fece…57e9"`). */
  truncated?: string;
  /** Full hash for copy-to-clipboard interactions. */
  fullHash?: string;
  /** Human-readable label. */
  label: string;
}

/**
 * Aggregated UI-relevant state derived from a `Milestone` domain object.
 *
 * Components consume this single object instead of deriving the same
 * logic repeatedly.
 */
export interface MilestoneUiInfo {
  status: MilestoneStatus;
  allowedActions: MilestoneAction[];
  actionRules: MilestoneActionRule[];
  evidence: MilestoneEvidenceDisplay;
  isReleased: boolean;
  isDisputed: boolean;
}

// ─── Action rule lookup ─────────────────────────────────────────────────────

/**
 * All contract entry points that can be called by a UI user.
 * The `reason` is a human-readable explanation shown when the action is
 * blocked by the current status or a prerequisite.
 */
const ACTION_RULES: Record<MilestoneStatus, MilestoneActionRule[]> = {
  draft: [
    { action: "assign_amount", availability: "admin_only" },
    { action: "submit_evidence", availability: "hidden" },
    { action: "approve", availability: "hidden" },
    { action: "dispute", availability: "hidden" },
    { action: "mark_ready_for_release", availability: "hidden" },
    { action: "release", availability: "hidden" },
    { action: "none", availability: "hidden" },
  ],
  active: [
    { action: "submit_evidence", availability: "admin_only" },
    { action: "assign_amount", availability: "blocked", reason: "Milestone is already active." },
    { action: "approve", availability: "hidden" },
    { action: "dispute", availability: "hidden" },
    { action: "mark_ready_for_release", availability: "hidden" },
    { action: "release", availability: "hidden" },
    { action: "none", availability: "hidden" },
  ],
  evidence_submitted: [
    { action: "approve", availability: "admin_only" },
    { action: "dispute", availability: "admin_only" },
    { action: "submit_evidence", availability: "blocked", reason: "Evidence already submitted." },
    { action: "assign_amount", availability: "hidden" },
    { action: "mark_ready_for_release", availability: "hidden" },
    { action: "release", availability: "hidden" },
    { action: "none", availability: "hidden" },
  ],
  approved: [
    { action: "mark_ready_for_release", availability: "admin_only" },
    { action: "submit_evidence", availability: "hidden" },
    { action: "approve", availability: "hidden" },
    { action: "dispute", availability: "hidden" },
    { action: "assign_amount", availability: "hidden" },
    { action: "release", availability: "hidden" },
    { action: "none", availability: "hidden" },
  ],
  disputed: [
    { action: "none", availability: "allowed", reason: "Dispute resolution not yet implemented." },
    { action: "submit_evidence", availability: "hidden" },
    { action: "approve", availability: "hidden" },
    { action: "dispute", availability: "hidden" },
    { action: "mark_ready_for_release", availability: "hidden" },
    { action: "release", availability: "hidden" },
    { action: "assign_amount", availability: "hidden" },
  ],
  ready_for_release: [
    { action: "release", availability: "admin_only" },
    { action: "submit_evidence", availability: "hidden" },
    { action: "approve", availability: "hidden" },
    { action: "dispute", availability: "hidden" },
    { action: "mark_ready_for_release", availability: "hidden" },
    { action: "assign_amount", availability: "hidden" },
    { action: "none", availability: "hidden" },
  ],
  released: [
    { action: "none", availability: "allowed", reason: "Milestone has been released." },
    { action: "release", availability: "hidden" },
    { action: "submit_evidence", availability: "hidden" },
    { action: "approve", availability: "hidden" },
    { action: "dispute", availability: "hidden" },
    { action: "mark_ready_for_release", availability: "hidden" },
    { action: "assign_amount", availability: "hidden" },
  ],
};

/** Human-readable label for each action. */
export const MILESTONE_ACTION_LABELS: Record<MilestoneAction, string> = {
  assign_amount: "Assign amount",
  submit_evidence: "Submit evidence",
  approve: "Approve",
  dispute: "Dispute",
  mark_ready_for_release: "Mark ready for release",
  release: "Release funds",
  none: "No action available",
};

/** All possible milestone actions in display order. */
export const MILESTONE_ACTIONS: readonly MilestoneAction[] = [
  "assign_amount",
  "submit_evidence",
  "approve",
  "dispute",
  "mark_ready_for_release",
  "release",
  "none",
] as const;

// ─── Public helpers ─────────────────────────────────────────────────────────

/** Get all action rules for a given milestone status. */
export function getMilestoneActionRules(status: MilestoneStatus): MilestoneActionRule[] {
  return ACTION_RULES[status];
}

/**
 * Return the subset of actions that are available to the current user.
 * Non-admin users see `"admin_only"` actions as blocked; admin users see them
 * as allowed.
 */
export function getMilestoneAllowedActions(
  status: MilestoneStatus,
  isAdmin: boolean,
): MilestoneAction[] {
  return ACTION_RULES[status]
    .filter((r) => {
      if (r.availability === "hidden") return false;
      if (r.availability === "admin_only") return isAdmin;
      if (r.availability === "allowed") return true;
      return false;
    })
    .map((r) => r.action);
}

/**
 * Check whether a specific action is allowed for the given status and role.
 */
export function isMilestoneActionAllowed(
  action: MilestoneAction,
  status: MilestoneStatus,
  isAdmin: boolean,
): boolean {
  const rule = ACTION_RULES[status].find((r) => r.action === action);
  if (!rule) return false;
  if (rule.availability === "hidden") return false;
  if (rule.availability === "blocked") return false;
  if (rule.availability === "admin_only") return isAdmin;
  return rule.availability === "allowed";
}

/**
 * Derive safe evidence-hash display info from a milestone.
 *
 * - When `evidenceHash` is absent → `"not_submitted"` state.
 * - When `evidenceHash` is a 64-char hex string → `"submitted"` state.
 * - Any other non-empty value → `"invalid"` state.
 */
export function getMilestoneEvidenceDisplay(milestone: {
  evidenceHash?: string;
  status: MilestoneStatus;
}): MilestoneEvidenceDisplay {
  const hash = milestone.evidenceHash;

  if (!hash) {
    return {
      state: "not_submitted",
      label: "Not submitted",
    };
  }

  if (/^[0-9a-fA-F]{64}$/.test(hash)) {
    const truncated = `${hash.slice(0, 5)}\u2026${hash.slice(-4)}`;
    return {
      state: "submitted",
      truncated,
      fullHash: hash,
      label: `Evidence hash: ${truncated}`,
    };
  }

  return {
    state: "invalid",
    truncated: hash.length > 30 ? `${hash.slice(0, 14)}\u2026` : hash,
    fullHash: hash,
    label: "Evidence hash is malformed",
  };
}

/**
 * Derive the full UI-relevant state from a `Milestone` domain object.
 */
export function getMilestoneUiInfo(
  milestone: Milestone,
  isAdmin: boolean,
): MilestoneUiInfo {
  return {
    status: milestone.status,
    allowedActions: getMilestoneAllowedActions(milestone.status, isAdmin),
    actionRules: getMilestoneActionRules(milestone.status),
    evidence: getMilestoneEvidenceDisplay(milestone),
    isReleased: milestone.status === "released",
    isDisputed: milestone.status === "disputed",
  };
}
