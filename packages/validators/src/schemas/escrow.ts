import { z } from "zod";
import { MILESTONE_STATUSES } from "@anchorkit/types";
import type { MilestoneStatus } from "@anchorkit/types";
import { PaymentAmountSchema } from "./stellar";

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

export type ParsedMilestone = z.infer<typeof MilestoneSchema>;
export type ParsedEscrowSummary = z.infer<typeof EscrowSummarySchema>;
