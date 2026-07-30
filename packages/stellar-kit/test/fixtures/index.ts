/**
 * Shared test fixtures for AnchorKit.
 *
 * Single entry point for all deterministic, reusable test data across packages.
 * Fixtures never contain real secret keys or real user data.
 *
 * Usage:
 *   import { FUNDED_ACCOUNTS, VALID_PAYMENT_INTENT } from "@anchorkit/stellar-kit/test/fixtures";
 *
 * Adding new fixtures:
 *   1. Create or add to the appropriate category file (accounts, payments, etc.)
 *   2. Export from this index file
 *   3. Add a Zod schema entry to examples/registry.ts if it's a JSON fixture
 *   4. Import in tests — never duplicate inline data
 */

// ─── Accounts ───────────────────────────────────────────────────────────────
export {
  FUNDED_ACCOUNT,
  FUNDED_ACCOUNT_INFO,
  FUNDED_ACCOUNT_INFO_WITH_ASSETS,
  UNFUNDED_ACCOUNT,
  UNFUNDED_ACCOUNT_INFO,
  NETWORK_ERROR_ACCOUNT_INFO,
  ZERO_BALANCE_ACCOUNT_INFO,
  LOW_BALANCE_ACCOUNT_INFO,
  HIGH_SUBENTRY_ACCOUNT_INFO,
  FUNDED_ACCOUNTS_ARRAY,
  UNFUNDED_ACCOUNTS_ARRAY,
} from "./accounts";

// ─── Payments ───────────────────────────────────────────────────────────────
export {
  VALID_PAYMENT_INTENT,
  VALID_PAYMENT_INTENT_WITH_MEMO,
  VALID_PAYMENT_INTENT_WITH_ID_MEMO,
  VALID_PAYMENT_INTENT_ISSUED_ASSET,
  INVALID_PAYMENT_INTENT_NO_SOURCE,
  INVALID_PAYMENT_INTENT_BAD_AMOUNT,
  INVALID_PAYMENT_INTENT_BAD_ASSET,
  INVALID_PAYMENT_INTENT_SELF_PAYMENT,
  PAYMENT_INTENTS_VALID_ARRAY,
  PAYMENT_INTENTS_INVALID_ARRAY,
} from "./payments";

// ─── Assets ─────────────────────────────────────────────────────────────────
export {
  NATIVE_ASSET,
  ISSUED_ASSET_USDC,
  ISSUED_ASSET_EURC,
  ISSUED_ASSET_WITH_INVALID_ISSUER,
  ASSETS_ARRAY,
} from "./assets";

// ─── Anchors ────────────────────────────────────────────────────────────────
export {
  VALID_DEPOSIT_REQUEST,
  VALID_WITHDRAWAL_REQUEST,
  INVALID_DEPOSIT_REQUEST,
  INVALID_WITHDRAWAL_REQUEST,
  INVALID_ASSET_CONFIG,
  INVALID_CALLBACK_URL,
  DEPOSIT_LIFECYCLE,
  WITHDRAWAL_LIFECYCLE,
  DEPOSIT_LIFECYCLE_ARRAY,
  WITHDRAWAL_LIFECYCLE_ARRAY,
} from "./anchors";

// ─── Escrow ─────────────────────────────────────────────────────────────────
export {
  ESCROW_MILESTONE_DRAFT,
  ESCROW_MILESTONE_ACTIVE,
  ESCROW_MILESTONE_EVIDENCE,
  ESCROW_MILESTONE_APPROVED,
  ESCROW_MILESTONE_DISPUTED,
  ESCROW_MILESTONE_READY,
  ESCROW_MILESTONE_RELEASED,
  ESCROW_MILESTONES_HAPPY_PATH,
  ESCROW_MILESTONES_WITH_DISPUTE,
  ESCROW_MILESTONES_FULL_LIFECYCLE,
  ESCROW_MILESTONES_ARRAY,
} from "./escrow";

// ─── Readiness ──────────────────────────────────────────────────────────────
export {
  READY_INTENT,
  READY_INTENT_WITH_WARNINGS,
  BLOCKED_INTENT_INVALID_ASSET,
  BLOCKED_INTENT_BAD_AMOUNT,
  UNSAFE_NETWORK_INTENT,
  INTENT_SOURCE_UNFUNDED,
  INTENT_INSUFFICIENT_FUNDS,
  BALANCE_MODEL_KNOWN,
  BALANCE_MODEL_LOW,
  BALANCE_MODEL_UNKNOWN,
  READINESS_SCENARIOS,
} from "./readiness";

// ─── Receipts ───────────────────────────────────────────────────────────────
export {
  RECEIPT_CONFIRMED,
  RECEIPT_PENDING,
  RECEIPT_FAILED,
  RECEIPT_REJECTED,
  RECEIPT_UNKNOWN,
  RECEIPTS_ARRAY,
} from "./receipts";

// ─── Severity ──────────────────────────────────────────────────────────────
export {
  RECEIPT_SEVERITY_ENTRIES,
  ANCHOR_SEVERITY_ENTRIES,
  READINESS_SEVERITY_ENTRIES,
  TRANSACTION_READINESS_SEVERITY_ENTRIES,
  ACCOUNT_SEVERITY_ENTRIES,
  ACCOUNT_DIAGNOSTIC_SEVERITY_ENTRIES,
  MILESTONE_SEVERITY_ENTRIES,
  VALIDATION_UI_STATE_SEVERITY_ENTRIES,
  BADGE_TONE_LEVELS,
} from "./severity";

// ─── Secrets ────────────────────────────────────────────────────────────────
export {
  makeFakeSecret,
  makeFakeKeypair,
  FRIENDBOT_PUBLIC_KEY,
  FRIENDBOT_PUBLIC_KEY_2,
  SAMPLE_TX_HASH,
  SAMPLE_TX_HASH_UPPER,
} from "./secrets";
