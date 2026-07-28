import { describe, it, expect } from "vitest";
import { estimateTransactionReadinessSync } from "../src/intent";
import type { PaymentIntent } from "@anchorkit/types";
import { DEFAULT_ENV_CONFIG } from "@anchorkit/config";

const VALID_INTENT: PaymentIntent = {
  sourcePublicKey: "GA2C5RFPE6GCKMY3K7AIGZ5ZBBX26Z5B3E6G7V4MMSZ5L2R5YHMBFQJJ",
  destinationPublicKey: "GBMFNDXCRSOD7Y7FW5WJ6TZ6MMHCYQJK76Y5QM5T2DJG7QX4LM4LMFTO",
  asset: { type: "native", code: "XLM", issuer: null },
  amount: "10.0000000",
};

describe("Mainnet-risk prevention — payment readiness (sync)", () => {
  it("produces no MAINNET_DISABLED warning for testnet by default", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT);
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });

  it("produces no MAINNET_DISABLED warning for testnet explicitly", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "testnet",
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });

  it("produces no MAINNET_DISABLED warning for futurenet", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "futurenet",
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });

  it("produces MAINNET_DISABLED error warning for mainnet with default config", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "mainnet",
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(1);
    expect(mainnetWarnings[0]!.severity).toBe("error");
    expect(mainnetWarnings[0]!.message).toContain("Mainnet mode is disabled by default");
  });

  it("mainnet warning makes readiness false", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "mainnet",
    });
    expect(result.ready).toBe(false);
  });

  it("produces no MAINNET_DISABLED warning for mainnet when allowMainnet is true", () => {
    const result = estimateTransactionReadinessSync(VALID_INTENT, {
      network: "mainnet",
      envConfig: { ...DEFAULT_ENV_CONFIG, allowMainnet: true },
    });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });

  it("defaults to env config defaultNetwork when no network specified", () => {
    const envConfig = { ...DEFAULT_ENV_CONFIG, defaultNetwork: "testnet" as const };
    const result = estimateTransactionReadinessSync(VALID_INTENT, { envConfig });
    const mainnetWarnings = result.warnings.filter((w) => w.code === "MAINNET_DISABLED");
    expect(mainnetWarnings).toHaveLength(0);
  });
});
