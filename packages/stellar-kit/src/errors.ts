import type { StellarErrorCode, StellarKitError } from "@anchorkit/types";
import { redactSecrets } from "./redaction";

export { redactSecrets } from "./redaction";

export function createStellarError(
  code: StellarErrorCode,
  message: string,
  cause?: unknown
): StellarKitError {
  const redactedMessage = redactSecrets(message);
  const error = new Error(redactedMessage) as StellarKitError;
  error.code = code;
  error.name = "StellarKitError";
  error.redacted = true;
  if (cause !== undefined) {
    error.cause = sanitizeCause(cause);
  }
  return error;
}

export function createFeatureDisabledError(
  flagId: string,
  featureName?: string,
  stability?: string
): StellarKitError {
  const nameStr = featureName ? `'${featureName}' (${flagId})` : `'${flagId}'`;
  const stabilityStr = stability ? ` Feature stability: ${stability}.` : "";
  return createStellarError(
    "FEATURE_DISABLED",
    `Feature ${nameStr} is disabled by default.${stabilityStr} Enable it in config by setting featureFlags.${flagId}: true.`
  );
}

function sanitizeCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    const sanitizedMessage = redactSecrets(cause.message);
    const sanitizedStack = cause.stack ? redactSecrets(cause.stack) : undefined;
    return {
      name: cause.name,
      message: sanitizedMessage,
      stack: sanitizedStack,
    };
  }
  if (typeof cause === "string") {
    return redactSecrets(cause);
  }
  if (typeof cause === "object" && cause !== null) {
    return cause;
  }
  return cause;
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

    return {
      code: "UNKNOWN",
      message: redactSecrets(error.message),
    };
  }

  return { code: "UNKNOWN", message: redactSecrets(String(error)) };
}

