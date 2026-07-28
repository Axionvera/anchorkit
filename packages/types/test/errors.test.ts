import { describe, it, expect } from "vitest";
import {
  AnchorKitError,
  createAnchorKitError,
  isAnchorKitError,
  redactSecrets,
  mapErrorToUserSafeMessage,
} from "../src/index";

describe("Shared error taxonomy — AnchorKitError", () => {
  it("creates a typed, secret-safe AnchorKitError", () => {
    const err = createAnchorKitError({
      category: "VALIDATION",
      code: "INVALID_AMOUNT",
      message: "Amount 'abc' is invalid",
    });

    expect(err).toBeInstanceOf(AnchorKitError);
    expect(err.name).toBe("AnchorKitError");
    expect(err.category).toBe("VALIDATION");
    expect(err.code).toBe("INVALID_AMOUNT");
    expect(err.redacted).toBe(true);
    expect(err.userSafeMessage).toBe("Validation failed. Please check your inputs.");
    expect(isAnchorKitError(err)).toBe(true);
  });

  it("redacts secret keys from error messages and details", () => {
    // Valid 56-character Stellar secret key starting with S
    const secretKey = "SDJLKFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDF234";
    const err = createAnchorKitError({
      category: "SECRET",
      code: "SECRET_KEY_INVALID",
      message: `Failed to import secretKey ${secretKey}`,
      details: {
        rawKey: secretKey,
      },
    });

    expect(err.message).not.toContain(secretKey);
    expect(err.message).toContain("[REDACTED]");
    expect(err.details?.rawKey).not.toContain(secretKey);
  });

  it("redacts secret keys via redactSecrets utility", () => {
    const secret = "SDJLKFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDF234";
    const redacted = redactSecrets(`Processing user key: ${secret}`);
    expect(redacted).not.toContain(secret);
    expect(redacted).toContain("[REDACTED]");
  });

  it("maps AnchorKitError to UserSafeErrorMapping for UI display", () => {
    const err = createAnchorKitError({
      category: "NETWORK",
      code: "HORIZON_ERROR",
      message: "Horizon endpoint returned 503",
      userSafeMessage: "Stellar network is currently unavailable.",
    });

    const mapped = mapErrorToUserSafeMessage(err);
    expect(mapped.title).toBe("Network Connection Error");
    expect(mapped.category).toBe("NETWORK");
    expect(mapped.code).toBe("HORIZON_ERROR");
    expect(mapped.userSafeMessage).toBe("Stellar network is currently unavailable.");
  });

  it("maps generic Error and unknown exceptions to safe user messages without exposing secrets", () => {
    const secret = "SDJLKFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDF234";
    const rawErr = new Error(`Connection failed with key ${secret}`);

    const mapped = mapErrorToUserSafeMessage(rawErr);
    expect(mapped.title).toBe("Unexpected Error");
    expect(mapped.category).toBe("UNKNOWN");
    expect(mapped.userSafeMessage).toBe("An unexpected error occurred.");
  });
});
