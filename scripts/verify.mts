/**
 * Local verification runner (issue #128).
 *
 * Runs the monorepo checks contributors should pass before opening a PR.
 * Default steps: lint → typecheck → test → build → format:check.
 * Pass `--full` (or use `pnpm verify:full`) to also run examples, package
 * boundary, and Soroban contract checks.
 *
 * Usage:
 *   pnpm verify
 *   pnpm verify:full
 *   tsx scripts/verify.mts --full
 */

import { spawnSync } from "node:child_process";

interface Step {
  name: string;
  command: string;
  args: string[];
}

const BASE_STEPS: Step[] = [
  { name: "lint", command: "pnpm", args: ["lint"] },
  { name: "typecheck", command: "pnpm", args: ["typecheck"] },
  { name: "test", command: "pnpm", args: ["test"] },
  { name: "build", command: "pnpm", args: ["build"] },
  { name: "format:check", command: "pnpm", args: ["format:check"] },
];

const FULL_EXTRA_STEPS: Step[] = [
  { name: "check:examples", command: "pnpm", args: ["check:examples"] },
  { name: "check:boundaries", command: "pnpm", args: ["check:boundaries"] },
  { name: "contract:test", command: "pnpm", args: ["contract:test"] },
];

function runStep(step: Step): boolean {
  console.log(`\n▶ ${step.name}`);
  console.log(`  $ ${step.command} ${step.args.join(" ")}\n`);
  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.error) {
    console.error(`\n✗ ${step.name} failed to start: ${result.error.message}`);
    return false;
  }
  if (result.status !== 0) {
    console.error(`\n✗ ${step.name} failed (exit ${result.status ?? "unknown"})`);
    return false;
  }
  console.log(`\n✓ ${step.name}`);
  return true;
}

function main(): void {
  const full = process.argv.includes("--full");
  const steps = full ? [...BASE_STEPS, ...FULL_EXTRA_STEPS] : BASE_STEPS;

  console.log("AnchorKit local verification");
  console.log(`Mode: ${full ? "full" : "standard"}`);
  console.log(`Steps: ${steps.map((s) => s.name).join(" → ")}`);

  const failed: string[] = [];
  for (const step of steps) {
    if (!runStep(step)) {
      failed.push(step.name);
      // Fail fast: stop on first failure so contributors fix one gate at a time.
      break;
    }
  }

  console.log("\n────────────────────────────────────────");
  if (failed.length === 0) {
    console.log("✓ All verification steps passed.");
    process.exit(0);
  }

  console.error(`✗ Verification failed at: ${failed.join(", ")}`);
  console.error("Fix the failing step, then re-run `pnpm verify`.");
  if (!full) {
    console.error("Tip: use `pnpm verify:full` when contracts/fixtures/imports changed.");
  }
  process.exit(1);
}

main();
