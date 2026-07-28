/**
 * Central Secret Redaction & Unsafe Pattern Detection Framework
 *
 * Provides shared utilities for scanning and redacting Stellar secret keys,
 * secret field assignments, diagnostic outputs, and stack traces.
 */

import type { RedactedSecretKey } from "@anchorkit/types";

/**
 * Regex matching Stellar secret seeds (56 chars, starting with 'S', base32 uppercase A-Z, 2-7).
 */
export const STELLAR_SECRET_KEY_REGEX = /S[A-Z2-7]{55}/g;

/**
 * Regex matching secret key assignments in key-value pairs or log strings.
 * e.g., secretKey="...", secret_key: "...", privateKey=...
 */
export const SECRET_ASSIGNMENT_REGEX =
  /(secret[_\-]?key|private[_\-]?key|seed[_\-]?phrase|secret[_\-]?seed)\s*[:=]\s*(["']?)([^\s"',}]+)\2/gi;

/**
 * Pattern list for scanning and scrubbing secret tokens from arbitrary strings.
 */
const SECRET_PATTERNS = [
  STELLAR_SECRET_KEY_REGEX,
  /S[A-Za-z2-7]{55}/g,
  SECRET_ASSIGNMENT_REGEX,
  /secret[_\-]?key/i,
  /private[_\-]?key/i,
  /seed[_\-]?phrase/i,
];

/**
 * Check if a string contains any secret-like value or unsafe pattern.
 */
export function containsSecret(input: string): boolean {
  if (typeof input !== "string" || !input) return false;
  if (/S[A-Z2-7]{55}/i.test(input)) return true;
  SECRET_ASSIGNMENT_REGEX.lastIndex = 0;
  if (SECRET_ASSIGNMENT_REGEX.test(input)) return true;
  return false;
}

export interface UnsafePatternMatch {
  type: "stellar_secret_key" | "secret_field_assignment" | "sensitive_keyword";
  match: string;
}

/**
 * Perform a detailed diagnostic scan for unsafe secret patterns in text.
 */
export function detectUnsafePatterns(input: string): {
  hasSecrets: boolean;
  matches: UnsafePatternMatch[];
} {
  if (typeof input !== "string" || !input) {
    return { hasSecrets: false, matches: [] };
  }

  const matches: UnsafePatternMatch[] = [];

  const secretKeys = input.match(STELLAR_SECRET_KEY_REGEX);
  if (secretKeys) {
    for (const key of secretKeys) {
      matches.push({ type: "stellar_secret_key", match: key });
    }
  }

  SECRET_ASSIGNMENT_REGEX.lastIndex = 0;
  let assignMatch: RegExpExecArray | null;
  while ((assignMatch = SECRET_ASSIGNMENT_REGEX.exec(input)) !== null) {
    matches.push({ type: "secret_field_assignment", match: assignMatch[0] });
  }

  return {
    hasSecrets: matches.length > 0,
    matches,
  };
}

/**
 * Redact Stellar secret keys and sensitive tokens embedded in arbitrary text.
 */
export function redactSecrets(input: string): string {
  if (typeof input !== "string") return input;
  let result = input;

  // Redact key-value assignments: secret_key="VAL" -> secret_key="[REDACTED]"
  result = result.replace(
    SECRET_ASSIGNMENT_REGEX,
    (fullMatch, keyName, quote, val) => {
      const q = quote || "";
      if (val.length === 56 && val.startsWith("S")) {
        const redactedVal = val.slice(0, 4) + "[REDACTED]" + val.slice(-4);
        return `${keyName}=${q}${redactedVal}${q}`;
      }
      return `${keyName}=${q}[REDACTED]${q}`;
    }
  );

  // Redact standalone Stellar secret keys
  result = result.replace(/S[A-Z2-7]{55}/gi, (match) => {
    return match.slice(0, 4) + "[REDACTED]" + match.slice(-4);
  });

  // Redact keywords if matched as isolated descriptors
  for (const pattern of [/secret[\s_\-]?key/i, /private[\s_\-]?key/i, /seed[\s_\-]?phrase/i]) {
    result = result.replace(pattern, "[REDACTED]");
  }


  return result;
}

/**
 * Format a redacted secret key object into a safe human-readable string.
 */
export function formatRedactedSecret(redacted: RedactedSecretKey): string {
  return `${redacted.prefix}••••••••••••••••••••••••••••••••••••••••••••••••••••${redacted.suffix}`;
}
