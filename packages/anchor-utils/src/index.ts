import type {
  AnchorAssetConfig,
  AnchorTransactionKind,
  AnchorTransactionRecord,
  AnchorTransactionStatus,
  DepositRequestMetadata,
  PaymentRailConfig,
  WithdrawalRequestMetadata,
  AnchorMockDepositRequest,
  AnchorMockDepositResponse,
  AnchorMockWithdrawalRequest,
  AnchorMockWithdrawalResponse,
  AnchorMockStatusResponse,
  AnchorMockUpdateRequest,
  AnchorMockUpdateResponse,
  AnchorMockErrorResponse,
} from "@anchorkit/types";
import { ANCHOR_TRANSACTION_STATUSES } from "@anchorkit/types";
import {
  AnchorAssetConfigSchema,
  CallbackUrlSchema,
  DepositRequestMetadataSchema,
  PaymentRailConfigSchema,
  WithdrawalRequestMetadataSchema,
  AnchorMockDepositRequestSchema,
  AnchorMockDepositResponseSchema,
  AnchorMockWithdrawalRequestSchema,
  AnchorMockWithdrawalResponseSchema,
  AnchorMockStatusResponseSchema,
  AnchorMockUpdateRequestSchema,
  AnchorMockUpdateResponseSchema,
  AnchorMockErrorResponseSchema,
} from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";
import type { StellarPublicKey, StellarTransactionHash } from "@anchorkit/types";

export function parseDepositRequestMetadata(
  input: unknown
): SafeParseReturnType<unknown, DepositRequestMetadata> {
  return DepositRequestMetadataSchema.safeParse(input);
}

export function parseWithdrawalRequestMetadata(
  input: unknown
): SafeParseReturnType<unknown, WithdrawalRequestMetadata> {
  return WithdrawalRequestMetadataSchema.safeParse(input);
}

export function isDepositRequestValid(input: unknown): boolean {
  return parseDepositRequestMetadata(input).success;
}

export function isWithdrawalRequestValid(input: unknown): boolean {
  return parseWithdrawalRequestMetadata(input).success;
}

export function parseAnchorMockDepositRequest(
  input: unknown
): SafeParseReturnType<unknown, AnchorMockDepositRequest> {
  return AnchorMockDepositRequestSchema.safeParse(input);
}

export function parseAnchorMockDepositResponse(
  input: unknown
): SafeParseReturnType<unknown, AnchorMockDepositResponse> {
  return AnchorMockDepositResponseSchema.safeParse(input);
}

export function parseAnchorMockWithdrawalRequest(
  input: unknown
): SafeParseReturnType<unknown, AnchorMockWithdrawalRequest> {
  return AnchorMockWithdrawalRequestSchema.safeParse(input);
}

export function parseAnchorMockWithdrawalResponse(
  input: unknown
): SafeParseReturnType<unknown, AnchorMockWithdrawalResponse> {
  return AnchorMockWithdrawalResponseSchema.safeParse(input);
}

export function parseAnchorMockStatusResponse(
  input: unknown
): SafeParseReturnType<unknown, AnchorMockStatusResponse> {
  return AnchorMockStatusResponseSchema.safeParse(input);
}

export function parseAnchorMockUpdateRequest(
  input: unknown
): SafeParseReturnType<unknown, AnchorMockUpdateRequest> {
  return AnchorMockUpdateRequestSchema.safeParse(input);
}

export function parseAnchorMockUpdateResponse(
  input: unknown
): SafeParseReturnType<unknown, AnchorMockUpdateResponse> {
  return AnchorMockUpdateResponseSchema.safeParse(input);
}

export function parseAnchorMockErrorResponse(
  input: unknown
): SafeParseReturnType<unknown, AnchorMockErrorResponse> {
  return AnchorMockErrorResponseSchema.safeParse(input);
}

export function validateAnchorAssetConfig(
  input: unknown
): SafeParseReturnType<unknown, AnchorAssetConfig> {
  return AnchorAssetConfigSchema.safeParse(input);
}

export function isAnchorAssetConfigValid(input: unknown): boolean {
  return validateAnchorAssetConfig(input).success;
}

export function validatePaymentRailConfig(
  input: unknown
): SafeParseReturnType<unknown, PaymentRailConfig> {
  return PaymentRailConfigSchema.safeParse(input);
}

export function isPaymentRailConfigValid(input: unknown): boolean {
  return validatePaymentRailConfig(input).success;
}

export function validateCallbackUrl(url: string): SafeParseReturnType<string, string> {
  return CallbackUrlSchema.safeParse(url);
}

export function isCallbackUrlValid(url: string): boolean {
  return validateCallbackUrl(url).success;
}

export function isAnchorTransactionStatus(value: string): value is AnchorTransactionStatus {
  return (ANCHOR_TRANSACTION_STATUSES as unknown as string[]).includes(value);
}

export interface AnchorStatusUserMessage {
  headline: string;
  detail: string;
  cta?: string;
  severity: "info" | "warning" | "error" | "success";
}

export function anchorStatusToUserMessage(
  status: AnchorTransactionStatus,
  kind: AnchorTransactionKind
): AnchorStatusUserMessage {
  const k = kind === "deposit" ? "Deposit" : "Withdrawal";
  switch (status) {
    case "pending_user":
      return {
        headline: `${k} waiting for your action`,
        detail: "Please complete the required steps before the anchor can proceed.",
        cta: "Open action flow",
        severity: "warning",
      };
    case "pending_anchor":
      return {
        headline: `${k} being processed by anchor`,
        detail: "The anchor is reviewing and processing your request. This can take a few minutes.",
        severity: "info",
      };
    case "pending_stellar":
      return {
        headline: `${k} settling on Stellar`,
        detail:
          "Your transaction has been submitted to Stellar and is awaiting network confirmation.",
        severity: "info",
      };
    case "completed":
      return {
        headline: `${k} complete`,
        detail:
          kind === "deposit"
            ? "Funds have arrived in your Stellar account."
            : "Funds have been sent to your external account.",
        severity: "success",
      };
    case "failed":
      return {
        headline: `${k} failed`,
        detail: "The transaction could not be completed. Please contact support or retry.",
        cta: "Retry",
        severity: "error",
      };
    case "refunded":
      return {
        headline: `${k} refunded`,
        detail: "Your funds have been returned. Please check the refund details for more info.",
        severity: "warning",
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export interface AnchorStatusBadgeStyle {
  label: string;
  tone: "neutral" | "amber" | "blue" | "green" | "red";
}

export function anchorStatusBadge(status: AnchorTransactionStatus): AnchorStatusBadgeStyle {
  switch (status) {
    case "pending_user":
      return { label: "Awaiting You", tone: "amber" };
    case "pending_anchor":
      return { label: "Anchor Processing", tone: "blue" };
    case "pending_stellar":
      return { label: "Settling on Stellar", tone: "blue" };
    case "completed":
      return { label: "Completed", tone: "green" };
    case "failed":
      return { label: "Failed", tone: "red" };
    case "refunded":
      return { label: "Refunded", tone: "amber" };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export interface CreateAnchorTransactionParams {
  id?: string;
  kind: AnchorTransactionKind;
  status?: AnchorTransactionStatus;
  assetCode: string;
  amountIn: string;
  amountOut?: string;
  feeAmount?: string;
  stellarAccount: StellarPublicKey;
  stellarTransactionId?: StellarTransactionHash;
  externalTransactionId?: string;
  userActionRequired?: boolean;
  userActionUrl?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  refunded?: boolean;
}

export function createMockAnchorTransactionRecord(
  params: CreateAnchorTransactionParams
): AnchorTransactionRecord {
  const now = new Date().toISOString();
  const id = params.id ?? `mock_${params.kind}_${Math.random().toString(36).slice(2, 10)}`;
  const status: AnchorTransactionStatus = params.status ?? "pending_user";

  let completedAt: string | undefined = params.completedAt;
  if (status === "completed" || status === "failed" || status === "refunded") {
    completedAt = completedAt ?? now;
  }

  return {
    id,
    kind: params.kind,
    status,
    assetCode: params.assetCode,
    amountIn: params.amountIn,
    amountOut: params.amountOut,
    feeAmount: params.feeAmount,
    stellarAccount: params.stellarAccount,
    stellarTransactionId: params.stellarTransactionId,
    externalTransactionId: params.externalTransactionId,
    startedAt: params.startedAt ?? now,
    updatedAt: params.updatedAt ?? now,
    completedAt,
    userActionRequired: params.userActionRequired ?? status === "pending_user",
    userActionUrl: params.userActionUrl,
    message: params.message,
    refunded: params.refunded ?? status === "refunded",
    metadata: params.metadata ?? {},
  };
}

export function advanceAnchorTransactionStatus(
  current: AnchorTransactionStatus,
  terminal?: "completed" | "failed" | "refunded"
): AnchorTransactionStatus {
  if (terminal) return terminal;
  const order: AnchorTransactionStatus[] = [
    "pending_user",
    "pending_anchor",
    "pending_stellar",
    "completed",
  ];
  const idx = order.indexOf(current);
  if (idx === -1) return "pending_user";
  return order[Math.min(idx + 1, order.length - 1)] ?? "pending_user";
}

export * from "./fixtures";

// ─── Lifecycle state machine (issue #5) ────────────────────────────────────
export * from "./lifecycle";

// ─── Validation engine re-export (issue #6) ─────────────────────────────────
// Note: validateAnchorAssetConfig / validateCallbackUrl already exist in this
// package (raw Zod safeparse); the engine versions are available via
// @anchorkit/validators. We re-export the non-colliding engine helpers.
export {
  validateDepositRequest,
  validateWithdrawalRequest,
  validateAmount,
  firstErrorMessage,
} from "@anchorkit/validators";
export type {
  ValidationResult,
  ValidationError,
  AnchorValidationErrorCode,
} from "@anchorkit/validators";

import { validateDepositRequest, validateWithdrawalRequest } from "@anchorkit/validators";

/**
 * Validate an anchor request by kind, returning a uniform `ValidationResult`.
 * Convenience wrapper so callers don't branch on kind before validating.
 */
export function validateAnchorRequest(kind: AnchorTransactionKind, input: unknown) {
  return kind === "deposit" ? validateDepositRequest(input) : validateWithdrawalRequest(input);
}
