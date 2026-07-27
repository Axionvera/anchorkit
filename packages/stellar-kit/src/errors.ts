import type { StellarErrorCode, StellarKitError } from "@anchorkit/types";

export function createStellarError(
  code: StellarErrorCode,
  message: string,
  cause?: unknown
): StellarKitError {
  const error = new Error(message) as StellarKitError;
  error.code = code;
  error.name = "StellarKitError";
  error.redacted = true;
  if (cause !== undefined) {
    error.cause = sanitizeCause(cause);
  }
  return error;
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

const SECRET_PATTERNS = [
  /S[A-Z2-7]{55}/g,
  /SA[A-Z2-7]{54}/g,
  /secret[_-]?key/i,
  /private[_-]?key/i,
  /seed[_-]?phrase/i,
];

export function redactSecrets(input: string): string {
  let result = input;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, (match) => {
      if (match.startsWith("S") && match.length === 56) {
        return match.slice(0, 4) + "[REDACTED]" + match.slice(-4);
      }
      return "[REDACTED]";
    });
  }
  return result;
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
