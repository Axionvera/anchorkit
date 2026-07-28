import { describe, it, expect } from "vitest";
import { Keypair } from "@stellar/stellar-base";
import {
  BASE_ENTRY_COUNT,
  STELLAR_BASE_RESERVE_XLM,
  computeBalanceModel,
  computeReserve,
  unknownBalanceModel,
} from "../src/balances";
import { estimateTransactionReadinessSync } from "../src/intent";
import type { AccountInfo, PaymentIntent, StellarAsset } from "@anchorkit/types";
import { BALANCE_MODEL_UNKNOWN, NATIVE_ASSET, makeFakeKeypair } from "./fixtures";

const key = () => makeFakeKeypair().publicKey as AccountInfo["publicKey"];

const NATIVE: StellarAsset = NATIVE_ASSET;

function fundedInfo(native: string, subentryCount = 0): AccountInfo {
  return {
    publicKey: key(),
    status: "funded",
    sequence: "1",
    subentryCount,
    balances: { native, assets: [] },
  };
}

function intentFor(amount: string, asset: StellarAsset = NATIVE): PaymentIntent {
  return {
    sourcePublicKey: key(),
    destinationPublicKey: key(),
    asset,
    amount,
  };
}

describe("computeReserve", () => {
  it("applies Stellar's (2 + subentries) x base reserve rule", () => {
    expect(computeReserve(0).minimumBalanceXlm).toBe(1);
    expect(computeReserve(1).minimumBalanceXlm).toBe(1.5);
    expect(computeReserve(3).minimumBalanceXlm).toBe(2.5);
    expect(BASE_ENTRY_COUNT).toBe(2);
    expect(STELLAR_BASE_RESERVE_XLM).toBe(0.5);
  });

  it("does not charge the base entries twice in its explanation", () => {
    const r = computeReserve(3);
    // The old explanation read "2 base reserve + 5 entries x 0.5", counting the
    // two base entries both as a flat charge and inside the entry count.
    expect(r.explanation).toContain("2.5 XLM");
    expect(r.explanation).toContain("5 ledger entries");
    expect(r.explanation).not.toMatch(/2 base reserve/);
  });
});

describe("computeBalanceModel — funded", () => {
  it("splits total into spendable and unavailable", () => {
    const m = computeBalanceModel(fundedInfo("100", 3));
    expect(m.state).toBe("known");
    expect(m.total).toBe("100.0000000");
    expect(m.reserve).toBe("2.5000000");
    expect(m.spendable).toBe("97.5000000");
    expect(m.unavailable).toBe("2.5000000");
  });

  it("keeps spendable + unavailable equal to total", () => {
    for (const [native, subs] of [
      ["100", 3],
      ["1.5", 0],
      ["0.25", 2],
      ["12345.6789012", 7],
    ] as const) {
      const m = computeBalanceModel(fundedInfo(native, subs));
      expect(Number(m.spendable) + Number(m.unavailable)).toBeCloseTo(Number(m.total), 7);
    }
  });
});

describe("computeBalanceModel — low balance", () => {
  it("clamps spendable at zero instead of reporting a negative amount", () => {
    // 0.5 XLM held against a 1 XLM minimum balance.
    const m = computeBalanceModel(fundedInfo("0.5", 0));
    expect(m.state).toBe("known");
    expect(m.spendable).toBe("0.0000000");
    expect(Number(m.spendable)).toBeGreaterThanOrEqual(0);
    expect(m.unavailable).toBe("0.5000000");
    expect(m.total).toBe("0.5000000");
  });
});

describe("computeBalanceModel — unfunded", () => {
  it("reports zero rather than unknown, and states what the account needs", () => {
    const m = computeBalanceModel({ publicKey: key(), status: "unfunded" });
    expect(m.state).toBe("known");
    expect(m.total).toBe("0.0000000");
    expect(m.spendable).toBe("0.0000000");
    expect(m.explanation).toContain("not funded");
  });
});

describe("computeBalanceModel — unknown", () => {
  const cases: Array<[string, AccountInfo]> = [
    ["network error", { publicKey: key(), status: "unknown", error: "timed out" }],
    ["errored lookup", { publicKey: key(), status: "error", error: "boom" }],
    ["funded without balances", { publicKey: key(), status: "funded", subentryCount: 2 }],
  ];

  for (const [label, info] of cases) {
    it(`carries no amounts at all for a ${label}`, () => {
      const m = computeBalanceModel(info);
      expect(m.state).toBe("unknown");
      expect(m.total).toBeNull();
      expect(m.reserve).toBeNull();
      expect(m.spendable).toBeNull();
      expect(m.unavailable).toBeNull();
      // An unavailable balance must never be dressed up as a figure.
      expect(m.explanation).not.toMatch(/\d/);
    });
  }

  it("treats an unparseable balance as unknown rather than zero", () => {
    const m = computeBalanceModel(fundedInfo("not-a-number", 0));
    expect(m.state).toBe("unknown");
    expect(m.spendable).toBeNull();
  });

  it("exposes a helper that never carries amounts", () => {
    expect(unknownBalanceModel("no data").spendable).toBeNull();
  });
});

describe("payment readiness uses spendable balance", () => {
  it("blocks a payment above the spendable balance", () => {
    const r = estimateTransactionReadinessSync(intentFor("99"), {
      sourceBalances: computeBalanceModel(fundedInfo("100", 3)), // spendable 97.5
    });
    const w = r.warnings.find((x) => x.code === "INSUFFICIENT_FUNDS");
    expect(w).toBeDefined();
    expect(w?.severity).toBe("error");
    expect(r.ready).toBe(false);
  });

  it("allows a payment within the spendable balance", () => {
    const r = estimateTransactionReadinessSync(intentFor("97"), {
      sourceBalances: computeBalanceModel(fundedInfo("100", 3)),
    });
    expect(r.warnings.find((x) => x.code === "INSUFFICIENT_FUNDS")).toBeUndefined();
    expect(r.ready).toBe(true);
  });

  it("would pass the reserve-only check but fails on the amount it cannot cover", () => {
    // 98 XLM held, 2.5 locked: the raw balance covers the payment, the
    // spendable balance does not.
    const r = estimateTransactionReadinessSync(intentFor("97.6"), {
      sourceBalances: computeBalanceModel(fundedInfo("98", 3)), // spendable 95.5
    });
    expect(r.ready).toBe(false);
  });

  it("never raises an error when the balance is unknown", () => {
    const r = estimateTransactionReadinessSync(intentFor("99"), {
      sourceBalances: unknownBalanceModel("Account data is unavailable."),
    });
    expect(r.warnings.find((x) => x.code === "INSUFFICIENT_FUNDS")).toBeUndefined();
    const info = r.warnings.find((x) => x.code === "SPENDABLE_UNKNOWN");
    expect(info?.severity).toBe("info");
    expect(r.ready).toBe(true);
  });

  it("does not apply the XLM reserve to an issued-asset payment", () => {
    const issued: StellarAsset = {
      type: "issued",
      code: "USDC" as never,
      issuer: Keypair.random().publicKey() as never,
    };
    const r = estimateTransactionReadinessSync(intentFor("99", issued), {
      sourceBalances: computeBalanceModel(fundedInfo("100", 3)),
    });
    expect(r.warnings.find((x) => x.code === "INSUFFICIENT_FUNDS")).toBeUndefined();
  });

  it("is opt-in: omitting the balance model leaves readiness unchanged", () => {
    const r = estimateTransactionReadinessSync(intentFor("99"));
    expect(r.warnings.find((x) => x.code === "INSUFFICIENT_FUNDS")).toBeUndefined();
    expect(r.warnings.find((x) => x.code === "SPENDABLE_UNKNOWN")).toBeUndefined();
    expect(r.ready).toBe(true);
  });
});
