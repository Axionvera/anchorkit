import { describe, it, expect } from "vitest";
import { Keypair } from "@stellar/stellar-base";
import { diagnoseAccount, diagnoseAccountInfo, computeReserve } from "../src/diagnostics";
import type { AccountInfo } from "@anchorkit/types";
import {
  FUNDED_ACCOUNT,
  FUNDED_ACCOUNT_INFO,
  UNFUNDED_ACCOUNT,
  UNFUNDED_ACCOUNT_INFO,
  NETWORK_ERROR_ACCOUNT_INFO,
} from "./fixtures";

const fundedKey = FUNDED_ACCOUNT;
const unfundedKey = UNFUNDED_ACCOUNT;

const fundedInfo = FUNDED_ACCOUNT_INFO;
const unfundedInfo = UNFUNDED_ACCOUNT_INFO;
const networkErrorInfo = NETWORK_ERROR_ACCOUNT_INFO;

describe("computeReserve", () => {
  it("computes minimum balance from subentry count", () => {
    const r = computeReserve(3);
    // Stellar's rule: (2 base entries + 3 subentries) * 0.5 XLM = 2.5
    expect(r.minimumBalanceXlm).toBe(2.5);
    expect(r.subentryCount).toBe(3);
    expect(r.entryCount).toBe(5);
    expect(r.baseReserve).toBe(0.5);
  });

  it("handles undefined subentry count", () => {
    // A bare account owns only the 2 base entries: 2 * 0.5 = 1 XLM
    expect(computeReserve(undefined).minimumBalanceXlm).toBe(1);
  });
});

describe("diagnoseAccountInfo (sync)", () => {
  it("maps funded account with reserve", () => {
    const d = diagnoseAccountInfo(fundedInfo);
    expect(d.state).toBe("funded");
    expect(d.isValidPublicKey).toBe(true);
    expect(d.expertUrl).toContain(fundedKey);
    expect(d.reserve?.minimumBalanceXlm).toBe(2.5);
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
