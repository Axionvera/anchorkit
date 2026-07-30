/**
 * Integration scenarios are composed from the public fixture package so these
 * tests exercise the same deterministic data consumed by package and web tests.
 */
export {
  allEscrowEventsRaw,
  buildDepositLifecycle,
  buildWithdrawalLifecycle,
  diagnosticsFundedAccountInfo,
  diagnosticsUnavailableAccountInfo,
  diagnosticsUnfundedAccountInfo,
  invalidPaymentIntent,
  sampleMilestoneLifecycle,
  samplePaymentIntent,
} from "@anchorkit/fixtures";

export const DEPOSIT_STATUS_SEQUENCE = [
  "pending_user",
  "pending_anchor",
  "pending_stellar",
  "completed",
] as const;

export const WITHDRAWAL_STATUS_SEQUENCE = [
  "pending_user",
  "pending_stellar",
  "pending_anchor",
  "failed",
  "refunded",
] as const;
