import { describe, it, expect } from "vitest";
import {
  createPaymentIntent,
  evaluateTransactionReadinessSync,
  evaluateTransactionReadiness,
} from "../src";
import type { AccountInfo, StellarAsset } from "@anchorkit/types";

const SOURCE_KEY = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";
const DEST_KEY = "GDQJUTQYK2MQ32ZGMMB7Q3UKTJLNTMZI2QYHW7OK2TK2DZI3X5IGQH6U";
const ISSUER_KEY = "GBBD47IF6LWK2P7MDEVSCWR7DPUWV3NY3DTQEVFL4TWVC5GIOTASHEXN";

const NATIVE_ASSET: StellarAsset = { type: "native", code: "XLM", issuer: null };
const ISSUED_ASSET: StellarAsset = { type: "issued", code: "USDC" as any, issuer: ISSUER_KEY as any };

describe("Transaction Readiness Pipeline", () => {
  it("returns VALID state when all stages pass with funded accounts", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "10.0000000",
      memo: { type: "text", value: "Invoice #1" },
    });

    const result = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: true,
      destAccountFunded: true,
      sourceBalanceXlm: "100.0000000",
    });

    expect(result.state).toBe("valid");
    expect(result.ready).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.stages.network.state).toBe("valid");
    expect(result.stages.account.state).toBe("valid");
    expect(result.stages.asset.state).toBe("valid");
    expect(result.stages.amount.state).toBe("valid");
    expect(result.stages.memo.state).toBe("valid");
    expect(result.summary).toContain("VALID");
  });

  it("returns INVALID state when source public key format is malformed", () => {
    const intent: any = {
      sourcePublicKey: "INVALID_KEY",
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "10.0000000",
    };

    const result = evaluateTransactionReadinessSync(intent);

    expect(result.state).toBe("invalid");
    expect(result.ready).toBe(false);
    expect(result.stages.account.state).toBe("invalid");
    expect(result.issues.some((i) => i.code === "SOURCE_INVALID")).toBe(true);
    expect(result.summary).toContain("INVALID");
  });

  it("returns INVALID state when payment amount format is invalid", () => {
    const intent: any = {
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "invalid_amount",
    };

    const result = evaluateTransactionReadinessSync(intent);

    expect(result.state).toBe("invalid");
    expect(result.ready).toBe(false);
    expect(result.stages.amount.state).toBe("invalid");
    expect(result.issues.some((i) => i.code === "AMOUNT_INVALID")).toBe(true);
  });

  it("returns BLOCKED state when source account is unfunded", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "10.0000000",
    });

    const result = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: false,
    });

    expect(result.state).toBe("blocked");
    expect(result.ready).toBe(false);
    expect(result.stages.account.state).toBe("blocked");
    expect(result.issues.some((i) => i.code === "SOURCE_UNFUNDED")).toBe(true);
  });

  it("returns BLOCKED state when source XLM balance is insufficient for amount + reserve", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "10.0000000",
    });

    const result = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: true,
      sourceBalanceXlm: "11.0000000", // Needs 10.0 + reserve (min 2.5) = 12.5 XLM
    });

    expect(result.state).toBe("blocked");
    expect(result.ready).toBe(false);
    expect(result.issues.some((i) => i.code === "INSUFFICIENT_BALANCE")).toBe(true);
  });

  it("returns BLOCKED state when destination is unfunded for an issued asset", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: ISSUED_ASSET,
      amount: "10.0000000",
    });

    const result = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: true,
      destAccountFunded: false,
    });

    expect(result.state).toBe("blocked");
    expect(result.ready).toBe(false);
    expect(result.issues.some((i) => i.code === "DEST_UNFUNDED_TRUSTLINE")).toBe(true);
  });

  it("returns BLOCKED state when mainnet mode is requested but not allowed in config", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "10.0000000",
    });

    const result = evaluateTransactionReadinessSync(intent, {
      network: "mainnet",
      sourceAccountFunded: true,
    });

    expect(result.state).toBe("blocked");
    expect(result.ready).toBe(false);
    expect(result.stages.network.state).toBe("blocked");
    expect(result.issues.some((i) => i.code === "MAINNET_DISABLED")).toBe(true);
  });

  it("returns WARNING state when destination account is unfunded for XLM native payment", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "10.0000000",
    });

    const result = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: true,
      destAccountFunded: false,
    });

    expect(result.state).toBe("warning");
    expect(result.ready).toBe(true);
    expect(result.issues.some((i) => i.code === "DEST_UNFUNDED")).toBe(true);
  });

  it("returns WARNING state when source and destination public keys are identical", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: SOURCE_KEY,
      asset: NATIVE_ASSET,
      amount: "10.0000000",
    });

    const result = evaluateTransactionReadinessSync(intent, {
      sourceAccountFunded: true,
    });

    expect(result.state).toBe("warning");
    expect(result.ready).toBe(true);
    expect(result.issues.some((i) => i.code === "SAME_SOURCE_DEST")).toBe(true);
  });

  it("returns UNAVAILABLE state when source diagnostic resolution fails", () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "10.0000000",
    });

    const unavailableDiagnostic: any = {
      input: SOURCE_KEY,
      state: "unavailable",
      isValidPublicKey: true,
      expertUrl: null,
      reserve: null,
      account: null,
      error: "Horizon node unreachable",
    };

    const result = evaluateTransactionReadinessSync(intent, {
      sourceDiagnostic: unavailableDiagnostic,
    });

    expect(result.state).toBe("unavailable");
    expect(result.ready).toBe(false);
    expect(result.stages.account.state).toBe("unavailable");
    expect(result.issues.some((i) => i.code === "SOURCE_UNAVAILABLE")).toBe(true);
  });

  it("async evaluateTransactionReadiness resolves account diagnostics using custom loader", async () => {
    const intent = createPaymentIntent({
      sourcePublicKey: SOURCE_KEY,
      destinationPublicKey: DEST_KEY,
      asset: NATIVE_ASSET,
      amount: "5.0000000",
    });

    const mockLoader = async (pk: string): Promise<AccountInfo> => ({
      publicKey: pk as any,
      status: "funded",
      balances: { native: "500.0000000", assets: [] },
      subentryCount: 0,
    });

    const result = await evaluateTransactionReadiness(intent, {
      network: "testnet",
      loadAccount: mockLoader,
    });

    expect(result.state).toBe("valid");
    expect(result.ready).toBe(true);
    expect(result.sourceDiagnostic).toBeDefined();
    expect(result.destDiagnostic).toBeDefined();
  });
});
