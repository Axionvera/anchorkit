import { createPaymentIntent, evaluateTransactionReadinessSync } from "@anchorkit/stellar-kit";
import type { AccountDiagnostic } from "@anchorkit/stellar-kit";
import type { StellarAsset } from "@anchorkit/types";

const G_ALICE = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const G_BOB = "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";

const XLM_NATIVE: StellarAsset = { type: "native", code: "XLM", issuer: null };

describe("transaction readiness pipeline composition", () => {
  it("marks a funded payment intent as valid", () => {
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
    expect(readiness.ready).toBe(true);
    expect(readiness.issues).toHaveLength(0);
    expect(readiness.stages.network.state).toBe("valid");
    expect(readiness.stages.account.state).toBe("valid");
    expect(readiness.stages.asset.state).toBe("valid");
    expect(readiness.stages.amount.state).toBe("valid");
    expect(readiness.stages.memo.state).toBe("valid");
  });

  it("marks malformed inputs as invalid", () => {
    const invalidIntent = {
      sourcePublicKey: "BAD_SOURCE_KEY",
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "-50.0",
    };

    const readiness = evaluateTransactionReadinessSync(invalidIntent as never);

    expect(readiness.state).toBe("invalid");
    expect(readiness.ready).toBe(false);
    expect(readiness.stages.account.state).toBe("invalid");
    expect(readiness.stages.amount.state).toBe("invalid");
    expect(readiness.issues.length).toBeGreaterThan(0);
  });

  it("blocks unfunded sources and insufficient XLM balances", () => {
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
    expect(readinessUnfunded.ready).toBe(false);

    const readinessLowBalance = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: true,
      sourceBalanceXlm: "501.0000000",
    });
    expect(readinessLowBalance.state).toBe("blocked");
    expect(readinessLowBalance.ready).toBe(false);
    expect(readinessLowBalance.issues.some((i) => i.code === "INSUFFICIENT_BALANCE")).toBe(true);
  });

  it("warns for unfunded destinations and identical accounts", () => {
    const intentUnfundedDest = createPaymentIntent({
      sourcePublicKey: G_ALICE,
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "10.0000000",
    });

    const readinessUnfundedDest = evaluateTransactionReadinessSync(intentUnfundedDest, {
      sourceAccountFunded: true,
      destAccountFunded: false,
    });
    expect(readinessUnfundedDest.state).toBe("warning");
    expect(readinessUnfundedDest.ready).toBe(true);

    const intentSameKeys = createPaymentIntent({
      sourcePublicKey: G_ALICE,
      destinationPublicKey: G_ALICE,
      asset: XLM_NATIVE,
      amount: "10.0000000",
    });

    const readinessSameKeys = evaluateTransactionReadinessSync(intentSameKeys, {
      sourceAccountFunded: true,
    });
    expect(readinessSameKeys.state).toBe("warning");
    expect(readinessSameKeys.ready).toBe(true);
  });

  it("treats unavailable diagnostics as an unavailable stage", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: G_ALICE,
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "10.0000000",
    });

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

    const readiness = evaluateTransactionReadinessSync(intent, {
      sourceDiagnostic: unavailableDiagnostic,
    });

    expect(readiness.state).toBe("unavailable");
    expect(readiness.ready).toBe(false);
    expect(readiness.stages.account.state).toBe("unavailable");
    expect(readiness.issues.some((i) => i.code === "SOURCE_UNAVAILABLE")).toBe(true);
  });
});
