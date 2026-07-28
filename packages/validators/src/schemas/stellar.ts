import { z } from "zod";
import { STELLAR_NETWORKS } from "@anchorkit/types";
import type {
  AssetCode,
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
    value: z.string(),
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
    const integerPart = val.split(".")[0] ?? "0";
    if (integerPart.length > 12 || num > max) {
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

export type ParsedMemoInput = z.infer<typeof MemoInputSchema>;
export type ParsedNativeAsset = z.infer<typeof NativeAssetSchema>;
export type ParsedIssuedAsset = z.infer<typeof IssuedAssetSchema>;
export type ParsedStellarAsset = z.infer<typeof StellarAssetSchema>;
export type ParsedPaymentIntent = z.infer<typeof PaymentIntentSchema>;
