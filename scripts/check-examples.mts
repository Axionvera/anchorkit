/**
 * Example / fixture validation script (issues #33, #94).
 *
 * Validates every entry in `examples/registry.ts` against the Zod schema it
 * declares. Examples marked `expect: 'invalid'` must FAIL validation; all
 * others must PASS.
 *
 * Exits non-zero on any mismatch so it can gate CI (`pnpm check:examples`)
 * or local contributor checks.
 *
 * Usage:
 *   pnpm check:examples
 *   pnpm check:examples --verbose
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ZodTypeAny } from "zod";
import {
  PaymentIntentSchema,
  StellarAssetSchema,
  AnchorTransactionRecordSchema,
  MilestoneSchema,
  StellarPublicKeySchema,
  TransactionReceiptSchema,
} from "@anchorkit/validators";
import { EXAMPLE_REGISTRY, type ExampleEntry } from "../examples/registry";

export const ROOT = resolve(import.meta.dirname, "..");

export const SCHEMA_MAP = {
  PaymentIntent: PaymentIntentSchema,
  StellarAsset: StellarAssetSchema,
  AnchorTransactionRecord: AnchorTransactionRecordSchema,
  Milestone: MilestoneSchema,
  StellarPublicKeyArray: StellarPublicKeySchema,
  TransactionReceipt: TransactionReceiptSchema,
} as const;

export type SchemaName = keyof typeof SCHEMA_MAP;

export interface ExampleIssue {
  /** JSON-path-like location within the fixture item. */
  path: string;
  message: string;
}

export interface ExampleValidationResult {
  id: string;
  path: string;
  expect: ExampleEntry["expect"];
  result: "pass" | "fail";
  detail: string;
  /** Schema issues collected while validating (useful for clear error output). */
  issues: ExampleIssue[];
}

function formatZodIssues(error: { issues: Array<{ path: (string | number)[]; message: string }> }): ExampleIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

function loadFixtureItems(entry: ExampleEntry, root = ROOT): { items: unknown[]; issues: ExampleIssue[] } {
  const filePath = resolve(root, entry.path);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (err) {
    return {
      items: [],
      issues: [
        {
          path: entry.path,
          message: `Could not read/parse JSON: ${(err as Error).message}`,
        },
      ],
    };
  }

  const source =
    entry.arrayKey && typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)[entry.arrayKey]
      : raw;

  if (entry.arrayKey && source === undefined) {
    return {
      items: [],
      issues: [
        {
          path: entry.arrayKey,
          message: `Missing array key "${entry.arrayKey}" in ${entry.path}`,
        },
      ],
    };
  }

  const items = entry.isArray && Array.isArray(source) ? source : [source];
  return { items, issues: [] };
}

function validateItem(schema: ZodTypeAny, entry: ExampleEntry, item: unknown): ExampleIssue[] {
  const target =
    entry.schema === "StellarPublicKeyArray"
      ? (item as { publicKey?: string }).publicKey
      : item;
  const res = schema.safeParse(target);
  if (res.success) return [];
  return formatZodIssues(res.error);
}

/**
 * Validate one registry entry against its shared Zod schema.
 * Exported for unit tests and CI wrappers.
 */
export function validateExampleEntry(entry: ExampleEntry, root = ROOT): ExampleValidationResult {
  const schema = SCHEMA_MAP[entry.schema];
  const loaded = loadFixtureItems(entry, root);
  if (loaded.issues.length > 0 && loaded.items.length === 0) {
    return {
      id: entry.id,
      path: entry.path,
      expect: entry.expect,
      result: "fail",
      detail: loaded.issues[0]?.message ?? "Failed to load fixture",
      issues: loaded.issues,
    };
  }

  const issues: ExampleIssue[] = [...loaded.issues];
  for (let i = 0; i < loaded.items.length; i++) {
    const itemIssues = validateItem(schema, entry, loaded.items[i]);
    for (const issue of itemIssues) {
      issues.push({
        path: entry.isArray ? `[${i}].${issue.path}` : issue.path,
        message: issue.message,
      });
    }
  }

  const ok = issues.length === 0;
  const matchedExpectation =
    (entry.expect === "valid" && ok) || (entry.expect === "invalid" && !ok);

  let detail: string;
  if (matchedExpectation) {
    detail =
      entry.expect === "valid"
        ? "validated against schema"
        : `correctly rejected (${issues.length} issue(s))`;
  } else if (ok) {
    detail = "expected to be invalid but it validated";
  } else {
    detail = `unexpected failure (${issues.length} issue(s))`;
  }

  return {
    id: entry.id,
    path: entry.path,
    expect: entry.expect,
    result: matchedExpectation ? "pass" : "fail",
    detail,
    issues,
  };
}

export interface RunExampleValidationOptions {
  registry?: readonly ExampleEntry[];
  root?: string;
  verbose?: boolean;
  /** Override stdout/stderr for tests. */
  log?: (line: string) => void;
  error?: (line: string) => void;
}

/**
 * Run validation for the full registry. Returns the number of failing entries.
 */
export function runExampleValidation(options: RunExampleValidationOptions = {}): {
  failed: number;
  results: ExampleValidationResult[];
} {
  const registry = options.registry ?? EXAMPLE_REGISTRY;
  const root = options.root ?? ROOT;
  const verbose = options.verbose ?? false;
  const log = options.log ?? ((line: string) => console.log(line));
  const error = options.error ?? ((line: string) => console.error(line));

  log("AnchorKit example validation\n");

  const results: ExampleValidationResult[] = [];
  let failed = 0;

  for (const entry of registry) {
    const row = validateExampleEntry(entry, root);
    results.push(row);
    const icon = row.result === "pass" ? "✓" : "✗";
    log(`  ${icon} ${row.id}  [expect ${row.expect}]  ${row.detail}`);

    const shouldPrintIssues =
      row.result === "fail" || (verbose && row.issues.length > 0);
    if (shouldPrintIssues && row.issues.length > 0) {
      for (const issue of row.issues.slice(0, 12)) {
        const line = `      • ${issue.path}: ${issue.message}`;
        if (row.result === "fail") error(line);
        else log(line);
      }
      if (row.issues.length > 12) {
        const more = `      … and ${row.issues.length - 12} more issue(s)`;
        if (row.result === "fail") error(more);
        else log(more);
      }
    }

    if (row.result === "fail") failed++;
  }

  log(`\n${registry.length} examples checked, ${failed} failing.`);
  return { failed, results };
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && entry.includes("check-examples"));
}

if (isMainModule()) {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const verbose = args.includes("--verbose") || args.includes("-v");
  const { failed } = runExampleValidation({ verbose });
  if (failed > 0) process.exit(1);
}
