import { describe, it, expect } from "vitest";
import { createAnchorKitError, mapErrorToUserSafeMessage } from "@anchorkit/types";

describe("Web UI Error Mapping Integration", () => {
  it("maps AnchorKitError to safe UI title and message", () => {
    const error = createAnchorKitError({
      category: "VALIDATION",
      code: "INVALID_DEPOSIT_METADATA",
      message: "Deposit amount 'ABC' is not valid decimal",
      userSafeMessage: "Please enter a valid deposit amount.",
    });

    const result = mapErrorToUserSafeMessage(error);
    expect(result.title).toBe("Validation Error");
    expect(result.category).toBe("VALIDATION");
    expect(result.code).toBe("INVALID_DEPOSIT_METADATA");
    expect(result.message).toBe("Please enter a valid deposit amount.");
  });

  it("safely handles raw runtime exceptions without exposing secret keys in UI", () => {
    const secret = "SDJLKFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDFJSLKDF234";
    const rawError = new Error(`Horizon network connection failed for ${secret}`);

    const result = mapErrorToUserSafeMessage(rawError);
    expect(result.title).toBe("Network Connection Error");
    expect(result.message).not.toContain(secret);
    expect(result.category).toBe("NETWORK");
  });
});
