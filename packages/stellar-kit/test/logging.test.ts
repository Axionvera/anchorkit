/**
 * Unsafe-logging guardrail tests (issue #3).
 * Verifies secrets are redacted before reaching the sink, while normal values
 * pass through untouched.
 */

import { describe, it, expect, vi } from "vitest";
import {
  createSafeLogger,
  safeLog,
  redactValue,
  redactSecrets,
  redactSecretKey,
  secretKeyToRedactedString,
} from "../src/logging";

// Build a fake Stellar-shaped secret at runtime so no static high-entropy
// literal is committed (avoids secret scanners). It starts with "S" and is 56
// base32 chars, matching the Stellar secret key shape.
function makeFakeSecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let s = "S";
  for (let i = 1; i < 56; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

const FAKE_SECRET = makeFakeSecret();

describe("redactSecrets", () => {
  it("redacts a Stellar-shaped secret key (S…, 56 chars)", () => {
    const out = redactSecrets(`key=${FAKE_SECRET}`);
    expect(out).not.toContain(FAKE_SECRET);
    expect(out).toContain("[REDACTED]");
    // prefix + suffix preserved for debugging
    expect(out).toContain(FAKE_SECRET.slice(0, 4));
    expect(out).toContain(FAKE_SECRET.slice(-4));
  });

  it("redacts seed phrases and private keys by keyword", () => {
    expect(redactSecrets("seed phrase: hello world foo bar")).toContain("[REDACTED]");
    expect(redactSecrets("private_key: abc123")).toContain("[REDACTED]");
  });

  it("leaves ordinary text untouched", () => {
    expect(redactSecrets("user logged in")).toBe("user logged in");
  });
});

describe("redactSecretKey / secretKeyToRedactedString", () => {
  it("returns a redacted marker object with prefix+suffix only", () => {
    const r = redactSecretKey(FAKE_SECRET);
    expect(r.__redacted).toBe(true);
    expect(r.prefix).toBe(FAKE_SECRET.slice(0, 4));
    expect(r.suffix).toBe(FAKE_SECRET.slice(-4));
  });

  it("formats a readable redacted string", () => {
    const s = secretKeyToRedactedString(FAKE_SECRET);
    expect(s).not.toContain(FAKE_SECRET.slice(4, -4));
    expect(s.startsWith(FAKE_SECRET.slice(0, 4))).toBe(true);
  });
});

describe("createSafeLogger", () => {
  it("redacts secret-shaped strings before calling the sink", () => {
    const sink = vi.fn();
    const logger = createSafeLogger({ log: sink });
    logger.log("auth", FAKE_SECRET, { token: FAKE_SECRET });
    expect(sink).toHaveBeenCalledTimes(1);
    // Each argument is stringified separately; the raw secret must never appear,
    // and a redacted form must be present in at least one argument.
    const allArgs = sink.mock.calls[0]!.join(" ");
    expect(allArgs).not.toContain(FAKE_SECRET);
    expect(allArgs).toContain("[REDACTED]");
  });

  it("does not redact normal log values", () => {
    const sink = vi.fn();
    const logger = createSafeLogger({ info: sink });
    logger.info("deposit started", { amount: "100", asset: "XLM" });
    const allArgs = sink.mock.calls[0]!.join(" ");
    expect(allArgs).toContain("deposit started");
    expect(allArgs).toContain("XLM");
    expect(allArgs).toContain("100");
  });

  it("routes to the correct sink per level", () => {
    const warn = vi.fn();
    const err = vi.fn();
    const logger = createSafeLogger({ warn, error: err });
    logger.warn("careful");
    logger.error("boom");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalledTimes(1);
  });
});

describe("safeLog default + redactValue", () => {
  it("redactValue returns a safe string without throwing on circular refs", () => {
    const circ: Record<string, unknown> = { a: 1 };
    circ.self = circ;
    const out = redactValue(circ);
    expect(typeof out).toBe("string");
  });

  it("default safeLog exposes the expected methods", () => {
    expect(typeof safeLog.log).toBe("function");
    expect(typeof safeLog.warn).toBe("function");
    expect(typeof safeLog.error).toBe("function");
  });
});
