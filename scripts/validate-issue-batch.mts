/**
 * GrantFox issue batch quality validator (issue #64).
 *
 * Validates a batch JSON file (array of {title, labels, body}) intended for
 * `gh issue create` against docs/ISSUE_STANDARD.md before any issues are
 * created on GitHub. Catches unsupported labels, missing required fields,
 * missing ISSUE_STANDARD.md sections on campaign-labelled issues, and weak
 * acceptance criteria.
 *
 * Usage: `pnpm validate:issues <path-to-batch.json>`
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface IssueBatchEntry {
  title: string;
  labels: string[];
  body: string;
}

export interface Violation {
  entryIndex: number;
  entryTitle: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
}

const REQUIRED_STANDARD_SECTIONS = [
  "Summary",
  "Background",
  "Proposed scope",
  "Acceptance criteria",
  "Tests required",
  "Docs required",
  "Security and Stellar correctness notes",
  "Estimate",
] as const;

const CAMPAIGN_LABELS = ["GrantFox OSS", "Maybe Rewarded", "Official Campaign | FWC26"] as const;

const SCOPE_LABELS = ["stellar", "soroban", "anchor", "sep", "wallet", "payments", "escrow"];
const TYPE_LABELS = ["security", "test", "documentation", "bug", "enhancement"];
const DIFFICULTY_LABELS = ["good first issue", "expert"];

const WEAK_ACCEPTANCE_PHRASES = [
  "improve ux",
  "improve performance",
  "make it better",
  "should work well",
  "handle edge cases",
  "is user friendly",
  "looks good",
  "works correctly",
];

function parseLabelsYaml(yamlText: string): Set<string> {
  const names = new Set<string>();
  const lines = yamlText.split("\n");
  for (const line of lines) {
    const match = line.match(/^-\s+name:\s+(.+)$/);
    if (!match) continue;
    let raw = match[1].trim();
    if (raw.startsWith('"') && raw.endsWith('"')) {
      raw = raw.slice(1, -1);
    }
    names.add(raw);
  }
  return names;
}

function checkRequiredFields(entry: unknown, index: number, violations: Violation[]): entry is IssueBatchEntry {
  if (typeof entry !== "object" || entry === null) {
    violations.push({ entryIndex: index, entryTitle: "(unknown)", field: "entry", message: "Entry is not an object." });
    return false;
  }
  const e = entry as Record<string, unknown>;
  let ok = true;
  const titleForMessage = typeof e.title === "string" ? e.title : "(missing title)";

  if (typeof e.title !== "string" || e.title.trim() === "") {
    violations.push({ entryIndex: index, entryTitle: titleForMessage, field: "title", message: "Missing or empty required field: title." });
    ok = false;
  }
  if (!Array.isArray(e.labels) || e.labels.length === 0) {
    violations.push({ entryIndex: index, entryTitle: titleForMessage, field: "labels", message: "Missing or empty required field: labels (must be a non-empty array)." });
    ok = false;
  }
  if (typeof e.body !== "string" || e.body.trim() === "") {
    violations.push({ entryIndex: index, entryTitle: titleForMessage, field: "body", message: "Missing or empty required field: body." });
    ok = false;
  }
  return ok;
}

function checkLabels(entry: IssueBatchEntry, index: number, knownLabels: Set<string>, violations: Violation[]) {
  for (const label of entry.labels) {
    if (!knownLabels.has(label)) {
      violations.push({ entryIndex: index, entryTitle: entry.title, field: "labels", message: `Unsupported label "${label}" — not defined in .github/LABELS.yml.` });
    }
  }

  const isCampaignIssue = CAMPAIGN_LABELS.every((l) => entry.labels.includes(l));
  if (isCampaignIssue) {
    const hasScope = SCOPE_LABELS.some((l) => entry.labels.includes(l));
    const hasType = TYPE_LABELS.some((l) => entry.labels.includes(l));
    const difficultyCount = DIFFICULTY_LABELS.filter((l) => entry.labels.includes(l)).length;

    if (!hasScope) {
      violations.push({ entryIndex: index, entryTitle: entry.title, field: "labels", message: `Campaign issue missing a scope label (one of: ${SCOPE_LABELS.join(", ")}).` });
    }
    if (!hasType) {
      violations.push({ entryIndex: index, entryTitle: entry.title, field: "labels", message: `Campaign issue missing a type label (one of: ${TYPE_LABELS.join(", ")}).` });
    }
    if (difficultyCount > 1) {
      violations.push({ entryIndex: index, entryTitle: entry.title, field: "labels", message: `Campaign issue has both "good first issue" and "expert" — pick at most one.` });
    }
  }
}

function checkBodyStandard(entry: IssueBatchEntry, index: number, violations: Violation[]) {
  const isCampaignIssue = CAMPAIGN_LABELS.every((l) => entry.labels.includes(l));
  if (!isCampaignIssue) return;

  for (const section of REQUIRED_STANDARD_SECTIONS) {
    const headingPattern = new RegExp(`(^|\\n)#{1,4}\\s*${section}\\b`, "i");
    if (!headingPattern.test(entry.body)) {
      violations.push({ entryIndex: index, entryTitle: entry.title, field: "body", message: `Campaign issue is missing the required "${section}" section per docs/ISSUE_STANDARD.md.` });
    }
  }

  const acceptanceMatch = entry.body.match(/#{1,4}\s*Acceptance criteria\b([\s\S]*?)(\n#{1,4}\s|$)/i);
  if (acceptanceMatch) {
    const section = acceptanceMatch[1];
    const checkboxLines = section.split("\n").filter((l) => /^\s*-\s*\[[ x]\]/i.test(l));
    if (checkboxLines.length === 0) {
      violations.push({ entryIndex: index, entryTitle: entry.title, field: "body", message: `Acceptance criteria section has no checkbox items ("- [ ] ...").` });
    }
    for (const line of checkboxLines) {
      const lower = line.toLowerCase();
      const weakPhrase = WEAK_ACCEPTANCE_PHRASES.find((p) => lower.includes(p));
      if (weakPhrase) {
        violations.push({ entryIndex: index, entryTitle: entry.title, field: "body", message: `Weak, unverifiable acceptance criterion (contains "${weakPhrase}"): "${line.trim()}"` });
      }
    }
  }
}

export function validateIssueBatch(batch: unknown[], labelsYamlText: string): ValidationResult {
  const knownLabels = parseLabelsYaml(labelsYamlText);
  const violations: Violation[] = [];

  batch.forEach((entry, index) => {
    if (!checkRequiredFields(entry, index, violations)) return;
    checkLabels(entry, index, knownLabels, violations);
    checkBodyStandard(entry, index, violations);
  });

  return { valid: violations.length === 0, violations };
}

function main() {
  const batchPath = process.argv[2];
  if (!batchPath) {
    console.error("Usage: pnpm validate:issues <path-to-batch.json>");
    process.exit(1);
  }

  const root = process.cwd();
  const labelsYamlText = readFileSync(resolve(root, ".github/LABELS.yml"), "utf-8");
  const batchRaw = readFileSync(resolve(root, batchPath), "utf-8");

  let batch: unknown;
  try {
    batch = JSON.parse(batchRaw);
  } catch (err) {
    console.error(`❌ Failed to parse ${batchPath} as JSON: ${(err as Error).message}`);
    process.exit(1);
  }

  if (!Array.isArray(batch)) {
    console.error(`❌ ${batchPath} must contain a top-level JSON array of issue entries.`);
    process.exit(1);
  }

  const result = validateIssueBatch(batch, labelsYamlText);

  if (result.valid) {
    console.log(`\n✓ Issue batch "${batchPath}" passed validation (${batch.length} entries).\n`);
    process.exit(0);
  } else {
    console.error(`\n❌ Found ${result.violations.length} issue(s) across ${batch.length} entries in "${batchPath}":\n`);
    for (const v of result.violations) {
      console.error(`   [entry ${v.entryIndex}] "${v.entryTitle}" — ${v.field}`);
      console.error(`      ${v.message}\n`);
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
