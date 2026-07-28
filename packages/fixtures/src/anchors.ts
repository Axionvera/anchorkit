/**
 * Anchor deposit/withdrawal fixtures (issue #59).
 *
 * Migrated from `packages/anchor-utils/src/fixtures.ts`. Timestamps are fixed
 * ISO strings (not `Date.now()`) so fixtures are deterministic across runs.
 * `makeAnchorRecord` is a local, minimal record builder — intentionally NOT
 * imported from `@anchorkit/anchor-utils`, to avoid a dependency cycle
 * (anchor-utils depends on fixtures, not the other way around).
 */

import type {
  AnchorTransactionRecord,
  AnchorTransactionStatus,
  DepositRequestMetadata,
  WithdrawalRequestMetadata,
} from "@anchorkit/types";
import { BASE_TIMESTAMP, FRIENDBOT_PUBLIC_KEY, SAMPLE_TX_HASH } from "./constants";

export const sampleDepositRequest: DepositRequestMetadata = {
  assetCode: "XLM",
  amount: "500.0000000",
  account: FRIENDBOT_PUBLIC_KEY,
  memo: "AnchorTest-42",
  memoType: "text",
  railId: "sepa_eur_bank",
  emailAddress: "tester+sep@example.com",
  type: "SEPA",
};

export const sampleWithdrawalRequest: WithdrawalRequestMetadata = {
  assetCode: "USDC",
  amount: "250.75",
  account: FRIENDBOT_PUBLIC_KEY,
  memo: "WITHDRAW-99",
  memoType: "text",
  railId: "ach_us_bank",
  dest: "US123456789012",
  destExtra: "ACCT-4421",
  type: "ACH",
};

interface MakeAnchorRecordParams {
  id: string;
  kind: AnchorTransactionRecord["kind"];
  status: AnchorTransactionStatus;
  assetCode: string;
  amountIn: string;
  amountOut?: string;
  feeAmount?: string;
  stellarAccount: AnchorTransactionRecord["stellarAccount"];
  stellarTransactionId?: AnchorTransactionRecord["stellarTransactionId"];
  externalTransactionId?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  refunded?: boolean;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Minimal, local anchor-transaction-record builder used only to compose
 * fixtures. Deliberately does not import `createMockAnchorTransactionRecord`
 * from `@anchorkit/anchor-utils` — see module doc.
 */
function makeAnchorRecord(params: MakeAnchorRecordParams): AnchorTransactionRecord {
  return {
    id: params.id,
    kind: params.kind,
    status: params.status,
    assetCode: params.assetCode,
    amountIn: params.amountIn,
    amountOut: params.amountOut,
    feeAmount: params.feeAmount,
    stellarAccount: params.stellarAccount,
    stellarTransactionId: params.stellarTransactionId,
    externalTransactionId: params.externalTransactionId,
    startedAt: params.startedAt,
    updatedAt: params.updatedAt,
    completedAt: params.completedAt,
    userActionRequired: params.status === "pending_user",
    message: params.message,
    refunded: params.refunded ?? params.status === "refunded",
    metadata: params.metadata ?? {},
  };
}

/** Deterministic hour offsets from `BASE_TIMESTAMP`, expressed as ISO strings. */
function hoursAfterBase(hours: number): string {
  return new Date(new Date(BASE_TIMESTAMP).getTime() + hours * 60 * 60 * 1000).toISOString();
}

/** Deposit lifecycle: pending_user → pending_anchor → pending_stellar → completed. */
export function buildDepositLifecycle(): AnchorTransactionRecord[] {
  const base = {
    kind: "deposit" as const,
    assetCode: "XLM",
    amountIn: "500.0000000",
    amountOut: "498.5000000",
    feeAmount: "1.5000000",
    stellarAccount: FRIENDBOT_PUBLIC_KEY,
    externalTransactionId: "SEPA-REF-0001",
  };

  const statuses: AnchorTransactionStatus[] = [
    "pending_user",
    "pending_anchor",
    "pending_stellar",
    "completed",
  ];

  return statuses.map((status, i) =>
    makeAnchorRecord({
      ...base,
      id: `dep_lifecycle_${i + 1}`,
      status,
      stellarTransactionId:
        status === "pending_stellar" || status === "completed" ? SAMPLE_TX_HASH : undefined,
      startedAt: hoursAfterBase(0),
      updatedAt: hoursAfterBase(i * 2),
      completedAt: status === "completed" ? hoursAfterBase(i * 2) : undefined,
      message:
        status === "pending_user"
          ? "Please confirm the bank transfer details in the anchor portal."
          : status === "pending_anchor"
            ? "Anchor has received the bank transfer and is preparing the Stellar transaction."
            : status === "pending_stellar"
              ? "Stellar transaction submitted. Awaiting ledger confirmation."
              : "Deposit complete. XLM is now available in the Stellar account.",
      metadata: { step: i + 1, rail: "SEPA" },
    })
  );
}

/** Withdrawal lifecycle: pending_user → pending_stellar → pending_anchor → failed/refunded. */
export function buildWithdrawalLifecycle(): AnchorTransactionRecord[] {
  const base = {
    kind: "withdrawal" as const,
    assetCode: "USDC",
    amountIn: "250.75",
    amountOut: "248.75",
    feeAmount: "2.00",
    stellarAccount: FRIENDBOT_PUBLIC_KEY,
    externalTransactionId: "ACH-OUT-8812",
  };

  const statuses: AnchorTransactionStatus[] = [
    "pending_user",
    "pending_stellar",
    "pending_anchor",
    "failed",
    "refunded",
  ];

  return statuses.map((status, i) =>
    makeAnchorRecord({
      ...base,
      id: `with_lifecycle_${i + 1}`,
      status,
      stellarTransactionId: i >= 1 && i < 4 ? SAMPLE_TX_HASH : undefined,
      startedAt: hoursAfterBase(0),
      updatedAt: hoursAfterBase(i * 2),
      completedAt: status === "failed" || status === "refunded" ? hoursAfterBase(i * 2) : undefined,
      refunded: status === "refunded",
      message:
        status === "failed"
          ? "External ACH transfer was rejected by the receiving bank."
          : status === "refunded"
            ? "USDC has been refunded to the originating Stellar account."
            : undefined,
      metadata: { step: i + 1, rail: "ACH", includeRefund: i === 4 },
    })
  );
}
