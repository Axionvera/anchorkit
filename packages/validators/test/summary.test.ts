/**
 * TransactionSummary schema tests (issue #90).
 */

import { describe, it, expect } from "vitest";
import { TransactionSummarySchema } from "../src/schemas/summary";

const validSummary = {
  id: "sum_1",
  operation: "payment",
  source: "payment",
  network: "testnet",
  headline: "Review payment",
  parties: [
    {
      role: "source",
      label: "Source",
      publicKey: "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
    },
  ],
  amount: "10.0000000",
  asset: { type: "native", code: "XLM", issuer: null },
  feeEstimate: { source: "unavailable", note: "Not estimated." },
  riskNotes: [],
};

describe("TransactionSummarySchema", () => {
  it("accepts a valid payment summary", () => {
    expect(TransactionSummarySchema.safeParse(validSummary).success).toBe(true);
  });

  it("accepts risk notes and optional memo", () => {
    const withNotes = {
      ...validSummary,
      memo: { type: "text", value: "Invoice" },
      riskNotes: [
        { code: "MAINNET_DISABLED", message: "Mainnet blocked.", severity: "error" },
      ],
    };
    expect(TransactionSummarySchema.safeParse(withNotes).success).toBe(true);
  });

  it("rejects an empty id", () => {
    expect(TransactionSummarySchema.safeParse({ ...validSummary, id: "" }).success).toBe(false);
  });

  it("rejects an unknown operation", () => {
    expect(
      TransactionSummarySchema.safeParse({ ...validSummary, operation: "swap" }).success
    ).toBe(false);
  });

  it("rejects missing riskNotes array", () => {
    const { riskNotes: _omit, ...rest } = validSummary;
    expect(TransactionSummarySchema.safeParse(rest).success).toBe(false);
  });
});
