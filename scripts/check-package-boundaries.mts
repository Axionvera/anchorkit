/**
 * Package boundary enforcement (issue #63).
 *
 * Statically scans every TypeScript file under each package's src directory
 * and fails if it finds an import that violates the dependency direction
 * documented in
 * `docs/ARCHITECTURE.md` (sections 3 and 12): a package importing a peer it
 * isn't allowed to depend on, a deep import that reaches past another
 * package's public entry point into its `src/` directory, or any package
 * importing from `apps/web`.
 *
 * This is deliberately a standalone, dependency-free static check (matching
 * `check-examples.mts`) rather than a vitest test, so it can run before
 * `pnpm install` resolves workspace packages and gate CI on its own.
 *
 * Usage: `pnpm check:boundaries` (runs via tsx).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const PACKAGES_DIR = join(ROOT, "packages");

/**
 * The allowed AnchorKit package dependencies, per docs/ARCHITECTURE.md §3.
 * A package not listed here, or an entry missing from this map, is treated
 * as having no internal AnchorKit dependencies allowed.
 */
const ALLOWED_DEPENDENCIES: Record<string, string[]> = {
  types: [],
  config: ["types"],
  validators: ["types", "config"],
  "stellar-kit": ["types", "config", "validators"],
  "anchor-utils": ["types", "config", "validators", "stellar-kit"],
};

const PACKAGE_NAMES = Object.keys(ALLOWED_DEPENDENCIES);

type Violation = {
  file: string;
  line: number;
  message: string;
};

function getTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getTsFiles(fullPath));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkPackage(pkgName: string, violations: Violation[]) {
  const srcDir = join(PACKAGES_DIR, pkgName, "src");
  try {
    statSync(srcDir);
  } catch {
    return; // package has no src/ (shouldn't happen, but don't crash the check)
  }

  const allowed = new Set(ALLOWED_DEPENDENCIES[pkgName] ?? []);

  for (const file of getTsFiles(srcDir)) {
    const relFile = relative(ROOT, file);
    const lines = readFileSync(file, "utf-8").split("\n");

    lines.forEach((line, index) => {
      // 1. Cross-package imports via the public "@anchorkit/x" specifier.
      const pkgImport = line.match(/from\s+['"]@anchorkit\/([a-z-]+)['"]/);
      if (pkgImport) {
        const importedPkg = pkgImport[1];
        if (importedPkg === "web") {
          violations.push({
            file: relFile,
            line: index + 1,
            message: `"${pkgName}" imports from "apps/web" (@anchorkit/web) — no package may depend on the web app.`,
          });
        } else if (PACKAGE_NAMES.includes(importedPkg) && !allowed.has(importedPkg)) {
          violations.push({
            file: relFile,
            line: index + 1,
            message: `"${pkgName}" imports "@anchorkit/${importedPkg}", which isn't in its allowed dependency list [${[...allowed].join(", ") || "none"}]. See docs/ARCHITECTURE.md §3.`,
          });
        }
      }

      // 2. Deep relative imports reaching into another package's src/,
      //    bypassing its public entry point entirely.
      const deepImport = line.match(/from\s+['"](\.\.\/)+packages\/([a-z-]+)\/src/);
      if (deepImport) {
        violations.push({
          file: relFile,
          line: index + 1,
          message: `Deep relative import into "packages/${deepImport[2]}/src" — import from "@anchorkit/${deepImport[2]}" instead. See docs/ARCHITECTURE.md §13.`,
        });
      }

      // 3. Any import of apps/web by relative path.
      if (/from\s+['"](\.\.\/)+apps\/web/.test(line)) {
        violations.push({
          file: relFile,
          line: index + 1,
          message: `"${pkgName}" imports from "apps/web" by relative path — no package may depend on the web app.`,
        });
      }
    });
  }
}

function main() {
  const violations: Violation[] = [];

  for (const pkgName of PACKAGE_NAMES) {
    checkPackage(pkgName, violations);
  }

  if (violations.length > 0) {
    console.error(`\n❌ Found ${violations.length} package boundary violation(s):\n`);
    for (const v of violations) {
      console.error(`   ${v.file}:${v.line}`);
      console.error(`      ${v.message}\n`);
    }
    process.exit(1);
  } else {
    console.log(
      `\n✓ Package boundary check passed cleanly across ${PACKAGE_NAMES.length} packages in packages/.\n`,
    );
    process.exit(0);
  }
}

main();
