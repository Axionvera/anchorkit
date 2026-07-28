import { describe, test, expect } from "vitest";
import { validateIssueBatch } from "./validate-issue-batch.mts";

const LABELS_YAML = `
- name: GrantFox OSS
  color: 9443fb
- name: Maybe Rewarded
  color: f59e0b
- name: "Official Campaign | FWC26"
  color: ec4899
- name: stellar
  color: 2563eb
- name: test
  color: 0d9488
- name: expert
  color: 475569
`;

const VALID_BODY = `
### Summary
Fixes a real bug.

### Background
See docs.

### Proposed scope
**In scope**: thing
**Out of scope**: other thing

### Acceptance criteria
- [ ] Endpoint returns 404 when project does not exist

### Tests required
- foo.test.ts

### Docs required
None required

### Security and Stellar correctness notes
No secret key handling.

### Estimate
small
`;

describe("validateIssueBatch", () => {
  test("accepts a fully compliant campaign issue", () => {
    const batch = [
      {
        title: "Fix thing",
        labels: ["GrantFox OSS", "Maybe Rewarded", "Official Campaign | FWC26", "stellar", "test"],
        body: VALID_BODY,
      },
    ];
    const result = validateIssueBatch(batch, LABELS_YAML);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});

test("flags unsupported labels", () => {
  const batch = [{ title: "X", labels: ["GrantFox OSS", "monorepo", "feature"], body: "body text" }];
  const result = validateIssueBatch(batch, LABELS_YAML);
  expect(result.valid).toBe(false);
  const labelViolations = result.violations.filter((v) => v.message.includes("Unsupported label"));
  expect(labelViolations).toHaveLength(2);
});

test("flags missing required fields", () => {
  const batch = [{ title: "", labels: [], body: "" }];
  const result = validateIssueBatch(batch, LABELS_YAML);
  expect(result.valid).toBe(false);
  expect(result.violations.some((v) => v.field === "title")).toBe(true);
  expect(result.violations.some((v) => v.field === "labels")).toBe(true);
  expect(result.violations.some((v) => v.field === "body")).toBe(true);
});

test("flags missing ISSUE_STANDARD.md sections on campaign issues", () => {
  const batch = [
    {
      title: "X",
      labels: ["GrantFox OSS", "Maybe Rewarded", "Official Campaign | FWC26", "stellar", "test"],
      body: "### Summary\nJust a summary, nothing else.",
    },
  ];
  const result = validateIssueBatch(batch, LABELS_YAML);
  expect(result.valid).toBe(false);
  const missingSection = result.violations.filter((v) => v.message.includes("missing the required"));
  expect(missingSection.length).toBeGreaterThanOrEqual(6);
});

test("flags weak, unverifiable acceptance criteria", () => {
  const batch = [
    {
      title: "X",
      labels: ["GrantFox OSS", "Maybe Rewarded", "Official Campaign | FWC26", "stellar", "test"],
      body: VALID_BODY.replace("Endpoint returns 404 when project does not exist", "improve UX"),
    },
  ];
  const result = validateIssueBatch(batch, LABELS_YAML);
  expect(result.valid).toBe(false);
  expect(result.violations.some((v) => v.message.includes("Weak, unverifiable"))).toBe(true);
});

test("does not require ISSUE_STANDARD.md sections on non-campaign issues", () => {
  const batch = [{ title: "X", labels: ["stellar"], body: "just a short body" }];
  const result = validateIssueBatch(batch, LABELS_YAML);
  expect(result.valid).toBe(true);
});
