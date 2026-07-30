import { describe, expect, it } from "vitest";
import { StatusBadgeExampleSchema, StatusSeveritySchema } from "../src/schemas/statusBadge";

const validSeverity = {
  level: "success",
  label: "Confirmed",
  tone: "green",
  headline: "Transaction confirmed",
  detail: "The transaction completed successfully.",
  action: "none",
  docLink: "./docs/transaction-receipts.md",
};

describe("StatusSeveritySchema", () => {
  it("accepts a complete status display mapping", () => {
    expect(StatusSeveritySchema.safeParse(validSeverity).success).toBe(true);
  });

  it("rejects unsupported levels and empty labels", () => {
    expect(
      StatusSeveritySchema.safeParse({
        ...validSeverity,
        level: "critical",
      }).success
    ).toBe(false);
    expect(
      StatusSeveritySchema.safeParse({
        ...validSeverity,
        label: "",
      }).success
    ).toBe(false);
  });
});

describe("StatusBadgeExampleSchema", () => {
  it("accepts a known domain with a status mapping", () => {
    expect(
      StatusBadgeExampleSchema.safeParse({
        domain: "receipt",
        status: "confirmed",
        severity: validSeverity,
      }).success
    ).toBe(true);
  });

  it("rejects unknown domains and empty statuses", () => {
    expect(
      StatusBadgeExampleSchema.safeParse({
        domain: "unknown",
        status: "confirmed",
        severity: validSeverity,
      }).success
    ).toBe(false);
    expect(
      StatusBadgeExampleSchema.safeParse({
        domain: "receipt",
        status: "",
        severity: validSeverity,
      }).success
    ).toBe(false);
  });
});
