import { describe, it, expect } from "vitest";

/**
 * Public package boundary integration test (issue #63).
 *
 * `scripts/check-package-boundaries.mts` statically proves no *forbidden*
 * import exists. This test proves the *positive* half of the contract: that
 * every package's documented public surface (docs/ARCHITECTURE.md §13) is
 * actually reachable through its `@anchorkit/x` entry point, from a package
 * that sits at the top of the dependency graph. If any package stopped
 * re-exporting a documented symbol from its `src/index.ts`, this file fails
 * to type-check — that's the "type-level" half of the boundary guarantee,
 * enforced by `pnpm typecheck` rather than a runtime assertion.
 */
describe("public package boundaries", () => {
  it("types: public types are importable from the package root", async () => {
    const types = await import("@anchorkit/types");
    // types is a type-only package; a successful dynamic import (an empty
    // module at runtime) is itself proof the root entry point resolves.
    expect(types).toBeDefined();
  });

  it("config: public config helpers are importable and callable from the package root", async () => {
    const { getNetworkConfig, DEFAULT_NETWORK } = await import("@anchorkit/config");
    expect(typeof getNetworkConfig).toBe("function");
    expect(getNetworkConfig(DEFAULT_NETWORK)).toBeDefined();
  });

  it("validators: public schemas are importable and usable from the package root", async () => {
    const { StellarPublicKeySchema } = await import("@anchorkit/validators");
    expect(StellarPublicKeySchema.safeParse("not-a-valid-key").success).toBe(false);
  });

  it("stellar-kit: public utilities are importable from the package root", async () => {
    const { isPublicKeyValid } = await import("@anchorkit/stellar-kit");
    expect(typeof isPublicKeyValid).toBe("function");
  });

  it("anchor-utils: this package's own public surface is importable from its root", async () => {
    const { anchorStatusBadge } = await import("@anchorkit/anchor-utils");
    expect(typeof anchorStatusBadge).toBe("function");
  });
});
