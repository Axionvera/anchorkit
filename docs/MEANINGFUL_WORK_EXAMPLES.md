# Meaningful vs. insufficient AnchorKit contributions (issue #142)

> Five concrete examples — low-effort, partial, under-tested, failing-CI, and
> acceptable — grounded in this repo's actual files, so "make a meaningful
> contribution" means something more specific than good intentions.

## Why this exists

A merged PR is not the same thing as a useful one. It's easy to assume that
any change which passes review and lands on `main` was "enough" — but a
one-line rename, a happy-path-only feature, or a test that never exercises
the failure branch can all get merged while leaving the actual problem from
the issue unsolved. That gap is exactly what this page is for: five real
failure modes, each shown against actual AnchorKit code, next to what the
same contribution looks like when it's done properly.

This page doesn't replace the process docs — it's the worked-example
companion to them:

- [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) — the contribution loop and
  branch/PR conventions these examples assume.
- [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) — the
  checklist a reviewer runs against every PR; several items below map
  directly to lines in it.
- [ACCEPTANCE_CRITERIA_COMPLETION.md](./ACCEPTANCE_CRITERIA_COMPLETION.md) —
  how to show which acceptance criteria a PR actually delivers.
- [LOCAL_VERIFICATION.md](./LOCAL_VERIFICATION.md) — what `pnpm verify` runs,
  and in what order.

## How to read the examples

Each diff below is **illustrative** — a realistic PR shape built against
real files and functions in this repo, written to demonstrate the failure
mode clearly. None of these diffs have been applied to the codebase; they
are what a reviewer would see arrive in a PR.

---

## 1. Low-effort

**What it looks like:** a change that touches a real file but doesn't move
any acceptance criterion forward — a rename, a whitespace pass, or a
comment tweak with no behavioural, test, or documentation impact.

```diff
--- a/packages/stellar-kit/src/explorer.ts
+++ b/packages/stellar-kit/src/explorer.ts
@@
-export function explorerBaseUrl(network: StellarNetwork): string {
-  return EXPLORER_BASE[network] ?? EXPLORER_BASE.testnet;
+export function explorerBaseUrl(net: StellarNetwork): string {
+  return EXPLORER_BASE[net] ?? EXPLORER_BASE.testnet;
 }
```

**Why this doesn't move the project forward:**

- No issue is referenced — there is no acceptance criterion this change
  satisfies.
- `pnpm verify` passes trivially (the parameter rename is behaviourally a
  no-op), so a green check mark tells a reviewer nothing about value.
- No test changed, because there was nothing new to test.
- It still costs reviewer time: a maintainer has to open the diff, confirm
  it really is a no-op, and reject it — that's a net negative, not a
  neutral one, per [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md)'s
  "we prioritise assigned contributors over drive-by PRs" note.

A rename or formatting fix is fine _as part of_ a PR that also does
something substantive. On its own, against an unassigned issue, it's not a
contribution — it's diff noise.

---

## 2. Partial implementation

**What it looks like:** a change that satisfies the easy half of an
acceptance criterion and silently drops the other half, without saying so.

Say an issue's acceptance criteria include (this mirrors the real
`MAINTAINER_REVIEW_CHECKLIST.md` line: _"Deposit/withdrawal metadata
parsing uses the correct Zod schema"_):

```
- [ ] Deposit metadata is validated with DepositRequestMetadataSchema.
- [ ] Withdrawal metadata is validated with WithdrawalRequestMetadataSchema.
```

A partial PR:

```diff
--- a/packages/anchor-utils/src/requestValidation.ts
+++ b/packages/anchor-utils/src/requestValidation.ts
@@
+import { DepositRequestMetadataSchema } from "@anchorkit/validators";
+
+export function validateAnchorRequestMetadata(
+  kind: "deposit" | "withdrawal",
+  metadata: unknown
+) {
+  if (kind === "deposit") {
+    return DepositRequestMetadataSchema.safeParse(metadata);
+  }
+  // TODO: withdrawal path
+  return { success: true, data: metadata } as const;
+}
```

```diff
--- a/packages/anchor-utils/test/requestValidation.test.ts
+++ b/packages/anchor-utils/test/requestValidation.test.ts
@@
+it("validates deposit metadata", () => {
+  const result = validateAnchorRequestMetadata("deposit", validDeposit);
+  expect(result.success).toBe(true);
+});
```

**Why this is partial, not done:**

- The withdrawal branch doesn't validate anything — it accepts arbitrary
  `unknown` data and returns `success: true` unconditionally. That's worse
  than not having the function at all, because callers now _believe_
  withdrawal metadata has been checked.
- `pnpm test` passes: the only test asserts the deposit branch, which
  really does work. Green CI here is not evidence of a complete feature —
  it's evidence that the tested 50% works.
- The PR description would need to mark the withdrawal criterion `❌ Not
done` per [ACCEPTANCE_CRITERIA_COMPLETION.md](./ACCEPTANCE_CRITERIA_COMPLETION.md)
  — but a partial PR that doesn't call this out at all is the actual
  failure mode, not the partial code by itself. Shipping half a feature and
  saying so plainly, with a follow-up issue, is a legitimate (if
  incomplete) contribution. Shipping half a feature silently is not.

---

## 3. Under-tested

**What it looks like:** a new function with a test suite that only ever
exercises the success path, leaving every branch that returns an error
unverified.

```diff
--- a/packages/stellar-kit/src/assetDisplay.ts
+++ b/packages/stellar-kit/src/assetDisplay.ts
@@
+export function parseAssetCodeInput(
+  input: string
+): { ok: true; code: string } | { ok: false; error: string } {
+  const trimmed = input.trim().toUpperCase();
+  if (trimmed.length === 0) {
+    return { ok: false, error: "Asset code cannot be empty" };
+  }
+  if (trimmed.length > 12) {
+    return { ok: false, error: "Asset code cannot exceed 12 characters" };
+  }
+  if (!/^[A-Z0-9]+$/.test(trimmed)) {
+    return { ok: false, error: "Asset code must be alphanumeric" };
+  }
+  return { ok: true, code: trimmed };
+}
```

```diff
--- a/packages/stellar-kit/test/assetDisplay.test.ts
+++ b/packages/stellar-kit/test/assetDisplay.test.ts
@@
+describe("parseAssetCodeInput", () => {
+  it("parses a valid asset code", () => {
+    expect(parseAssetCodeInput("usdc")).toEqual({ ok: true, code: "USDC" });
+  });
+});
```

**Why this is under-tested:**

- The function has three distinct error branches (empty, too long,
  non-alphanumeric) and none of them are exercised. A future refactor could
  break any of the three checks and the suite would still be green.
- This directly violates [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md)'s
  "tests are required" rule and the
  [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) test
  coverage line: _"New public functions in `packages/` have a positive and
  a negative Vitest case."_ One positive case is not that.
- `pnpm test` and `pnpm verify` both pass — passing CI is necessary but not
  sufficient evidence of test quality. Coverage of _behaviour_, not just
  coverage of _lines_, is what the checklist is asking reviewers to check.

The same function with adequate coverage:

```diff
+  it("parses a valid asset code", () => {
+    expect(parseAssetCodeInput("usdc")).toEqual({ ok: true, code: "USDC" });
+  });
+  it("rejects an empty asset code", () => {
+    expect(parseAssetCodeInput("   ").ok).toBe(false);
+  });
+  it("rejects an asset code over 12 characters", () => {
+    expect(parseAssetCodeInput("A".repeat(13)).ok).toBe(false);
+  });
+  it("rejects non-alphanumeric input", () => {
+    expect(parseAssetCodeInput("USD-C").ok).toBe(false);
+  });
```

---

## 4. Failing-CI

**What it looks like:** a change that looks reasonable, and may even pass
`pnpm test`, but breaks one of the earlier gates in
[`pnpm verify`](./LOCAL_VERIFICATION.md) (`lint` → `typecheck` → `test` →
`build` → `format:check`) — usually because it wasn't run locally before
pushing.

AnchorKit's anchor-status switches are deliberately exhaustive. From
`packages/anchor-utils/src/index.ts`:

```ts
export function anchorStatusBadge(status: AnchorTransactionStatus): AnchorStatusBadgeStyle {
  switch (status) {
    case "pending_user": /* ... */
    case "pending_anchor": /* ... */
    case "pending_stellar": /* ... */
    case "completed": /* ... */
    case "failed": /* ... */
    case "refunded": /* ... */
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
```

Suppose an issue asks to add an `on_hold` status (anchor paused for manual
compliance review) to the SEP-style lifecycle in
[`packages/anchor-utils/src/lifecycle.ts`](../packages/anchor-utils/src/lifecycle.ts).
A PR that only updates the type and the transition table:

```diff
--- a/packages/types/src/index.ts
+++ b/packages/types/src/index.ts
@@
-export type AnchorTransactionStatus =
-  | "pending_user" | "pending_anchor" | "pending_stellar"
-  | "completed" | "failed" | "refunded";
+export type AnchorTransactionStatus =
+  | "pending_user" | "pending_anchor" | "pending_stellar" | "on_hold"
+  | "completed" | "failed" | "refunded";
```

```diff
--- a/packages/anchor-utils/src/lifecycle.ts
+++ b/packages/anchor-utils/src/lifecycle.ts
@@
 export const ALLOWED_TRANSITIONS: Readonly<...> = {
   pending_user: ["pending_anchor"],
-  pending_anchor: ["pending_stellar", "failed", "refunded"],
+  pending_anchor: ["pending_stellar", "failed", "refunded", "on_hold"],
+  on_hold: ["pending_anchor", "failed"],
   pending_stellar: ["completed", "failed", "refunded"],
   completed: [],
   failed: [],
   refunded: [],
 };
```

**Why CI fails:** `lifecycleStepLabel`'s switch (also in `lifecycle.ts`) and
`anchorStatusToUserMessage` / `anchorStatusBadge` (in
`packages/anchor-utils/src/index.ts`) are not updated for the new
`"on_hold"` case. `anchorStatusBadge`'s `default` branch assigns `status` to
a `never`-typed variable — with `on_hold` now a real member of
`AnchorTransactionStatus`, that assignment no longer type-checks. `pnpm
typecheck` (step 2 of `pnpm verify`, run before `pnpm test`) fails with a
`Type '"on_hold"' is not assignable to type 'never'` error, and the build
never reaches the test step.

This is exactly the class of bug the exhaustive-`never` pattern exists to
catch — the type system rejects the incomplete change before it can reach
a human reviewer. The lesson generalises beyond this one function: run
`pnpm verify` locally (not just `pnpm test`) before pushing, because the
gate that catches an incomplete change is often earlier in the pipeline
than the one you remembered to run.

---

## 5. Acceptable

**What it looks like:** the same `on_hold` change from the failing-CI
example, done completely — every exhaustive switch updated, both branches
tested, and the docs/PR description that let a reviewer verify it without
re-deriving the diff themselves.

```diff
--- a/packages/anchor-utils/src/index.ts
+++ b/packages/anchor-utils/src/index.ts
@@
     case "pending_stellar":
       return { headline: `${k} settling on Stellar`, /* ... */ };
+    case "on_hold":
+      return {
+        headline: `${k} on hold for manual review`,
+        detail: "The anchor has paused this request pending a compliance check.",
+        severity: "warning",
+      };
     case "completed":
@@
     case "pending_stellar":
       return { label: "Settling on Stellar", tone: "blue" };
+    case "on_hold":
+      return { label: "On Hold", tone: "amber" };
     case "completed":
```

```diff
--- a/packages/anchor-utils/test/lifecycle.test.ts
+++ b/packages/anchor-utils/test/lifecycle.test.ts
@@
+it("allows pending_anchor -> on_hold -> pending_anchor", () => {
+  expect(isTransitionValid("pending_anchor", "on_hold")).toBe(true);
+  expect(isTransitionValid("on_hold", "pending_anchor")).toBe(true);
+});
+it("allows on_hold -> failed but not on_hold -> completed", () => {
+  expect(isTransitionValid("on_hold", "failed")).toBe(true);
+  expect(isTransitionValid("on_hold", "completed")).toBe(false);
+});
```

```diff
--- a/packages/anchor-utils/test/anchor.test.ts
+++ b/packages/anchor-utils/test/anchor.test.ts
@@
+it("returns a warning message and amber badge for on_hold", () => {
+  expect(anchorStatusToUserMessage("on_hold", "deposit").severity).toBe("warning");
+  expect(anchorStatusBadge("on_hold")).toEqual({ label: "On Hold", tone: "amber" });
+});
```

Plus a short doc update noting the new status in whatever topic doc
describes the lifecycle, and — per
[ACCEPTANCE_CRITERIA_COMPLETION.md](./ACCEPTANCE_CRITERIA_COMPLETION.md) —
a completion table in the PR body:

| Acceptance Criterion                                      | Status  | Implementation Evidence                                                                         | Tests                                                                                                                                                              | Notes |
| --------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| Add `on_hold` status to the anchor transaction lifecycle. | ✅ Done | `packages/types/src/index.ts`, `packages/anchor-utils/src/lifecycle.ts` → `ALLOWED_TRANSITIONS` | `packages/anchor-utils/test/lifecycle.test.ts` → `"allows pending_anchor -> on_hold -> pending_anchor"`, `"allows on_hold -> failed but not on_hold -> completed"` |       |
| Status message/badge reflect `on_hold`.                   | ✅ Done | `packages/anchor-utils/src/index.ts` → `anchorStatusToUserMessage`, `anchorStatusBadge`         | `packages/anchor-utils/test/anchor.test.ts` → `"returns a warning message and amber badge for on_hold"`                                                            |       |

**Why this is enough:**

- Every exhaustive switch touched by the new status is updated, so
  `pnpm typecheck` passes for the reason it's supposed to — the change is
  actually complete, not just accepted by the compiler by luck.
- Both the state-machine transitions and the presentation-layer functions
  have tests, including the negative case (`on_hold -> completed` must be
  rejected).
- The PR body lets a reviewer confirm scope and evidence in one table
  instead of re-reading the whole diff to reconstruct what changed and why.
- Nothing here is gold-plated beyond the stated scope — no unrelated
  refactor, no speculative extra status, no unrequested rename. That
  restraint is itself part of "acceptable," per
  [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md)'s "no out-of-scope
  refactors" review point.

---

## Before you open a PR

If your change matches any of sections 1–4 above, it isn't ready yet —
either finish it, or say explicitly in the PR description which part is
missing and why (see
[ACCEPTANCE_CRITERIA_COMPLETION.md](./ACCEPTANCE_CRITERIA_COMPLETION.md)'s
`🟡 Partial` / `❌ Not done` guidance). Run `pnpm verify` locally, fill in
the [PR template](../.github/PULL_REQUEST_TEMPLATE.md) completely, and
paste the Phase 1 self-check from
[MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) into
your PR description before requesting review.
