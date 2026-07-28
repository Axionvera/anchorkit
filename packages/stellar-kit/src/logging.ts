/**
 * Unsafe-logging guardrails (issue #3).
 *
 * A safe logger that transparently redacts Stellar secret keys, seed phrases,
 * private keys, and known-secret-shaped strings before anything reaches
 * `console`. This prevents accidental secret leakage through logs — the most
 * common way credentials slip into CI output, crash reports, and support dumps.
 *
 * The underlying primitives (`redactSecretKey`, `redactSecrets`) live in
 * `./keys` and `./errors`; this module wraps them in a drop-in logging API so
 * callers can replace raw `console.log(...)` with `safeLog(...)` without
 * changing call sites' shape.
 */

import { redactSecrets } from "./redaction";

export { redactSecretKey, secretKeyToRedactedString } from "./keys";
export { redactSecrets } from "./redaction";
export type { RedactedSecretKey } from "@anchorkit/types";

/** Recursively redact secret-shaped strings inside a value. */
function safeStringify(value: unknown): string {
  if (typeof value === "string") {
    return redactSecrets(value);
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      const seen = new WeakSet<object>();
      const scrubbed = JSON.parse(
        JSON.stringify(value, (_key, val: unknown) => {
          if (typeof val === "string") return redactSecrets(val);
          if (typeof val === "object" && val !== null) {
            if (seen.has(val)) return "[Circular]";
            seen.add(val);
          }
          return val;
        })
      ) as unknown;
      return JSON.stringify(scrubbed);
    } catch {
      // Fallback: String() then redact (handles BigInt, functions, etc.)
      return redactSecrets(String(value));
    }
  }
  return redactSecrets(String(value));
}

/** The function signature a safe logger uses for output. */
export type LogSink = (...args: unknown[]) => void;

export interface SafeLogger {
  log: LogSink;
  info: LogSink;
  warn: LogSink;
  error: LogSink;
  /** Redact a single value and return the safe string (no console output). */
  redact: (value: unknown) => string;
}

/**
 * Create a safe logger bound to a console-like sink set.
 * By default mirrors `console`, but you can pass custom sinks (e.g. a file
 * writer or a remote aggregator) and secrets will still be redacted first.
 */
export function createSafeLogger(
  sinks?: Partial<{ log: LogSink; info: LogSink; warn: LogSink; error: LogSink }>
): SafeLogger {
  /* eslint-disable no-console */
  const out = sinks ?? console;
  const logSink = out.log ?? console.log.bind(console);
  const infoSink = out.info ?? console.info.bind(console);
  const warnSink = out.warn ?? console.warn.bind(console);
  const errorSink = out.error ?? console.error.bind(console);
  /* eslint-enable no-console */

  return {
    log: (...args) => logSink(...args.map(safeStringify)),
    info: (...args) => infoSink(...args.map(safeStringify)),
    warn: (...args) => warnSink(...args.map(safeStringify)),
    error: (...args) => errorSink(...args.map(safeStringify)),
    redact: safeStringify,
  };
}

/** Shared default safe logger backed by the global console. */
export const safeLog: SafeLogger = createSafeLogger();

/** Convenience: redact a value to a safe string without logging. */
export function redactValue(value: unknown): string {
  return safeStringify(value);
}
