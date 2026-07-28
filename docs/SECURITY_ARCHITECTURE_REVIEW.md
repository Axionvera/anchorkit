# AnchorKit Security & Architecture Readiness Review

> Performed against the MVP codebase (v0.1.x, testnet-only). This review is
> intended to surface risks, gaps, and high-priority follow-ups as the project
> scales toward production readiness.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Package-by-package findings](#2-package-by-package-findings)
3. [Cross-cutting concerns](#3-cross-cutting-concerns)
4. [Consolidated risk register](#4-consolidated-risk-register)
5. [Missing test coverage](#5-missing-test-coverage)
6. [Documentation gaps](#6-documentation-gaps)
7. [Recommended follow-up issues](#7-recommended-follow-up-issues)

---

## 1. Executive summary

AnchorKit demonstrates a **strong security foundation** for an MVP. The project
enforces testnet-first defaults, redacts secret keys consistently, and avoids
logging sensitive data. The Soroban escrow contract has solid overflow protection
and admin-only guards on most functions.

However, the review identified **one critical contract vulnerability**, several
medium-severity gaps across packages, and significant test coverage holes that
should be addressed before any mainnet consideration.

> **Status note (issue #52):** CF-T1 (no mainnet-safety test coverage) and
> SK-S3 (mainnet guard only at the intent layer) are addressed — see their
> rows below for details. Remaining findings are unchanged.

### Severity distribution

| Severity | Count | Areas |
| --- | --- | --- |
| **Critical** | 1 | Escrow contract: missing auth on `submit_evidence` |
| **High** | 2 | Escrow: disputed milestones permanently stuck; evidence overwrite |
| **Medium** | 12 | Config tests missing, secret schema public, barrel exports, type casts, mainnet gating asymmetry |
| **Low** | 14 | Redundant regex, duplicated URL logic, missing events, naming inconsistencies |

### Positive highlights

- Zero `console.log` calls in production source code across all packages and the web app.
- Secret redaction is thorough and well-tested (`redactSecrets`, `secretKeyToRedactedString`, `formatRedactedSecret`).
- Error sanitization strips secrets from error causes before propagation.
- Consistent validation pattern: `validate` -> `is` -> `assert` triple using Zod schemas.
- Every web page displays explicit testnet-only warnings.
- Escrow contract uses `saturating_add` and `overflow-checks = true`.
- The `diagnoseAccount` function supports dependency injection for testability.

---

## 2. Package-by-package findings

### 2.1 `@anchorkit/stellar-kit`

#### Security

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| SK-S1 | MEDIUM | `test/keys.test.ts:17-18` | Hardcoded well-known test secret key (`SCZANGBA5YHT...`) may trigger secret scanners in CI. `logging.test.ts` already follows the safer pattern of generating fake secrets at runtime. |
| SK-S2 | LOW | `src/errors.ts:39` | Redundant `SA[A-Z2-7]{54}` regex pattern — already covered by `S[A-Z2-7]{55}`. |
| SK-S3 | MEDIUM | `src/intent.ts:118,163` / `src/accounts.ts:28` | ✅ **Fixed** (issue #52). Mainnet guard previously existed only at the intent layer. `loadAccount`/`getAccountStatus`/`diagnoseAccount` now gate via `assertNetworkAllowed` inside `accounts.ts#createServer`, before any Horizon call. URL builders (`explorer.ts`) remain intentionally ungated since they never touch the network. |
| SK-S4 | MEDIUM | `src/assets.ts:48,56,65,73` | Double-cast through `unknown` (`as unknown as SafeParseReturnType<string, StellarAsset>`) masks a type system mismatch in `parseAssetString` — the function signature claims `string` input but internally constructs objects for Zod parsing. |
| SK-S5 | LOW | `src/payments.ts:25-28` | `normalizeAmount` uses `Number()` without guarding `Infinity`/`NaN`. `Number("Infinity").toFixed(7)` throws `RangeError`. |
| SK-S6 | LOW | `src/payments.ts:30-36` | `compareAmounts` returns `0` (equal) for non-numeric input because `NaN < NaN` and `NaN > NaN` are both `false`. |

#### Architecture

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| SK-A1 | MEDIUM | `src/index.ts` | Barrel `export *` exposes all internals as public API with no distinction between public and private modules. |
| SK-A2 | MEDIUM | `src/errors.ts:8-16` | `createStellarError` manually assigns `.code` and `.name` to a plain `Error` instead of using a proper `class StellarKitError extends Error`. `error.constructor.name` is `"Error"`, not `"StellarKitError"`. |
| SK-A3 | LOW | `src/transactions.ts` vs `src/explorer.ts` | Duplicated Stellar Expert URL-building logic across two modules. |

#### Test gaps

| # | Priority | Module | Description |
|---|----------|--------|-------------|
| SK-T1 | HIGH | `errors.ts` | `mapHorizonError` and `sanitizeCause` have zero unit tests. |
| SK-T2 | HIGH | `intent.ts` | No tests for `createPaymentIntent`, `validatePaymentIntent`, `isPaymentIntentValid`, or any readiness functions. |
| SK-T3 | MEDIUM | `accounts.ts` | Pure helpers (`isAccountFunded`, `isAccountUnfunded`, URL builders) untested. |
| SK-T4 | MEDIUM | assertions | `assertPublicKeyValid`, `assertSecretKeyValid`, etc. not tested for thrown error shape. |

---

### 2.2 `@anchorkit/anchor-utils`

#### Security

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| AU-S1 | MEDIUM | `package.json:28-34` | `@anchorkit/config` and `@anchorkit/stellar-kit` listed as production dependencies but never imported — phantom deps inflate install and may leak config. |
| AU-S2 | LOW | `src/fixtures.ts:66,114` | Unsafe double-cast (`as unknown as BrandedType`) bypasses branded type safety in test fixtures. |

#### Architecture

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| AU-A1 | MEDIUM | `src/index.ts:21-67 + 241-268` | Two parallel validation APIs (raw Zod wrappers and engine wrappers) for the same data — confusing consumer surface. |
| AU-A2 | MEDIUM | `src/index.ts:216-230` | `advanceAnchorTransactionStatus` silently wraps to `"pending_user"` on unknown status, duplicating and conflicting with `nextStatus` in `lifecycle.ts`. |
| AU-A3 | MEDIUM | `src/lifecycle.ts:125-138` | `lifecycleStepLabel` lacks exhaustiveness check (no `never` pattern) unlike sibling functions. |
| AU-A4 | LOW | `src/fixtures.ts:8` / `src/index.ts:232` | Circular dependency between `index.ts` and `fixtures.ts`. |
| AU-A5 | LOW | `src/fixtures.ts:97-103` | `buildWithdrawalLifecycle` exports intentionally-invalid lifecycle without clear naming or warning. |

#### Test gaps

| # | Priority | Description |
|---|----------|-------------|
| AU-T1 | HIGH | `validatePaymentRailConfig`, `validateAnchorRequest`, `isAnchorTransactionStatus` have zero test coverage. |
| AU-T2 | MEDIUM | `createMockAnchorTransactionRecord` edge cases untested (default status, ID generation, metadata propagation). |

---

### 2.3 `@anchorkit/config`

#### Security

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| CF-S1 | LOW-MEDIUM | `src/index.ts:74-76` | `allowMainnet` is a plain boolean with no audit trail, warning log, or confirmation prompt. A one-line flip enables mainnet with no friction. |
| CF-S2 | LOW | `src/index.ts:6-28` | Horizon/RPC URLs are hardcoded with no override mechanism for custom endpoints. |

#### Test gaps

| # | Priority | Description |
|---|----------|-------------|
| CF-T1 | **HIGH** | ✅ **Fixed** (issue #52). `assertNetworkAllowed()` and `isMainnetAllowed()` are now covered by `packages/config/test/mainnet-safety.test.ts`, plus end-to-end gating tests in `packages/stellar-kit/test/mainnet-safety.test.ts` (`loadAccount`, `getAccountStatus`, `diagnoseAccount`, `estimateTransactionReadiness`). |

---

### 2.4 `@anchorkit/validators`

#### Security

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| VL-S1 | HIGH | `src/schemas/stellar.ts:39-50` | `StellarSecretKeySchema` is exported from the public API, enabling any consumer to parse and handle raw secret keys without redaction. Should return `RedactedSecretKey` or be removed from public exports. |
| VL-S2 | MEDIUM | `src/schemas/anchor.ts:89-104` | `CallbackUrlSchema` allows `http://localhost` regardless of network. On mainnet, HTTP callbacks for real payment confirmations would be unencrypted. |
| VL-S3 | LOW-MEDIUM | `src/schemas/stellar.ts:139-140` | `PaymentAmountSchema` uses `Number()` for large values — precision loss at ~15-17 significant digits. The `Number.isNaN` check is dead code (regex already ensures numeric strings). |
| VL-S4 | LOW | `src/schemas/stellar.ts:91-98` | Memo ID validation accepts arbitrarily large integers. Stellar memo IDs are uint64 (max `18446744073709551615`). |
| VL-S5 | LOW | `src/schemas/anchor.ts:28-29` | `feeFixed` and `feePercent` fields have no range validation — `"99999"` passes. |

#### Architecture

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| VL-A1 | MEDIUM | `src/validationEngine.ts:16-22` | Circular import: `validationEngine.ts` imports from `./index` (the barrel that also re-exports it). Should import from `./schemas/*` directly. |
| VL-A2 | MEDIUM | `src/schemas/stellar.ts:10` | Schemas depend on `DEFAULT_ENV_CONFIG` singleton for boundary values. Consumers cannot override `minimumPaymentAmount`/`maximumPaymentAmount` per-call. |
| VL-A3 | LOW | `src/schemas/anchor.ts:18` | `AnchorAssetConfigSchema` uses `z.string().min(1).max(12)` for `code` instead of the validated `AssetCodeSchema` from `stellar.ts` — accepts special characters. |

---

### 2.5 `apps/web`

#### Security

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| WEB-S1 | MEDIUM | `app/accounts/page.tsx:86,117-123` | Secret key can be re-revealed infinitely via toggle, contradicting the "Secret is only shown once" UI copy. |
| WEB-S2 | LOW | `app/layout.tsx:9` | `metadataBase` hardcoded to `http://localhost:3000` — would break on deployment. |
| WEB-S3 | LOW | `next.config.js` | No Content-Security-Policy, X-Frame-Options, or security headers configured. |

#### Architecture

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| WEB-A1 | MEDIUM | All page files | Every page is `"use client"` — zero server components, no streaming, no static generation. |
| WEB-A2 | MEDIUM | Missing files | No `error.tsx` boundaries. If Horizon calls or event parsing throw, Next.js shows a generic error page with no recovery. |
| WEB-A3 | MEDIUM | Missing files | No `loading.tsx` or `not-found.tsx` files. |
| WEB-A4 | LOW | `app/payments/page.tsx:39-50` | Six `as any` casts bypass TypeScript checking, including in payment intent construction. |

#### Positive findings

- **Zero `console.log`/`console.warn`/`console.error`** in the entire web directory.
- **No `.env` files**, no `process.env` or `NEXT_PUBLIC_*` references.
- Secret key validation input uses `type="password"`.
- `reactStrictMode: true` is enabled.

---

### 2.6 `contracts/treasury-escrow`

#### Security

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| CR-S1 | **CRITICAL** | `src/lib.rs:176-202` | **`submit_evidence` has no authorization check.** Any external account can call it on any milestone, overwriting the evidence hash. An attacker can force Draft/Active milestones into `EvidenceSubmitted` status, or silently replace evidence on disputed milestones. |
| CR-S2 | HIGH | `src/lib.rs:233-262` | **Disputed milestones are permanently stuck.** No `resolve_dispute` or `cancel_milestone` function exists. `DisputeResolutionRequired = 12` error variant is defined (`lib.rs:69`) but never used. |
| CR-S3 | HIGH | `src/lib.rs:187-195` | Evidence can be silently overwritten on `Disputed` milestones by any caller (combined with CR-S1). |
| CR-S4 | MEDIUM | `src/lib.rs:192-194` | `submit_evidence` on a `Draft` milestone skips `Active` status, bypassing amount finalization via `assign_amount`. |
| CR-S5 | LOW | `src/lib.rs:155-174` | `assign_amount` is the only state-changing function that does not emit an event — breaks auditability. |

#### Architecture

| # | Severity | File:Line | Description |
|---|----------|-----------|-------------|
| CR-A1 | LOW | `src/lib.rs:333` | `read_summary` iterates `1..=count` with `has()` checks — O(n) with no pagination. |
| CR-A2 | INFO | `src/lib.rs:145` | `u32::MAX` count overflow silently loses milestones in summary (extremely unlikely but a silent data-loss edge case). |

#### Test gaps

| # | Priority | Description |
|---|----------|-------------|
| CR-T1 | HIGH | `submit_evidence` called by non-admin — the missing auth is never exercised. |
| CR-T2 | HIGH | Submitting evidence on a Disputed milestone — the silent overwrite is untested. |
| CR-T3 | MEDIUM | `initialize` called twice — `AlreadyInitialized` error never tested. |
| CR-T4 | MEDIUM | `assign_amount` and `create_milestone` with amount=0 — `InvalidAmount` error never tested. |
| CR-T5 | MEDIUM | `dispute_milestone` on a Draft milestone — `DisputeWithoutEvidence` error never tested. |

#### Positive findings

- `overflow-checks = true` in release profile.
- `saturating_add` used for milestone count and summary aggregations.
- Admin-only enforcement on 8 of 9 state-changing functions.
- Event emission on 8 of 9 state-changing functions.

---

## 3. Cross-cutting concerns

### 3.1 Mainnet safety

The testnet-first default (`DEFAULT_ENV_CONFIG.allowMainnet = false`) is correctly
implemented at the config layer.

✅ **Fixed (issue #52):** the guard was previously enforced only at the
`intent.ts` level in stellar-kit. It is now also enforced in `accounts.ts`
(`createServer`, used by `loadAccount`/`getAccountStatus`/`diagnoseAccount`),
which is the sole entry point stellar-kit uses to reach Horizon. URL builders
in `explorer.ts` remain intentionally ungated since they only construct
strings and never make network calls.

### 3.2 Secret handling

Secret redaction is well-implemented across the codebase. The main risk is that
`StellarSecretKeySchema` is publicly exported from `@anchorkit/validators`,
enabling consumers to parse and handle raw secrets without going through the
redaction layer.

**Recommendation:** Either remove `StellarSecretKeySchema` from public exports,
or have it return `RedactedSecretKey` instead of `StellarSecretKey`.

### 3.3 Package boundary discipline

The monorepo uses workspace packages (`types`, `config`, `validators`,
`stellar-kit`, `anchor-utils`) with clear naming. However:

- `anchor-utils` has phantom dependencies on `config` and `stellar-kit` (never imported).
- `validationEngine.ts` has a circular import with its barrel.
- `stellar-kit` uses `export *` for everything, exposing internals.

**Recommendation:** Audit phantom deps, fix circular imports, and consider
explicit named exports instead of barrel `export *`.

### 3.4 Error handling patterns

- `stellar-kit` uses a brand-on-Error pattern (`createStellarError`) instead of
  proper Error subclasses. `error.constructor.name` is `"Error"`, not
  `"StellarKitError"`.
- The escrow contract defines `DisputeResolutionRequired` but never uses it.
- The web app has no error boundaries (`error.tsx`).

---

## 4. Consolidated risk register

### Critical and high

| # | Package | Severity | Description | Recommended action |
|---|---------|----------|-------------|-------------------|
| 1 | escrow | **CRITICAL** | `submit_evidence` has no auth check | Add `require_admin()` or explicit caller identity recording |
| 2 | escrow | HIGH | Disputed milestones permanently stuck | Implement `resolve_dispute` function |
| 3 | escrow | HIGH | Evidence overwritten on Disputed milestones | Restrict `submit_evidence` status guard to exclude Disputed |
| 4 | validators | HIGH | `StellarSecretKeySchema` publicly exports raw secret handling | Remove from public API or return redacted form |

### Medium

| # | Package | Description |
|---|---------|-------------|
| 5 | config | ✅ Fixed (#52) — Zero tests for `assertNetworkAllowed()` |
| 6 | stellar-kit | ✅ Fixed (#52) — `intent.ts` and `accounts.ts` mainnet guard asymmetry |
| 7 | stellar-kit | `errors.ts` and `intent.ts` have zero test coverage |
| 8 | anchor-utils | `validatePaymentRailConfig` and `validateAnchorRequest` untested |
| 9 | anchor-utils | Dual validation APIs (Zod wrappers + engine wrappers) |
| 10 | anchor-utils | `advanceAnchorTransactionStatus` silent wrap-around |
| 11 | validators | Circular import in `validationEngine.ts` |
| 12 | validators | Schemas hardwired to `DEFAULT_ENV_CONFIG` singleton |
| 13 | web | No `error.tsx` boundaries |
| 14 | web | Secret re-reveal contradicts "shown once" UI copy |
| 15 | escrow | `submit_evidence` on Draft bypasses Active status |
| 16 | stellar-kit | `parseAssetString` type signature mismatch |

---

## 5. Missing test coverage

### Packages with zero or near-zero tests

| Package | Status |
|---------|--------|
| `@anchorkit/config` | ✅ Fixed (#52) — was zero test files; see `test/mainnet-safety.test.ts`. |
| `@anchorkit/stellar-kit` `errors.ts` | No dedicated test file. `mapHorizonError` and `sanitizeCause` untested. |
| `@anchorkit/stellar-kit` `intent.ts` | No test file. All payment intent functions untested. |

### Functions with no test coverage

| Package | Function(s) |
|---------|-------------|
| `stellar-kit` | `createStellarError`, `sanitizeCause`, `mapHorizonError`, `createPaymentIntent`, `validatePaymentIntent`, `isPaymentIntentValid`, `estimateTransactionReadinessSync`, `estimateTransactionReadiness`, `loadAccount`, `getAccountStatus`, `isAccountFunded`, `isAccountUnfunded` |
| `anchor-utils` | `validatePaymentRailConfig`, `isPaymentRailConfigValid`, `validateAnchorRequest`, `isAnchorTransactionStatus` |
| `config` | `getNetworkConfig`, `assertNetworkAllowed`, `isMainnetAllowed`, `getDefaultNetworkConfig` |
| `escrow` | `submit_evidence` auth, evidence overwrite, `initialize` double-call, `assign_amount` zero, `dispute_milestone` without evidence |

---

## 6. Documentation gaps

| Area | Gap |
|------|-----|
| Escrow contract | No documentation of the `Disputed` terminal state or the missing resolution path |
| `AUTOMATION_RUNBOOK.md` | Recently added — covers automation workflows |
| Mainnet safety | ✅ Fixed (#52) — see § 3.1 above for which layers enforce the guard |
| Secret key handling | R0-R6 rules exist but `StellarSecretKeySchema` public export contradicts the spirit of the rules |
| Package boundaries | No document explaining which packages are public vs internal API |

---

## 7. Recommended follow-up issues

Based on this review, the following issues should be created (priority order):

1. **[CRITICAL] Add auth check to `submit_evidence` in escrow contract**
   - Add `require_admin()` or implement caller identity tracking
   - Add tests for non-admin calls

2. **[HIGH] Implement dispute resolution for escrow milestones**
   - Add `resolve_dispute` function (admin cancels or re-approves)
   - Implement the already-defined `DisputeResolutionRequired` error path
   - Add event emission for dispute resolution

3. **[HIGH] Restrict evidence overwrite on disputed milestones**
   - Update status guard in `submit_evidence` to reject `Disputed` status
   - Add test coverage

4. **[HIGH] Add tests for `@anchorkit/config`** — ✅ Done (#52)
   - Test `assertNetworkAllowed()` with testnet (pass) and mainnet (throw)
   - Test `getNetworkConfig()` with valid and invalid inputs
   - Test `isMainnetAllowed()` boundary values

5. **[MEDIUM] Add tests for `stellar-kit` `errors.ts` and `intent.ts`**
   - Test `mapHorizonError` with various Horizon error shapes
   - Test `sanitizeCause` with secrets in error messages
   - Test `createPaymentIntent` happy path and validation failures
   - Test `estimateTransactionReadiness` with mainnet guard

6. **[MEDIUM] Remove or restrict `StellarSecretKeySchema` from public exports**
   - Either return `RedactedSecretKey` or remove from barrel export

7. **[MEDIUM] Add error boundaries to web app**
   - Add `app/error.tsx` as global error boundary
   - Add per-route boundaries for pages with network calls

8. **[MEDIUM] Fix circular import in validators**
   - `validationEngine.ts` should import from `./schemas/*` directly

9. **[MEDIUM] Remove phantom dependencies from anchor-utils**
   - Remove `@anchorkit/config` and `@anchorkit/stellar-kit` from production deps

10. **[LOW] Emit event for `assign_amount` in escrow contract**
    - Add event emission consistent with other state-changing functions

---

*This review covers the AnchorKit MVP codebase as of July 2026. It is intended
as a point-in-time assessment. Re-review is recommended after the high-priority
items are addressed.*
