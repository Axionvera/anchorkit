import { describe, it, expect } from "vitest";
import {
  createPaymentIntent,
  evaluateTransactionReadinessSync,
  transactionReadinessStateToUiState,
  deriveValidationUiState,
} from "../packages/stellar-kit/src";
import { anchorValidationUiState, validateAnchorRequest } from "../packages/anchor-utils/src";
import type { StellarAsset } from "../packages/types/src";

const G_ALICE = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const G_BOB = "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";

const XLM_NATIVE: StellarAsset = { type: "native", code: "XLM", issuer: null };

describe("Monorepo Integration: ValidationUIState spans loading/invalid/warning/ready/blocked", () => {
  it("loading: no result yet", () => {
    expect(deriveValidationUiState({ result: null })).toBe("loading");
    expect(deriveValidationUiState({ result: { ok: true, value: {} }, loading: true })).toBe("loading");
  });

  it("ready: a fully compliant payment intent with funded accounts", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: G_ALICE,
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "100.5000000",
      memo: { type: "text", value: "Payment #1001" },
    });
    const readiness = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: true,
      destAccountFunded: true,
      sourceBalanceXlm: "1000.0000000",
    });

    expect(readiness.state).toBe("valid");
    expect(transactionReadinessStateToUiState(readiness.state)).toBe("ready");
  });

  it("invalid: malformed payment intent input", () => {
    const invalidIntent: any = {
      sourcePublicKey: "BAD_SOURCE_KEY",
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "-50.0",
    };
    const readiness = evaluateTransactionReadinessSync(invalidIntent);

    expect(readiness.state).toBe("invalid");
    expect(transactionReadinessStateToUiState(readiness.state)).toBe("invalid");
  });

  it("warning: unfunded destination for an XLM payment (non-blocking)", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: G_ALICE,
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "10.0000000",
    });
    const readiness = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: true,
      destAccountFunded: false,
    });

    expect(readiness.state).toBe("warning");
    expect(transactionReadinessStateToUiState(readiness.state)).toBe("warning");
  });

  it("blocked: unfunded source account, and unavailable diagnostics", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: G_ALICE,
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "500.0000000",
    });

    const readinessUnfunded = evaluateTransactionReadinessSync(intent, { sourceAccountFunded: false });
    expect(readinessUnfunded.state).toBe("blocked");
    expect(transactionReadinessStateToUiState(readinessUnfunded.state)).toBe("blocked");

    const unavailableDiagnostic: any = {
      input: G_ALICE,
      state: "unavailable",
      isValidPublicKey: true,
      expertUrl: null,
      reserve: null,
      account: null,
      error: "Horizon network request timed out",
    };
    const readinessUnavailable = evaluateTransactionReadinessSync(intent, {
      sourceDiagnostic: unavailableDiagnostic,
    });
    expect(readinessUnavailable.state).toBe("unavailable");
    // "unavailable" folds into "blocked" — see docs/VALIDATION_UI_STATES.md
    expect(transactionReadinessStateToUiState(readinessUnavailable.state)).toBe("blocked");
  });

  it("anchor-utils: blocked when the anchor asset config disables the operation", () => {
    const depositDraft = {
      assetCode: "USDC",
      amount: "10",
      account: G_ALICE,
      type: "SEPA",
    };

    const result = validateAnchorRequest("deposit", depositDraft);
    expect(result.ok).toBe(true);

    expect(anchorValidationUiState(result)).toBe("ready");
    expect(anchorValidationUiState(result, { blocked: true })).toBe("blocked");
  });
});
