/**
 * Transaction summary builder (issue #90).
 *
 * Shared review-before-action summaries for payment, anchor, and escrow
 * preview screens. Summaries carry operation type, parties, amount, asset,
 * network, memo, fee estimate, and risk notes where available.
 *
 * Limitations:
 * - Fee estimates are not derived from Horizon fee stats; payment summaries
 *   mark fees as unavailable unless a manual estimate is supplied.
 * - Anchor fee values come from mock config / records when present.
 * - Risk notes are optional inputs (often readiness warnings); this module
 *   does not re-run readiness pipelines.
 */

import type {
  AnchorAssetConfig,
  AnchorTransactionKind,
  AnchorTransactionRecord,
  AssetCode,
  DepositRequestMetadata,
  MemoInput,
  Milestone,
  PaymentIntent,
  ReadinessWarning,
  StellarAsset,
  StellarNetwork,
  StellarPublicKey,
  TransactionSummary,
  TransactionSummaryFeeEstimate,
  TransactionSummaryOperation,
  TransactionSummaryParty,
  TransactionSummaryRiskNote,
  TransactionSummarySource,
  WithdrawalRequestMetadata,
} from "@anchorkit/types";
import { TRANSACTION_SUMMARY_OPERATIONS } from "@anchorkit/types";
import { TransactionSummarySchema } from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";
import { assetToString } from "./assets";

export function isTransactionSummaryOperation(
  value: string
): value is TransactionSummaryOperation {
  return (TRANSACTION_SUMMARY_OPERATIONS as unknown as string[]).includes(value);
}

function operationHeadline(operation: TransactionSummaryOperation): string {
  switch (operation) {
    case "payment":
      return "Review payment";
    case "anchor_deposit":
      return "Review anchor deposit";
    case "anchor_withdrawal":
      return "Review anchor withdrawal";
    case "escrow_release":
      return "Review escrow release";
    case "other":
      return "Review transaction";
    default: {
      const _exhaustive: never = operation;
      return _exhaustive;
    }
  }
}

function party(
  role: TransactionSummaryParty["role"],
  label: string,
  publicKey?: string,
  detail?: string
): TransactionSummaryParty {
  return {
    role,
    label,
    publicKey: publicKey as StellarPublicKey | undefined,
    detail,
  };
}

function toRiskNotes(
  notes?: ReadonlyArray<TransactionSummaryRiskNote | ReadinessWarning>
): TransactionSummaryRiskNote[] {
  if (!notes || notes.length === 0) return [];
  return notes.map((note) => ({
    code: note.code,
    message: note.message,
    severity: note.severity,
  }));
}

function unavailableFee(note?: string): TransactionSummaryFeeEstimate {
  return {
    source: "unavailable",
    note:
      note ??
      "Stellar protocol fee estimation is not available in AnchorKit MVP; review Horizon fee stats before mainnet use.",
  };
}

function assetFromCode(code: string, issuer?: string | null): StellarAsset | undefined {
  if (!code) return undefined;
  if (code === "XLM" || code.toUpperCase() === "NATIVE") {
    return { type: "native", code: "XLM", issuer: null };
  }
  if (!issuer) {
    return undefined;
  }
  return {
    type: "issued",
    code: code as AssetCode,
    issuer: issuer as StellarPublicKey,
  };
}

export interface BuildTransactionSummaryParams {
  id: string;
  operation: TransactionSummaryOperation;
  source: TransactionSummarySource;
  network?: StellarNetwork;
  headline?: string;
  detail?: string;
  parties?: TransactionSummaryParty[];
  amount?: string;
  asset?: StellarAsset;
  memo?: MemoInput;
  feeEstimate?: TransactionSummaryFeeEstimate;
  riskNotes?: ReadonlyArray<TransactionSummaryRiskNote | ReadinessWarning>;
  metadata?: Record<string, unknown>;
}

/** Build a normalized review summary for preview screens. */
export function buildTransactionSummary(
  params: BuildTransactionSummaryParams
): TransactionSummary {
  const network = params.network ?? "testnet";
  return {
    id: params.id,
    operation: params.operation,
    source: params.source,
    network,
    headline: params.headline ?? operationHeadline(params.operation),
    detail: params.detail,
    parties: params.parties ?? [],
    amount: params.amount,
    asset: params.asset,
    memo: params.memo,
    feeEstimate: params.feeEstimate ?? unavailableFee(),
    riskNotes: toRiskNotes(params.riskNotes),
    metadata: params.metadata,
  };
}

export interface PaymentIntentSummaryParams {
  intent: PaymentIntent;
  network?: StellarNetwork;
  id?: string;
  riskNotes?: ReadonlyArray<TransactionSummaryRiskNote | ReadinessWarning>;
  feeEstimate?: TransactionSummaryFeeEstimate;
  metadata?: Record<string, unknown>;
}

/** Map a payment intent into a review summary. */
export function paymentIntentToSummary(params: PaymentIntentSummaryParams): TransactionSummary {
  const { intent } = params;
  const assetLabel = assetToString(intent.asset);
  return buildTransactionSummary({
    id: params.id ?? `payment_summary_${intent.sourcePublicKey.slice(0, 8)}`,
    operation: "payment",
    source: "payment",
    network: params.network ?? "testnet",
    headline: "Review payment",
    detail: `Send ${intent.amount} ${assetLabel} on ${params.network ?? "testnet"}.`,
    parties: [
      party("source", "Source", intent.sourcePublicKey),
      party("destination", "Destination", intent.destinationPublicKey),
    ],
    amount: intent.amount,
    asset: intent.asset,
    memo: intent.memo,
    feeEstimate: params.feeEstimate ?? unavailableFee(),
    riskNotes: params.riskNotes,
    metadata: params.metadata,
  });
}

export interface AnchorRequestSummaryParams {
  kind: AnchorTransactionKind;
  request: DepositRequestMetadata | WithdrawalRequestMetadata;
  network?: StellarNetwork;
  id?: string;
  assetConfig?: Pick<AnchorAssetConfig, "code" | "issuer" | "feeFixed" | "feePercent">;
  riskNotes?: ReadonlyArray<TransactionSummaryRiskNote | ReadinessWarning>;
  metadata?: Record<string, unknown>;
}

function feeFromAssetConfig(
  config?: Pick<AnchorAssetConfig, "code" | "feeFixed" | "feePercent">
): TransactionSummaryFeeEstimate {
  if (!config) return unavailableFee("No anchor asset fee configuration was provided.");
  if (config.feeFixed) {
    return {
      amount: config.feeFixed,
      assetCode: config.code,
      source: "anchor_config",
      note: config.feePercent
        ? `Fixed fee from anchor config (${config.feePercent}% also configured).`
        : "Fixed fee from anchor asset configuration.",
    };
  }
  if (config.feePercent) {
    return {
      assetCode: config.code,
      source: "anchor_config",
      note: `Percent fee configured (${config.feePercent}%); absolute fee depends on amount.`,
    };
  }
  return unavailableFee("Anchor asset configuration did not include feeFixed or feePercent.");
}

/** Map an anchor deposit or withdrawal request into a review summary. */
export function anchorRequestToSummary(params: AnchorRequestSummaryParams): TransactionSummary {
  const { kind, request } = params;
  const operation: TransactionSummaryOperation =
    kind === "deposit" ? "anchor_deposit" : "anchor_withdrawal";
  const parties: TransactionSummaryParty[] = [
    party("source", "Stellar account", request.account),
  ];

  if (kind === "withdrawal") {
    const withdraw = request as WithdrawalRequestMetadata;
    parties.push(
      party("destination", "Off-ramp destination", undefined, withdraw.dest)
    );
  }

  const asset =
    params.assetConfig != null
      ? assetFromCode(params.assetConfig.code, params.assetConfig.issuer)
      : assetFromCode(request.assetCode);

  return buildTransactionSummary({
    id: params.id ?? `anchor_${kind}_summary_${request.account.slice(0, 8)}`,
    operation,
    source: "anchor",
    network: params.network ?? "testnet",
    headline: operationHeadline(operation),
    detail:
      kind === "deposit"
        ? `Deposit ${request.amount} ${request.assetCode} via rail ${request.type}.`
        : `Withdraw ${request.amount} ${request.assetCode} via rail ${request.type}.`,
    parties,
    amount: request.amount,
    asset,
    memo:
      request.memo != null
        ? {
            type: request.memoType ?? "text",
            value: request.memo,
          }
        : undefined,
    feeEstimate: feeFromAssetConfig(params.assetConfig),
    riskNotes: params.riskNotes,
    metadata: {
      railId: request.railId,
      railType: request.type,
      ...params.metadata,
    },
  });
}

export interface AnchorRecordSummaryParams {
  record: AnchorTransactionRecord;
  network?: StellarNetwork;
  riskNotes?: ReadonlyArray<TransactionSummaryRiskNote | ReadinessWarning>;
  metadata?: Record<string, unknown>;
}

/** Map an existing anchor transaction record into a review summary. */
export function anchorRecordToSummary(params: AnchorRecordSummaryParams): TransactionSummary {
  const { record } = params;
  const operation: TransactionSummaryOperation =
    record.kind === "deposit" ? "anchor_deposit" : "anchor_withdrawal";
  const feeEstimate: TransactionSummaryFeeEstimate = record.feeAmount
    ? {
        amount: record.feeAmount,
        assetCode: record.assetCode,
        source: "anchor_record",
        note: "Fee amount copied from the anchor transaction record.",
      }
    : unavailableFee("Anchor record did not include feeAmount.");

  return buildTransactionSummary({
    id: `anchor_summary_${record.id}`,
    operation,
    source: "anchor",
    network: params.network ?? "testnet",
    headline: operationHeadline(operation),
    detail: record.message ?? `${record.kind} ${record.amountIn} ${record.assetCode}`,
    parties: [party("source", "Stellar account", record.stellarAccount)],
    amount: record.amountIn,
    asset: assetFromCode(record.assetCode),
    feeEstimate,
    riskNotes: params.riskNotes,
    metadata: {
      anchorStatus: record.status,
      amountOut: record.amountOut,
      ...record.metadata,
      ...params.metadata,
    },
  });
}

export interface EscrowMilestoneSummaryParams {
  milestone: Milestone;
  network?: StellarNetwork;
  id?: string;
  adminPublicKey?: string;
  destinationPublicKey?: string;
  riskNotes?: ReadonlyArray<TransactionSummaryRiskNote | ReadinessWarning>;
  feeEstimate?: TransactionSummaryFeeEstimate;
  metadata?: Record<string, unknown>;
}

/** Map an escrow milestone into a release review summary. */
export function escrowMilestoneToSummary(
  params: EscrowMilestoneSummaryParams
): TransactionSummary {
  const { milestone } = params;
  const parties: TransactionSummaryParty[] = [];
  if (params.adminPublicKey) {
    parties.push(party("admin", "Escrow admin", params.adminPublicKey));
  }
  if (params.destinationPublicKey) {
    parties.push(party("destination", "Release recipient", params.destinationPublicKey));
  }

  return buildTransactionSummary({
    id: params.id ?? `escrow_summary_${milestone.id}`,
    operation: "escrow_release",
    source: "escrow",
    network: params.network ?? "testnet",
    headline: "Review escrow release",
    detail: `Release milestone "${milestone.title}" (${milestone.amount} XLM). Status: ${milestone.status}.`,
    parties,
    amount: milestone.amount,
    asset: { type: "native", code: "XLM", issuer: null },
    feeEstimate: params.feeEstimate ?? unavailableFee(),
    riskNotes: params.riskNotes,
    metadata: {
      milestoneId: milestone.id,
      milestoneStatus: milestone.status,
      evidenceHash: milestone.evidenceHash,
      ...params.metadata,
    },
  });
}

export function parseTransactionSummary(
  input: unknown
): SafeParseReturnType<unknown, TransactionSummary> {
  return TransactionSummarySchema.safeParse(input);
}

export function isTransactionSummaryValid(input: unknown): boolean {
  return parseTransactionSummary(input).success;
}

export interface CreateMockSummaryParams {
  id?: string;
  operation?: TransactionSummaryOperation;
  source?: TransactionSummarySource;
  network?: StellarNetwork;
  amount?: string;
  headline?: string;
  detail?: string;
  riskNotes?: ReadonlyArray<TransactionSummaryRiskNote | ReadinessWarning>;
  feeEstimate?: TransactionSummaryFeeEstimate;
  metadata?: Record<string, unknown>;
}

const DEMO_SOURCE =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const DEMO_DEST =
  "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";

/** Deterministic-enough mock summary for UI demos and tests. */
export function createMockTransactionSummary(
  params: CreateMockSummaryParams = {}
): TransactionSummary {
  const operation = params.operation ?? "payment";
  const source: TransactionSummarySource =
    params.source ??
    (operation.startsWith("anchor_")
      ? "anchor"
      : operation.startsWith("escrow_")
        ? "escrow"
        : operation === "payment"
          ? "payment"
          : "other");

  return buildTransactionSummary({
    id: params.id ?? `mock_summary_${operation}`,
    operation,
    source,
    network: params.network ?? "testnet",
    headline: params.headline,
    detail: params.detail ?? "Mock review summary for demo purposes.",
    parties: [
      party("source", "Source", DEMO_SOURCE),
      party("destination", "Destination", DEMO_DEST),
    ],
    amount: params.amount ?? "10.0000000",
    asset: { type: "native", code: "XLM", issuer: null },
    memo: { type: "text", value: "Mock summary" },
    feeEstimate: params.feeEstimate,
    riskNotes: params.riskNotes,
    metadata: params.metadata,
  });
}

/** Fixture set covering every summary operation for docs and examples. */
export function buildTransactionSummaryFixtures(
  network: StellarNetwork = "testnet"
): TransactionSummary[] {
  return TRANSACTION_SUMMARY_OPERATIONS.map((operation) =>
    createMockTransactionSummary({
      id: `fixture_summary_${operation}`,
      operation,
      network,
    })
  );
}
