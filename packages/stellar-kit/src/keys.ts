import { Keypair as StellarKeypairSDK } from "@stellar/stellar-sdk";
import type {
  RedactedSecretKey,
  StellarKeypair,
  StellarPublicKey,
  StellarSecretKey,
} from "@anchorkit/types";
import { StellarPublicKeySchema, StellarSecretKeySchema } from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";
import { createStellarError } from "./errors";
import { formatRedactedSecret } from "./redaction";

export { formatRedactedSecret } from "./redaction";

export function generateTestnetKeypair(): StellarKeypair {
  try {
    const kp = StellarKeypairSDK.random();
    return {
      publicKey: kp.publicKey() as StellarPublicKey,
      secretKey: kp.secret() as StellarSecretKey,
    };
  } catch (err) {
    throw createStellarError("SECRET_KEY_INVALID", "Failed to generate keypair", err);
  }
}

export function validatePublicKey(
  publicKey: string
): SafeParseReturnType<string, StellarPublicKey> {
  return StellarPublicKeySchema.safeParse(publicKey);
}

export function isPublicKeyValid(publicKey: string): boolean {
  return validatePublicKey(publicKey).success;
}

export function assertPublicKeyValid(publicKey: string): asserts publicKey is StellarPublicKey {
  const result = validatePublicKey(publicKey);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createStellarError(
      "PUBLIC_KEY_INVALID",
      firstIssue?.message ?? "Invalid Stellar public key"
    );
  }
}

export function validateSecretKey(
  secretKey: string
): SafeParseReturnType<string, StellarSecretKey> {
  return StellarSecretKeySchema.safeParse(secretKey);
}

export function isSecretKeyValid(secretKey: string): boolean {
  return validateSecretKey(secretKey).success;
}

export function assertSecretKeyValid(secretKey: string): asserts secretKey is StellarSecretKey {
  const result = validateSecretKey(secretKey);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createStellarError(
      "SECRET_KEY_INVALID",
      firstIssue?.message ?? "Invalid Stellar secret key"
    );
  }
}

export function validateSecretKeyQuietly(secretKey: string): {
  valid: boolean;
  errorCode?: "TOO_SHORT" | "TOO_LONG" | "BAD_PREFIX" | "BAD_CHARS";
} {
  if (typeof secretKey !== "string") {
    return { valid: false, errorCode: "BAD_PREFIX" };
  }
  if (secretKey.length < 56) return { valid: false, errorCode: "TOO_SHORT" };
  if (secretKey.length > 56) return { valid: false, errorCode: "TOO_LONG" };
  if (!secretKey.startsWith("S")) return { valid: false, errorCode: "BAD_PREFIX" };
  if (!/^S[A-Z2-7]{55}$/.test(secretKey)) return { valid: false, errorCode: "BAD_CHARS" };
  return { valid: true };
}

export function getPublicKeyFromSecret(secretKey: string): StellarPublicKey {
  assertSecretKeyValid(secretKey);
  try {
    const kp = StellarKeypairSDK.fromSecret(secretKey);
    return kp.publicKey() as StellarPublicKey;
  } catch (err) {
    throw createStellarError("SECRET_KEY_INVALID", "Secret key is structurally invalid", err);
  }
}

export function redactSecretKey(secretKey: string): RedactedSecretKey {
  const safeStr = typeof secretKey === "string" ? secretKey : "";
  const prefix = safeStr.slice(0, 4);
  const suffix = safeStr.slice(-4);
  return {
    __redacted: true,
    prefix,
    suffix,
  };
}

export function secretKeyToRedactedString(secretKey: string): string {
  if (typeof secretKey !== "string" || !secretKey) {
    return "[INVALID_SECRET_KEY]";
  }
  const result = validateSecretKeyQuietly(secretKey);
  if (!result.valid) {
    return "[INVALID_SECRET_KEY]";
  }
  return formatRedactedSecret(redactSecretKey(secretKey));
}
