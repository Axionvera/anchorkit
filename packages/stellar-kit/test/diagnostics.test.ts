import { describe, it, expect } from "vitest";
import { Keypair } from "@stellar/stellar-base";
import { diagnoseAccount, diagnoseAccountInfo, computeReserve } from "../src/diagnostics";
import type { AccountInfo } from "@anchorkit/types";

const fundedKey = Keypair.random().publicKey();
const unfundedKey = Keypair.random().publicKey();

const fundedInfo: AccountInfo = {
  publicKey: fundedKey as AccountInfo["publicKey"],
  status: "funded",
  sequence: "123",
  subentryCount: 3,
  balances: { native: "100", assets: [] },
};

const unfundedInfo: AccountInfo = {
  publicKey: unfundedKey as AccountInfo["publicKey"],
  status: "unfunded",
};

const networkErrorInfo: AccountInfo = {
  publicKey: fundedKey as AccountInfo["publicKey"],
  status: "unknown",
  error: "request timed out",
};

describe("computeReserve", () => {
  it("computes minimum balance from subentry count", () => {
    const r = computeReserve(3);
    // 2 + (3 + 2) * 0.5 = 4.5
    expect(r.minimumBalanceXlm).toBe(4.5);
    expect(r.subentryCount).toBe(3);
  });

  it("handles undefined subentry count", () => {
    expect(computeReserve(undefined).minimumBalanceXlm).toBe(3);
  });
});

describe("diagnoseAccountInfo (sync)", () => {
  it("maps funded account with reserve", () => {
    const d = diagnoseAccountInfo(fundedInfo);
    expect(d.state).toBe("funded");
    expect(d.isValidPublicKey).toBe(true);
    expect(d.expertUrl).toContain(fundedKey);
    expect(d.reserve?.minimumBalanceXlm).toBe(4.5);
  });

  it("maps unfunded account without reserve", () => {
    const d = diagnoseAccountInfo(unfundedInfo);
    expect(d.state).toBe("unfunded");
    expect(d.reserve).toBeNull();
    expect(d.expertUrl).toContain(unfundedKey);
  });

  it("maps network error to unavailable", () => {
    const d = diagnoseAccountInfo(networkErrorInfo);
    expect(d.state).toBe("unavailable");
    expect(d.error).toBe("request timed out");
  });
});

describe("diagnoseAccount (async)", () => {
  it("returns invalid for a bad key without calling loader", () => {
    let called = false;
    const loader = async () => {
      called = true;
      return fundedInfo;
    };
    return diagnoseAccount("not-a-key", { loadAccount: loader }).then((d) => {
      expect(called).toBe(false);
      expect(d.state).toBe("invalid");
      expect(d.isValidPublicKey).toBe(false);
      expect(d.expertUrl).toBeNull();
    });
  });

  it("diagnoses a funded account via injected loader", () => {
    return diagnoseAccount(fundedKey, { loadAccount: async () => fundedInfo }).then((d) => {
      expect(d.state).toBe("funded");
      expect(d.reserve).not.toBeNull();
    });
  });

  it("diagnoses an unfunded account via injected loader", () => {
    return diagnoseAccount(unfundedKey, { loadAccount: async () => unfundedInfo }).then((d) => {
      expect(d.state).toBe("unfunded");
    });
  });

  it("falls back to unavailable on loader throw (network error)", () => {
    const loader = async () => {
      throw new Error("network down");
    };
    return diagnoseAccount(fundedKey, { loadAccount: loader }).then((d) => {
      expect(d.state).toBe("unavailable");
      expect(d.error).toBe("network down");
    });
  });
});
