/**
 * Tests for the transaction summary integration in the web dashboard (issue #90).
 *
 * Verifies that shared summary builders produce schema-valid objects for the
 * payment, anchor, and escrow cases used by preview panels — without mounting
 * React components.
 */

import { describe, it, expect } from "vitest";
import {
  anchorRequestToSummary,
  escrowMilestoneToSummary,
  isTransactionSummaryValid,
  paymentIntentToSummary,
} from "@anchorkit/stellar-kit";
import type {
  AssetCode,
  DepositRequestMetadata,
  Milestone,
  PaymentIntent,
  StellarPublicKey,
} from "@anchorkit/types";

const SOURCE =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR" as StellarPublicKey;
const DEST =
  "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U" as StellarPublicKey;

describe("transaction summary web integration (issue #90)", () => {
  it("builds a valid payment review summary", () => {
    const intent: PaymentIntent = {
      sourcePublicKey: SOURCE,
      destinationPublicKey: DEST,
      asset: { type: "native", code: "XLM", issuer: null },
      amount: "10.0000000",
      memo: { type: "text", value: "Review" },
    };
    const summary = paymentIntentToSummary({
      intent,
      network: "testnet",
      riskNotes: [
        {
          code: "TESTNET_ONLY",
          message: "Dashboard payments are simulated.",
          severity: "info",
        },
      ],
    });
    expect(isTransactionSummaryValid(summary)).toBe(true);
    expect(summary.operation).toBe("payment");
    expect(summary.parties).toHaveLength(2);
  });

  it("builds a valid anchor deposit summary with fee config", () => {
    const request: DepositRequestMetadata = {
      assetCode: "USDC",
      amount: "100.0000000",
      account: SOURCE,
      type: "SEPA",
      railId: "sepa_eu",
    };
    const summary = anchorRequestToSummary({
      kind: "deposit",
      request,
      assetConfig: {
        code: "USDC",
        issuer: DEST,
        feeFixed: "0.1000000",
      },
    });
    expect(isTransactionSummaryValid(summary)).toBe(true);
    expect(summary.operation).toBe("anchor_deposit");
    expect(summary.feeEstimate?.source).toBe("anchor_config");
  });

  it("builds a valid escrow release summary", () => {
    const milestone: Milestone = {
      id: "1",
      title: "Milestone 1",
      amount: "15000.0000000",
      status: "ready_for_release",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const summary = escrowMilestoneToSummary({
      milestone,
      adminPublicKey: SOURCE,
      destinationPublicKey: DEST,
    });
    expect(isTransactionSummaryValid(summary)).toBe(true);
    expect(summary.operation).toBe("escrow_release");
    expect(summary.asset?.type).toBe("native");
  });

  it("supports issued assets in payment summaries", () => {
    const intent: PaymentIntent = {
      sourcePublicKey: SOURCE,
      destinationPublicKey: DEST,
      asset: {
        type: "issued",
        code: "USDC" as AssetCode,
        issuer: DEST,
      },
      amount: "1.0000000",
    };
    const summary = paymentIntentToSummary({ intent });
    expect(isTransactionSummaryValid(summary)).toBe(true);
    expect(summary.asset?.type).toBe("issued");
  });
});
