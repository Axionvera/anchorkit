/**
 * Shared test fixtures for the severity mapping module.
 *
 * Provides every severity mapping entry in a deterministic, iterable form
 * so unit tests can verify completeness and correctness without duplicating
 * data across test files.
 */

import type {
  AccountDiagnosticState,
  AccountStatus,
  AnchorTransactionStatus,
  MilestoneStatus,
  ReadinessState,
  SeverityLevel,
  TransactionReadinessState,
  TransactionReceiptStatus,
  ValidationUIState,
} from "@anchorkit/types";

// ─── Receipt severity entries ───────────────────────────────────────────────

export const RECEIPT_SEVERITY_ENTRIES: readonly [TransactionReceiptStatus, SeverityLevel][] = [
  ["confirmed", "success"],
  ["pending", "info"],
  ["failed", "error"],
  ["rejected", "warning"],
  ["unknown", "unknown"],
] as const;

// ─── Anchor severity entries ────────────────────────────────────────────────

export const ANCHOR_SEVERITY_ENTRIES: readonly [AnchorTransactionStatus, SeverityLevel][] = [
  ["pending_user", "warning"],
  ["pending_anchor", "info"],
  ["pending_stellar", "info"],
  ["completed", "success"],
  ["failed", "error"],
  ["refunded", "warning"],
] as const;

// ─── Readiness severity entries ─────────────────────────────────────────────

export const READINESS_SEVERITY_ENTRIES: readonly [ReadinessState, SeverityLevel][] = [
  ["ready", "success"],
  ["warnings", "warning"],
  ["unsafe-network", "blocked"],
  ["blocked", "blocked"],
] as const;

export const TRANSACTION_READINESS_SEVERITY_ENTRIES: readonly [
  TransactionReadinessState,
  SeverityLevel,
][] = [
  ["valid", "success"],
  ["invalid", "error"],
  ["blocked", "blocked"],
  ["warning", "warning"],
  ["unavailable", "unknown"],
] as const;

// ─── Account severity entries ───────────────────────────────────────────────

export const ACCOUNT_SEVERITY_ENTRIES: readonly [AccountStatus, SeverityLevel][] = [
  ["funded", "success"],
  ["unfunded", "warning"],
  ["unknown", "unknown"],
  ["error", "error"],
] as const;

export const ACCOUNT_DIAGNOSTIC_SEVERITY_ENTRIES: readonly [
  AccountDiagnosticState,
  SeverityLevel,
][] = [
  ["funded", "success"],
  ["unfunded", "warning"],
  ["invalid", "error"],
  ["unavailable", "unknown"],
  ["unknown", "unknown"],
] as const;

// ─── Milestone severity entries ─────────────────────────────────────────────

export const MILESTONE_SEVERITY_ENTRIES: readonly [MilestoneStatus, SeverityLevel][] = [
  ["draft", "info"],
  ["active", "info"],
  ["evidence_submitted", "info"],
  ["approved", "success"],
  ["disputed", "error"],
  ["ready_for_release", "success"],
  ["released", "success"],
] as const;

// ─── Validation UI state severity entries ───────────────────────────────────

export const VALIDATION_UI_STATE_SEVERITY_ENTRIES: readonly [ValidationUIState, SeverityLevel][] = [
  ["loading", "info"],
  ["invalid", "error"],
  ["warning", "warning"],
  ["ready", "success"],
  ["blocked", "blocked"],
] as const;

// ─── Badge tone → severity level (for badge class testing) ──────────────────

export const BADGE_TONE_LEVELS: readonly SeverityLevel[] = [
  "info",
  "success",
  "warning",
  "blocked",
  "error",
  "unknown",
] as const;
