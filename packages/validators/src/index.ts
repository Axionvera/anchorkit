import { z } from "zod";
import {
  ANCHOR_TRANSACTION_STATUSES,
  MILESTONE_STATUSES,
  STELLAR_NETWORKS,
} from "@anchorkit/types";
import type {
  AnchorTransactionStatus,
  AssetCode,
  MilestoneStatus,
  StellarNetwork,
  StellarPublicKey,
  StellarSecretKey,
  StellarTransactionHash,
} from "@anchorkit/types";
import { DEFAULT_ENV_CONFIG } from "@anchorkit/config";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PUBLIC_KEY_LENGTH = 56;
const SECRET_KEY_LENGTH = 56;
const TX_HASH_LENGTH = 64;

function isValidBase32(input: string): boolean {
  for (let i = 0; i < input.length; i++) {
    if (!BASE32_ALPHABET.includes(input[i]!)) {
      return false;
    }
  }
  return true;
}

export const StellarPublicKeySchema = z
  .string()
  .refine((val) => val.length === PUBLIC_KEY_LENGTH, {
    message: `Stellar public key must be exactly ${PUBLIC_KEY_LENGTH} characters`,
  })
  .refine((val) => val.startsWith("G"), {
    message: "Stellar public key must start with 'G'",
  })
  .refine((val) => isValidBase32(val), {
    message: "Stellar public key must contain only valid base32 characters (A-Z, 2-7)",
  })
  .transform((val) => val as StellarPublicKey);

export const StellarSecretKeySchema = z
  .string()
  .refine((val) => val.length === SECRET_KEY_LENGTH, {
    message: `Stellar secret key must be exactly ${SECRET_KEY_LENGTH} characters`,
  })
  .refine((val) => val.startsWith("S"), {
    message: "Stellar secret key must start with 'S'",
  })
  .refine((val) => isValidBase32(val), {
    message: "Stellar secret key must contain only valid base32 characters (A-Z, 2-7)",
  })
  .transform((val) => val as StellarSecretKey);

export const StellarTransactionHashSchema = z
  .string()
  .refine((val) => val.length === TX_HASH_LENGTH, {
    message: `Stellar transaction hash must be exactly ${TX_HASH_LENGTH} hex characters`,
  })
  .refine((val) => /^[0-9a-fA-F]+$/.test(val), {
    message: "Stellar transaction hash must be a valid hex string",
  })
  .transform((val) => val as StellarTransactionHash);

export const StellarNetworkSchema = z.enum(
  [STELLAR_NETWORKS.TESTNET, STELLAR_NETWORKS.MAINNET, STELLAR_NETWORKS.FUTURENET] as [
    StellarNetwork,
    ...StellarNetwork[]
  ]
);

export const MemoTypeSchema = z.enum(["none", "text", "id", "hash", "return"]);

export const MemoInputSchema = z
  .object({
    type: MemoTypeSchema,
    value: z.string().max(28, "Memo value exceeds 28 byte limit for text memo"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "text") {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data.value);
      if (bytes.length > DEFAULT_ENV_CONFIG.maximumMemoTextBytes) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: DEFAULT_ENV_CONFIG.maximumMemoTextBytes,
          type: "string",
          inclusive: true,
          message: `Memo text exceeds ${DEFAULT_ENV_CONFIG.maximumMemoTextBytes} byte limit`,
          path: ["value"],
        });
      }
    }
    if (data.type === "id") {
      if (!/^\d+$/.test(data.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Memo ID must be a non-negative 64-bit integer string",
          path: ["value"],
        });
      }
    }
    if (data.type === "hash" || data.type === "return") {
      if (!/^[0-9a-fA-F]{64}$/.test(data.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Memo hash/return must be a 64-character hex string",
          path: ["value"],
        });
      }
    }
  });

export const AssetCodeSchema = z
  .string()
  .min(1, "Asset code must not be empty")
  .max(12, "Asset code must be at most 12 characters")
  .regex(/^[a-zA-Z0-9]+$/, "Asset code must contain only alphanumeric characters")
  .transform((val) => val as AssetCode);

export const NativeAssetSchema = z.object({
  type: z.literal("native"),
  code: z.literal("XLM"),
  issuer: z.null(),
});

export const IssuedAssetSchema = z.object({
  type: z.literal("issued"),
  code: AssetCodeSchema,
  issuer: StellarPublicKeySchema,
});

export const StellarAssetSchema = z.discriminatedUnion("type", [
  NativeAssetSchema,
  IssuedAssetSchema,
]);

export const PaymentAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,7})?$/, "Amount must be a valid Stellar amount (max 7 decimal places)")
  .superRefine((val, ctx) => {
    const num = Number(val);
    if (Number.isNaN(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Amount is not a valid number",
      });
      return;
    }
    if (num <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 0,
        type: "number",
        inclusive: false,
        message: "Amount must be greater than zero",
      });
    }
    const min = Number(DEFAULT_ENV_CONFIG.minimumPaymentAmount);
    const max = Number(DEFAULT_ENV_CONFIG.maximumPaymentAmount);
    if (num < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: min,
        type: "number",
        inclusive: true,
        message: `Amount must be at least ${DEFAULT_ENV_CONFIG.minimumPaymentAmount}`,
      });
    }
    if (num > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: max,
        type: "number",
        inclusive: true,
        message: `Amount must not exceed ${DEFAULT_ENV_CONFIG.maximumPaymentAmount}`,
      });
    }
  });

export const PaymentIntentSchema = z.object({
  sourcePublicKey: StellarPublicKeySchema,
  destinationPublicKey: StellarPublicKeySchema,
  asset: StellarAssetSchema,
  amount: PaymentAmountSchema,
  memo: MemoInputSchema.optional(),
});

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

export const MilestoneStatusSchema = z.enum(
  MILESTONE_STATUSES as [MilestoneStatus, ...MilestoneStatus[]]
);

export const MilestoneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: PaymentAmountSchema,
  status: MilestoneStatusSchema,
  evidenceHash: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  approvedAt: z.string().datetime().optional(),
  releasedAt: z.string().datetime().optional(),
  disputedAt: z.string().datetime().optional(),
  disputeReason: z.string().optional(),
});

export const EscrowSummarySchema = z.object({
  totalMilestones: z.number().int().min(0),
  totalAmount: z.string(),
  releasedAmount: z.string(),
  pendingAmount: z.string(),
  disputedCount: z.number().int().min(0),
  completedCount: z.number().int().min(0),
  admin: z.string().min(1),
});

export const CallbackUrlSchema = z.string().url().superRefine((val, ctx) => {
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

export { z };

// ─── Validation engine (issue #6) ───────────────────────────────────────────
export * from "./validationEngine";
