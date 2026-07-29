import { z } from "zod";
import { MILESTONE_ACTIONS } from "@anchorkit/types";
import type { MilestoneAction, MilestoneActionAvailability } from "@anchorkit/types";

export const MilestoneActionSchema = z.enum(
  MILESTONE_ACTIONS as [MilestoneAction, ...MilestoneAction[]],
);

export const MilestoneActionAvailabilitySchema = z.enum(
  ["allowed", "blocked", "hidden", "admin_only"] as [
    MilestoneActionAvailability,
    ...MilestoneActionAvailability[],
  ],
);

export const MilestoneActionRuleSchema = z.object({
  action: MilestoneActionSchema,
  availability: MilestoneActionAvailabilitySchema,
  reason: z.string().optional(),
});

export const MilestoneEvidenceDisplaySchema = z.object({
  state: z.enum(["not_submitted", "submitted", "invalid"]),
  truncated: z.string().optional(),
  fullHash: z.string().optional(),
  label: z.string(),
});

export const MilestoneUiInfoSchema = z.object({
  status: z.enum([
    "draft",
    "active",
    "evidence_submitted",
    "approved",
    "disputed",
    "ready_for_release",
    "released",
  ]),
  allowedActions: z.array(MilestoneActionSchema),
  actionRules: z.array(MilestoneActionRuleSchema),
  evidence: MilestoneEvidenceDisplaySchema,
  isReleased: z.boolean(),
  isDisputed: z.boolean(),
});

export type ParsedMilestoneActionRule = z.infer<typeof MilestoneActionRuleSchema>;
export type ParsedMilestoneEvidenceDisplay = z.infer<typeof MilestoneEvidenceDisplaySchema>;
export type ParsedMilestoneUiInfo = z.infer<typeof MilestoneUiInfoSchema>;
