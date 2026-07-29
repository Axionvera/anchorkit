/**
 * Fixture/example consistency checker (issue #33).
 *
 * Validates every entry in `examples/registry.ts` against the Zod schema it
 * declares. Examples marked `expect: 'invalid'` must FAIL validation; all
 * others must PASS. Exits non-zero on any mismatch so it can gate CI or a
 * local `pnpm check:examples` run.
 *
 * Usage: `pnpm check:examples` (runs via tsx).
 */

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
  AnchorMockDepositRequestSchema,
  AnchorMockDepositResponseSchema,
  AnchorMockWithdrawalRequestSchema,
  AnchorMockWithdrawalResponseSchema,
  AnchorMockStatusResponseSchema,
  AnchorMockUpdateRequestSchema,
  AnchorMockUpdateResponseSchema,
  AnchorMockErrorResponseSchema,
} from "@anchorkit/validators";
import { EXAMPLE_REGISTRY } from "../examples/registry";

const ROOT = resolve(import.meta.dirname, "..");

const SCHEMA_MAP = {
  PaymentIntent: PaymentIntentSchema,
  StellarAsset: StellarAssetSchema,
  AnchorTransactionRecord: AnchorTransactionRecordSchema,
  Milestone: MilestoneSchema,
  StellarPublicKeyArray: StellarPublicKeySchema,
  TransactionReceipt: TransactionReceiptSchema,
  TransactionSummary: TransactionSummarySchema,
  AnchorMockDepositRequest: AnchorMockDepositRequestSchema,
  AnchorMockDepositResponse: AnchorMockDepositResponseSchema,
  AnchorMockWithdrawalRequest: AnchorMockWithdrawalRequestSchema,
  AnchorMockWithdrawalResponse: AnchorMockWithdrawalResponseSchema,
  AnchorMockStatusResponse: AnchorMockStatusResponseSchema,
  AnchorMockUpdateRequest: AnchorMockUpdateRequestSchema,
  AnchorMockUpdateResponse: AnchorMockUpdateResponseSchema,
  AnchorMockErrorResponse: AnchorMockErrorResponseSchema,
} as const;

interface ReportRow {
  id: string;
  path: string;
  expect: string;
  result: "pass" | "fail";
  detail: string;
}

function validateEntry(entry: (typeof EXAMPLE_REGISTRY)[number]): ReportRow {
  const filePath = resolve(ROOT, entry.path);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (err) {
    return {
      id: entry.id,
      path: entry.path,
      expect: entry.expect,
      result: "fail",
      detail: `Could not read/parse JSON: ${(err as Error).message}`,
    };
  }

  const schema = SCHEMA_MAP[entry.schema];
  const source =
    entry.arrayKey && typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)[entry.arrayKey]
      : raw;
  const items = entry.isArray && Array.isArray(source) ? source : [source];

  let failures = 0;
  const messages: string[] = [];
  for (const item of items) {
    // Accounts fixtures are objects with a `publicKey` field, not bare keys.
    const target =
      entry.schema === "StellarPublicKeyArray" ? (item as { publicKey?: string }).publicKey : item;
    const res = schema.safeParse(target);
    if (!res.success) {
      failures++;
      messages.push(res.error.issues[0]?.message ?? "invalid");
    }
  }

  const ok = failures === 0;
  const matchedExpectation =
    (entry.expect === "valid" && ok) || (entry.expect === "invalid" && !ok);

  return {
    id: entry.id,
    path: entry.path,
    expect: entry.expect,
    result: matchedExpectation ? "pass" : "fail",
    detail: matchedExpectation
      ? entry.expect === "valid"
        ? "validated against schema"
        : `correctly rejected (${failures} issue(s))`
      : ok
        ? "expected to be invalid but it validated"
        : `unexpected failure: ${messages.join("; ")}`,
  };
}

let failed = 0;
console.log("AnchorKit example consistency check\n");
for (const entry of EXAMPLE_REGISTRY) {
  const row = validateEntry(entry);
  const icon = row.result === "pass" ? "✓" : "✗";
  console.log(`  ${icon} ${row.id}  [expect ${row.expect}]  ${row.detail}`);
  if (row.result === "fail") failed++;
}

console.log(`\n${EXAMPLE_REGISTRY.length} examples checked, ${failed} failing.`);
if (failed > 0) process.exit(1);
