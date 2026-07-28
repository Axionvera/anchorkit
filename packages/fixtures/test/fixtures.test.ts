/**
 * Smoke tests for @anchorkit/fixtures (issue #59).
 *
 * These are intentionally shallow: they confirm every fixture module exports
 * values with the expected shape and that "invalid" fixtures really are
 * defined (not asserting full schema validation here — that's covered by
 * `@anchorkit/validators` tests that consume these fixtures).
 */

import { describe, it, expect } from "vitest";
import * as fixtures from "../src/index";

describe("constants", () => {
  it("exports well-formed Stellar public keys and a tx hash", () => {
    expect(fixtures.FRIENDBOT_PUBLIC_KEY).toMatch(/^G[A-Z2-7]{55}$/);
    expect(fixtures.DEMO_FUNDED_PUBLIC_KEY).toMatch(/^G[A-Z2-7]{55}$/);
    expect(fixtures.DEMO_UNFUNDED_PUBLIC_KEY).toMatch(/^G[A-Z2-7]{55}$/);
    expect(fixtures.SAMPLE_TX_HASH).toMatch(/^[0-9a-f]{64}$/);
    expect(fixtures.ESCROW_CONTRACT_ID.length).toBeGreaterThan(0);
  });
});

describe("assets", () => {
  it("sampleNativeAsset is a native XLM asset", () => {
    expect(fixtures.sampleNativeAsset).toEqual({ type: "native", code: "XLM", issuer: null });
  });

  it("sampleIssuedAsset has a code and issuer", () => {
    expect(fixtures.sampleIssuedAsset.type).toBe("issued");
    expect(fixtures.sampleIssuedAsset.code).toBe("USDC");
    expect(fixtures.sampleIssuedAsset.issuer).toMatch(/^G[A-Z2-7]{55}$/);
  });
});

describe("accounts", () => {
  it("fundedAccounts are all status funded with a native balance", () => {
    expect(fixtures.fundedAccounts.length).toBeGreaterThan(0);
    for (const account of fixtures.fundedAccounts) {
      expect(account.status).toBe("funded");
      expect(account.balances?.native).toBeDefined();
    }
  });

  it("unfundedAccounts are all status unfunded with no balances", () => {
    expect(fixtures.unfundedAccounts.length).toBeGreaterThan(0);
    for (const account of fixtures.unfundedAccounts) {
      expect(account.status).toBe("unfunded");
      expect(account.balances).toBeUndefined();
    }
  });
});

describe("payments", () => {
  it("samplePaymentIntent has the required PaymentIntent keys", () => {
    expect(fixtures.samplePaymentIntent).toMatchObject({
      sourcePublicKey: expect.any(String),
      destinationPublicKey: expect.any(String),
      asset: expect.any(Object),
      amount: expect.any(String),
    });
  });

  it("invalidPaymentIntent is defined and structurally broken", () => {
    expect(fixtures.invalidPaymentIntent).toBeDefined();
    const intent = fixtures.invalidPaymentIntent as Record<string, unknown>;
    expect(intent.sourcePublicKey).toBe("BAD-KEY-TOO-SHORT");
  });
});

describe("anchors", () => {
  it("sampleDepositRequest / sampleWithdrawalRequest have expected keys", () => {
    expect(fixtures.sampleDepositRequest).toMatchObject({
      assetCode: expect.any(String),
      amount: expect.any(String),
      account: expect.any(String),
      type: expect.any(String),
    });
    expect(fixtures.sampleWithdrawalRequest).toMatchObject({
      assetCode: expect.any(String),
      amount: expect.any(String),
      account: expect.any(String),
      dest: expect.any(String),
      type: expect.any(String),
    });
  });

  it("buildDepositLifecycle returns 4 deterministic records", () => {
    const first = fixtures.buildDepositLifecycle();
    const second = fixtures.buildDepositLifecycle();
    expect(first).toHaveLength(4);
    expect(first).toEqual(second);
    expect(first.map((r) => r.status)).toEqual([
      "pending_user",
      "pending_anchor",
      "pending_stellar",
      "completed",
    ]);
  });

  it("buildWithdrawalLifecycle returns 5 deterministic records including failed/refunded", () => {
    const first = fixtures.buildWithdrawalLifecycle();
    const second = fixtures.buildWithdrawalLifecycle();
    expect(first).toHaveLength(5);
    expect(first).toEqual(second);
    expect(first.map((r) => r.status)).toContain("failed");
    expect(first.map((r) => r.status)).toContain("refunded");
  });
});

describe("escrow", () => {
  it("allEscrowEventsRaw covers every escrow event type", () => {
    expect(fixtures.allEscrowEventsRaw).toHaveLength(6);
    const types = fixtures.allEscrowEventsRaw.map((e) => e.topic[0]);
    expect(types).toEqual([
      "milestone_created",
      "evidence_submitted",
      "approved",
      "disputed",
      "ready_for_release",
      "released",
    ]);
  });

  it("sampleMilestoneLifecycle covers the full milestone state DAG", () => {
    const milestones = fixtures.sampleMilestoneLifecycle();
    const statuses = milestones.map((m) => m.status);
    expect(statuses).toEqual([
      "draft",
      "active",
      "evidence_submitted",
      "approved",
      "ready_for_release",
      "released",
      "disputed",
    ]);
  });
});

describe("diagnostics", () => {
  it("exports funded/unfunded/unavailable AccountInfo fixtures", () => {
    expect(fixtures.diagnosticsFundedAccountInfo.status).toBe("funded");
    expect(fixtures.diagnosticsUnfundedAccountInfo.status).toBe("unfunded");
    expect(fixtures.diagnosticsUnavailableAccountInfo.status).toBe("unknown");
    expect(fixtures.diagnosticsUnavailableAccountInfo.error).toBeDefined();
  });
});

describe("invalid", () => {
  it("every invalid fixture is defined", () => {
    expect(fixtures.invalidDepositRequest).toBeDefined();
    expect(fixtures.invalidWithdrawalRequest).toBeDefined();
    expect(fixtures.invalidAnchorAssetConfig).toBeDefined();
    expect(fixtures.invalidCallbackUrl).toBe("http://example.com/callback");
    expect(fixtures.invalidAmount).toBe("0.0000000001");
  });

  it("contains no string that looks like a real 56-char S-prefixed secret with a non-placeholder body", () => {
    const serialized = JSON.stringify(fixtures);
    const secretLike = serialized.match(/"S[A-Z2-7]{55}"/g) ?? [];
    expect(secretLike).toHaveLength(0);
  });
});
