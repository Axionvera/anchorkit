import { describe, it, expect } from "vitest";
import {
  validateAmount,
  isAmountValid,
  compareAmounts,
  normalizeAmount,
  validateMemo,
  isMemoValid,
  createTextMemo,
  createIdMemo,
  createEmptyMemo,
  memoLengthTextBytes,
} from "../src";

describe("Amount validation", () => {
  it("accepts zero-decimal integers and amounts up to 7 decimals", () => {
    expect(isAmountValid("1")).toBe(true);
    expect(isAmountValid("100")).toBe(true);
    expect(isAmountValid("1.5")).toBe(true);
    expect(isAmountValid("1.1234567")).toBe(true);
  });

  it("rejects negative, zero, and NaN amounts", () => {
    expect(isAmountValid("-1")).toBe(false);
    expect(isAmountValid("0")).toBe(false);
    expect(isAmountValid("0.0000000")).toBe(false);
    expect(isAmountValid("abc")).toBe(false);
    expect(isAmountValid("")).toBe(false);
  });

  it("rejects amounts with more than 7 decimal places", () => {
    expect(isAmountValid("1.12345678")).toBe(false);
    expect(isAmountValid("0.00000001")).toBe(false);
  });

  it("rejects amounts exceeding MAX (1e12 - epsilon)", () => {
    expect(isAmountValid("999999999999.9999999")).toBe(true);
    expect(isAmountValid("1000000000000")).toBe(false);
  });

  it("rejects sub-stroop amounts below 1e-7", () => {
    expect(isAmountValid("0.0000001")).toBe(true);
    expect(isAmountValid("0.00000005")).toBe(false);
  });

  it("normalizeAmount pads to 7 decimals without throwing", () => {
    expect(normalizeAmount("1")).toBe("1.0000000");
    expect(normalizeAmount("2.5")).toBe("2.5000000");
  });

  it("compareAmounts respects partial order", () => {
    expect(compareAmounts("1", "2")).toBeLessThan(0);
    expect(compareAmounts("2", "1")).toBeGreaterThan(0);
    expect(compareAmounts("1.5", "1.5000000")).toBe(0);
  });
});

describe("Memo validation", () => {
  it("accepts memo none with empty value", () => {
    const m = createEmptyMemo();
    expect(isMemoValid(m)).toBe(true);
  });

  it("accepts short UTF-8 text memos under the 28 byte limit", () => {
    const ok = createTextMemo("hello world");
    expect(isMemoValid(ok)).toBe(true);
  });

  it("rejects text memos exceeding 28 UTF-8 bytes (respects multi-byte chars)", () => {
    const under = createTextMemo("a".repeat(28));
    expect(isMemoValid(under)).toBe(true);
    const overBytes = createTextMemo("é".repeat(15)); // 30 bytes
    expect(isMemoValid(overBytes)).toBe(false);
    expect(memoLengthTextBytes("éé")).toBe(4);
  });

  it("accepts ID memos composed of digits only", () => {
    expect(isMemoValid(createIdMemo("12345"))).toBe(true);
    expect(isMemoValid(createIdMemo("0"))).toBe(true);
    expect(isMemoValid({ type: "id", value: "notanumber" })).toBe(false);
    expect(isMemoValid({ type: "id", value: "-1" })).toBe(false);
  });

  it("accepts hash and return memos that are 64 hex chars", () => {
    const hex64 = "a".repeat(64);
    expect(isMemoValid({ type: "hash", value: hex64 })).toBe(true);
    expect(isMemoValid({ type: "return", value: hex64 })).toBe(true);
    expect(isMemoValid({ type: "hash", value: "ZZ" + hex64.slice(2) })).toBe(false);
    expect(isMemoValid({ type: "hash", value: hex64.slice(0, 32) })).toBe(false);
  });

  it("validateMemo returns typed errors for invalid memos", () => {
    const badText = createTextMemo("a".repeat(300));
    const r = validateMemo(badText);
    expect(r.success).toBe(false);
  });
});
