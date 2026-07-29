/**
 * Unit tests for the example validation script (issue #94).
 * Covers valid fixtures, intentionally invalid fixtures, and clear error output.
 */

import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EXAMPLE_REGISTRY,
  type ExampleEntry,
} from "../examples/registry";
import {
  runExampleValidation,
  validateExampleEntry,
} from "./check-examples.mts";

describe("validateExampleEntry", () => {
  it("passes a known-valid payment intent fixture", () => {
    const entry = EXAMPLE_REGISTRY.find((e) => e.id === "payments-valid-intent");
    expect(entry).toBeDefined();
    const result = validateExampleEntry(entry!);
    expect(result.result).toBe("pass");
    expect(result.expect).toBe("valid");
    expect(result.issues).toHaveLength(0);
  });

  it("rejects the known-invalid payment intent and returns clear issues", () => {
    const entry = EXAMPLE_REGISTRY.find((e) => e.id === "payments-invalid-intent");
    expect(entry).toBeDefined();
    const result = validateExampleEntry(entry!);
    expect(result.result).toBe("pass"); // expectation matched (invalid + rejected)
    expect(result.expect).toBe("invalid");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]?.path).toBeTruthy();
    expect(result.issues[0]?.message).toBeTruthy();
    expect(result.detail).toMatch(/correctly rejected/i);
  });

  it("fails clearly when a valid-expected fixture does not match the schema", () => {
    const dir = mkdtempSync(join(tmpdir(), "anchorkit-examples-"));
    const file = "bad-valid.json";
    writeFileSync(
      join(dir, file),
      JSON.stringify({
        sourcePublicKey: "BAD",
        destinationPublicKey: "BAD",
        asset: { type: "native", code: "XLM", issuer: null },
        amount: "1",
      }),
      "utf8"
    );

    const entry: ExampleEntry = {
      id: "tmp-bad-valid",
      path: file,
      schema: "PaymentIntent",
      expect: "valid",
    };

    const result = validateExampleEntry(entry, dir);
    expect(result.result).toBe("fail");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => /public key|exactly 56|start with/i.test(i.message))).toBe(
      true
    );
    expect(result.detail).toMatch(/unexpected failure/i);
  });

  it("fails clearly when an invalid-expected fixture accidentally validates", () => {
    const dir = mkdtempSync(join(tmpdir(), "anchorkit-examples-"));
    const valid = EXAMPLE_REGISTRY.find((e) => e.id === "assets-native-xlm")!;
    const content = readFileSync(join(process.cwd(), valid.path), "utf8");
    writeFileSync(join(dir, "should-be-invalid.json"), content, "utf8");

    const entry: ExampleEntry = {
      id: "tmp-should-be-invalid",
      path: "should-be-invalid.json",
      schema: "StellarAsset",
      expect: "invalid",
    };

    const result = validateExampleEntry(entry, dir);
    expect(result.result).toBe("fail");
    expect(result.detail).toMatch(/expected to be invalid but it validated/i);
  });

  it("reports a clear error for missing fixture files", () => {
    const entry: ExampleEntry = {
      id: "missing-file",
      path: "examples/does-not-exist.json",
      schema: "StellarAsset",
      expect: "valid",
    };
    const result = validateExampleEntry(entry);
    expect(result.result).toBe("fail");
    expect(result.issues[0]?.message).toMatch(/Could not read\/parse JSON/i);
  });
});

describe("runExampleValidation", () => {
  it("passes the full registry with zero failures", () => {
    const lines: string[] = [];
    const { failed, results } = runExampleValidation({
      log: (line) => lines.push(line),
      error: (line) => lines.push(line),
    });
    expect(failed).toBe(0);
    expect(results.length).toBe(EXAMPLE_REGISTRY.length);
    expect(results.every((r) => r.result === "pass")).toBe(true);
    expect(lines.join("\n")).toMatch(/examples checked, 0 failing/);
  });

  it("prints clear issue lines for failing entries", () => {
    const dir = mkdtempSync(join(tmpdir(), "anchorkit-examples-"));
    mkdirSync(join(dir, "examples"), { recursive: true });
    writeFileSync(
      join(dir, "examples", "broken.json"),
      JSON.stringify({ type: "issued", code: "", issuer: "nope" }),
      "utf8"
    );

    const registry: ExampleEntry[] = [
      {
        id: "broken-asset",
        path: "examples/broken.json",
        schema: "StellarAsset",
        expect: "valid",
      },
    ];

    const errors: string[] = [];
    const { failed } = runExampleValidation({
      registry,
      root: dir,
      log: () => undefined,
      error: (line) => errors.push(line),
    });

    expect(failed).toBe(1);
    expect(errors.some((line) => line.includes("•"))).toBe(true);
    expect(errors.join("\n")).toMatch(/issuer|code|Asset|public key|empty/i);
  });

  it("covers both valid and invalid registered examples", () => {
    const valid = EXAMPLE_REGISTRY.filter((e) => e.expect === "valid");
    const invalid = EXAMPLE_REGISTRY.filter((e) => e.expect === "invalid");
    expect(valid.length).toBeGreaterThan(0);
    expect(invalid.length).toBeGreaterThan(0);

    for (const entry of [...valid.slice(0, 3), ...invalid]) {
      const result = validateExampleEntry(entry);
      expect(result.result, entry.id).toBe("pass");
    }
  });
});
