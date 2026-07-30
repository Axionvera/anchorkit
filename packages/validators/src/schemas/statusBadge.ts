import { z } from "zod";
import { STATUS_BADGE_DOMAINS } from "@anchorkit/types";
import type { StatusBadgeDomain } from "@anchorkit/types";

export const SeverityLevelSchema = z.enum([
  "info",
  "success",
  "warning",
  "blocked",
  "error",
  "unknown",
]);

export const BadgeToneSchema = z.enum(["neutral", "amber", "blue", "green", "red"]);

export const RecommendedActionSchema = z.enum([
  "none",
  "retry",
  "contact_support",
  "check_explorer",
  "enable_mainnet",
  "fund_account",
  "wait",
  "review_details",
]);

export const StatusBadgeDomainSchema = z.enum(
  STATUS_BADGE_DOMAINS as unknown as [StatusBadgeDomain, ...StatusBadgeDomain[]]
);

export const StatusSeveritySchema = z.object({
  level: SeverityLevelSchema,
  label: z.string().min(1),
  tone: BadgeToneSchema,
  headline: z.string().min(1),
  detail: z.string().min(1),
  action: RecommendedActionSchema.optional(),
  docLink: z.string().min(1).optional(),
});

export const StatusBadgeExampleSchema = z.object({
  domain: StatusBadgeDomainSchema,
  status: z.string().min(1),
  severity: StatusSeveritySchema,
});

export type ParsedStatusBadgeExample = z.infer<typeof StatusBadgeExampleSchema>;
