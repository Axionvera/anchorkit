import { describe, it, expect } from "vitest";
import { Keypair } from "@stellar/stellar-base";
import { FRIENDBOT_PUBLIC_KEY } from "@anchorkit/fixtures";
import {
  generateTestnetKeypair,
  validatePublicKey,
  isPublicKeyValid,
  validateSecretKey,
  isSecretKeyValid,
  validateSecretKeyQuietly,
  redactSecretKey,
  formatRedactedSecret,
  secretKeyToRedactedString,
  getPublicKeyFromSecret,
  redactSecrets,
} from "../src";

const WELL_KNOWN_FRIENDBOT: string = FRIENDBOT_PUBLIC_KEY;
// Generated fresh per test run — never a real secret that has held funds.
const SAMPLE_KEYPAIR = Keypair.random();
const SECRET_KEY_SAMPLE = SAMPLE_KEYPAIR.secret();
const SECRET_KEY_SAMPLE_PUBLIC = SAMPLE_KEYPAIR.publicKey();

describe("Stellar public key validation", () => {
  it("accepts a valid 56-char G-prefixed base32 public key", () => {
    const result = validatePublicKey(WELL_KNOWN_FRIENDBOT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(WELL_KNOWN_FRIENDBOT);
    }
  });

  it("rejects a key shorter than 56 characters", () => {
    const result = validatePublicKey("GSHORT");
    expect(result.success).toBe(false);
  });

  it("rejects a key longer than 56 characters", () => {
    const result = validatePublicKey(WELL_KNOWN_FRIENDBOT + "AA");
    expect(result.success).toBe(false);
  });

  it("rejects a key that does not start with G", () => {
    const result = validatePublicKey(SECRET_KEY_SAMPLE);
    expect(result.success).toBe(false);
  });

  it("rejects keys with invalid base32 characters (lowercase, digits 0189)", () => {
    const bad = WELL_KNOWN_FRIENDBOT.replace("A", "0");
    expect(isPublicKeyValid(bad)).toBe(false);
    expect(isPublicKeyValid(WELL_KNOWN_FRIENDBOT.toLowerCase())).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isPublicKeyValid("")).toBe(false);
  });

  it("rejects null or undefined inputs without throwing", () => {
    expect(isPublicKeyValid(null as unknown as string)).toBe(false);
    expect(isPublicKeyValid(undefined as unknown as string)).toBe(false);
  });
});

describe("Stellar secret key validation and redaction", () => {
  it("accepts a structurally valid 56-char S-prefixed secret key", () => {
    const result = validateSecretKey(SECRET_KEY_SAMPLE);
    expect(result.success).toBe(true);
  });

  it("quietly rejects a key shorter than 56 characters", () => {
    const r = validateSecretKeyQuietly("SSHORT");
    expect(r.valid).toBe(false);
    expect(r.errorCode).toBe("TOO_SHORT");
  });

  it("quietly rejects a key longer than 56 characters", () => {
    const r = validateSecretKeyQuietly(SECRET_KEY_SAMPLE + "AAA");
    expect(r.valid).toBe(false);
    expect(r.errorCode).toBe("TOO_LONG");
  });

  it("quietly rejects a key without S prefix", () => {
    const r = validateSecretKeyQuietly(WELL_KNOWN_FRIENDBOT);
    expect(r.valid).toBe(false);
    expect(r.errorCode).toBe("BAD_PREFIX");
  });

  it("quietly rejects keys with bad characters", () => {
    // "0", "1", "8", "9" are outside the base32 alphabet used by Stellar keys,
    // so swapping in a "1" after the S prefix is always an invalid character
    // regardless of what the randomly generated sample secret contains.
    const bad = `S1${SECRET_KEY_SAMPLE.slice(2)}`;
    const r = validateSecretKeyQuietly(bad);
    expect(r.valid).toBe(false);
    expect(r.errorCode).toBe("BAD_CHARS");
  });

  it("derivePublic matches known public key for a known secret", () => {
    const pk = getPublicKeyFromSecret(SECRET_KEY_SAMPLE);
    expect(pk).toBe(SECRET_KEY_SAMPLE_PUBLIC);
  });

  it("generateTestnetKeypair produces consistent G/S pair with matching public key", () => {
    const pair = generateTestnetKeypair();
    expect(pair.publicKey.startsWith("G")).toBe(true);
    expect(pair.secretKey.startsWith("S")).toBe(true);
    expect(pair.publicKey.length).toBe(56);
    expect(pair.secretKey.length).toBe(56);
    const derived = getPublicKeyFromSecret(pair.secretKey);
    expect(derived).toBe(pair.publicKey);
  });

  it("redactSecretKey only exposes prefix and suffix", () => {
    const r = redactSecretKey(SECRET_KEY_SAMPLE);
    expect(r.__redacted).toBe(true);
    expect(r.prefix).toBe(SECRET_KEY_SAMPLE.slice(0, 4));
    expect(r.suffix).toBe(SECRET_KEY_SAMPLE.slice(-4));
    expect(formatRedactedSecret(r)).toContain("••••");
    expect(formatRedactedSecret(r)).not.toContain(
      SECRET_KEY_SAMPLE.slice(4, SECRET_KEY_SAMPLE.length - 4)
    );
  });

  it("secretKeyToRedactedString never leaks the middle portion", () => {
    const s = secretKeyToRedactedString(SECRET_KEY_SAMPLE);
    const middle = SECRET_KEY_SAMPLE.slice(4, -4);
    expect(s).not.toContain(middle);
  });

  it("redactSecrets masks S-prefixed 56-char secrets embedded in arbitrary strings", () => {
    const log = `loaded keys for account ${WELL_KNOWN_FRIENDBOT} with secret ${SECRET_KEY_SAMPLE}`;
    const masked = redactSecrets(log);
    expect(masked).not.toContain(SECRET_KEY_SAMPLE.slice(4, -4));
    expect(masked).toContain("[REDACTED]");
    expect(masked).toContain(WELL_KNOWN_FRIENDBOT);
  });

  it("does not consider a public key a secret even though it starts with G", () => {
    const s = redactSecrets(`account ${WELL_KNOWN_FRIENDBOT}`);
    expect(s).toContain(WELL_KNOWN_FRIENDBOT);
  });
});
