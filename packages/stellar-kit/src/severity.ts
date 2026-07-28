/**
 * Shared status severity mapping (issue #100).
 *
 * Single source of truth for mapping domain-specific statuses to canonical
 * severity levels, badge tones, headlines, detail messages, recommended
 * actions, and documentation links. Consumed by web components, tests, and
 * documentation generators.
 *
 * Every domain status in AnchorKit maps to exactly one `StatusSeverity`
 * entry. The mapping is exhaustive — adding a new domain status requires
 * updating the corresponding switch and the `SEVERITY_MAP` constant.
 */

import type {
  AccountStatus,
  AnchorTransactionStatus,
  BadgeTone,
  MilestoneStatus,
  ReadinessState,
  RecommendedAction,
  SeverityLevel,
  StatusSeverity,
  TransactionReceiptStatus,
} from "@anchorkit/types";

// ─── Badge tone → Tailwind class fragments ──────────────────────────────────

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-800",
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
};

export const BADGE_TONE_CLASSES_SOLID: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-900 dark:text-ink-300 dark:border-ink-800",
  amber: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900",
  blue: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-900",
  green: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-200 dark:border-green-900",
  red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-200 dark:border-red-900",
};

// ─── Alert tone → Tailwind class fragments ──────────────────────────────────

export const ALERT_TONE_CLASSES: Record<SeverityLevel, string> = {
  info: "border-stellar-200 bg-stellar-50 text-stellar-800 dark:border-stellar-900 dark:bg-stellar-950/40 dark:text-stellar-200",
  success: "border-anchor-100 bg-anchor-50 text-anchor-700 dark:border-anchor-900 dark:bg-anchor-950/30 dark:text-anchor-200",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
  blocked: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200",
  unknown: "border-ink-200 bg-ink-50 text-ink-800 dark:border-ink-800 dark:bg-ink-950/30 dark:text-ink-200",
};

// ─── Receipt status severity ────────────────────────────────────────────────

const RECEIPT_SEVERITY: Record<TransactionReceiptStatus, StatusSeverity> = {
  confirmed: {
    level: "success",
    label: "Confirmed",
    tone: "green",
    headline: "Transaction confirmed",
    detail: "The transaction completed successfully on the Stellar network.",
    action: "none",
    docLink: "./docs/transaction-receipts.md",
  },
  pending: {
    level: "info",
    label: "Pending",
    tone: "blue",
    headline: "Transaction pending",
    detail: "The transaction has been submitted and is awaiting confirmation.",
    action: "wait",
    docLink: "./docs/transaction-receipts.md",
  },
  failed: {
    level: "error",
    label: "Failed",
    tone: "red",
    headline: "Transaction failed",
    detail: "The transaction could not be completed. Review the error details and retry if appropriate.",
    action: "retry",
    docLink: "./docs/transaction-receipts.md",
  },
  rejected: {
    level: "warning",
    label: "Rejected",
    tone: "amber",
    headline: "Transaction rejected",
    detail: "The transaction was rejected or reversed before completion.",
    action: "check_explorer",
    docLink: "./docs/transaction-receipts.md",
  },
  unknown: {
    level: "unknown",
    label: "Unknown",
    tone: "neutral",
    headline: "Transaction status unknown",
    detail: "The outcome could not be determined. Check the explorer or try again later.",
    action: "check_explorer",
    docLink: "./docs/transaction-receipts.md",
  },
};

// ─── Anchor status severity ─────────────────────────────────────────────────

const ANCHOR_SEVERITY: Record<AnchorTransactionStatus, StatusSeverity> = {
  pending_user: {
    level: "warning",
    label: "Awaiting You",
    tone: "amber",
    headline: "Action required",
    detail: "Please complete the required steps before the anchor can proceed.",
    action: "review_details",
    docLink: "./docs/anchor-lifecycle.md",
  },
  pending_anchor: {
    level: "info",
    label: "Anchor Processing",
    tone: "blue",
    headline: "Being processed",
    detail: "The anchor is reviewing and processing your request. This can take a few minutes.",
    action: "wait",
    docLink: "./docs/anchor-lifecycle.md",
  },
  pending_stellar: {
    level: "info",
    label: "Settling on Stellar",
    tone: "blue",
    headline: "Settling on Stellar",
    detail: "Your transaction has been submitted to Stellar and is awaiting network confirmation.",
    action: "wait",
    docLink: "./docs/anchor-lifecycle.md",
  },
  completed: {
    level: "success",
    label: "Completed",
    tone: "green",
    headline: "Complete",
    detail: "The transaction has been completed successfully.",
    action: "none",
    docLink: "./docs/anchor-lifecycle.md",
  },
  failed: {
    level: "error",
    label: "Failed",
    tone: "red",
    headline: "Failed",
    detail: "The transaction could not be completed. Please contact support or retry.",
    action: "retry",
    docLink: "./docs/anchor-lifecycle.md",
  },
  refunded: {
    level: "warning",
    label: "Refunded",
    tone: "amber",
    headline: "Refunded",
    detail: "Your funds have been returned. Please check the refund details for more info.",
    action: "check_explorer",
    docLink: "./docs/anchor-lifecycle.md",
  },
};

// ─── Readiness state severity ───────────────────────────────────────────────

const READINESS_SEVERITY: Record<ReadinessState, StatusSeverity> = {
  ready: {
    level: "success",
    label: "Ready",
    tone: "green",
    headline: "Ready to submit",
    detail: "All validation checks passed. The transaction is ready for signing and submission.",
    action: "none",
    docLink: "./docs/transaction-readiness.md",
  },
  warnings: {
    level: "warning",
    label: "Warnings",
    tone: "amber",
    headline: "Ready with warnings",
    detail: "The transaction can proceed but has non-blocking warnings you should review.",
    action: "review_details",
    docLink: "./docs/transaction-readiness.md",
  },
  "unsafe-network": {
    level: "blocked",
    label: "Unsafe Network",
    tone: "red",
    headline: "Mainnet access disabled",
    detail: "Mainnet mode is disabled by default. Review security notes and explicitly enable mainnet if needed.",
    action: "enable_mainnet",
    docLink: "./docs/SECURITY_NOTES.md",
  },
  blocked: {
    level: "blocked",
    label: "Blocked",
    tone: "red",
    headline: "Cannot proceed",
    detail: "One or more validation errors must be resolved before the transaction can be submitted.",
    action: "review_details",
    docLink: "./docs/transaction-readiness.md",
  },
};

// ─── Account status severity ────────────────────────────────────────────────

const ACCOUNT_SEVERITY: Record<AccountStatus, StatusSeverity> = {
  funded: {
    level: "success",
    label: "Funded",
    tone: "green",
    headline: "Account funded",
    detail: "The account is active and funded on the Stellar network.",
    action: "none",
    docLink: "./docs/ACCOUNT_UTILITIES.md",
  },
  unfunded: {
    level: "warning",
    label: "Unfunded",
    tone: "amber",
    headline: "Account not funded",
    detail: "The account exists but has no balance. Fund it via Friendbot to send transactions.",
    action: "fund_account",
    docLink: "./docs/ACCOUNT_UTILITIES.md",
  },
  unknown: {
    level: "unknown",
    label: "Unknown",
    tone: "neutral",
    headline: "Account status unknown",
    detail: "The account status could not be determined. The network may be unavailable.",
    action: "retry",
    docLink: "./docs/ACCOUNT_UTILITIES.md",
  },
  error: {
    level: "error",
    label: "Error",
    tone: "red",
    headline: "Account lookup failed",
    detail: "An error occurred while looking up the account. Check the network and try again.",
    action: "contact_support",
    docLink: "./docs/ACCOUNT_UTILITIES.md",
  },
};

// ─── Milestone status severity ──────────────────────────────────────────────

const MILESTONE_SEVERITY: Record<MilestoneStatus, StatusSeverity> = {
  draft: {
    level: "info",
    label: "Draft",
    tone: "neutral",
    headline: "Milestone drafted",
    detail: "This milestone has been created but is not yet active.",
    action: "none",
    docLink: "./docs/SOROBAN_ESCROW_CONTRACT.md",
  },
  active: {
    level: "info",
    label: "Active",
    tone: "blue",
    headline: "Milestone active",
    detail: "Work on this milestone is in progress.",
    action: "none",
    docLink: "./docs/SOROBAN_ESCROW_CONTRACT.md",
  },
  evidence_submitted: {
    level: "info",
    label: "Evidence Submitted",
    tone: "blue",
    headline: "Evidence submitted",
    detail: "Evidence has been submitted and is awaiting review.",
    action: "wait",
    docLink: "./docs/SOROBAN_ESCROW_CONTRACT.md",
  },
  approved: {
    level: "success",
    label: "Approved",
    tone: "green",
    headline: "Milestone approved",
    detail: "The milestone has been approved and is ready for release.",
    action: "none",
    docLink: "./docs/SOROBAN_ESCROW_CONTRACT.md",
  },
  disputed: {
    level: "error",
    label: "Disputed",
    tone: "red",
    headline: "Milestone disputed",
    detail: "This milestone has been disputed and requires resolution before further progress.",
    action: "contact_support",
    docLink: "./docs/SOROBAN_ESCROW_CONTRACT.md",
  },
  ready_for_release: {
    level: "success",
    label: "Ready for Release",
    tone: "green",
    headline: "Ready for release",
    detail: "The milestone is approved and awaiting fund release.",
    action: "none",
    docLink: "./docs/SOROBAN_ESCROW_CONTRACT.md",
  },
  released: {
    level: "success",
    label: "Released",
    tone: "green",
    headline: "Funds released",
    detail: "The milestone funds have been released.",
    action: "none",
    docLink: "./docs/SOROBAN_ESCROW_CONTRACT.md",
  },
};

// ─── Public lookup functions ────────────────────────────────────────────────

/** Look up the severity mapping for a transaction receipt status. */
export function getReceiptSeverity(status: TransactionReceiptStatus): StatusSeverity {
  return RECEIPT_SEVERITY[status];
}

/** Look up the severity mapping for an anchor transaction status. */
export function getAnchorSeverity(status: AnchorTransactionStatus): StatusSeverity {
  return ANCHOR_SEVERITY[status];
}

/** Look up the severity mapping for a readiness state. */
export function getReadinessSeverity(state: ReadinessState): StatusSeverity {
  return READINESS_SEVERITY[state];
}

/** Look up the severity mapping for an account status. */
export function getAccountSeverity(status: AccountStatus): StatusSeverity {
  return ACCOUNT_SEVERITY[status];
}

/** Look up the severity mapping for an escrow milestone status. */
export function getMilestoneSeverity(status: MilestoneStatus): StatusSeverity {
  return MILESTONE_SEVERITY[status];
}

// ─── Badge helpers ──────────────────────────────────────────────────────────

/** Get the Tailwind class string for a badge tone. */
export function badgeClasses(tone: BadgeTone, variant: "default" | "solid" = "default"): string {
  return variant === "solid" ? BADGE_TONE_CLASSES_SOLID[tone] : BADGE_TONE_CLASSES[tone];
}

/** Get the Tailwind class string for an alert severity level. */
export function alertClasses(level: SeverityLevel): string {
  return ALERT_TONE_CLASSES[level];
}

// ─── Composite severity lookup ──────────────────────────────────────────────

/**
 * Unified severity lookup that accepts any known domain status type.
 * Returns `null` for unrecognized strings.
 */
export function getStatusSeverity(
  domain: "receipt",
  status: TransactionReceiptStatus
): StatusSeverity;
export function getStatusSeverity(
  domain: "anchor",
  status: AnchorTransactionStatus
): StatusSeverity;
export function getStatusSeverity(
  domain: "readiness",
  status: ReadinessState
): StatusSeverity;
export function getStatusSeverity(
  domain: "account",
  status: AccountStatus
): StatusSeverity;
export function getStatusSeverity(
  domain: "milestone",
  status: MilestoneStatus
): StatusSeverity;
export function getStatusSeverity(
  domain: string,
  status: string
): StatusSeverity | null;
export function getStatusSeverity(
  domain: string,
  status: string
): StatusSeverity | null {
  switch (domain) {
    case "receipt":
      return status in RECEIPT_SEVERITY
        ? RECEIPT_SEVERITY[status as TransactionReceiptStatus]
        : null;
    case "anchor":
      return status in ANCHOR_SEVERITY
        ? ANCHOR_SEVERITY[status as AnchorTransactionStatus]
        : null;
    case "readiness":
      return status in READINESS_SEVERITY
        ? READINESS_SEVERITY[status as ReadinessState]
        : null;
    case "account":
      return status in ACCOUNT_SEVERITY
        ? ACCOUNT_SEVERITY[status as AccountStatus]
        : null;
    case "milestone":
      return status in MILESTONE_SEVERITY
        ? MILESTONE_SEVERITY[status as MilestoneStatus]
        : null;
    default:
      return null;
  }
}

// ─── Constants for iteration ────────────────────────────────────────────────

/** All severity levels in order from least to most severe. */
export const SEVERITY_LEVELS: readonly SeverityLevel[] = [
  "info",
  "success",
  "warning",
  "blocked",
  "error",
  "unknown",
] as const;

/** All badge tones. */
export const BADGE_TONES: readonly BadgeTone[] = [
  "neutral",
  "amber",
  "blue",
  "green",
  "red",
] as const;

/** All recommended actions. */
export const RECOMMENDED_ACTIONS: readonly RecommendedAction[] = [
  "none",
  "retry",
  "contact_support",
  "check_explorer",
  "enable_mainnet",
  "fund_account",
  "wait",
  "review_details",
] as const;
