import { describe, it, expect } from "vitest";
import {
  createPaymentIntent,
  evaluateTransactionReadinessSync,
} from "../packages/stellar-kit/src";
import type { StellarAsset } from "../packages/types/src";

const G_ALICE = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const G_BOB = "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";
const G_ISSUER = "GBBD47IF6LWK2P7MDEVSCWR7DPUWV3NY3DTQEVFL4TWVC5GIOTASHEXN";

const XLM_NATIVE: StellarAsset = { type: "native", code: "XLM", issuer: null };
const USDC_ISSUED: StellarAsset = { type: "issued", code: "USDC" as any, issuer: G_ISSUER as any };

describe("Monorepo Integration: Transaction Readiness Pipeline Fixtures", () => {
  it("Fixture 1: Valid State - Fully compliant payment intent with funded accounts", () => {
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

  it("Fixture 2: Invalid State - Malformed inputs and schema validation failure", () => {
    const invalidIntent: any = {
      sourcePublicKey: "BAD_SOURCE_KEY",
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "-50.0",
    };

    const readiness = evaluateTransactionReadinessSync(invalidIntent);

    expect(readiness.state).toBe("invalid");
    expect(readiness.ready).toBe(false);
    expect(readiness.stages.account.state).toBe("invalid");
    expect(readiness.stages.amount.state).toBe("invalid");
    expect(readiness.issues.length).toBeGreaterThan(0);
  });

  it("Fixture 3: Blocked State - Unfunded source account and insufficient XLM balance", () => {
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
      sourceBalanceXlm: "501.0000000", // Needs 500 + min reserve 2.5 XLM
    });
    expect(readinessLowBalance.state).toBe("blocked");
    expect(readinessLowBalance.ready).toBe(false);
    expect(readinessLowBalance.issues.some((i) => i.code === "INSUFFICIENT_BALANCE")).toBe(true);
  });

  it("Fixture 4: Warning State - Unfunded destination for XLM payment or identical accounts", () => {
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

  it("Fixture 5: Unavailable State - Graceful handling when account diagnostics fail", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: G_ALICE,
      destinationPublicKey: G_BOB,
      asset: XLM_NATIVE,
      amount: "10.0000000",
    });

    const unavailableDiagnostic: any = {
      input: G_ALICE,
      state: "unavailable",
      isValidPublicKey: true,
      expertUrl: null,
      reserve: null,
      account: null,
      error: "Horizon network request timed out",
    };

    const readiness = evaluateTransactionReadinessSync(intent, {
      sourceDiagnostic: unavailableDiagnostic,
    });

    expect(readiness.state).toBe("unavailable");
    expect(readiness.ready).toBe(false);
    expect(readiness.stages.account.state).toBe("unavailable");
    expect(readiness.issues.some((i) => i.code === "SOURCE_UNAVAILABLE")).toBe(true);
  });
});
