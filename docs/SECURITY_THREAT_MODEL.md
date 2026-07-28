# Security Threat Model

> AnchorKit MVP (v0.1.x) — testnet-only by default, **not production custody software**.
>
> This document identifies threat areas, attack surfaces, mitigations, assumptions,
> and out-of-scope production behaviours across the entire monorepo. It is the
> single source of truth for security reasoning; individual package READMEs and
> code comments may reference this file but should not contain standalone threat
> claims.

---

## Table of contents

1. [Scope and audience](#1-scope-and-audience)
2. [Threat actors](#2-threat-actors)
3. [High-level system boundaries](#3-high-level-system-boundaries)
4. [Threat area 1 — Stellar secret key handling](#4-threat-area-1--stellar-secret-key-handling)
5. [Threat area 2 — Payment intent validation](#5-threat-area-2--payment-intent-validation)
6. [Threat area 3 — Transaction readiness](#6-threat-area-3--transaction-readiness)
7. [Threat area 4 — Anchor metadata and lifecycle](#7-threat-area-4--anchor-metadata-and-lifecycle)
8. [Threat area 5 — Account diagnostics](#8-threat-area-5--account-diagnostics)
9. [Threat area 6 — Soroban escrow contract](#9-threat-area-6--soroban-escrow-contract)
10. [Threat area 7 — Unsafe logging and diagnostics](#10-threat-area-7--unsafe-logging-and-diagnostics)
11. [Threat area 8 — Mainnet risks and testnet assumptions](#11-threat-area-8--mainnet-risks-and-testnet-assumptions)
12. [Threat area 9 — Web dashboard](#12-threat-area-9--web-dashboard)
13. [Consolidated risk register](#13-consolidated-risk-register)
14. [Assumptions](#14-assumptions)
15. [Out-of-scope production behaviours](#15-out-of-scope-production-behaviours)
16. [Review requirements](#16-review-requirements)

---

## 1. Scope and audience

This threat model covers:

| In scope | Out of scope |
|----------|-------------|
| `@anchorkit/stellar-kit` — keypairs, accounts, assets, payments, intents, readiness, receipts, diagnostics, explorer links, escrow event mapping, logging | Browser extension security, OS keychain integration |
| `@anchorkit/anchor-utils` — deposit/withdrawal metadata parsing, lifecycle state machine, status mapping, fixtures | Real anchor backend infrastructure |
| `@anchorkit/validators` — Zod schemas, validation engine | Zod library internals |
| `@anchorkit/config` — network presets, env config, mainnet gate | Infrastructure-level network security |
| `contracts/treasury-escrow` — Soroban Rust contract | Soroban runtime / WASM VM bugs |
| `apps/web` — Next.js developer dashboard | Deployment infrastructure, CI/CD secrets |
| `docs/` — documentation | N/A |

**Audience:** Contributors, maintainers, and anyone evaluating AnchorKit for integration. This is not a substitute for a third-party security audit.

---

## 2. Threat actors

| Actor | Capability | Goal |
|-------|-----------|------|
| **Malicious contributor** | Submit PRs with backdoors, logging of secrets, or unsafe defaults | Exfiltrate testnet keys, introduce mainnet bypasses |
| **Dashboard user (careless)** | Paste real mainnet secrets into testnet-only UI | Lose funds via browser extension or screenshot leak |
| **Dashboard user (hostile)** | Craft URLs or inputs to trigger XSS/SSRF in the web app | Steal session data or pivot to backend |
| **Contract caller (unauthorized)** | Call escrow functions without admin auth | Manipulate milestone state, submit false evidence, trigger premature release |
| **Contract caller (malicious admin)** | Abuse admin privileges on escrow | Steal escrowed funds, permanently lock disputed milestones |
| **Network attacker** | MitM HTTP traffic, tamper Horizon responses | Feed false account data, redirect payments |
| **Dependency supply chain** | Compromise npm/cargo dependencies | Inject malicious code into builds |

---

## 3. High-level system boundaries

```
┌─────────────────────────────────────────────────────────┐
│  apps/web  (Next.js 14, client-side "use client")       │
│  - Never handles secret keys for signing                 │
│  - Displays redacted key strings only                    │
│  - Calls @anchorkit/* packages in-browser                │
├─────────────────────────────────────────────────────────┤
│  @anchorkit/stellar-kit                                  │
│  - Keypair generation (testnet only by default)          │
│  - Account loading via Horizon                           │
│  - Payment intent building + readiness checks            │
│  - Secret redaction everywhere                           │
├─────────────────────────────────────────────────────────┤
│  @anchorkit/anchor-utils                                 │
│  - SEP metadata parsing (deposit / withdrawal)           │
│  - Lifecycle state machine                               │
│  - Status mapping + fixtures                             │
├─────────────────────────────────────────────────────────┤
│  @anchorkit/validators + @anchorkit/config               │
│  - Zod schemas for all inputs                            │
│  - Network presets, mainnet gate                         │
├─────────────────────────────────────────────────────────┤
│  contracts/treasury-escrow  (Soroban / Rust)             │
│  - On-chain milestone escrow                             │
│  - Admin-gated state transitions                         │
│  - Events for audit trail                                │
├─────────────────────────────────────────────────────────┤
│  Stellar Horizon / Soroban RPC  (external)               │
│  - Network data source                                   │
│  - NOT controlled by AnchorKit                           │
└─────────────────────────────────────────────────────────┘
```

**Sensitive data boundary:** Secret keys must never cross from the user's control into AnchorKit storage, logs, URLs, HTTP headers, or third-party services. The only acceptable operations on secret keys are: (1) structural validation, (2) public key derivation, (3) redacted display.

---

## 4. Threat area 1 — Stellar secret key handling

### 4.1 Assets at risk

- Stellar secret keys (S-prefixed, 56-char base32 strings)
- Derived keypairs that could sign real transactions

### 4.2 Threats

| ID | Threat | Severity | Existing mitigation |
|----|--------|----------|-------------------|
| SK-T1 | Secret key logged to console, CI output, or error reports | **High** | `redactSecrets()` strips S-prefixed strings from all error messages and log sinks. Zero `console.log` calls in production source code. `createSafeLogger` wraps all output through `safeStringify` which recursively redacts. |
| SK-T2 | Secret key displayed in UI beyond initial generation | **Medium** | Accounts page shows secret once on generation. `secretKeyToRedactedString()` collapses to `SC••••••••AB` on re-render. Validation inputs use `type="password"`. |
| SK-T3 | Secret key stored in localStorage, cookies, or IndexedDB | **Low** | No `localStorage.setItem`, cookie, or IndexedDB calls exist in the codebase. Enforced by code review convention (R2 in `SECRET_KEY_HANDLING.md`). |
| SK-T4 | Secret key in URL query params or HTTP headers | **Low** | Public key only appears in Stellar Expert links (never secret keys). `validateCallbackUrl` rejects non-HTTPS. R3 rule enforced on PRs. |
| SK-T5 | `StellarSecretKeySchema` exported publicly, enabling raw secret handling | **Medium** | Rules R0–R6 enforce redaction discipline. However, the schema's public export is a known gap (see `SECURITY_ARCHITECTURE_REVIEW.md` VL-S1). Consumers can bypass redaction by importing the schema directly. |
| SK-T6 | Browser extension exfiltrates secret pasted into validation input | **Medium** | Out of AnchorKit's control. Mitigated by: password input type, no persistence, prominent "testnet-only" warnings, explicit "do not paste mainnet secrets" guidance. |
| SK-T7 | `validateSecretKeyQuietly` does not allocate error messages (avoids leaking via error text) | **Low** | Correctly implemented — returns structured `{ valid, errorCode }` with no string interpolation of the input. |

### 4.3 Mitigations in code

- `redactSecretKey()` — extracts first 4 and last 4 chars, discards middle (`packages/stellar-kit/src/keys.ts:86-94`)
- `secretKeyToRedactedString()` — validates then redacts (`packages/stellar-kit/src/keys.ts:100-106`)
- `redactSecrets()` — regex-based S-prefix stripping in `@anchorkit/types` (`packages/types/src/errors.ts`)
- `createSafeLogger()` — recursive redaction through `safeStringify` before any sink (`packages/stellar-kit/src/logging.ts:68-86`)
- `createStellarError()` — error cause chain is sanitized before propagation (`packages/stellar-kit/src/errors.ts:6-22`)

### 4.4 Known gaps

1. `StellarSecretKeySchema` is publicly exported from `@anchorkit/validators`, allowing consumers to parse raw secrets without going through the redaction layer. **Recommendation:** Remove from public exports or return `RedactedSecretKey`.
2. The well-known test secret `SCZANGBA5YHT...` appears in `test/keys.test.ts`. While only in tests, it may trigger secret scanners in CI. Prefer runtime-generated fake secrets.

---

## 5. Threat area 2 — Payment intent validation

### 5.1 Assets at risk

- Incorrectly validated payment parameters leading to failed or unintended transactions
- Oversized or malformed amounts causing precision loss

### 5.2 Threats

| ID | Threat | Severity | Existing mitigation |
|----|--------|----------|-------------------|
| PI-T1 | Invalid public key accepted, payment built to wrong/nonexistent account | **Medium** | `PaymentIntentSchema` validates both source and destination via `StellarPublicKeySchema`. `isPublicKeyValid` runs before any intent creation. |
| PI-T2 | Amount precision loss for very large values (>15 significant digits) | **Low** | `PaymentAmountSchema` uses `Number()`. Precision loss occurs at ~15-17 significant digits. Stellar amounts are 7 decimal fixed-point; real-world payments rarely approach this limit. |
| PI-T3 | Negative or zero amounts accepted | **Low** | Zod schema enforces positive numeric strings. `validateAmount` in validators adds range checks. |
| PI-T4 | Memo of wrong type or oversized value accepted | **Low** | `MemoInputSchema` validates type-specific constraints: text ≤28 bytes, hash = 64 hex chars, ID = numeric string. |
| PI-T5 | Self-payment (source == destination) accepted silently | **Low** | Readiness check emits `SAME_SOURCE_DEST` warning. Payment intent creation does not block it (valid on Stellar, just wasteful). |
| PI-T6 | `normalizeAmount` throws `RangeError` on `Infinity` input | **Low** | Regex validation in `PaymentAmountSchema` rejects non-numeric strings before `normalizeAmount` is reached. Edge case: `Number("Infinity").toFixed(7)` throws. |
| PI-T7 | `compareAmounts` returns 0 (equal) for NaN inputs | **Low** | NaN comparison semantics (`NaN < NaN` = false, `NaN > NaN` = false) mean NaN amounts would appear as "equal." Mitigated by upstream validation. |

### 5.3 Mitigations in code

- `PaymentIntentSchema` — Zod validation with `StellarPublicKeySchema`, `StellarAssetSchema`, `PaymentAmountSchema`, `MemoInputSchema` (`packages/validators/src/schemas/stellar.ts`)
- `createPaymentIntent()` — validates via schema before returning (`packages/stellar-kit/src/intent.ts:28-44`)
- `validatePaymentIntent()` / `isPaymentIntentValid()` — re-validation of unknown inputs (`packages/stellar-kit/src/intent.ts:46-54`)

---

## 6. Threat area 3 — Transaction readiness

### 6.1 Assets at risk

- Users signing transactions that will fail on-chain
- Mainnet transactions attempted without explicit opt-in

### 6.2 Threats

| ID | Threat | Severity | Existing mitigation |
|----|--------|----------|-------------------|
| TR-T1 | Transaction built against mainnet without explicit `allowMainnet: true` | **High** | `assertNetworkAllowed()` throws `MAINNET_DISABLED` before any Horizon call in `createServer` (`accounts.ts:30-34`). Also checked in `estimateTransactionReadiness` (`intent.ts:270-272`). |
| TR-T2 | Insufficient funds — payment exceeds spendable balance after reserves | **Medium** | `computeBalanceModel()` calculates spendable = native - reserve. `estimateTransactionReadinessSync` emits `INSUFFICIENT_FUNDS` error when spendable < amount. |
| TR-T3 | Unfunded source account — transaction will fail with `NO_ACCOUNT` | **Medium** | `SOURCE_UNFUNDED` warning emitted when `sourceAccountFunded === false`. Async readiness loads account status before evaluation. |
| TR-T4 | Destination lacks trustline for issued asset — payment will fail | **Medium** | `DEST_UNFUNDED` warning emitted. Readiness does not verify trustline existence (would require additional network call). |
| TR-T5 | Readiness check itself fails (Horizon timeout, network error) | **Low** | `Promise.allSettled` used for parallel account loads. Failures degrade to `undefined` funding status (warnings emitted but not blockers). |
| TR-T6 | Sync readiness used without live account data — funding/balance checks skipped | **Low** | `estimateTransactionReadinessSync` accepts optional `sourceAccountFunded`/`destAccountFunded`/`sourceBalances`. When omitted, balance stage carries no warnings — caller is responsible. |

### 6.3 Mitigations in code

- `assertNetworkAllowed()` — throws before Horizon call (`packages/config/src/index.ts`)
- `createServer()` — single Horizon entry point, gates mainnet (`packages/stellar-kit/src/accounts.ts:30-38`)
- `estimateTransactionReadiness()` — async, loads accounts, computes balance model (`packages/stellar-kit/src/intent.ts:259-297`)
- `estimateTransactionReadinessSync()` — sync, optional live data (`packages/stellar-kit/src/intent.ts:95-257`)

---

## 7. Threat area 4 — Anchor metadata and lifecycle

### 7.1 Assets at risk

- Invalid deposit/withdrawal requests processed by anchor integrations
- Lifecycle state machine bypass leading to inconsistent transaction states

### 7.2 Threats

| ID | Threat | Severity | Existing mitigation |
|----|--------|----------|-------------------|
| AM-T1 | Malformed SEP deposit/withdrawal metadata accepted | **Medium** | `DepositRequestMetadataSchema` and `WithdrawalRequestMetadataSchema` validate all fields via Zod before processing. |
| AM-T2 | Invalid callback URL accepted (HTTP on mainnet) | **Medium** | `CallbackUrlSchema` requires HTTPS except for `localhost`. On mainnet, HTTP callbacks would be unencrypted. |
| AM-T3 | Callback URL accepts no allow-listing | **Low** | MVP rejects non-HTTPS. Production would need allow-lists + HMAC signatures. Not implemented. |
| AM-T4 | Lifecycle transition bypass — illegal status jump | **Medium** | `isTransitionValid()` checks against `ALLOWED_TRANSITIONS` map. `transition()` returns typed error on illegal moves. `findFirstIllegalTransition()` validates sequences. |
| AM-T5 | `advanceAnchorTransactionStatus` silently wraps to `pending_user` on unknown status | **Medium** | `advanceAnchorTransactionStatus` returns `pending_user` when status not found in order array (`index.ts:228`). This differs from `nextStatus()` in `lifecycle.ts` which returns `null`. Dual API surface can confuse consumers. |
| AM-T6 | `feeFixed` / `feePercent` fields accept extreme values (e.g. `"99999"`) | **Low** | `AnchorAssetConfigSchema` does not range-validate fee fields. Values pass Zod string validation. |
| AM-T7 | `AnchorAssetConfigSchema` code field accepts special characters | **Low** | Uses `z.string().min(1).max(12)` instead of validated `AssetCodeSchema`. Accepts characters outside Stellar's alphanumeric asset code rules. |

### 7.3 Mitigations in code

- Zod validation schemas for all metadata inputs (`packages/validators/src/schemas/anchor.ts`)
- Lifecycle state machine with explicit allowed transitions (`packages/anchor-utils/src/lifecycle.ts:28-37`)
- `transition()` returns structured error on illegal moves (`packages/anchor-utils/src/lifecycle.ts:70-96`)
- Exhaustive `never` checks in `anchorStatusToUserMessage` and `anchorStatusBadge` (`packages/anchor-utils/src/index.ts:128-132, 154-158`)

---

## 8. Threat area 5 — Account diagnostics

### 8.1 Assets at risk

- Incorrect account state displayed to user (false funded/unfunded status)
- Sensitive balance information leaked

### 8.2 Threats

| ID | Threat | Severity | Existing mitigation |
|----|--------|----------|-------------------|
| AD-T1 | Diagnostics on mainnet without explicit opt-in | **High** | `diagnoseAccount` calls `loadAccount` which calls `createServer` which gates mainnet via `assertNetworkAllowed`. |
| AD-T2 | Invalid public key accepted — Horizon returns misleading error | **Low** | `diagnoseAccount` validates key structure before network call, returns `invalid` state with descriptive error. |
| AD-T3 | Horizon unavailable — diagnostics show `unavailable` instead of throwing | **Low** | Graceful degradation: network errors map to `unavailable` state with null balances and error message. No secrets in error path. |
| AD-T4 | `diagnoseAccountInfo` relies on caller-provided `AccountInfo` — could contain tampered data | **Low** | Sync variant is explicitly for tests and pre-validated data. Caller is responsible for data integrity. |
| AD-T5 | Balance model exposes reserve calculation assumptions | **Low** | `computeReserve` uses `BASE_ENTRY_COUNT` (1) and `STELLAR_BASE_RESERVE_XLM` (0.5 XLM). Values are public Stellar protocol constants. |

---

## 9. Threat area 6 — Soroban escrow contract

### 9.1 Assets at risk

- Escrowed funds (in production deployment)
- Milestone state integrity
- Evidence integrity

### 9.2 Threats

| ID | Threat | Severity | Current status | Recommended action |
|----|--------|----------|---------------|-------------------|
| EC-T1 | Non-admin caller submits evidence on any milestone | **Critical** | **Fixed in code** — `submit_evidence` calls `require_admin()` (`lib.rs:213`). Security review (CR-S1) flagged this; code now includes the guard. | Verify in tests: add test for non-admin `submit_evidence` call. |
| EC-T2 | Disputed milestones permanently stuck — no resolution path | **High** | **Open.** `DisputeResolutionRequired = 12` error variant defined but never used. No `resolve_dispute` function exists. | Implement `resolve_dispute` (admin cancels or re-approves). Add event emission. |
| EC-T3 | Evidence silently overwritten on disputed milestones | **High** | **Fixed in code** — `submit_evidence` now checks `EvidenceAlreadySubmitted` (`lib.rs:223-225`). Once a hash is recorded, it cannot be replaced. | Verify in tests: add test for duplicate evidence submission. |
| EC-T4 | `submit_evidence` on Draft milestone skips Active status, bypassing amount finalization | **Medium** | **Open.** Evidence submission advances status to `EvidenceSubmitted` even if milestone was `Draft`, skipping `Active` (where `assign_amount` finalizes the amount). | Add status guard: require `>= Active` before evidence submission. |
| EC-T5 | `assign_amount` is the only state-changing function without event emission | **Low** | **Open.** Breaks auditability — amount changes are invisible to event monitors. | Add event emission consistent with other functions. |
| EC-T6 | Single admin — no multi-sig or role-based access | **Medium** | **Known limitation.** MVP uses single admin address. No key rotation, no multi-sig, no timelock. | Documented as expected for MVP. Add multi-admin or role-based access before real value. |
| EC-T7 | `release_milestone` sets a state flag but does not perform token transfer | **Medium** | **By design.** MVP contract gates release via status flags. Actual token movement is left to a production integration layer. | Documented in `SECURITY_NOTES.md`. Production integration must atomically move assets. |
| EC-T8 | Amounts are raw i128 — decimal/asset type mismatch when bridging to real tokens | **Medium** | **Known risk.** Contract stores amounts as `i128`. No decimal or asset type validation at contract level. | Consumer must validate decimals and asset type when integrating with real token contracts. |
| EC-T9 | `initialize` called twice — `AlreadyInitialized` error never tested | **Medium** | Error variant exists and code checks `env.storage().instance().has(&ADMIN_KEY)` before init. | Add test for double-initialization. |
| EC-T10 | `dispute_milestone` on Draft milestone — `DisputeWithoutEvidence` error untested | **Medium** | Error variant exists and code checks `status < EvidenceSubmitted`. | Add test. |
| EC-T11 | `u32::MAX` count overflow silently loses milestones in summary | **Low** | `saturating_add` used for count, but `1..=count` iteration would be O(u32::MAX). Extremely unlikely. | Documented as acceptable. |

### 9.3 Mitigations in code

- `require_admin()` — authorization check via `admin.require_auth()` (`lib.rs:108-116`)
- `EvidenceAlreadySubmitted` — write-once evidence hash (`lib.rs:223-225`)
- `DuplicateRelease` — prevents double release (`lib.rs:330-331`)
- `ReleaseBeforeApproval` — enforces approval gate (`lib.rs:333-334`)
- `ApprovalAfterDispute` — prevents approval after dispute (`lib.rs:248-249`)
- `saturating_add` — overflow-safe aggregations (`lib.rs:166, 383-390`)
- `overflow-checks = true` in release profile (`Cargo.toml`)
- Events on 8 of 9 state-changing functions (`lib.rs`)

---

## 10. Threat area 7 — Unsafe logging and diagnostics

### 10.1 Assets at risk

- Secret keys leaked through logs, error reports, crash dumps, CI output

### 10.2 Threats

| ID | Threat | Severity | Existing mitigation |
|----|--------|----------|-------------------|
| UL-T1 | `console.log` called with raw secret key | **High** | Zero `console.log`/`console.warn`/`console.error` calls in production source code across all packages and `apps/web`. Enforced by ESLint rules and PR review. |
| UL-T2 | Error cause chain contains secret in message or stack trace | **High** | `createStellarError` constructs errors through `AnchorKitError` which calls `redactSecrets` on the cause. Error `.message` and `.cause` are sanitized. |
| UL-T3 | Third-party logging library receives unredacted data | **Medium** | `createSafeLogger()` provides a drop-in replacement that redacts before forwarding to any sink. Callers using raw `console` directly bypass this. |
| UL-T4 | `safeStringify` fails on circular objects or BigInt | **Low** | Fallback: `String(value)` then `redactSecrets`. Circular detection via `WeakSet`. BigInt handled by fallback path. |
| UL-T5 | Horizon error response contains sensitive data | **Low** | `mapHorizonError` maps to typed codes with generic messages. Raw Horizon error text is not forwarded. |

### 10.3 Mitigations in code

- `createSafeLogger()` — recursive redaction through `safeStringify` (`packages/stellar-kit/src/logging.ts:68-86`)
- `redactSecrets()` — regex-based S-prefix stripping (`packages/types/src/errors.ts`)
- `safeLog` — shared default safe logger (`packages/stellar-kit/src/logging.ts:89`)
- Zero `console.*` calls in production source (enforced by `eslint` + PR review)

---

## 11. Threat area 8 — Mainnet risks and testnet assumptions

### 11.1 Testnet assumptions

| Assumption | Risk if violated |
|-----------|-----------------|
| Testnet XLM has no real value | Users paste real mainnet secrets into testnet-only UI |
| Testnet Horizon is publicly accessible | Rate limiting, DDoS, or data integrity issues |
| Testnet accounts are unfunded by default | Friendbot may be rate-limited or unavailable |
| Testnet asset issuers are not real anchors | Metadata, callbacks, and status flows are simulated |

### 11.2 Mainnet risks

| ID | Threat | Severity | Existing mitigation |
|----|--------|----------|-------------------|
| MN-T1 | `allowMainnet` flipped to `true` without review | **High** | `assertNetworkAllowed()` throws `MAINNET_DISABLED` before any Horizon call. Guard enforced in `createServer` (accounts), `estimateTransactionReadiness` (intents). |
| MN-T2 | Mainnet guard only at intent/account layer — URL builders bypass it | **Medium** | **By design.** `explorer.ts` URL builders (`buildAccountLink`, `buildTransactionLink`) never make network calls and remain ungated. |
| MN-T3 | HTTP allowed on non-mainnet (`allowHttp: !networkConfig.isMainnet`) | **Low** | Correct behavior: testnet Horizon uses HTTP, mainnet requires HTTPS. |
| MN-T4 | `CallbackUrlSchema` allows HTTP localhost on mainnet | **Low** | Schema allows `http://localhost` regardless of network. On mainnet, callbacks for real payment confirmations would be unencrypted. |
| MN-T5 | No encrypted secret storage — user must manage own key security | **Medium** | **Out of scope for MVP.** AnchorKit does not implement secure key storage, HSM-backed signers, spend policies, or withdrawal authorization. |

### 11.3 Production readiness gaps

The following are explicitly **not implemented** in the MVP and must be addressed before any production use:

1. **No secure key storage** — no HSM, no encrypted wallet, no keychain integration
2. **No transaction signing** — payment intents are built but not signed or submitted
3. **No custodial logic** — no fund management, no withdrawal authorization
4. **No HMAC callback verification** — callbacks are URL-validated but not signed
5. **No rate limiting** — Horizon calls are unbounded
6. **No Soroban RPC mainnet gating** — RPC access is not yet implemented in the toolkit

---

## 12. Threat area 9 — Web dashboard

### 12.1 Assets at risk

- User session data
- Any data entered into the dashboard

### 12.2 Threats

| ID | Threat | Severity | Existing mitigation |
|----|--------|----------|-------------------|
| WD-T1 | Secret key re-revealed infinitely via toggle | **Medium** | Toggle allows repeated show/hide. "Secret is only shown once" UI copy is contradicted. No persistence risk (value stays in React state only). |
| WD-T2 | XSS via crafted Stellar account data | **Low** | React escapes output by default. No `dangerouslySetInnerHTML` usage found. |
| WD-T3 | No Content-Security-Policy or security headers | **Low** | `next.config.js` has no CSP, X-Frame-Options configured. Mitigated by: no sensitive data exposure, testnet-only, localhost deployment. |
| WD-T4 | No `error.tsx` boundaries — Horizon failures show generic error | **Low** | No crash recovery UI. User sees Next.js default error page. |
| WD-T5 | `as any` casts in payment page bypass TypeScript checks | **Low** | Six `as any` casts in `app/payments/page.tsx`. Runtime behavior is correct; type safety is weakened. |

### 12.3 Positive security properties

- Zero `console.log`/`console.warn`/`console.error` in `apps/web`
- No `.env` files, no `process.env` or `NEXT_PUBLIC_*` references
- `reactStrictMode: true`
- All pages marked `"use client"` — no server-side secret handling
- Secret validation inputs use `type="password"`

---

## 13. Consolidated risk register

### Critical and High

| # | Area | ID | Severity | Description | Status |
|---|------|----|----------|-------------|--------|
| 1 | escrow | EC-T1 | **CRITICAL** | `submit_evidence` auth check | **Fixed** — `require_admin()` added |
| 2 | escrow | EC-T2 | **HIGH** | Disputed milestones permanently stuck | **Open** — needs `resolve_dispute` |
| 3 | escrow | EC-T3 | **HIGH** | Evidence overwrite on disputed | **Fixed** — write-once enforced |
| 4 | secret | SK-T5 | **MEDIUM** | `StellarSecretKeySchema` public export | **Open** — known gap |
| 5 | mainnet | TR-T1 | **HIGH** | Mainnet safety gate | **Fixed** — enforced in `createServer` |
| 6 | logging | UL-T1 | **HIGH** | `console.log` with secrets | **Mitigated** — zero calls in production code |

### Medium

| # | Area | ID | Description |
|---|------|----|-------------|
| 7 | escrow | EC-T4 | Evidence submission skips Active status |
| 8 | escrow | EC-T6 | Single admin — no multi-sig |
| 9 | escrow | EC-T7 | Release is state flag only — no token transfer |
| 10 | escrow | EC-T8 | Amounts are raw i128 — no decimal validation |
| 11 | anchor | AM-T5 | `advanceAnchorTransactionStatus` silent wrap-around |
| 12 | web | WD-T1 | Secret re-reveal contradicts "shown once" |
| 13 | mainnet | MN-T2 | URL builders bypass mainnet guard (by design) |
| 14 | anchor | AM-T2 | HTTP callback allowed on localhost in mainnet |

### Low

| # | Area | ID | Description |
|---|------|----|-------------|
| 15 | escrow | EC-T5 | `assign_amount` missing event emission |
| 16 | escrow | EC-T11 | `u32::MAX` count overflow in summary |
| 17 | secret | SK-T7 | Well-known test secret in test files |
| 18 | payment | PI-T2 | Amount precision loss >15 digits |
| 19 | payment | PI-T6 | `normalizeAmount` Infinity edge case |
| 20 | anchor | AM-T6 | Fee fields accept extreme values |
| 21 | anchor | AM-T7 | Asset code accepts special characters |
| 22 | web | WD-T3 | No CSP or security headers |
| 23 | web | WD-T4 | No error boundaries |
| 24 | web | WD-T5 | `as any` casts in payments page |

---

## 14. Assumptions

1. **AnchorKit MVP is not production custody software.** It is developer tooling and a reference example. It does not store, sign with, or manage real private keys on behalf of users.
2. **Testnet is the default and expected environment.** Mainnet access requires explicit opt-in via code change (`allowMainnet: true`).
3. **The web dashboard runs locally or in a controlled environment.** No hosted deployment with real users is assumed.
4. **The escrow contract is an example, not a production treasury.** It demonstrates milestone-based escrow patterns but lacks multi-sig, timelock, dispute resolution, and token transfer mechanics.
5. **Horizon and Soroban RPC are trusted network data sources.** AnchorKit does not verify or cache network responses beyond error mapping.
6. **All contributors follow the R0–R6 secret key handling rules** enforced via PR review and the maintainer checklist.
7. **Third-party browser extensions are out of scope.** Users accept the risk of pasting secrets into any web page.
8. **No third-party security audit has been performed** unless explicitly noted in the repository.

---

## 15. Out-of-scope production behaviours

The following are explicitly **not part of the AnchorKit MVP** and must not be assumed:

| Behaviour | Why it is out of scope |
|-----------|----------------------|
| Secure key storage (HSM, keychain, encrypted wallet) | Requires separate package with explicit warnings and password-derived encryption |
| Transaction signing and submission | Payment intents are built and validated only; no broadcasting |
| Custodial fund management | No withdrawal authorization, no spend policies, no fund segregation |
| HMAC callback verification | Only URL validation (HTTPS) is implemented |
| Rate limiting on Horizon calls | Left to the consumer's infrastructure |
| Soroban RPC mainnet gating | RPC access not yet implemented in the toolkit |
| Multi-admin or role-based escrow access | Single admin for MVP |
| Dispute resolution for escrow milestones | `DisputeResolutionRequired` error defined but not implemented |
| Atomic token transfer on milestone release | Release sets a state flag; token movement is a consumer responsibility |
| Decimal and asset type validation in escrow contract | Amounts are raw i128; consumer must validate at integration layer |
| Hosted production deployment | Dashboard is local developer tooling |

---

## 16. Review requirements

Every PR that touches security-sensitive code must pass the
[MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) and additionally
verify:

### Before merge

- [ ] No new `console.log` / `console.warn` / `console.error` calls in production source
- [ ] No secret keys in test fixtures that have ever held mainnet funds
- [ ] No new `StellarSecretKeySchema` exports or raw secret handling in public APIs
- [ ] All new network-calling functions gate mainnet via `assertNetworkAllowed`
- [ ] All new error paths run through `redactSecrets` before propagation
- [ ] Escrow contract changes maintain admin-only enforcement on state-changing functions
- [ ] Escrow contract changes emit events on state-changing functions
- [ ] No circular imports introduced between packages

### Before mainnet consideration

- [ ] Third-party security audit completed and published
- [ ] `StellarSecretKeySchema` removed from public exports or returns redacted form
- [ ] `resolve_dispute` function implemented for escrow contract
- [ ] `submit_evidence` status guard updated to reject `Disputed` status
- [ ] `assign_amount` event emission added
- [ ] Error boundaries added to web app
- [ ] Callback HMAC verification implemented
- [ ] Secure key storage package created (if custodial features desired)

---

*This threat model covers the AnchorKit MVP codebase as of July 2026. It is a
living document that should be updated as new threat areas are identified or
existing mitigations change. Re-review is recommended after each major release
or when production deployment is being considered.*
