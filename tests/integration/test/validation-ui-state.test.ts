import {
  createPaymentIntent,
  evaluateTransactionReadinessSync,
  transactionReadinessStateToUiState,
  deriveValidationUiState,
} from "@anchorkit/stellar-kit";
import type { AccountDiagnostic } from "@anchorkit/stellar-kit";
import { anchorValidationUiState, validateAnchorRequest } from "@anchorkit/anchor-utils";
import type { StellarAsset } from "@anchorkit/types";

const G_ALICE = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const G_BOB = "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";

const XLM_NATIVE: StellarAsset = { type: "native", code: "XLM", issuer: null };

describe("validation UI state composition", () => {
  it("reports loading when no result is available yet", () => {
    expect(deriveValidationUiState({ result: null })).toBe("loading");
    expect(deriveValidationUiState({ result: { ok: true, value: {} }, loading: true })).toBe(
      "loading"
    );
  });

  it("maps a ready payment pipeline to ready UI state", () => {
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

  it("maps malformed payment input to invalid UI state", () => {
    const invalidIntent = {
      sourcePublicKey: "BAD_SOURCE_KEY",
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "-50.0",
    };
    const readiness = evaluateTransactionReadinessSync(invalidIntent as never);

    expect(readiness.state).toBe("invalid");
    expect(transactionReadinessStateToUiState(readiness.state)).toBe("invalid");
  });

  it("maps non-blocking destination warnings to warning UI state", () => {
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

  it("maps blocked and unavailable readiness into blocked UI state", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: G_ALICE,
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "500.0000000",
    });

    const readinessUnfunded = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: false,
    });
    expect(readinessUnfunded.state).toBe("blocked");
    expect(transactionReadinessStateToUiState(readinessUnfunded.state)).toBe("blocked");

    const unavailableDiagnostic = {
      input: G_ALICE,
      state: "unavailable",
      isValidPublicKey: true,
      expertUrl: null,
      reserve: null,
      balances: {
        state: "unknown",
        total: null,
        reserve: null,
        spendable: null,
        unavailable: null,
        explanation: "Horizon network request timed out",
      },
      account: null,
      error: "Horizon network request timed out",
    } satisfies AccountDiagnostic;

    const readinessUnavailable = evaluateTransactionReadinessSync(intent, {
      sourceDiagnostic: unavailableDiagnostic,
    });
    expect(readinessUnavailable.state).toBe("unavailable");
    expect(transactionReadinessStateToUiState(readinessUnavailable.state)).toBe("blocked");
  });

  it("maps blocked anchor validation into blocked UI state", () => {
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
