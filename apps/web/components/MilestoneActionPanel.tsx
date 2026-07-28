"use client";

import type { MilestoneAction, MilestoneActionAvailability, MilestoneUiInfo } from "@anchorkit/types";
import {
  actionLabel,
  actionButtonVariant,
  isActionVisible,
} from "@/lib/milestoneUi";
import { clsx } from "clsx";
import { Alert, Button } from "./ui";

interface MilestoneActionPanelProps {
  uiInfo: MilestoneUiInfo;
  isAdmin: boolean;
  /** Callback fired when the user clicks an action button. */
  onAction?: (action: MilestoneAction) => void;
}

/**
 * Renders the available (and blocked) milestone actions based on UI state.
 *
 * - Actions with availability `"hidden"` are not rendered.
 * - `"admin_only"` actions are rendered as disabled for non-admin users.
 * - `"blocked"` actions are rendered as disabled with a tooltip reason.
 * - `"allowed"` actions are clickable.
 */
export function MilestoneActionPanel({
  uiInfo,
  isAdmin,
  onAction,
}: MilestoneActionPanelProps) {
  if (uiInfo.isReleased) {
    return (
      <Alert tone="success" title="Milestone released">
        This milestone has been released. No further actions are available.
      </Alert>
    );
  }

  if (uiInfo.isDisputed) {
    return (
      <Alert tone="error" title="Milestone disputed">
        This milestone is disputed and awaiting resolution. All actions are
        blocked until the dispute is resolved.
      </Alert>
    );
  }

  const visibleRules = uiInfo.actionRules.filter((r) =>
    isActionVisible(r.availability),
  );

  if (visibleRules.length === 0) {
    return (
      <p className="text-sm text-ink-500 dark:text-ink-400">
        No actions available for this milestone status.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink-800 dark:text-ink-200">
        Available actions
      </p>
      {visibleRules.map((rule) => {
        const disabled =
          rule.availability === "blocked" || rule.availability === "admin_only";
        const variant = actionButtonVariant(rule.action);
        const label = actionLabel(rule.action);

        const showAdminIcon =
          rule.availability === "admin_only" && !isAdmin;

        return (
          <div key={rule.action} className="flex items-center gap-2">
            <Button
              variant={disabled ? "secondary" : variant}
              disabled={disabled}
              title={
                rule.reason ??
                (rule.availability === "admin_only" && !isAdmin
                  ? "Admin access required"
                  : label)
              }
              onClick={() =>
                !disabled && isAdmin && onAction?.(rule.action)
              }
              className={clsx(
                disabled && "cursor-not-allowed opacity-50",
                rule.availability === "blocked" && "line-through",
              )}
            >
              {label}
              {showAdminIcon && (
                <span className="ml-1.5 text-ink-400" title="Admin only">
                  &#x1f512;
                </span>
              )}
            </Button>
            {rule.reason && (
              <span className="text-xs text-ink-400 dark:text-ink-500">
                {rule.reason}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
