/**
 * SEP-style anchor transaction lifecycle state machine (issue #5).
 *
 * Models the anchor transaction lifecycle used by SEP-6/24/31-style flows:
 *
 *   pending_user → pending_anchor → pending_stellar → completed
 *                                            │
 *                                            ├──→ failed
 *                                            └──→ refunded
 *
 * `pending_user`    : waiting for the user's action (e.g. KYC, deposit).
 * `pending_anchor`  : anchor is reviewing/processing the request.
 * `pending_stellar` : submitted to Stellar, awaiting confirmation.
 * `completed`       : funds delivered (terminal).
 * `failed`          : terminal error state.
 * `refunded`        : funds returned to the user (terminal).
 *
 * The repo already ships status types, message/badge maps, and mock-record
 * builders. This module adds the **missing** piece from the issue: explicit
 * transition rules that *reject or flag invalid transitions* instead of
 * silently wrapping around.
 */

import type { AnchorTransactionStatus, AnchorTransactionKind, AnchorKitError } from "@anchorkit/types";
import { createAnchorKitError } from "@anchorkit/types";

/** Legal next-state sets for each status. Terminal states map to empty sets. */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<AnchorTransactionStatus, readonly AnchorTransactionStatus[]>
> = {
  pending_user: ["pending_anchor"],
  pending_anchor: ["pending_stellar", "failed", "refunded"],
  pending_stellar: ["completed", "failed", "refunded"],
  completed: [],
  failed: [],
  refunded: [],
};

/** Terminal states (no further transitions allowed). */
export const TERMINAL_STATUSES: readonly AnchorTransactionStatus[] = [
  "completed",
  "failed",
  "refunded",
];

export function isTerminalStatus(status: AnchorTransactionStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** True if moving `from` → `to` is a legal lifecycle transition. */
export function isTransitionValid(
  from: AnchorTransactionStatus,
  to: AnchorTransactionStatus
): boolean {
  if (from === to) return true; // staying put is always allowed
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface TransitionResult {
  ok: boolean;
  status?: AnchorTransactionStatus;
  error?: string;
  anchorKitError?: AnchorKitError;
}

/**
 * Attempt a lifecycle transition. Returns `{ ok: true, status }` on success,
 * or `{ ok: false, error, anchorKitError }` when the move is illegal.
 */
export function transition(
  from: AnchorTransactionStatus,
  to: AnchorTransactionStatus
): TransitionResult {
  if (isTransitionValid(from, to)) {
    return { ok: true, status: to };
  }
  const allowed = ALLOWED_TRANSITIONS[from];
  const allowedText = allowed.length
    ? allowed.join(", ")
    : "(no further transitions — terminal)";
  const msg = `Illegal transition '${from}' → '${to}'. Allowed next: ${allowedText}.`;
  
  const err = createAnchorKitError({
    category: "ANCHOR",
    code: "ILLEGAL_LIFECYCLE_TRANSITION",
    message: msg,
    userSafeMessage: "This transaction transition is not allowed by the anchor lifecycle rules.",
    details: { from, to, allowed },
  });

  return {
    ok: false,
    error: msg,
    anchorKitError: err,
  };
}

/**
 * Compute the next automatic status along the happy path, or the given
 * terminal override.
 */
export function nextStatus(
  current: AnchorTransactionStatus,
  terminal?: "completed" | "failed" | "refunded"
): AnchorTransactionStatus | null {
  if (terminal) return terminal;
  const forward = ALLOWED_TRANSITIONS[current];
  return forward && forward.length > 0 ? forward[0]! : null;
}

/**
 * Validate a sequence of status changes. Returns the first illegal step, or `null`.
 */
export function findFirstIllegalTransition(
  steps: readonly AnchorTransactionStatus[]
): { from: AnchorTransactionStatus; to: AnchorTransactionStatus; index: number } | null {
  for (let i = 1; i < steps.length; i++) {
    const from = steps[i - 1]!;
    const to = steps[i]!;
    if (!isTransitionValid(from, to)) {
      return { from, to, index: i };
    }
  }
  return null;
}

/** Convenience: describe the lifecycle step for UI labels. */
export function lifecycleStepLabel(
  status: AnchorTransactionStatus,
  kind: AnchorTransactionKind
): string {
  const k = kind === "deposit" ? "Deposit" : "Withdrawal";
  switch (status) {
    case "pending_user":
      return `${k}: awaiting your action`;
    case "pending_anchor":
      return `${k}: anchor processing`;
    case "pending_stellar":
      return `${k}: settling on Stellar`;
    case "completed":
      return `${k}: completed`;
    case "failed":
      return `${k}: failed`;
    case "refunded":
      return `${k}: refunded`;
  }
}
