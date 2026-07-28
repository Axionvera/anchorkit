/**
 * Transaction receipt model (issue #91).
 *
 * Reusable, network-aware receipt types and mappers so payment, anchor, and
 * escrow surfaces display confirmed / pending / failed / rejected / unknown
 * outcomes consistently. Explorer links route through `explorer.ts`.
 */

import type {
  AnchorTransactionRecord,
  AnchorTransactionStatus,
  EscrowEventV1,
  ReleasedEvent,
  StellarNetwork,
  StellarTransactionHash,
  TransactionReceipt,
  TransactionReceiptSource,
  TransactionReceiptStatus,
} from "@anchorkit/types";
import { TRANSACTION_RECEIPT_STATUSES } from "@anchorkit/types";
import { TransactionReceiptSchema } from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";
import { buildTransactionLink } from "./explorer";

export interface ReceiptStatusUserMessage {
  headline: string;
  detail: string;
  severity: "info" | "warning" | "error" | "success";
}

export interface ReceiptStatusBadgeStyle {
  label: string;
  tone: "neutral" | "amber" | "blue" | "green" | "red";
}

export function isTransactionReceiptStatus(
  value: string
): value is TransactionReceiptStatus {
  return (TRANSACTION_RECEIPT_STATUSES as unknown as string[]).includes(value);
}

export function receiptStatusToUserMessage(
  status: TransactionReceiptStatus
): ReceiptStatusUserMessage {
  switch (status) {
    case "confirmed":
      return {
        headline: "Transaction confirmed",
        detail: "The transaction completed successfully on the Stellar network.",
        severity: "success",
      };
    case "pending":
      return {
        headline: "Transaction pending",
        detail: "The transaction has been submitted and is awaiting confirmation.",
        severity: "info",
      };
    case "failed":
      return {
        headline: "Transaction failed",
        detail: "The transaction could not be completed. Review the error details and retry if appropriate.",
        severity: "error",
      };
    case "rejected":
      return {
        headline: "Transaction rejected",
        detail: "The transaction was rejected or reversed before completion.",
        severity: "warning",
      };
    case "unknown":
      return {
        headline: "Transaction status unknown",
        detail: "The outcome could not be determined. Check the explorer or try again later.",
        severity: "warning",
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function receiptStatusBadge(status: TransactionReceiptStatus): ReceiptStatusBadgeStyle {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", tone: "green" };
    case "pending":
      return { label: "Pending", tone: "blue" };
    case "failed":
      return { label: "Failed", tone: "red" };
    case "rejected":
      return { label: "Rejected", tone: "amber" };
    case "unknown":
      return { label: "Unknown", tone: "neutral" };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Map SEP-style anchor statuses to normalized receipt statuses. */
export function mapAnchorStatusToReceiptStatus(
  status: AnchorTransactionStatus
): TransactionReceiptStatus {
  switch (status) {
    case "pending_user":
    case "pending_anchor":
    case "pending_stellar":
      return "pending";
    case "completed":
      return "confirmed";
    case "failed":
      return "failed";
    case "refunded":
      return "rejected";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export interface BuildTransactionReceiptParams {
  id: string;
  status: TransactionReceiptStatus;
  network?: StellarNetwork;
  headline?: string;
  detail?: string;
  source: TransactionReceiptSource;
  transactionHash?: StellarTransactionHash | string;
  submittedAt?: string;
  finalizedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Build a receipt and attach a network-aware explorer link when a valid hash
 * is present.
 */
export function buildTransactionReceipt(
  params: BuildTransactionReceiptParams
): TransactionReceipt {
  const network = params.network ?? "testnet";
  const message = receiptStatusToUserMessage(params.status);
  const receipt: TransactionReceipt = {
    id: params.id,
    status: params.status,
    network,
    headline: params.headline ?? message.headline,
    detail: params.detail ?? params.errorMessage ?? message.detail,
    source: params.source,
    transactionHash: params.transactionHash as StellarTransactionHash | undefined,
    submittedAt: params.submittedAt,
    finalizedAt: params.finalizedAt,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    metadata: params.metadata,
  };
  return attachExplorerLink(receipt);
}

/** Attach or refresh the network-aware explorer URL on an existing receipt. */
export function attachExplorerLink(receipt: TransactionReceipt): TransactionReceipt {
  if (!receipt.transactionHash) {
    return { ...receipt, explorerUrl: undefined };
  }
  try {
    const explorerUrl = buildTransactionLink(receipt.transactionHash, receipt.network);
    return { ...receipt, explorerUrl };
  } catch {
    return { ...receipt, explorerUrl: undefined };
  }
}

/** Convert an anchor transaction record into a normalized receipt. */
export function anchorRecordToReceipt(
  record: AnchorTransactionRecord,
  network: StellarNetwork = "testnet"
): TransactionReceipt {
  const status = mapAnchorStatusToReceiptStatus(record.status);
  const anchorMessage = record.message;
  return buildTransactionReceipt({
    id: record.id,
    status,
    network,
    headline: receiptStatusToUserMessage(status).headline,
    detail: anchorMessage ?? receiptStatusToUserMessage(status).detail,
    source: "anchor",
    transactionHash: record.stellarTransactionId,
    submittedAt: record.startedAt,
    finalizedAt: record.completedAt,
    errorCode: status === "failed" ? "ANCHOR_TRANSACTION_FAILED" : undefined,
    errorMessage: status === "failed" ? record.message : undefined,
    metadata: {
      anchorKind: record.kind,
      anchorStatus: record.status,
      assetCode: record.assetCode,
      amountIn: record.amountIn,
      externalTransactionId: record.externalTransactionId,
      ...record.metadata,
    },
  });
}

/** Map a released escrow event to a receipt when funds were disbursed. */
export function escrowReleaseToReceipt(
  event: ReleasedEvent | EscrowEventV1,
  network: StellarNetwork = "testnet"
): TransactionReceipt {
  if (event.type !== "released") {
    return buildTransactionReceipt({
      id: `escrow_${event.milestoneId}_${event.type}`,
      status: "unknown",
      network,
      source: "escrow",
      detail: `Escrow event "${event.type}" does not represent a finalized release.`,
      metadata: { milestoneId: event.milestoneId, eventType: event.type },
    });
  }

  const released = event as ReleasedEvent;
  const hasHash = Boolean(released.transactionHash);
  return buildTransactionReceipt({
    id: `escrow_release_${released.milestoneId}`,
    status: hasHash ? "confirmed" : "pending",
    network,
    headline: hasHash ? "Escrow release confirmed" : "Escrow release pending",
    detail: hasHash
      ? `Milestone funds (${released.amount}) were released on Stellar.`
      : `Milestone release (${released.amount}) is awaiting an on-chain transaction hash.`,
    source: "escrow",
    transactionHash: released.transactionHash as StellarTransactionHash | undefined,
    submittedAt: released.timestamp,
    finalizedAt: hasHash ? released.timestamp : undefined,
    metadata: {
      milestoneId: released.milestoneId,
      amount: released.amount,
      contractId: released.contractId,
      ledger: released.ledger,
    },
  });
}

export function parseTransactionReceipt(
  input: unknown
): SafeParseReturnType<unknown, TransactionReceipt> {
  const parsed = TransactionReceiptSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }
  return { success: true, data: attachExplorerLink(parsed.data) };
}

export function isTransactionReceiptValid(input: unknown): boolean {
  return parseTransactionReceipt(input).success;
}

export interface CreateMockReceiptParams {
  id?: string;
  status?: TransactionReceiptStatus;
  network?: StellarNetwork;
  source?: TransactionReceiptSource;
  transactionHash?: StellarTransactionHash | string;
  headline?: string;
  detail?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/** Deterministic-enough mock receipt for UI demos and tests. */
export function createMockTransactionReceipt(
  params: CreateMockReceiptParams = {}
): TransactionReceipt {
  const status = params.status ?? "pending";
  const now = new Date().toISOString();
  const id = params.id ?? `mock_receipt_${status}_${Math.random().toString(36).slice(2, 8)}`;
  const hash =
    params.transactionHash ??
    (status === "confirmed" || status === "pending"
      ? ("a".repeat(64) as StellarTransactionHash)
      : undefined);

  return buildTransactionReceipt({
    id,
    status,
    network: params.network ?? "testnet",
    source: params.source ?? "payment",
    headline: params.headline,
    detail: params.detail,
    transactionHash: hash,
    submittedAt: now,
    finalizedAt:
      status === "confirmed" || status === "failed" || status === "rejected"
        ? now
        : undefined,
    errorCode: params.errorCode ?? (status === "failed" ? "TRANSACTION_FAILED" : undefined),
    errorMessage:
      params.errorMessage ??
      (status === "failed"
        ? "Simulated submission failure for demo purposes."
        : status === "rejected"
          ? "Simulated rejection for demo purposes."
          : undefined),
    metadata: params.metadata,
  });
}

/** Fixture set covering every receipt status for docs and examples. */
export function buildReceiptStatusFixtures(
  network: StellarNetwork = "testnet"
): TransactionReceipt[] {
  return TRANSACTION_RECEIPT_STATUSES.map((status) =>
    createMockTransactionReceipt({
      id: `fixture_receipt_${status}`,
      status,
      network,
      source: "payment",
    })
  );
}
