import { describe, expect, it } from "vitest";
import { isPaymentRequestValid, parsePaymentRequest } from "../src/paymentRequest";
import {
  EXPIRED_PAYMENT_REQUEST,
  MALFORMED_PAYMENT_REQUEST,
  UNSUPPORTED_PAYMENT_REQUEST,
  VALID_PAYMENT_REQUEST,
} from "./fixtures";

const BEFORE_EXPIRY = new Date("2029-01-01T00:00:00Z");

describe("parsePaymentRequest", () => {
  it("parses a complete request from an object", () => {
    const result = parsePaymentRequest(VALID_PAYMENT_REQUEST, { now: BEFORE_EXPIRY });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(VALID_PAYMENT_REQUEST);
    expect(result.data.destination).toBe(VALID_PAYMENT_REQUEST.destination);
    expect(result.data.amount).toBe("25.5000000");
    expect(result.data.asset).toEqual({ type: "native", code: "XLM", issuer: null });
    expect(result.data.memo).toEqual({ type: "text", value: "Invoice #84" });
    expect(result.data.network).toBe("testnet");
    expect(result.data.metadata).toEqual({
      orderId: "order-84",
      refundable: true,
      lineItems: 2,
    });
    expect(result.data.expiresAt).toBe("2030-01-01T00:00:00Z");
  });

  it("parses serialized JSON without making a network call", () => {
    const result = parsePaymentRequest(JSON.stringify(VALID_PAYMENT_REQUEST), {
      now: BEFORE_EXPIRY,
    });

    expect(result.success).toBe(true);
  });

  it("returns a typed expired error at and after the expiry instant", () => {
    const result = parsePaymentRequest(EXPIRED_PAYMENT_REQUEST, {
      now: new Date("2024-01-01T00:00:00Z"),
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: "PAYMENT_REQUEST_EXPIRED",
        message: "Payment request expired at 2024-01-01T00:00:00Z",
      },
    });
  });

  it("returns field-level issues for malformed request fields", () => {
    const result = parsePaymentRequest(MALFORMED_PAYMENT_REQUEST, {
      now: BEFORE_EXPIRY,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("PAYMENT_REQUEST_MALFORMED");
    expect(result.error.issues?.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([
        "destination",
        "amount",
        "asset.code",
        "memo.value",
        "metadata.nested",
        "expiresAt",
      ])
    );
  });

  it("returns a typed malformed error for invalid JSON", () => {
    expect(parsePaymentRequest("{not-json")).toEqual({
      success: false,
      error: {
        code: "PAYMENT_REQUEST_MALFORMED",
        message: "Payment request must be valid JSON",
      },
    });
  });

  it("returns a typed unsupported-network error", () => {
    const result = parsePaymentRequest(UNSUPPORTED_PAYMENT_REQUEST, {
      now: BEFORE_EXPIRY,
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: "PAYMENT_REQUEST_UNSUPPORTED_NETWORK",
        message: "Payment request network is not supported",
      },
    });
  });

  it("returns a typed unsupported-version error", () => {
    const result = parsePaymentRequest(
      { ...VALID_PAYMENT_REQUEST, version: "2" },
      { now: BEFORE_EXPIRY }
    );

    expect(result).toEqual({
      success: false,
      error: {
        code: "PAYMENT_REQUEST_UNSUPPORTED_VERSION",
        message: "Payment request version is not supported",
      },
    });
  });

  it("does not echo unsupported values in errors", () => {
    const secretShapedValue = `S${"A".repeat(55)}`;
    const result = parsePaymentRequest({
      ...VALID_PAYMENT_REQUEST,
      network: secretShapedValue,
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toContain(secretShapedValue);
  });

  it("rejects unknown top-level fields and non-scalar metadata", () => {
    const withUnknownField = {
      ...VALID_PAYMENT_REQUEST,
      callbackUrl: "https://example.test/pay",
    };
    const withNestedMetadata = {
      ...VALID_PAYMENT_REQUEST,
      metadata: { nested: { value: "not allowed" } },
    };

    expect(parsePaymentRequest(withUnknownField, { now: BEFORE_EXPIRY }).success).toBe(false);
    expect(parsePaymentRequest(withNestedMetadata, { now: BEFORE_EXPIRY }).success).toBe(false);
  });
});

describe("isPaymentRequestValid", () => {
  it("accounts for JSON decoding, schema validity, and expiry", () => {
    expect(isPaymentRequestValid(VALID_PAYMENT_REQUEST, { now: BEFORE_EXPIRY })).toBe(true);
    expect(
      isPaymentRequestValid(JSON.stringify(VALID_PAYMENT_REQUEST), {
        now: BEFORE_EXPIRY,
      })
    ).toBe(true);
    expect(
      isPaymentRequestValid(EXPIRED_PAYMENT_REQUEST, {
        now: new Date("2025-01-01T00:00:00Z"),
      })
    ).toBe(false);
  });
});
