import {
  getMilestoneActionRules,
  getMilestoneAllowedActions,
  isMilestoneActionAllowed,
  getMilestoneEvidenceDisplay,
  getMilestoneUiInfo,
  MILESTONE_ACTION_LABELS,
  MILESTONE_ACTIONS,
} from "@anchorkit/types";
import type {
  Milestone,
  MilestoneAction,
  MilestoneActionRule,
  MilestoneActionAvailability,
  MilestoneEvidenceDisplay,
  MilestoneStatus,
  MilestoneUiInfo,
} from "@anchorkit/types";

export {
  getMilestoneActionRules,
  getMilestoneAllowedActions,
  isMilestoneActionAllowed,
  getMilestoneEvidenceDisplay,
  getMilestoneUiInfo,
  MILESTONE_ACTION_LABELS,
  MILESTONE_ACTIONS,
};
export type {
  Milestone,
  MilestoneAction,
  MilestoneActionRule,
  MilestoneActionAvailability,
  MilestoneEvidenceDisplay,
  MilestoneStatus,
  MilestoneUiInfo,
};

/** Human-readable description for an action. */
export function actionLabel(action: MilestoneAction): string {
  return MILESTONE_ACTION_LABELS[action];
}

/** Whether the action should render as a button in the UI. */
export function isActionVisible(availability: MilestoneActionAvailability): boolean {
  return availability !== "hidden";
}

/** Tailwind button variant for a given action. */
export function actionButtonVariant(action: MilestoneAction): "primary" | "secondary" | "danger" {
  switch (action) {
    case "release":
      return "primary";
    case "dispute":
      return "danger";
    default:
      return "secondary";
  }
}
