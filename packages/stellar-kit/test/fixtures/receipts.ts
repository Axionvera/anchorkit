/**
 * Shared transaction receipt fixtures for tests.
 *
 * Covers every normalized receipt status: confirmed, pending, failed, rejected, unknown.
 * No real transaction data — pure deterministic fixtures.
 */
import type {
  StellarPublicKey,
  StellarTransactionHash,
  TransactionReceipt,
} from "@anchorkit/types";

const ACCOUNT: StellarPublicKey =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR" as StellarPublicKey;

const TX_HASH: StellarTransactionHash =
  "b".repeat(64) as StellarTransactionHash;

// ─── Individual receipts per status ─────────────────────────────────────────

export const RECEIPT_CONFIRMED: TransactionReceipt = {
  id: "receipt_confirmed_1",
  status: "confirmed",
  network: "testnet",
  headline: "Payment confirmed",
  detail: "Transaction has been confirmed on the Stellar network.",
  source: "payment",
  transactionHash: TX_HASH,
  explorerUrl: `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`,
  submittedAt: "2026-01-01T00:00:00.000Z",
  finalizedAt: "2026-01-01T00:03:00.000Z",
  metadata: {},
};

export const RECEIPT_PENDING: TransactionReceipt = {
  id: "receipt_pending_1",
  status: "pending",
  network: "testnet",
  headline: "Payment pending",
  detail: "Transaction has been submitted and is awaiting confirmation.",
  source: "payment",
  transactionHash: TX_HASH,
  submittedAt: "2026-01-01T00:00:00.000Z",
  metadata: {},
};

export const RECEIPT_FAILED: TransactionReceipt = {
  id: "receipt_failed_1",
  status: "failed",
  network: "testnet",
  headline: "Payment failed",
  detail: "The transaction could not be completed.",
  source: "anchor",
  errorCode: "ANCHOR_TRANSACTION_FAILED",
  errorMessage: "External ACH transfer was rejected by the receiving bank.",
  submittedAt: "2026-01-01T00:00:00.000Z",
  finalizedAt: "2026-01-01T00:01:00.000Z",
  metadata: { anchorKind: "withdrawal" },
};

export const RECEIPT_REJECTED: TransactionReceipt = {
  id: "receipt_rejected_1",
  status: "rejected",
  network: "testnet",
  headline: "Payment rejected",
  detail: "The transaction was rejected.",
  source: "escrow",
  transactionHash: TX_HASH,
  explorerUrl: `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`,
  errorCode: "ESCROW_RELEASE_REJECTED",
  submittedAt: "2026-01-01T00:00:00.000Z",
  finalizedAt: "2026-01-01T00:02:00.000Z",
  metadata: { milestoneId: "ms_1" },
};

export const RECEIPT_UNKNOWN: TransactionReceipt = {
  id: "receipt_unknown_1",
  status: "unknown",
  network: "testnet",
  headline: "Payment status unknown",
  detail: "The transaction status could not be determined.",
  source: "other",
  metadata: {},
};

// ─── Array for schema validation ────────────────────────────────────────────

export const RECEIPTS_ARRAY = [
  RECEIPT_CONFIRMED,
  RECEIPT_PENDING,
  RECEIPT_FAILED,
  RECEIPT_REJECTED,
  RECEIPT_UNKNOWN,
];
