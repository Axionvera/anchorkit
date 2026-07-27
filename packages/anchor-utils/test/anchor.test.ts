import { describe, it, expect } from "vitest";
import type {
  AnchorAssetConfig,
  DepositRequestMetadata,
  StellarPublicKey,
  WithdrawalRequestMetadata,
} from "@anchorkit/types";
import {
  parseDepositRequestMetadata,
  parseWithdrawalRequestMetadata,
  isDepositRequestValid,
  isWithdrawalRequestValid,
  validateAnchorAssetConfig,
  isAnchorAssetConfigValid,
  anchorStatusToUserMessage,
  anchorStatusBadge,
  validateCallbackUrl,
  isCallbackUrlValid,
  createMockAnchorTransactionRecord,
  buildDepositLifecycle,
  buildWithdrawalLifecycle,
  advanceAnchorTransactionStatus,
} from "../src";

const FRIENDBOT =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR" as StellarPublicKey;

const goodDeposit: DepositRequestMetadata = {
  assetCode: "XLM",
  amount: "100.0000000",
  account: FRIENDBOT,
  memo: "INV-42",
  memoType: "text",
  railId: "sepa_eu",
  type: "SEPA",
  emailAddress: "dev@example.com",
};

const goodWithdrawal: WithdrawalRequestMetadata = {
  assetCode: "USDC",
  amount: "50.25",
  account: FRIENDBOT,
  memo: "WITHDRAW-99",
  memoType: "text",
  railId: "ach_us",
  dest: "US123456789",
  destExtra: "ACCT-7",
  type: "ACH",
};

describe("Anchor deposit metadata validation", () => {
  it("accepts a complete valid deposit request", () => {
    const r = parseDepositRequestMetadata(goodDeposit);
    expect(r.success).toBe(true);
    expect(isDepositRequestValid(goodDeposit)).toBe(true);
  });

  it("rejects a deposit request with negative or zero amount", () => {
    const bad: DepositRequestMetadata = { ...goodDeposit, amount: "0" };
    expect(parseDepositRequestMetadata(bad).success).toBe(false);
    expect(isDepositRequestValid({ ...goodDeposit, amount: "-1" })).toBe(false);
  });

  it("rejects a deposit request without a valid Stellar account", () => {
    const bad: DepositRequestMetadata = {
      ...goodDeposit,
      account: "BADACCOUNT" as StellarPublicKey,
    };
    expect(parseDepositRequestMetadata(bad).success).toBe(false);
  });

  it("rejects an asset code longer than 12 chars", () => {
    const bad: DepositRequestMetadata = { ...goodDeposit, assetCode: "VERYLONGASSETCODE" };
    expect(parseDepositRequestMetadata(bad).success).toBe(false);
  });

  it("rejects a badly formatted email but accepts missing email (optional)", () => {
    expect(
      isDepositRequestValid({ ...goodDeposit, emailAddress: "not-an-email" })
    ).toBe(false);
    const withoutEmail = { ...goodDeposit };
    delete (withoutEmail as Partial<DepositRequestMetadata>).emailAddress;
    expect(isDepositRequestValid(withoutEmail)).toBe(true);
  });
});

describe("Anchor withdrawal metadata validation", () => {
  it("accepts a complete valid withdrawal request", () => {
    expect(parseWithdrawalRequestMetadata(goodWithdrawal).success).toBe(true);
    expect(isWithdrawalRequestValid(goodWithdrawal)).toBe(true);
  });

  it("rejects a withdrawal request missing the external dest field", () => {
    const bad = { ...goodWithdrawal };
    delete (bad as Partial<WithdrawalRequestMetadata>).dest;
    expect(parseWithdrawalRequestMetadata(bad).success).toBe(false);
  });

  it("rejects amount with more than 7 decimals", () => {
    expect(isWithdrawalRequestValid({ ...goodWithdrawal, amount: "0.00000001" })).toBe(false);
  });

  it("accepts a withdrawal without optional memo and railId", () => {
    const minimal = { ...goodWithdrawal };
    delete (minimal as Partial<WithdrawalRequestMetadata>).memo;
    delete (minimal as Partial<WithdrawalRequestMetadata>).memoType;
    delete (minimal as Partial<WithdrawalRequestMetadata>).railId;
    expect(isWithdrawalRequestValid(minimal)).toBe(true);
  });
});

describe("Anchor asset and callback URL validation", () => {
  it("accepts a valid anchor asset config with stellar schema and valid issuer", () => {
    const cfg: AnchorAssetConfig = {
      code: "USDC",
      issuer: FRIENDBOT,
      schema: "stellar",
      enabled: true,
      depositEnabled: true,
      withdrawalEnabled: true,
      depositMinAmount: "1",
      depositMaxAmount: "1000000",
      feeFixed: "0.01",
    };
    expect(validateAnchorAssetConfig(cfg).success).toBe(true);
    expect(isAnchorAssetConfigValid(cfg)).toBe(true);
  });

  it("rejects an asset config with a bad issuer public key", () => {
    const cfg: AnchorAssetConfig = {
      code: "USDC",
      issuer: "BAD" as StellarPublicKey,
      schema: "stellar",
      enabled: true,
      depositEnabled: true,
      withdrawalEnabled: true,
    };
    expect(isAnchorAssetConfigValid(cfg)).toBe(false);
  });

  it("accepts HTTPS and localhost callbacks but rejects random plain HTTP in production", () => {
    expect(isCallbackUrlValid("https://anchor.example/callback")).toBe(true);
    expect(isCallbackUrlValid("http://localhost:8080/callback")).toBe(true);
    expect(validateCallbackUrl("http://example.com/callback").success).toBe(false);
    expect(isCallbackUrlValid("not a url")).toBe(false);
  });
});

describe("Anchor status mapping", () => {
  it("anchorStatusToUserMessage produces headline + detail for every status and kind", () => {
    const statuses = [
      "pending_user",
      "pending_anchor",
      "pending_stellar",
      "completed",
      "failed",
      "refunded",
    ] as const;
    for (const s of statuses) {
      for (const k of ["deposit", "withdrawal"] as const) {
        const m = anchorStatusToUserMessage(s, k);
        expect(m.headline.length).toBeGreaterThan(0);
        expect(m.detail.length).toBeGreaterThan(0);
        expect(["info", "warning", "error", "success"]).toContain(m.severity);
      }
    }
    expect(anchorStatusToUserMessage("completed", "deposit").severity).toBe("success");
    expect(anchorStatusToUserMessage("failed", "withdrawal").severity).toBe("error");
  });

  it("anchorStatusBadge returns a human readable label with distinct tones per bucket", () => {
    expect(anchorStatusBadge("completed").tone).toBe("green");
    expect(anchorStatusBadge("failed").tone).toBe("red");
    expect(anchorStatusBadge("pending_user").tone).toBe("amber");
    expect(anchorStatusBadge("pending_stellar").tone).toBe("blue");
    expect(anchorStatusBadge("refunded").tone).toBe("amber");
    expect(anchorStatusBadge("completed").label).toBe("Completed");
  });
});

describe("Anchor lifecycle fixtures and status transitions", () => {
  it("buildDepositLifecycle returns 4 records covering all non-error statuses", () => {
    const recs = buildDepositLifecycle();
    expect(recs.length).toBe(4);
    expect(recs.map((r) => r.status)).toEqual([
      "pending_user",
      "pending_anchor",
      "pending_stellar",
      "completed",
    ]);
    for (const r of recs) {
      expect(r.kind).toBe("deposit");
      expect(r.assetCode).toBe("XLM");
    }
    expect(recs[3]!.completedAt).toBeDefined();
    expect(recs[3]!.stellarTransactionId).toBeDefined();
  });

  it("buildWithdrawalLifecycle includes failed and refunded terminal states", () => {
    const recs = buildWithdrawalLifecycle();
    const statuses = recs.map((r) => r.status);
    expect(statuses).toContain("failed");
    expect(statuses).toContain("refunded");
    const refunded = recs.find((r) => r.status === "refunded")!;
    expect(refunded.refunded).toBe(true);
  });

  it("createMockAnchorTransactionRecord idempotently propagates completedAt for terminal states", () => {
    const r = createMockAnchorTransactionRecord({
      id: "x",
      kind: "deposit",
      status: "completed",
      assetCode: "XLM",
      amountIn: "10",
      stellarAccount: FRIENDBOT,
    });
    expect(r.completedAt).toBeDefined();
    expect(r.status).toBe("completed");
    expect(r.id).toBe("x");
  });

  it("advanceAnchorTransactionStatus cycles through pending states then stays completed", () => {
    expect(advanceAnchorTransactionStatus("pending_user")).toBe("pending_anchor");
    expect(advanceAnchorTransactionStatus("pending_anchor")).toBe("pending_stellar");
    expect(advanceAnchorTransactionStatus("pending_stellar")).toBe("completed");
    expect(advanceAnchorTransactionStatus("completed")).toBe("completed");
    expect(advanceAnchorTransactionStatus("pending_user", "failed")).toBe("failed");
  });
});
