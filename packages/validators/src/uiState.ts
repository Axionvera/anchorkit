/**
 * Base UI validation state derivation (issue: payment/anchor validation UI
 * state system).
 *
 * This is the domain-agnostic case: given only a `ValidationResult` (and an
 * optional loading flag), decide whether the form should render as
 * "loading", "invalid", or "ready". It has no notion of "warning" or
 * "blocked" — those require domain-specific readiness knowledge that this
 * package cannot see (see `@anchorkit/stellar-kit`'s `deriveValidationUiState`,
 * which layers those states on top of this function).
 */

import type { ValidationUIState } from "@anchorkit/types";
import type { ValidationResult } from "./validationEngine";

/**
 * Map a `ValidationResult` (or the absence of one, while a result is still
 * pending) to the base `ValidationUIState`.
 */
export function validationResultToUiState(
  result: ValidationResult<unknown> | null,
  opts?: { loading?: boolean }
): ValidationUIState {
  if (opts?.loading || !result) return "loading";
  return result.ok ? "ready" : "invalid";
}
