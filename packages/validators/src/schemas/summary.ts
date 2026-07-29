import { z } from "zod";
import {
  STELLAR_NETWORKS,
  TRANSACTION_SUMMARY_OPERATIONS,
} from "@anchorkit/types";
import type {
  StellarNetwork,
  TransactionSummaryOperation,
} from "@anchorkit/types";
import {
  MemoInputSchema,
  StellarAssetSchema,
  StellarPublicKeySchema,
} from "./stellar";

export const TransactionSummaryOperationSchema = z.enum(
  TRANSACTION_SUMMARY_OPERATIONS as [
    TransactionSummaryOperation,
    ...TransactionSummaryOperation[],
  ]
);

export const TransactionSummarySourceSchema = z.enum([
  "payment",
  "anchor",
  "escrow",
  "other",
]);

export const TransactionSummaryPartyRoleSchema = z.enum([
  "source",
  "destination",
  "admin",
  "anchor",
  "other",
]);

export const TransactionSummaryPartySchema = z.object({
  role: TransactionSummaryPartyRoleSchema,
  label: z.string().min(1),
  publicKey: StellarPublicKeySchema.optional(),
  detail: z.string().optional(),
});

export const TransactionSummaryFeeEstimateSchema = z.object({
  amount: z.string().optional(),
  assetCode: z.string().optional(),
  source: z.enum(["anchor_config", "anchor_record", "unavailable", "manual"]),
  note: z.string().optional(),
});

export const TransactionSummaryRiskNoteSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["error", "warning", "info"]),
});

export const TransactionSummarySchema = z.object({
  id: z.string().min(1),
  operation: TransactionSummaryOperationSchema,
  source: TransactionSummarySourceSchema,
  network: z.enum([
    STELLAR_NETWORKS.TESTNET,
    STELLAR_NETWORKS.MAINNET,
    STELLAR_NETWORKS.FUTURENET,
  ] as [StellarNetwork, ...StellarNetwork[]]),
  headline: z.string().min(1),
  detail: z.string().optional(),
  parties: z.array(TransactionSummaryPartySchema),
  amount: z.string().optional(),
  asset: StellarAssetSchema.optional(),
  memo: MemoInputSchema.optional(),
  feeEstimate: TransactionSummaryFeeEstimateSchema.optional(),
  riskNotes: z.array(TransactionSummaryRiskNoteSchema),
  metadata: z.record(z.unknown()).optional(),
});

export type ParsedTransactionSummary = z.infer<typeof TransactionSummarySchema>;
