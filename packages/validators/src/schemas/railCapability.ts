/**
 * Zod schemas for anchor rails capability matrix (issue #54).
 */

import { z } from "zod";
import { CAPABILITY_STATES, ANCHOR_RAIL_CAPABILITY_STATES } from "@anchorkit/types";

export const AnchorRailCapabilityStateSchema = z.enum(
  ANCHOR_RAIL_CAPABILITY_STATES as [string, ...string[]]
);

export const CapabilityStateSchema = z.enum(
  CAPABILITY_STATES as [string, ...string[]]
);

export const AnchorRailCapabilitySchema = z.object({
  railId: z.string().min(1),
  name: z.string().min(1),
  state: AnchorRailCapabilityStateSchema,
  depositSupported: z.boolean(),
  withdrawalSupported: z.boolean(),
  currencies: z.array(z.string().min(1)).min(1),
  countries: z.array(z.string().length(2)).min(1),
  note: z.string().optional(),
});

export const AnchorAssetCapabilitySchema = z.object({
  code: z.string().min(1).max(12),
  issuer: z.string().nullable(),
  enabled: z.boolean(),
  depositEnabled: z.boolean(),
  withdrawalEnabled: z.boolean(),
  depositMinAmount: z.string().optional(),
  depositMaxAmount: z.string().optional(),
  withdrawalMinAmount: z.string().optional(),
  withdrawalMaxAmount: z.string().optional(),
  feeFixed: z.string().optional(),
  feePercent: z.string().optional(),
  note: z.string().optional(),
});

export const AnchorCapabilityMatrixSchema = z.object({
  anchorName: z.string().min(1),
  overallState: AnchorRailCapabilityStateSchema,
  isMock: z.boolean(),
  depositState: AnchorRailCapabilityStateSchema,
  withdrawalState: AnchorRailCapabilityStateSchema,
  rails: z.array(AnchorRailCapabilitySchema),
  assets: z.array(AnchorAssetCapabilitySchema),
  experimentalBehaviours: z.record(z.string()).optional(),
  disabledBehaviours: z.record(z.string()).optional(),
  docsHref: z.string().optional(),
});

export type ParsedAnchorRailCapability = z.infer<typeof AnchorRailCapabilitySchema>;
export type ParsedAnchorAssetCapability = z.infer<typeof AnchorAssetCapabilitySchema>;
export type ParsedAnchorCapabilityMatrix = z.infer<typeof AnchorCapabilityMatrixSchema>;
