import { describe, it, expect } from "vitest";
import {
  redactSecrets,
  containsSecret,
  detectUnsafePatterns,
  redactSecretKey,
  formatRedactedSecret,
  secretKeyToRedactedString,
  createStellarError,
  diagnoseAccount,
  diagnoseAccountInfo,
  createSafeLogger,
} from "../src";

const SAMPLE_SECRET = "SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4";
const SAMPLE_PUBLIC = "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR";

describe("Secret Redaction Utilities", () => {
  it("redacts 56-character Stellar secret keys from log messages", () => {
    const rawLog = `Authenticating account ${SAMPLE_PUBLIC} using secret ${SAMPLE_SECRET}`;
    const scrubbed = redactSecrets(rawLog);
    expect(scrubbed).not.toContain(SAMPLE_SECRET);
    expect(scrubbed).toContain("SCZA[REDACTED]BTQ4");
    expect(scrubbed).toContain(SAMPLE_PUBLIC);
  });

  it("redacts key-value secret assignment patterns", () => {
    const rawConfig = `secretKey="${SAMPLE_SECRET}" and private_key="super_secret_value"`;
    const scrubbed = redactSecrets(rawConfig);
    expect(scrubbed).not.toContain(SAMPLE_SECRET);
    expect(scrubbed).not.toContain("super_secret_value");
    expect(scrubbed).toContain("[REDACTED]");
  });

  it("does not redact valid Stellar public keys", () => {
    const pubLog = `Account loaded: ${SAMPLE_PUBLIC}`;
    const result = redactSecrets(pubLog);
    expect(result).toBe(pubLog);
  });

  it("detects unsafe patterns in input text", () => {
    expect(containsSecret(SAMPLE_SECRET)).toBe(true);
    expect(containsSecret(`key=${SAMPLE_SECRET}`)).toBe(true);
    expect(containsSecret(SAMPLE_PUBLIC)).toBe(false);

    const diag = detectUnsafePatterns(`Found ${SAMPLE_SECRET} in memory dump`);
    expect(diag.hasSecrets).toBe(true);
    expect(diag.matches.length).toBe(1);
    expect(diag.matches[0]?.type).toBe("stellar_secret_key");
  });

  it("redacts secret keys inside createStellarError messages", () => {
    const err = createStellarError(
      "SECRET_KEY_INVALID",
      `Failed to initialize with key ${SAMPLE_SECRET}`
    );
    expect(err.message).not.toContain(SAMPLE_SECRET);
    expect(err.message).toContain("SCZA[REDACTED]BTQ4");
    expect(err.redacted).toBe(true);
  });

  it("diagnoseAccount redacts secret keys when passed as input", async () => {
    const diag = await diagnoseAccount(SAMPLE_SECRET);
    expect(diag.state).toBe("invalid");
    expect(diag.input).not.toContain(SAMPLE_SECRET);
    expect(diag.input).toContain("SCZA[REDACTED]BTQ4");
    expect(diag.isValidPublicKey).toBe(false);
  });

  it("diagnoseAccountInfo redacts error strings containing secrets", () => {
    const diag = diagnoseAccountInfo({
      publicKey: SAMPLE_PUBLIC as any,
      status: "error",
      error: `Horizon error while authenticating ${SAMPLE_SECRET}`,
    });
    expect(diag.error).not.toContain(SAMPLE_SECRET);
    expect(diag.error).toContain("SCZA[REDACTED]BTQ4");
  });

  it("createSafeLogger redacts secrets from objects, arrays, and errors", () => {
    let captured = "";
    const logger = createSafeLogger({
      log: (...args: unknown[]) => {
        captured = args.join(" ");
      },
    });

    logger.log("user logged in", { secret: SAMPLE_SECRET, nested: { key: SAMPLE_SECRET } });
    expect(captured).not.toContain(SAMPLE_SECRET);
    expect(captured).toContain("[REDACTED]");
  });

  it("secretKeyToRedactedString returns formatted redacted string for valid keys", () => {
    const redacted = secretKeyToRedactedString(SAMPLE_SECRET);
    expect(redacted).toBe(formatRedactedSecret(redactSecretKey(SAMPLE_SECRET)));
    expect(redacted).not.toContain(SAMPLE_SECRET.slice(4, -4));
  });

  it("secretKeyToRedactedString redacts invalid secret input safely", () => {
    const redacted = secretKeyToRedactedString("SINVALID_SECRET");
    expect(redacted).not.toContain("SINVALID_SECRET");
    expect(redacted).toBe("[INVALID_SECRET_KEY]");
  });
});
