import { describe, it, expect } from "vitest";
import {
  createPaymentIntent,
  estimateTransactionReadinessSync,
  getReadinessState,
  mapReadinessToErrorCode,
} from "../src/intent";
import type { ReadinessState, ReadinessWarning } from "@anchorkit/types";
import {
  FRIENDBOT_PUBLIC_KEY,
  FRIENDBOT_PUBLIC_KEY_2,
  BALANCE_MODEL_KNOWN,
  BALANCE_MODEL_UNKNOWN,
} from "./fixtures";

const SRC = FRIENDBOT_PUBLIC_KEY_2;
const DST = FRIENDBOT_PUBLIC_KEY;

function intent(overrides: Partial<Parameters<typeof createPaymentIntent>[0]> = {}) {
  return createPaymentIntent({
    sourcePublicKey: SRC,
    destinationPublicKey: DST,
    asset: { type: "native", code: "XLM", issuer: null },
    amount: "10.0000000",
    ...overrides,
  });
}

describe("readiness engine — typed state", () => {
  it("returns 'ready' for a fully valid intent with no warnings", () => {
    const r = estimateTransactionReadinessSync(intent(), { network: "testnet" });
    expect(r.ready).toBe(true);
    expect(r.state).toBe<ReadinessState>("ready");
    expect(r.warnings).toHaveLength(0);
    expect(r.stages.every((s) => s.status === "pass")).toBe(true);
  });

  it("returns 'warnings' when only non-blocking warnings exist (same src/dest)", () => {
    const r = estimateTransactionReadinessSync(
      intent({ destinationPublicKey: SRC }),
      { network: "testnet" }
    );
    expect(r.ready).toBe(true);
    expect(r.state).toBe<ReadinessState>("warnings");
    const same = r.stages.find((s) => s.id === "account-dest");
    expect(same?.status).toBe("warn");
  });

  it("returns 'blocked' for an invalid asset/amount", () => {
    const badIntent = {
      sourcePublicKey: SRC,
      destinationPublicKey: DST,
      asset: { type: "native", code: "", issuer: null } as any,
      amount: "not-a-number",
    } as any;
    const r = estimateTransactionReadinessSync(badIntent, { network: "testnet" });
    expect(r.ready).toBe(false);
    expect(r.state).toBe<ReadinessState>("blocked");
    expect(r.stages.some((s) => s.id === "asset" && s.status === "fail")).toBe(true);
    expect(r.stages.some((s) => s.id === "amount" && s.status === "fail")).toBe(true);
  });

  it("returns 'unsafe-network' when mainnet is disabled", () => {
    const r = estimateTransactionReadinessSync(intent(), { network: "mainnet" });
    expect(r.state).toBe<ReadinessState>("unsafe-network");
    const net = r.stages.find((s) => s.id === "network");
    expect(net?.status).toBe("fail");
  });

  it("flags mainnet-disabled as unsafe-network even with other errors", () => {
    const badIntent = {
      sourcePublicKey: "bad-key",
      destinationPublicKey: DST,
      asset: { type: "native", code: "XLM", issuer: null },
      amount: "10.0000000",
    } as any;
    const r = estimateTransactionReadinessSync(badIntent, { network: "mainnet" });
    expect(r.state).toBe<ReadinessState>("unsafe-network");
    expect(r.stages.some((s) => s.id === "network" && s.status === "fail")).toBe(true);
  });
});

describe("readiness engine — funding/unfunded", () => {
  it("marks source unfunded as a warning stage", () => {
    const r = estimateTransactionReadinessSync(intent(), {
      network: "testnet",
      sourceAccountFunded: false,
    });
    expect(r.ready).toBe(true);
    const bal = r.stages.find((s) => s.id === "balance");
    expect(bal?.status).toBe("warn");
    expect(bal?.warnings.some((w) => w.code === "SOURCE_UNFUNDED")).toBe(true);
  });

  it("flags insufficient native funds as a blocking error", () => {
    const r = estimateTransactionReadinessSync(intent({ amount: "999.0000000" }), {
      network: "testnet",
      sourceBalances: BALANCE_MODEL_KNOWN,
    });
    expect(r.ready).toBe(false);
    const bal = r.stages.find((s) => s.id === "balance");
    expect(bal?.status).toBe("fail");
    expect(bal?.warnings.some((w) => w.code === "INSUFFICIENT_FUNDS")).toBe(true);
  });
});

describe("readiness helpers", () => {
  it("getReadinessState classifies warning-only input", () => {
    const ws: ReadinessWarning[] = [
      { code: "SAME_SOURCE_DEST", message: "x", severity: "warning" },
    ];
    expect(getReadinessState(ws)).toBe<ReadinessState>("warnings");
  });

  it("getReadinessState classifies mainnet-disabled as unsafe-network", () => {
    const ws: ReadinessWarning[] = [
      { code: "MAINNET_DISABLED", message: "x", severity: "error" },
    ];
    expect(getReadinessState(ws)).toBe<ReadinessState>("unsafe-network");
  });

  it("mapReadinessToErrorCode returns the first error code", () => {
    const ws: ReadinessWarning[] = [
      { code: "SOURCE_INVALID", message: "x", severity: "error" },
      { code: "AMOUNT_INVALID", message: "y", severity: "error" },
    ];
    expect(mapReadinessToErrorCode(ws)).toBe("SOURCE_INVALID");
  });

  it("mapReadinessToErrorCode returns UNKNOWN with no errors", () => {
    expect(mapReadinessToErrorCode([])).toBe("UNKNOWN");
  });
});
