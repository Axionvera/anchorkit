import { z } from "zod";
import { ANCHOR_TRANSACTION_STATUSES } from "@anchorkit/types";
import type { AnchorTransactionStatus } from "@anchorkit/types";
import {
  StellarPublicKeySchema,
  StellarTransactionHashSchema,
  MemoTypeSchema,
  PaymentAmountSchema,
} from "./stellar";

export const AnchorTransactionStatusSchema = z.enum(
  ANCHOR_TRANSACTION_STATUSES as [AnchorTransactionStatus, ...AnchorTransactionStatus[]]
);

export const AnchorTransactionKindSchema = z.enum(["deposit", "withdrawal"]);

export const AnchorAssetConfigSchema = z.object({
  code: z.string().min(1).max(12),
  issuer: StellarPublicKeySchema,
  schema: z.enum(["stellar", "iso4217"]),
  enabled: z.boolean(),
  depositEnabled: z.boolean(),
  withdrawalEnabled: z.boolean(),
  depositMinAmount: z.string().optional(),
  depositMaxAmount: z.string().optional(),
  withdrawalMinAmount: z.string().optional(),
  withdrawalMaxAmount: z.string().optional(),
  feeFixed: z.string().optional(),
  feePercent: z.string().optional(),
});

export const PaymentRailConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["bank_transfer", "card", "cash", "crypto", "other"]),
  currencies: z.array(z.string()).min(1),
  countries: z.array(z.string()).min(1),
  enabled: z.boolean(),
  estimatedProcessingMinutesMin: z.number().int().min(0),
  estimatedProcessingMinutesMax: z.number().int().min(0),
});

export const DepositRequestMetadataSchema = z.object({
  assetCode: z.string().min(1).max(12),
  amount: PaymentAmountSchema,
  account: StellarPublicKeySchema,
  memo: z.string().optional(),
  memoType: MemoTypeSchema.optional(),
  railId: z.string().optional(),
  clientDomain: z.string().optional(),
  emailAddress: z.string().email().optional(),
  type: z.string(),
});

export const WithdrawalRequestMetadataSchema = z.object({
  assetCode: z.string().min(1).max(12),
  amount: PaymentAmountSchema,
  account: StellarPublicKeySchema,
  memo: z.string().optional(),
  memoType: MemoTypeSchema.optional(),
  railId: z.string().optional(),
  clientDomain: z.string().optional(),
  dest: z.string().min(1),
  destExtra: z.string().optional(),
  type: z.string(),
});

export const AnchorTransactionRecordSchema = z.object({
  id: z.string().min(1),
  kind: AnchorTransactionKindSchema,
  status: AnchorTransactionStatusSchema,
  assetCode: z.string().min(1).max(12),
  amountIn: PaymentAmountSchema,
  amountOut: PaymentAmountSchema.optional(),
  feeAmount: PaymentAmountSchema.optional(),
  stellarAccount: StellarPublicKeySchema,
  stellarTransactionId: StellarTransactionHashSchema.optional(),
  externalTransactionId: z.string().optional(),
  startedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  userActionRequired: z.boolean().optional(),
  userActionUrl: z.string().url().optional(),
  message: z.string().optional(),
  refunded: z.boolean().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const AnchorMockDepositRequestSchema = DepositRequestMetadataSchema;

export const AnchorMockDepositResponseSchema = z.object({
  transaction: AnchorTransactionRecordSchema,
  userActionUrl: z.string().url().optional(),
  instructions: z.string().optional(),
});

export const AnchorMockWithdrawalRequestSchema = WithdrawalRequestMetadataSchema;

export const AnchorMockWithdrawalResponseSchema = z.object({
  transaction: AnchorTransactionRecordSchema,
  memo: z.string(),
  memoType: MemoTypeSchema,
  anchorAddress: StellarPublicKeySchema,
});

export const AnchorMockStatusResponseSchema = z.object({
  transaction: AnchorTransactionRecordSchema,
  status: AnchorTransactionStatusSchema,
  userMessage: z.object({
    headline: z.string().min(1),
    detail: z.string().min(1),
    cta: z.string().optional(),
    severity: z.enum(["info", "warning", "error", "success"]),
  }),
});

export const AnchorMockUpdateRequestSchema = z.object({
  status: AnchorTransactionStatusSchema.optional(),
  message: z.string().optional(),
  externalTransactionId: z.string().optional(),
  stellarTransactionId: z.string().optional(),
  refunded: z.boolean().optional(),
  feeAmount: PaymentAmountSchema.optional(),
  amountOut: PaymentAmountSchema.optional(),
});

export const AnchorMockUpdateResponseSchema = z.object({
  ok: z.boolean(),
  transaction: AnchorTransactionRecordSchema.optional(),
  error: z.string().optional(),
});

export const AnchorMockErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  code: z.string(),
  userSafeMessage: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export const CallbackUrlSchema = z
  .string()
  .url()
  .superRefine((val, ctx) => {
    try {
      const url = new URL(val);
      if (url.protocol !== "https:" && url.hostname !== "localhost") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Callback URL must use HTTPS in production (localhost is allowed for testing)",
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid URL format",
      });
    }
  });

export type ParsedAnchorAssetConfig = z.infer<typeof AnchorAssetConfigSchema>;
export type ParsedPaymentRailConfig = z.infer<typeof PaymentRailConfigSchema>;
export type ParsedDepositRequestMetadata = z.infer<typeof DepositRequestMetadataSchema>;
export type ParsedWithdrawalRequestMetadata = z.infer<typeof WithdrawalRequestMetadataSchema>;
export type ParsedAnchorTransactionRecord = z.infer<typeof AnchorTransactionRecordSchema>;
export type ParsedAnchorMockDepositRequest = z.infer<typeof AnchorMockDepositRequestSchema>;
export type ParsedAnchorMockDepositResponse = z.infer<typeof AnchorMockDepositResponseSchema>;
export type ParsedAnchorMockWithdrawalRequest = z.infer<typeof AnchorMockWithdrawalRequestSchema>;
export type ParsedAnchorMockWithdrawalResponse = z.infer<typeof AnchorMockWithdrawalResponseSchema>;
export type ParsedAnchorMockStatusResponse = z.infer<typeof AnchorMockStatusResponseSchema>;
export type ParsedAnchorMockUpdateRequest = z.infer<typeof AnchorMockUpdateRequestSchema>;
export type ParsedAnchorMockUpdateResponse = z.infer<typeof AnchorMockUpdateResponseSchema>;
export type ParsedAnchorMockErrorResponse = z.infer<typeof AnchorMockErrorResponseSchema>;
