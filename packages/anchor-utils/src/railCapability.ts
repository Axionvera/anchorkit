/**
 * Anchor capability matrix utilities (issue #54).
 *
 * Provides parse/validate wrappers and convenience helpers for working with
 * `AnchorCapabilityMatrix`, `AnchorRailCapability`, and `AnchorAssetCapability`
 * from within `@anchorkit/anchor-utils`.
 */

import type {
  AnchorCapabilityMatrix,
  AnchorRailCapability,
  AnchorAssetCapability,
} from "@anchorkit/types";
import {
  AnchorCapabilityMatrixSchema,
  AnchorRailCapabilitySchema,
  AnchorAssetCapabilitySchema,
} from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";

// ─── Parse helpers ────────────────────────────────────────────────────────────

/**
 * Safely parse and validate an `AnchorCapabilityMatrix` object.
 * Returns a Zod `SafeParseReturnType` — never throws.
 */
export function parseAnchorCapabilityMatrix(
  input: unknown
): SafeParseReturnType<unknown, AnchorCapabilityMatrix> {
  return AnchorCapabilityMatrixSchema.safeParse(input) as SafeParseReturnType<
    unknown,
    AnchorCapabilityMatrix
  >;
}

/**
 * Returns `true` when the input is a structurally valid `AnchorCapabilityMatrix`.
 */
export function isAnchorCapabilityMatrixValid(input: unknown): boolean {
  return parseAnchorCapabilityMatrix(input).success;
}

/**
 * Safely parse and validate an `AnchorRailCapability` object.
 */
export function parseAnchorRailCapability(
  input: unknown
): SafeParseReturnType<unknown, AnchorRailCapability> {
  return AnchorRailCapabilitySchema.safeParse(input) as SafeParseReturnType<
    unknown,
    AnchorRailCapability
  >;
}

/**
 * Returns `true` when the input is a structurally valid `AnchorRailCapability`.
 */
export function isAnchorRailCapabilityValid(input: unknown): boolean {
  return parseAnchorRailCapability(input).success;
}

/**
 * Safely parse and validate an `AnchorAssetCapability` object.
 */
export function parseAnchorAssetCapability(
  input: unknown
): SafeParseReturnType<unknown, AnchorAssetCapability> {
  return AnchorAssetCapabilitySchema.safeParse(input) as SafeParseReturnType<
    unknown,
    AnchorAssetCapability
  >;
}

/**
 * Returns `true` when the input is a structurally valid `AnchorAssetCapability`.
 */
export function isAnchorAssetCapabilityValid(input: unknown): boolean {
  return parseAnchorAssetCapability(input).success;
}
