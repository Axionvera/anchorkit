import { z } from "zod";
import { STELLAR_NETWORKS, TRANSACTION_RECEIPT_STATUSES } from "@anchorkit/types";
import type {
  StellarNetwork,
  TransactionReceiptStatus,
} from "@anchorkit/types";
import { StellarTransactionHashSchema } from "./stellar";

export const TransactionReceiptStatusSchema = z.enum(
  TRANSACTION_RECEIPT_STATUSES as [TransactionReceiptStatus, ...TransactionReceiptStatus[]]
);

export const TransactionReceiptSourceSchema = z.enum([
  "payment",
  "anchor",
  "escrow",
  "other",
]);

export const TransactionReceiptSchema = z.object({
  id: z.string().min(1),
  status: TransactionReceiptStatusSchema,
  network: z.enum([
    STELLAR_NETWORKS.TESTNET,
    STELLAR_NETWORKS.MAINNET,
    STELLAR_NETWORKS.FUTURENET,
  ] as [StellarNetwork, ...StellarNetwork[]]),
  headline: z.string().min(1),
  detail: z.string().optional(),
  source: TransactionReceiptSourceSchema,
  transactionHash: StellarTransactionHashSchema.optional(),
  explorerUrl: z.string().url().optional(),
  submittedAt: z.string().datetime().optional(),
  finalizedAt: z.string().datetime().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ParsedTransactionReceipt = z.infer<typeof TransactionReceiptSchema>;
