/**
 * Shared error taxonomy across AnchorKit packages.
 */

export type AnchorKitErrorCategory =
  | "VALIDATION"
  | "NETWORK"
  | "PAYMENT"
  | "ANCHOR"
  | "SECRET"
  | "CONFIG"
  | "ESCROW"
  | "UNKNOWN";

export type AnchorKitErrorCode =
  // Validation
  | "INVALID_INPUT"
  | "INVALID_SCHEMA"
  | "INVALID_AMOUNT"
  | "INVALID_ASSET"
  | "INVALID_PUBLIC_KEY"
  | "INVALID_CALLBACK_URL"
  | "INVALID_DEPOSIT_METADATA"
  | "INVALID_WITHDRAWAL_METADATA"
  | "INVALID_ASSET_CONFIG"
  | "INVALID_RAIL_CONFIG"
  // Network
  | "NETWORK_ERROR"
  | "HORIZON_ERROR"
  | "RPC_ERROR"
  | "TIMEOUT_ERROR"
  // Payment
  | "PAYMENT_INTENT_INVALID"
  | "INSUFFICIENT_FUNDS"
  | "TRANSACTION_FAILED"
  | "MEMO_INVALID"
  | "ASSET_MISMATCH"
  // Anchor
  | "INVALID_ANCHOR_CONFIG"
  | "ANCHOR_API_ERROR"
  | "ILLEGAL_LIFECYCLE_TRANSITION"
  | "TRANSACTION_RECORD_INVALID"
  // Secret
  | "SECRET_KEY_INVALID"
  | "SECRET_REDACTION_ERROR"
  | "UNAUTHORIZED"
  // Config
  | "INVALID_CONFIG"
  | "MAINNET_DISABLED"
  | "MISSING_ENV_VAR"
  // Escrow
  | "ESCROW_EVENT_DECODE_ERROR"
  | "ESCROW_MILESTONE_INVALID"
  | "ESCROW_CONTRACT_ERROR"
  // Unknown
  | "UNKNOWN_ERROR";

const SECRET_PATTERNS = [
  /S[A-Z2-7]{55}/g,
  /SA[A-Z2-7]{54}/g,
  /secret[\s_-]?key/i,
  /private[\s_-]?key/i,
  /seed[\s_-]?phrase/i,
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

const DEFAULT_USER_MESSAGES: Record<AnchorKitErrorCategory, string> = {
  VALIDATION: "Validation failed. Please check your inputs.",
  NETWORK: "Network error. Please check your connection or retry.",
  PAYMENT: "Payment transaction failed. Please check payment details.",
  ANCHOR: "Anchor service error. Please try again later.",
  SECRET: "Secret or authorization validation failed.",
  CONFIG: "System configuration error.",
  ESCROW: "Escrow contract operation failed.",
  UNKNOWN: "An unexpected error occurred.",
};

export interface AnchorKitErrorDetails {
  category: AnchorKitErrorCategory;
  code: AnchorKitErrorCode;
  message: string;
  userSafeMessage: string;
  details?: Record<string, unknown>;
  cause?: unknown;
  redacted: true;
}

export class AnchorKitError extends Error implements AnchorKitErrorDetails {
  override readonly name = "AnchorKitError";
  readonly category: AnchorKitErrorCategory;
  readonly code: AnchorKitErrorCode;
  readonly userSafeMessage: string;
  readonly details?: Record<string, unknown>;
  override readonly cause?: unknown;
  readonly redacted = true as const;

  constructor(options: {
    category: AnchorKitErrorCategory;
    code: AnchorKitErrorCode;
    message: string;
    userSafeMessage?: string;
    details?: Record<string, unknown>;
    cause?: unknown;
  }) {
    const sanitizedMessage = redactSecrets(options.message);
    super(sanitizedMessage);

    this.category = options.category;
    this.code = options.code;
    this.userSafeMessage = options.userSafeMessage
      ? redactSecrets(options.userSafeMessage)
      : DEFAULT_USER_MESSAGES[options.category];
    this.details = options.details ? sanitizeDetails(options.details) : undefined;
    this.cause = options.cause ? sanitizeCause(options.cause) : undefined;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function sanitizeCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: redactSecrets(cause.message),
      stack: cause.stack ? redactSecrets(cause.stack) : undefined,
    };
  }
  if (typeof cause === "string") {
    return redactSecrets(cause);
  }
  if (typeof cause === "object" && cause !== null) {
    return sanitizeDetails(cause as Record<string, unknown>);
  }
  return cause;
}

function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(details)) {
    if (typeof val === "string") {
      result[key] = redactSecrets(val);
    } else if (val instanceof Error) {
      result[key] = redactSecrets(val.message);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function createAnchorKitError(options: {
  category: AnchorKitErrorCategory;
  code: AnchorKitErrorCode;
  message: string;
  userSafeMessage?: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}): AnchorKitError {
  return new AnchorKitError(options);
}

export function isAnchorKitError(error: unknown): error is AnchorKitError {
  return (
    error instanceof Error &&
    error.name === "AnchorKitError" &&
    (error as unknown as Record<string, unknown>).redacted === true
  );
}

export interface UserSafeErrorMapping {
  title: string;
  message: string;
  category: AnchorKitErrorCategory;
  code: AnchorKitErrorCode;
  userSafeMessage: string;
}

export function mapErrorToUserSafeMessage(error: unknown): UserSafeErrorMapping {
  if (isAnchorKitError(error)) {
    return {
      title: getCategoryTitle(error.category),
      message: error.userSafeMessage || error.message,
      category: error.category,
      code: error.code,
      userSafeMessage: error.userSafeMessage,
    };
  }

  if (error instanceof Error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: AnchorKitErrorCode }).code
        : undefined;
    const category = mapErrorCodeToCategory(code) ?? mapMessageToCategory(error.message);

    return {
      title: getCategoryTitle(category),
      message: DEFAULT_USER_MESSAGES[category],
      category,
      code: code ?? "UNKNOWN_ERROR",
      userSafeMessage: DEFAULT_USER_MESSAGES[category],
    };
  }

  if (typeof error === "string") {
    return {
      title: getCategoryTitle("UNKNOWN"),
      message: DEFAULT_USER_MESSAGES.UNKNOWN,
      category: "UNKNOWN",
      code: "UNKNOWN_ERROR",
      userSafeMessage: DEFAULT_USER_MESSAGES.UNKNOWN,
    };
  }

  return {
    title: getCategoryTitle("UNKNOWN"),
    message: DEFAULT_USER_MESSAGES.UNKNOWN,
    category: "UNKNOWN",
    code: "UNKNOWN_ERROR",
    userSafeMessage: DEFAULT_USER_MESSAGES.UNKNOWN,
  };
}

function getCategoryTitle(category: AnchorKitErrorCategory): string {
  switch (category) {
    case "VALIDATION":
      return "Validation Error";
    case "NETWORK":
      return "Network Connection Error";
    case "PAYMENT":
      return "Payment Processing Error";
    case "ANCHOR":
      return "Anchor Service Error";
    case "SECRET":
      return "Security & Key Error";
    case "CONFIG":
      return "Configuration Error";
    case "ESCROW":
      return "Escrow Contract Error";
    case "UNKNOWN":
    default:
      return "Unexpected Error";
  }
}

function mapErrorCodeToCategory(code?: string): AnchorKitErrorCategory | undefined {
  if (!code) return undefined;
  if (code.startsWith("INVALID_") || code.includes("VALIDATION")) return "VALIDATION";
  if (code.includes("NETWORK") || code.includes("HORIZON") || code.includes("RPC")) return "NETWORK";
  if (code.includes("PAYMENT") || code.includes("TRANSACTION") || code.includes("MEMO")) return "PAYMENT";
  if (code.includes("SECRET") || code === "UNAUTHORIZED") return "SECRET";
  if (code.includes("CONFIG") || code === "MAINNET_DISABLED") return "CONFIG";
  if (code.includes("ESCROW")) return "ESCROW";
  return undefined;
}

function mapMessageToCategory(msg: string): AnchorKitErrorCategory {
  const lower = msg.toLowerCase();
  if (lower.includes("mainnet") || lower.includes("config") || lower.includes("env")) return "CONFIG";
  if (lower.includes("secret") || lower.includes("unauthorized") || lower.includes("forbidden")) return "SECRET";
  if (lower.includes("network") || lower.includes("horizon") || lower.includes("timeout") || lower.includes("fetch")) return "NETWORK";
  if (lower.includes("payment") || lower.includes("balance") || lower.includes("amount") || lower.includes("memo")) return "PAYMENT";
  if (lower.includes("validation") || lower.includes("invalid") || lower.includes("schema")) return "VALIDATION";
  if (lower.includes("escrow") || lower.includes("milestone")) return "ESCROW";
  if (lower.includes("anchor")) return "ANCHOR";
  return "UNKNOWN";
}
