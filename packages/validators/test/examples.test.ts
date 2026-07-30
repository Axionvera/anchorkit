/**
 * Example consistency tests (issue #33).
 * Validates every entry in the shared example registry against its declared
 * Zod schema. Examples marked `expect: 'invalid'` MUST fail validation;
 * all others MUST pass. This makes "invalid examples fail tests" real — a
 * drifted or broken example breaks CI.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PaymentIntentSchema,
  StellarAssetSchema,
  AnchorTransactionRecordSchema,
  MilestoneSchema,
  StellarPublicKeySchema,
  TransactionReceiptSchema,
  TransactionSummarySchema,
  StatusBadgeExampleSchema,
  AnchorMockDepositRequestSchema,
  AnchorMockDepositResponseSchema,
  AnchorMockWithdrawalRequestSchema,
  AnchorMockWithdrawalResponseSchema,
  AnchorMockStatusResponseSchema,
  AnchorMockUpdateRequestSchema,
  AnchorMockUpdateResponseSchema,
  AnchorMockErrorResponseSchema,
} from "../src/index";
import { EXAMPLE_REGISTRY } from "../../../examples/registry";

const SCHEMA_MAP = {
  PaymentIntent: PaymentIntentSchema,
  StellarAsset: StellarAssetSchema,
  AnchorTransactionRecord: AnchorTransactionRecordSchema,
  Milestone: MilestoneSchema,
  StellarPublicKeyArray: StellarPublicKeySchema,
  TransactionReceipt: TransactionReceiptSchema,
  TransactionSummary: TransactionSummarySchema,
  StatusBadgeExample: StatusBadgeExampleSchema,
  AnchorMockDepositRequest: AnchorMockDepositRequestSchema,
  AnchorMockDepositResponse: AnchorMockDepositResponseSchema,
  AnchorMockWithdrawalRequest: AnchorMockWithdrawalRequestSchema,
  AnchorMockWithdrawalResponse: AnchorMockWithdrawalResponseSchema,
  AnchorMockStatusResponse: AnchorMockStatusResponseSchema,
  AnchorMockUpdateRequest: AnchorMockUpdateRequestSchema,
  AnchorMockUpdateResponse: AnchorMockUpdateResponseSchema,
  AnchorMockErrorResponse: AnchorMockErrorResponseSchema,
} as const;

const ROOT = resolve(import.meta.dirname, "../../..");

describe("example registry", () => {
  it("is non-empty and unique by id", () => {
    expect(EXAMPLE_REGISTRY.length).toBeGreaterThan(0);
    const ids = EXAMPLE_REGISTRY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe.each(EXAMPLE_REGISTRY)("$id", (entry) => {
  it(`matches expectation (${entry.expect})`, () => {
    const raw = JSON.parse(readFileSync(resolve(ROOT, entry.path), "utf8"));
    const schema = SCHEMA_MAP[entry.schema];
    const source =
      entry.arrayKey && typeof raw === "object" && raw !== null
        ? (raw as Record<string, unknown>)[entry.arrayKey]
        : raw;
    const items = entry.isArray && Array.isArray(source) ? source : [source];

    let failures = 0;
    for (const item of items) {
      // Accounts fixtures are objects with a `publicKey` field, not bare keys.
      const target =
        entry.schema === "StellarPublicKeyArray"
          ? (item as { publicKey?: string }).publicKey
          : item;
      if (!schema.safeParse(target).success) failures++;
    }

    if (entry.expect === "valid") {
      expect(failures, `${entry.path} should validate`).toBe(0);
    } else {
      expect(failures, `${entry.path} should be invalid`).toBeGreaterThan(0);
    }
  });
});
