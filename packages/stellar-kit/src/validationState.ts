/**
 * Domain-aware UI validation state derivation (issue: payment/anchor
 * validation UI state system).
 *
 * `@anchorkit/validators`' `validationResultToUiState` only knows the base
 * loading/invalid/ready cases from a `ValidationResult`. This module layers
 * "warning" and "blocked" on top, and reconciles the two pre-existing
 * readiness pipelines (`readiness.ts`'s `TransactionReadinessState` and
 * `intent.ts`'s `ReadinessState`) onto the shared `ValidationUIState`
 * vocabulary via pure mapping functions — neither pipeline is replaced or
 * merged.
 *
 * State precedence (highest wins): loading > invalid > blocked > warning >
 * ready. This mirrors the priority order `readiness.ts` already uses when
 * collapsing per-stage states into an overall state (invalid is checked
 * before blocked, before unavailable/warning) — see `deriveOverallState` in
 * `./readiness.ts`.
 */

import type { ReadinessState, TransactionReadinessState, ValidationUIState } from "@anchorkit/types";
import type { ValidationResult } from "@anchorkit/validators";
import { validationResultToUiState } from "@anchorkit/validators";

export interface ValidationUiStateInput {
  /** Validation/derivation is currently in flight. */
  loading?: boolean;
  /** The latest validation result, or `null` while none is available yet. */
  result: ValidationResult<unknown> | null;
  /** An external/policy condition (e.g. mainnet safety) blocks proceeding. */
  blocked?: boolean;
  /** Non-blocking issues exist alongside an otherwise-ok result. */
  hasWarnings?: boolean;
}

/**
 * Derive the generic {@link ValidationUIState} for a form, layering
 * "blocked" and "warning" on top of the base result-only derivation.
 */
export function deriveValidationUiState(input: ValidationUiStateInput): ValidationUIState {
  const base = validationResultToUiState(input.result, { loading: input.loading });
  if (base === "loading" || base === "invalid") return base;
  if (input.blocked) return "blocked";
  if (input.hasWarnings) return "warning";
  return base;
}

/** Map a `readiness.ts` per-stage/overall state onto the shared vocabulary. */
export function transactionReadinessStateToUiState(state: TransactionReadinessState): ValidationUIState {
  switch (state) {
    case "valid":
      return "ready";
    case "warning":
      return "warning";
    case "blocked":
      return "blocked";
    case "invalid":
      return "invalid";
    case "unavailable":
      // Folds into "blocked": not a user input error, but an external
      // condition (diagnostics unavailable) preventing a safe "ready" state.
      return "blocked";
  }
}

/** Map an `intent.ts` readiness state onto the shared vocabulary. */
export function readinessStateToUiState(state: ReadinessState): ValidationUIState {
  switch (state) {
    case "ready":
      return "ready";
    case "warnings":
      return "warning";
    case "unsafe-network":
    case "blocked":
      return "blocked";
  }
}
