import {
  STELLAR_NETWORKS,
  type PaymentRequest,
  type PaymentRequestParseError,
  type PaymentRequestParseResult,
} from "@anchorkit/types";
import { PaymentRequestSchema } from "@anchorkit/validators";

export interface ParsePaymentRequestOptions {
  /** Clock override for deterministic consumers and tests. Defaults to now. */
  now?: Date;
}

const SUPPORTED_NETWORKS = new Set<string>(Object.values(STELLAR_NETWORKS));

function malformed(
  message: string,
  issues?: PaymentRequestParseError["issues"]
): PaymentRequestParseResult {
  return {
    success: false,
    error: {
      code: "PAYMENT_REQUEST_MALFORMED",
      message,
      ...(issues && issues.length > 0 ? { issues } : {}),
    },
  };
}

/**
 * Parse and validate a versioned AnchorKit payment request from JSON or an
 * already-decoded value. No network calls are made.
 */
export function parsePaymentRequest(
  input: unknown,
  options: ParsePaymentRequestOptions = {}
): PaymentRequestParseResult {
  let decoded = input;
  if (typeof input === "string") {
    if (input.trim().length === 0) {
      return malformed("Payment request must not be empty");
    }

    try {
      decoded = JSON.parse(input) as unknown;
    } catch {
      return malformed("Payment request must be valid JSON");
    }
  }

  if (typeof decoded === "object" && decoded !== null && !Array.isArray(decoded)) {
    const candidate = decoded as Record<string, unknown>;

    if ("version" in candidate && candidate.version !== "1") {
      return {
        success: false,
        error: {
          code: "PAYMENT_REQUEST_UNSUPPORTED_VERSION",
          message: "Payment request version is not supported",
        },
      };
    }

    if (typeof candidate.network === "string" && !SUPPORTED_NETWORKS.has(candidate.network)) {
      return {
        success: false,
        error: {
          code: "PAYMENT_REQUEST_UNSUPPORTED_NETWORK",
          message: "Payment request network is not supported",
        },
      };
    }
  }

  const result = PaymentRequestSchema.safeParse(decoded);
  if (!result.success) {
    return malformed(
      "Payment request failed validation",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }))
    );
  }

  if (result.data.expiresAt) {
    const now = options.now ?? new Date();
    if (new Date(result.data.expiresAt).getTime() <= now.getTime()) {
      return {
        success: false,
        error: {
          code: "PAYMENT_REQUEST_EXPIRED",
          message: `Payment request expired at ${result.data.expiresAt}`,
        },
      };
    }
  }

  return { success: true, data: result.data as PaymentRequest };
}

export function isPaymentRequestValid(
  input: unknown,
  options: ParsePaymentRequestOptions = {}
): boolean {
  return parsePaymentRequest(input, options).success;
}
