import type { StellarErrorCode, StellarKitError, AnchorKitErrorCategory, AnchorKitErrorCode } from "@anchorkit/types";
import { AnchorKitError } from "@anchorkit/types";

export { redactSecrets } from "@anchorkit/types";

export function createStellarError(
  code: StellarErrorCode,
  message: string,
  cause?: unknown
): StellarKitError {
  const category = mapStellarErrorCodeToCategory(code);
  const error = new AnchorKitError({
    category,
    code: code as unknown as AnchorKitErrorCode,
    message,
    cause,
  }) as unknown as StellarKitError;

  error.code = code;
  error.name = "StellarKitError";
  return error;
}

function mapStellarErrorCodeToCategory(code: StellarErrorCode): AnchorKitErrorCategory {
  switch (code) {
    case "SECRET_KEY_INVALID":
    case "UNAUTHORIZED":
      return "SECRET";
    case "PUBLIC_KEY_INVALID":
    case "ACCOUNT_MALFORMED":
    case "TRANSACTION_HASH_INVALID":
      return "VALIDATION";
    case "ACCOUNT_NOT_FOUND":
    case "NETWORK_ERROR":
      return "NETWORK";
    case "ASSET_INVALID":
    case "AMOUNT_INVALID":
    case "MEMO_INVALID":
      return "PAYMENT";
    case "MAINNET_DISABLED":
      return "CONFIG";
    case "UNKNOWN":
    default:
      return "UNKNOWN";
  }
}

export function mapHorizonError(
  error: unknown
): { code: StellarErrorCode; message: string } {
  if (error === null || error === undefined) {
    return { code: "UNKNOWN", message: "Unknown error occurred" };
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes("not found") || msg.includes("404")) {
      return {
        code: "ACCOUNT_NOT_FOUND",
        message: "Stellar account not found on the network (may be unfunded)",
      };
    }

    if (msg.includes("malformed") || msg.includes("bad request") || msg.includes("400")) {
      return {
        code: "ACCOUNT_MALFORMED",
        message: "Malformed request or invalid Stellar identifier",
      };
    }

    if (msg.includes("unauthorized") || msg.includes("forbidden") || msg.includes("403")) {
      return {
        code: "UNAUTHORIZED",
        message: "Authorization required for this operation",
      };
    }

    if (
      msg.includes("timeout") ||
      msg.includes("network") ||
      msg.includes("econnrefused") ||
      msg.includes("enetunreach")
    ) {
      return {
        code: "NETWORK_ERROR",
        message: "Network error when connecting to Stellar Horizon API",
      };
    }
  }

  return { code: "UNKNOWN", message: "An unexpected error occurred" };
}
