import type { MemoInput, MemoType } from "@anchorkit/types";
import { MemoInputSchema, PaymentAmountSchema } from "@anchorkit/validators";
import type { SafeParseReturnType } from "zod";
import { createStellarError } from "./errors";

export function validateAmount(amount: string): SafeParseReturnType<string, string> {
  return PaymentAmountSchema.safeParse(amount);
}

export function isAmountValid(amount: string): boolean {
  return validateAmount(amount).success;
}

export function assertAmountValid(amount: string): void {
  const result = validateAmount(amount);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createStellarError(
      "AMOUNT_INVALID",
      firstIssue?.message ?? "Invalid payment amount"
    );
  }
}

export function normalizeAmount(amount: string): string {
  const n = Number(amount);
  return n.toFixed(7);
}

export function compareAmounts(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}

export function isAmountGreaterThan(a: string, b: string): boolean {
  return compareAmounts(a, b) > 0;
}

export function isAmountLessThan(a: string, b: string): boolean {
  return compareAmounts(a, b) < 0;
}

export function validateMemo(memo: Partial<MemoInput>): SafeParseReturnType<MemoInput, MemoInput> {
  const safe: MemoInput = {
    type: (memo.type as MemoType) ?? "none",
    value: memo.value ?? "",
  };
  return MemoInputSchema.safeParse(safe);
}

export function isMemoValid(memo: Partial<MemoInput>): boolean {
  return validateMemo(memo).success;
}

export function assertMemoValid(memo: Partial<MemoInput>): void {
  const result = validateMemo(memo);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw createStellarError("MEMO_INVALID", firstIssue?.message ?? "Invalid memo");
  }
}

export function memoLengthTextBytes(value: string): number {
  const encoder = new TextEncoder();
  return encoder.encode(value).length;
}

export function createEmptyMemo(): MemoInput {
  return { type: "none", value: "" };
}

export function createTextMemo(value: string): MemoInput {
  return { type: "text", value };
}

export function createIdMemo(id: string): MemoInput {
  return { type: "id", value: id };
}
