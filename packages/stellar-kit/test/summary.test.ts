import { describe, it, expect } from "vitest";
import type {
  AnchorTransactionRecord,
  AssetCode,
  DepositRequestMetadata,
  Milestone,
  PaymentIntent,
  StellarPublicKey,
  TransactionSummaryOperation,
  WithdrawalRequestMetadata,
} from "@anchorkit/types";
import {
  anchorRecordToSummary,
  anchorRequestToSummary,
  buildTransactionSummary,
  buildTransactionSummaryFixtures,
  createMockTransactionSummary,
  escrowMilestoneToSummary,
  isTransactionSummaryOperation,
  isTransactionSummaryValid,
  parseTransactionSummary,
  paymentIntentToSummary,
} from "../src/summary";
import { FRIENDBOT_PUBLIC_KEY, FRIENDBOT_PUBLIC_KEY_2 } from "./fixtures";

const SOURCE = FRIENDBOT_PUBLIC_KEY as StellarPublicKey;
const DEST = FRIENDBOT_PUBLIC_KEY_2 as StellarPublicKey;

const validIntent: PaymentIntent = {
  sourcePublicKey: SOURCE,
  destinationPublicKey: DEST,
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "25.0000000",
  memo: { type: "text", value: "Invoice #90" },
};

describe("isTransactionSummaryOperation", () => {
  it("accepts known operations", () => {
    expect(isTransactionSummaryOperation("payment")).toBe(true);
    expect(isTransactionSummaryOperation("anchor_deposit")).toBe(true);
  });

  it("rejects unknown operations", () => {
    expect(isTransactionSummaryOperation("swap")).toBe(false);
  });
});

describe("buildTransactionSummary", () => {
  it("defaults network to testnet and fee to unavailable", () => {
    const summary = buildTransactionSummary({
      id: "sum_1",
      operation: "payment",
      source: "payment",
      parties: [],
    });
    expect(summary.network).toBe("testnet");
    expect(summary.feeEstimate?.source).toBe("unavailable");
    expect(summary.riskNotes).toEqual([]);
    expect(summary.headline).toBe("Review payment");
  });

  it("maps readiness-style risk notes", () => {
    const summary = buildTransactionSummary({
      id: "sum_2",
      operation: "payment",
      source: "payment",
      riskNotes: [
        {
          code: "MAINNET_DISABLED",
          message: "Mainnet submissions are disabled.",
          severity: "error",
        },
      ],
    });
    expect(summary.riskNotes).toHaveLength(1);
    expect(summary.riskNotes[0]?.code).toBe("MAINNET_DISABLED");
  });
});

describe("paymentIntentToSummary", () => {
  it("maps parties, amount, asset, memo, and network", () => {
    const summary = paymentIntentToSummary({
      intent: validIntent,
      network: "testnet",
    });
    expect(summary.operation).toBe("payment");
    expect(summary.source).toBe("payment");
    expect(summary.amount).toBe("25.0000000");
    expect(summary.asset).toEqual(validIntent.asset);
    expect(summary.memo).toEqual(validIntent.memo);
    expect(summary.parties).toHaveLength(2);
    expect(summary.parties[0]?.publicKey).toBe(SOURCE);
    expect(summary.parties[1]?.publicKey).toBe(DEST);
    expect(summary.feeEstimate?.source).toBe("unavailable");
  });

  it("supports issued assets without memo", () => {
    const intent: PaymentIntent = {
      ...validIntent,
      asset: {
        type: "issued",
        code: "USDC" as AssetCode,
        issuer: DEST,
      },
      memo: undefined,
    };
    const summary = paymentIntentToSummary({ intent });
    expect(summary.asset?.type).toBe("issued");
    expect(summary.memo).toBeUndefined();
    expect(summary.detail).toContain("USDC");
  });
});

describe("anchorRequestToSummary", () => {
  const deposit: DepositRequestMetadata = {
    assetCode: "USDC",
    amount: "100.0000000",
    account: SOURCE,
    type: "bank_account",
    railId: "sepa_eu",
  };

  const withdraw: WithdrawalRequestMetadata = {
    assetCode: "USDC",
    amount: "50.0000000",
    account: SOURCE,
    dest: "DE89370400440532013000",
    type: "bank_account",
    railId: "sepa_eu",
    memo: "WD-1",
    memoType: "text",
  };

  it("builds a deposit summary with config fee", () => {
    const summary = anchorRequestToSummary({
      kind: "deposit",
      request: deposit,
      assetConfig: {
        code: "USDC",
        issuer: DEST,
        feeFixed: "0.1000000",
      },
    });
    expect(summary.operation).toBe("anchor_deposit");
    expect(summary.feeEstimate?.source).toBe("anchor_config");
    expect(summary.feeEstimate?.amount).toBe("0.1000000");
    expect(summary.asset?.type).toBe("issued");
    expect(summary.metadata?.railId).toBe("sepa_eu");
  });

  it("builds a withdrawal summary with off-ramp destination", () => {
    const summary = anchorRequestToSummary({
      kind: "withdrawal",
      request: withdraw,
    });
    expect(summary.operation).toBe("anchor_withdrawal");
    expect(summary.parties.some((p) => p.role === "destination")).toBe(true);
    expect(summary.memo?.value).toBe("WD-1");
    expect(summary.feeEstimate?.source).toBe("unavailable");
  });
});

describe("anchorRecordToSummary", () => {
  it("copies feeAmount from the record when present", () => {
    const record: AnchorTransactionRecord = {
      id: "anch_1",
      kind: "deposit",
      status: "pending_user",
      assetCode: "USDC",
      amountIn: "10.0000000",
      feeAmount: "0.0500000",
      stellarAccount: SOURCE,
      startedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      metadata: {},
    };
    const summary = anchorRecordToSummary({ record });
    expect(summary.operation).toBe("anchor_deposit");
    expect(summary.feeEstimate?.source).toBe("anchor_record");
    expect(summary.feeEstimate?.amount).toBe("0.0500000");
  });
});

describe("escrowMilestoneToSummary", () => {
  const milestone: Milestone = {
    id: "ms_1",
    title: "Design delivery",
    amount: "500.0000000",
    status: "ready_for_release",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  it("maps milestone amount and parties", () => {
    const summary = escrowMilestoneToSummary({
      milestone,
      adminPublicKey: SOURCE,
      destinationPublicKey: DEST,
      riskNotes: [
        {
          code: "ESCROW_MOCK_ONLY",
          message: "Escrow release is simulated in the MVP dashboard.",
          severity: "warning",
        },
      ],
    });
    expect(summary.operation).toBe("escrow_release");
    expect(summary.amount).toBe("500.0000000");
    expect(summary.asset?.type).toBe("native");
    expect(summary.parties).toHaveLength(2);
    expect(summary.riskNotes[0]?.code).toBe("ESCROW_MOCK_ONLY");
  });
});

describe("parseTransactionSummary", () => {
  it("parses a valid summary", () => {
    const mock = createMockTransactionSummary({ operation: "payment" });
    const result = parseTransactionSummary(mock);
    expect(result.success).toBe(true);
  });

  it("rejects invalid summaries", () => {
    expect(parseTransactionSummary({ id: "" }).success).toBe(false);
    expect(isTransactionSummaryValid({})).toBe(false);
  });
});

describe("buildTransactionSummaryFixtures", () => {
  it("returns one fixture per operation", () => {
    const fixtures = buildTransactionSummaryFixtures("testnet");
    expect(fixtures).toHaveLength(5);
    const ops = new Set(fixtures.map((f) => f.operation));
    expect(ops.size).toBe(5);
    for (const op of [
      "payment",
      "anchor_deposit",
      "anchor_withdrawal",
      "escrow_release",
      "other",
    ] as TransactionSummaryOperation[]) {
      expect(ops.has(op)).toBe(true);
    }
  });
});
