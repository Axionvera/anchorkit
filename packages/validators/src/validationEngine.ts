/**
 * Anchor validation engine.
 *
 * Provides a single, uniform surface for validating anchor deposit/withdrawal
 * request metadata, anchor asset configuration, and callback URLs. Every
 * validator returns a `ValidationResult<T>` — never throws — with typed,
 * user-safe errors so UI/forms and package helpers can branch without parsing
 * Zod internals.
 *
 * This is the shared engine issue #6 asks for. The underlying Zod schemas
 * (`DepositRequestMetadataSchema`, etc.) live in this same package; the engine
 * wraps them in a stable, consumer-friendly result type.
 */

import { z } from 'zod';
import {
  DepositRequestMetadataSchema,
  WithdrawalRequestMetadataSchema,
  AnchorAssetConfigSchema,
  CallbackUrlSchema,
  PaymentAmountSchema,
  PaymentIntentSchema,
} from './index';
import type {
  DepositRequestMetadata,
  WithdrawalRequestMetadata,
  AnchorAssetConfig,
  AnchorKitErrorCategory,
} from '@anchorkit/types';
import { redactSecrets } from '@anchorkit/types';

/** Stable error codes for anchor validation failures (UI may branch on these). */
export type AnchorValidationErrorCode =
  | 'INVALID_DEPOSIT_METADATA'
  | 'INVALID_WITHDRAWAL_METADATA'
  | 'INVALID_ASSET_CONFIG'
  | 'INVALID_CALLBACK_URL'
  | 'INVALID_AMOUNT'
  | 'INVALID_ACCOUNT'
  | 'INVALID_DESTINATION'
  | 'INVALID_READINESS_INPUT'
  | 'SCHEMA_ERROR';


/** A single typed, user-safe validation error. */
export interface ValidationError {
  /** Shared error category. */
  category?: AnchorKitErrorCategory;
  /** Stable code (safe to branch on in UI). */
  code: AnchorValidationErrorCode;
  /** Human-readable, user-safe message (never contains secrets). */
  message: string;
  /** The field path the error relates to, if known. */
  field?: string;
}

/** Uniform result returned by every engine validator. */
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

/** Map a Zod error into typed, user-safe anchor validation errors. */
function toValidationErrors(
  code: AnchorValidationErrorCode,
  error: z.ZodError,
): ValidationError[] {
  if (error.issues.length === 0) {
    return [{ category: 'VALIDATION', code, message: 'Validation failed.' }];
  }
  return error.issues.map((issue) => ({
    category: 'VALIDATION',
    code,
    message: redactSecrets(issue.message),
    field: issue.path.join('.') || undefined,
  }));
}

/** Validate anchor deposit request metadata. */
export function validateDepositRequest(
  input: unknown,
): ValidationResult<DepositRequestMetadata> {
  const result = DepositRequestMetadataSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, errors: toValidationErrors('INVALID_DEPOSIT_METADATA', result.error) };
}

/** Validate anchor withdrawal request metadata. */
export function validateWithdrawalRequest(
  input: unknown,
): ValidationResult<WithdrawalRequestMetadata> {
  const result = WithdrawalRequestMetadataSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  return {
    ok: false,
    errors: toValidationErrors('INVALID_WITHDRAWAL_METADATA', result.error),
  };
}

/** Validate an anchor asset configuration. */
export function validateAnchorAssetConfig(
  input: unknown,
): ValidationResult<AnchorAssetConfig> {
  const result = AnchorAssetConfigSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, errors: toValidationErrors('INVALID_ASSET_CONFIG', result.error) };
}

/** Validate a callback URL. */
export function validateCallbackUrl(input: string): ValidationResult<string> {
  const result = CallbackUrlSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, errors: toValidationErrors('INVALID_CALLBACK_URL', result.error) };
}

/** Validate a raw amount string against Stellar payment rules. */
export function validateAmount(input: unknown): ValidationResult<string> {
  const result = PaymentAmountSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, errors: toValidationErrors('INVALID_AMOUNT', result.error) };
}

/** Validate raw payment intent structure for readiness processing. */
export function validateReadinessInput(input: unknown): ValidationResult<PaymentIntent> {
  const result = PaymentIntentSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, errors: toValidationErrors('INVALID_READINESS_INPUT', result.error) };
}

/** Convenience: first user-safe message, or undefined. */
export function firstErrorMessage(result: ValidationResult<unknown>): string | undefined {
  return result.ok ? undefined : result.errors[0]?.message;
}

