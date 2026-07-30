import { PaymentIntentSchema, TransactionSummarySchema } from "@anchorkit/validators";
import {
  createPaymentIntent,
  diagnoseAccountInfo,
  estimateTransactionReadinessSync,
  evaluateTransactionReadinessSync,
  getReadinessSeverity,
  paymentIntentToSummary,
  readinessStateToUiState,
} from "@anchorkit/stellar-kit";
import { assertNetworkAllowed, DEFAULT_ENV_CONFIG } from "@anchorkit/config";
import { isAnchorKitError } from "@anchorkit/types";
import {
  diagnosticsFundedAccountInfo,
  invalidPaymentIntent,
  samplePaymentIntent,
} from "./fixtures";

describe("payment validation flow", () => {
  it("validates, constructs, evaluates, and summarizes a payment intent", () => {
    const parsed = PaymentIntentSchema.parse({
      ...samplePaymentIntent,
      amount: "10.0000000",
    });
    const intent = createPaymentIntent(parsed);
    const sourceDiagnostic = diagnoseAccountInfo(diagnosticsFundedAccountInfo);

    const readiness = evaluateTransactionReadinessSync(intent, {
      sourceDiagnostic,
      destAccountFunded: true,
    });
    const summary = paymentIntentToSummary({
      intent,
      riskNotes: readiness.issues,
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.state).toBe("valid");
    expect(readiness.stages.account.state).toBe("valid");
    expect(TransactionSummarySchema.parse(summary)).toMatchObject({
      operation: "payment",
      source: "payment",
      amount: "10.0000000",
    });
  });

  it("blocks mainnet payments unless config explicitly allows them", () => {
    const intent = createPaymentIntent({
      ...samplePaymentIntent,
      amount: "10.0000000",
    });

    const blocked = estimateTransactionReadinessSync(intent, { network: "mainnet" });
    expect(blocked.state).toBe("unsafe-network");
    expect(readinessStateToUiState(blocked.state)).toBe("blocked");
    expect(getReadinessSeverity(blocked.state).action).toBe("enable_mainnet");

    expect(() => assertNetworkAllowed("mainnet")).toThrow();
    try {
      assertNetworkAllowed("mainnet");
    } catch (error) {
      expect(isAnchorKitError(error)).toBe(true);
      expect(error).toMatchObject({
        code: "MAINNET_DISABLED",
        category: "CONFIG",
      });
    }

    const allowed = estimateTransactionReadinessSync(intent, {
      network: "mainnet",
      envConfig: { ...DEFAULT_ENV_CONFIG, allowMainnet: true },
    });
    expect(allowed.state).toBe("ready");
  });

  it("rejects the shared malformed intent before domain processing", () => {
    const result = PaymentIntentSchema.safeParse(invalidPaymentIntent);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
    }
  });
});
