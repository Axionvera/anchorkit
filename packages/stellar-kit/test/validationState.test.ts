import { describe, it, expect } from "vitest";
import type { ReadinessState, TransactionReadinessState, ValidationUIState } from "@anchorkit/types";
import type { ValidationResult } from "@anchorkit/validators";
import {
  deriveValidationUiState,
  transactionReadinessStateToUiState,
  readinessStateToUiState,
} from "../src/validationState";

const OK_RESULT: ValidationResult<{ value: string }> = { ok: true, value: { value: "x" } };
const FAIL_RESULT: ValidationResult<{ value: string }> = {
  ok: false,
  errors: [{ code: "SCHEMA_ERROR", message: "bad input" }],
};

describe("deriveValidationUiState", () => {
  it("prioritizes loading over everything else", () => {
    expect(deriveValidationUiState({ loading: true, result: OK_RESULT, blocked: true })).toBe("loading");
    expect(deriveValidationUiState({ loading: true, result: FAIL_RESULT })).toBe("loading");
  });

  it("prioritizes invalid over blocked and warning", () => {
    expect(
      deriveValidationUiState({ result: FAIL_RESULT, blocked: true, hasWarnings: true })
    ).toBe("invalid");
  });

  it("prioritizes blocked over warning when the result is ok", () => {
    expect(deriveValidationUiState({ result: OK_RESULT, blocked: true, hasWarnings: true })).toBe(
      "blocked"
    );
  });

  it("returns warning when ok with warnings and not blocked", () => {
    expect(deriveValidationUiState({ result: OK_RESULT, hasWarnings: true })).toBe("warning");
  });

  it("returns ready for a plain ok result", () => {
    expect(deriveValidationUiState({ result: OK_RESULT })).toBe("ready");
  });

  it("returns loading when no result is available yet", () => {
    expect(deriveValidationUiState({ result: null })).toBe("loading");
  });
});

describe("transactionReadinessStateToUiState", () => {
  const cases: [TransactionReadinessState, ValidationUIState][] = [
    ["valid", "ready"],
    ["warning", "warning"],
    ["blocked", "blocked"],
    ["invalid", "invalid"],
    ["unavailable", "blocked"],
  ];

  it.each(cases)("maps %s to %s", (input, expected) => {
    expect(transactionReadinessStateToUiState(input)).toBe(expected);
  });
});

describe("readinessStateToUiState", () => {
  const cases: [ReadinessState, ValidationUIState][] = [
    ["ready", "ready"],
    ["warnings", "warning"],
    ["unsafe-network", "blocked"],
    ["blocked", "blocked"],
  ];

  it.each(cases)("maps %s to %s", (input, expected) => {
    expect(readinessStateToUiState(input)).toBe(expected);
  });
});
