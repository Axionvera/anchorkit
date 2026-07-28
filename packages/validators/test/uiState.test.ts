import { describe, it, expect } from "vitest";
import { validationResultToUiState } from "../src/uiState";
import type { ValidationResult } from "../src/validationEngine";

const OK_RESULT: ValidationResult<{ value: string }> = { ok: true, value: { value: "x" } };
const FAIL_RESULT: ValidationResult<{ value: string }> = {
  ok: false,
  errors: [{ code: "SCHEMA_ERROR", message: "bad input" }],
};

describe("validationResultToUiState", () => {
  it("returns 'loading' when loading is true, regardless of result", () => {
    expect(validationResultToUiState(OK_RESULT, { loading: true })).toBe("loading");
    expect(validationResultToUiState(FAIL_RESULT, { loading: true })).toBe("loading");
    expect(validationResultToUiState(null, { loading: true })).toBe("loading");
  });

  it("returns 'loading' when result is null and not explicitly loading", () => {
    expect(validationResultToUiState(null)).toBe("loading");
  });

  it("returns 'ready' for an ok result", () => {
    expect(validationResultToUiState(OK_RESULT)).toBe("ready");
  });

  it("returns 'invalid' for a failed result", () => {
    expect(validationResultToUiState(FAIL_RESULT)).toBe("invalid");
  });
});
