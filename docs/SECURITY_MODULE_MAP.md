# Security-sensitive module map

Certain modules in AnchorKit handle secrets, network configuration, financial
amounts, escrow state, or diagnostic data that could cause harm if modified
incorrectly. This map identifies those modules, explains the risk, and tells
reviewers what to look for.

## Sensitivity tiers

| Tier | Meaning | Review required |
|------|---------|-----------------|
| **CRITICAL** | Secret key material, mainnet gate, asset amounts | Two-person review, mandatory R0–R6 audit |
| **HIGH** | Transaction readiness, escrow state, account diagnostics | Thorough checklist review |
| **MEDIUM** | Validation schemas, web UI, fixture data | Standard review |
| **LOW** | Barrel exports, docs, example files | Light review |

---

## 1. `packages/stellar-kit/` — Core Stellar utilities

### `src/keys.ts` — Keypair generation and validation

| Property | Value |
|----------|-------|
| Sensitivity | **CRITICAL** |
| Risk | Secret key leakage into logs, errors, or UI. Unvalidated public keys. |
| Review | R0–R6 compliance. No secret key is ever logged verbatim. `createStellarError` redacts before throwing. Validation rejects malformed keys before any derivation. Branded types (`StellarPublicKey`, `StellarSecretKey`) prevent string interchange. |
| Files | [`src/keys.ts`](../packages/stellar-kit/src/keys.ts), [`test/keys.test.ts`](../packages/stellar-kit/test/keys.test.ts) |
| Docs | [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md) (R0–R6), threat model SK-T1 to SK-T7 |

### `src/redaction.ts` — Secret redaction utilities

| Property | Value |
|----------|-------|
| Sensitivity | **CRITICAL** |
| Risk | A redaction bypass could leak secrets in logs, error messages, or the web UI. |
| Review | Every new call site must use `redactSecrets()` or `secretKeyToRedactedString()`. Regex patterns must not have false negatives for 56-char S-prefixed keys. |
| Files | [`src/redaction.ts`](../packages/stellar-kit/src/redaction.ts), [`test/redaction.test.ts`](../packages/stellar-kit/test/redaction.test.ts) |
| Docs | Secret key handling, threat model SK-T1, UL-T1 to UL-T5 |

### `src/errors.ts` — Stellar error mapping with redaction

| Property | Value |
|----------|-------|
| Sensitivity | **CRITICAL** |
| Risk | Horizon error messages may contain raw request bodies, which could include secrets. `createStellarError` must redact before storing the cause chain. |
| Review | All error factories call `redactSecrets` on user-facing messages. Branded error code stays stable. |
| Files | [`src/errors.ts`](../packages/stellar-kit/src/errors.ts), [`test/assets.test.ts`](../packages/stellar-kit/test/assets.test.ts) |
| Docs | [ERROR_TAXONOMY.md](./ERROR_TAXONOMY.md) |

### `src/accounts.ts` — Account loading from Horizon

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Mainnet account data could be loaded without `assertNetworkAllowed`. Unfunded-account errors may leak account existence. |
| Review | Every Horizon-bound function must call `assertNetworkAllowed` first. No account data is cached unsafely. |
| Files | [`src/accounts.ts`](../packages/stellar-kit/src/accounts.ts), [`test/mainnet-safety.test.ts`](../packages/stellar-kit/test/mainnet-safety.test.ts) |
| Docs | [ACCOUNT_UTILITIES.md](./ACCOUNT_UTILITIES.md), threat model AD-T1 to AD-T5, MN-T1 |

### `src/intent.ts` — Payment intent builders

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Invalid amounts, assets, or memos could produce an intent that looks valid but fails on submission. |
| Review | All inputs validated against Zod schemas before any processing. Amount decimal precision enforced (7 decimals). Memo type/value rules from Stellar protocol. Assets parsed and validated. |
| Files | [`src/intent.ts`](../packages/stellar-kit/src/intent.ts), [`test/assets.test.ts`](../packages/stellar-kit/test/assets.test.ts), [`test/payments.test.ts`](../packages/stellar-kit/test/payments.test.ts) |
| Docs | [PAYMENT_INTENT_UTILITIES.md](./PAYMENT_INTENT_UTILITIES.md), threat model PI-T1 to PI-T7 |

### `src/readiness.ts` — Transaction readiness pipeline

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | A readiness stage that incorrectly reports `"ready"` could let a transaction proceed when it should be blocked. Missing mainnet check could allow mainnet submission. |
| Review | Every stage (network, account, asset, amount, memo) must produce accurate warnings. `mainnet_access` gate enforced in network stage. `unsafe-network` state correctly propagated. |
| Files | [`src/readiness.ts`](../packages/stellar-kit/src/readiness.ts), [`test/readiness.test.ts`](../packages/stellar-kit/test/readiness.test.ts) |
| Docs | [TRANSACTION_READINESS.md](./TRANSACTION_READINESS.md), threat model TR-T1 to TR-T6 |

### `src/balances.ts` — Balance model computation

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Overstated spendable balance could mislead users. Understated reserve could cause failed transactions. |
| Review | Reserve computation matches Stellar protocol (base reserve + subentry count). Spendable = total - reserve, never negative. Unknown state returns null for all amounts. |
| Files | [`src/balances.ts`](../packages/stellar-kit/src/balances.ts), [`test/balances.test.ts`](../packages/stellar-kit/test/balances.test.ts) |
| Docs | [ACCOUNT_UTILITIES.md](./ACCOUNT_UTILITIES.md) |

### `src/assetRegistry.ts` — Network-aware asset registry

| Property | Value |
|----------|-------|
| Sensitivity | **MEDIUM** |
| Risk | Incorrect registry entries could allow unsupported assets through. Wrong issuer could direct payments to the wrong address. |
| Review | Registry entries are purely metadata — no trust is implied. Native XLM always supported. Testnet-only assets correctly gated. |
| Files | [`src/assetRegistry.ts`](../packages/stellar-kit/src/assetRegistry.ts), [`test/assetRegistry.test.ts`](../packages/stellar-kit/test/assetRegistry.test.ts) |
| Docs | [asset-registry.md](./asset-registry.md) |

### `src/diagnostics.ts` — Account diagnostics pipeline

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Diagnostics could leak account details (sequence numbers, balances, subentries) to unauthorised surfaces. Mainnet diagnostics could be triggered without the mainnet gate. |
| Review | All network-bound diagnostics call `assertNetworkAllowed`. Output is redacted for secrets. |
| Files | [`src/diagnostics.ts`](../packages/stellar-kit/src/diagnostics.ts), [`test/diagnostics.test.ts`](../packages/stellar-kit/test/diagnostics.test.ts) |
| Docs | Threat model AD-T1 to AD-T5 |

### `src/logging.ts` — Safe logger with redaction

| Property | Value |
|----------|-------|
| Sensitivity | **CRITICAL** |
| Risk | A log line that skips redaction could expose a secret key or account details. |
| Review | Every new log call uses `createSafeLogger` or `safeLog`. No raw objects are logged without redaction. |
| Files | [`src/logging.ts`](../packages/stellar-kit/src/logging.ts), [`test/logging.test.ts`](../packages/stellar-kit/test/logging.test.ts) |
| Docs | Threat model UL-T1 to UL-T5 |

### `src/explorer.ts` — Explorer link builders

| Property | Value |
|----------|-------|
| Sensitivity | **LOW** |
| Risk | Incorrect URL construction could expose network information or link to wrong explorer. |
| Review | URLs use the network config's `expertBaseUrl`. Transaction hashes are validated before inclusion. |
| Files | [`src/explorer.ts`](../packages/stellar-kit/src/explorer.ts), [`test/explorer.test.ts`](../packages/stellar-kit/test/explorer.test.ts) |

### `src/assets.ts`, `src/assetDisplay.ts` — Asset parsing and display

| Property | Value |
|----------|-------|
| Sensitivity | **MEDIUM** |
| Risk | Invalid asset strings could be parsed incorrectly. Display metadata could imply trust in an asset or issuer. |
| Review | Asset parsing validates code length (1–12 chars) and issuer format (56-char G-prefixed public key). Display metadata explicitly avoids implying trust. |
| Files | [`src/assets.ts`](../packages/stellar-kit/src/assets.ts), [`src/assetDisplay.ts`](../packages/stellar-kit/src/assetDisplay.ts), [`test/assets.test.ts`](../packages/stellar-kit/test/assets.test.ts), [`test/assetDisplay.test.ts`](../packages/stellar-kit/test/assetDisplay.test.ts) |

---

## 2. `packages/config/` — Network configuration

### `src/index.ts` — Network presets, env config, mainnet gate

| Property | Value |
|----------|-------|
| Sensitivity | **CRITICAL** |
| Risk | Changing the mainnet gate (`allowMainnet`), Horizon URLs, or network passphrases could enable mainnet operations accidentally. A wrong Horizon URL could exfiltrate requests. |
| Review | `DEFAULT_ENV_CONFIG.allowMainnet` must remain `false`. Network config URLs must point to the correct Stellar network. Every consumer calls `assertNetworkAllowed` before reaching a network. |
| Files | [`src/index.ts`](../packages/config/src/index.ts), [`test/mainnet-safety.test.ts`](../packages/config/test/mainnet-safety.test.ts) |
| Docs | [STELLAR_TESTNET_USAGE.md](./STELLAR_TESTNET_USAGE.md), threat model MN-T1 to MN-T5 |

---

## 3. `packages/validators/` — Zod validation schemas

### `src/schemas/stellar.ts` — Key, asset, amount, memo schemas

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | A schema that is too permissive could let invalid data through. A schema that is too strict could reject valid Stellar data. |
| Review | `StellarSecretKeySchema` must use secret redaction in its error messages. Amount precision (7 decimals), memo byte limits (28 text, 64 hex), asset code format (1–12 alphanumeric) match Stellar protocol exactly. |
| Files | [`src/schemas/stellar.ts`](../packages/validators/src/schemas/stellar.ts), [`test/validationEngine.test.ts`](../packages/validators/test/validationEngine.test.ts) |
| Docs | [VALIDATION_GOVERNANCE.md](./VALIDATION_GOVERNANCE.md) |

### `src/schemas/anchor.ts` — Anchor asset and lifecycle schemas

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Anchor asset configs that pass validation but reference wrong issuers. Callback URLs that accept non-HTTPS (except localhost). |
| Review | Callback URL schema enforces HTTPS in production. Anchor asset config validates code, issuer, and schema type. |
| Files | [`src/schemas/anchor.ts`](../packages/validators/src/schemas/anchor.ts) |
| Docs | [ANCHOR_UTILITIES.md](./ANCHOR_UTILITIES.md) |

### `src/schemas/escrow.ts` — Escrow state schemas

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Invalid escrow event data or milestone states that don't match the contract DAG could be accepted. |
| Review | Schemas must match the contract's `MilestoneStatus` enum exactly. Event types align with contract events. |
| Files | [`src/schemas/escrow.ts`](../packages/validators/src/schemas/escrow.ts) |
| Docs | [SOROBAN_ESCROW_CONTRACT.md](./SOROBAN_ESCROW_CONTRACT.md) |

### `src/validationEngine.ts` — Validation engine with redaction

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Validation error messages could include raw input data (potentially secret keys). |
| Review | Engine must redact secret keys from error messages before surfacing. Custom error formatters must not bypass redaction. |
| Files | [`src/validationEngine.ts`](../packages/validators/src/validationEngine.ts) |
| Docs | [VALIDATION_GOVERNANCE.md](./VALIDATION_GOVERNANCE.md) |

---

## 4. `packages/types/` — Shared types and errors

### `src/errors.ts` — Error taxonomy and redactSecrets

| Property | Value |
|----------|-------|
| Sensitivity | **CRITICAL** |
| Risk | `redactSecrets` and `redactObject` are the last line of defence against secret leakage. A bug here affects every call site. |
| Review | Regex patterns for S-prefixed 56-char keys must be accurate. String replacement must not corrupt non-secret data. |
| Files | [`src/errors.ts`](../packages/types/src/errors.ts) |
| Docs | [ERROR_TAXONOMY.md](./ERROR_TAXONOMY.md), [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md) |

### `src/index.ts` — Branded types

| Property | Value |
|----------|-------|
| Sensitivity | **MEDIUM** |
| Risk | Removing or changing branded types (`StellarPublicKey`, `StellarSecretKey`, `StellarTransactionHash`) would break type safety across all packages. |
| Review | Branded types are nominal — they prevent string interchange. Adding new types must follow the same brand pattern. `AssetCode` and `AssetIssuer` must match Stellar protocol constraints. |
| Files | [`src/index.ts`](../packages/types/src/index.ts) |
| Docs | [ARCHITECTURE.md](./ARCHITECTURE.md) |

---

## 5. `packages/anchor-utils/` — SEP anchor utilities

### `src/index.ts` — Anchor status mapping, mock records

| Property | Value |
|----------|-------|
| Sensitivity | **MEDIUM** |
| Risk | Incorrect anchor status transitions could mislead users about the state of a deposit or withdrawal. |
| Review | Status transitions match SEP-24 lifecycle. Headlines and details are user-safe (no raw data). |
| Files | [`src/index.ts`](../packages/anchor-utils/src/index.ts) |
| Docs | [ANCHOR_UTILITIES.md](./ANCHOR_UTILITIES.md), threat model AM-T1 to AM-T7 |

---

## 6. `contracts/treasury-escrow/` — Soroban Rust contract

### `src/lib.rs` — Milestone escrow state machine

| Property | Value |
|----------|-------|
| Sensitivity | **CRITICAL** |
| Risk | Any bug in admin auth, status DAG transitions, evidence integrity, or double-release prevention could lead to loss of funds or incorrect state in a production deployment. |
| Review | `require_admin()` must guard every state-mutating function. Status transitions must follow the DAG exactly. Evidence hash is write-once. `release_milestone` prevents double-release. Amounts use saturating math. Storage versioning enables future upgrades. |
| Files | [`src/lib.rs`](../contracts/treasury-escrow/src/lib.rs), [`src/test.rs`](../contracts/treasury-escrow/src/test.rs) |
| Docs | [SOROBAN_ESCROW_CONTRACT.md](./SOROBAN_ESCROW_CONTRACT.md), threat model EC-T1 to EC-T11 |

### `src/test.rs` — Contract test coverage

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Missing test coverage for status transitions, auth bypass, or double-spend scenarios could leave critical bugs undetected. |
| Review | Every DAG edge has a test. Every error variant is exercised. Scoped auth tests confirm non-admin calls fail. |
| Files | [`src/test.rs`](../contracts/treasury-escrow/src/test.rs) |
| Docs | Threat model EC-T1 to EC-T11 |

---

## 7. `apps/web/` — Next.js dashboard

### `app/accounts/page.tsx` — Keypair generator and validator

| Property | Value |
|----------|-------|
| Sensitivity | **CRITICAL** |
| Risk | Secret keys typed into the browser could be persisted, logged, or sent to an external service. |
| Review | No secret key is stored in local storage, sent over the network, or logged. Validation runs entirely client-side. Generated keys are ephemeral (lost on page refresh). |
| Files | [`app/accounts/page.tsx`](../apps/web/app/accounts/page.tsx) |
| Docs | Threat model WD-T1 to WD-T5 |

### `app/payments/page.tsx` — Payment intent builder

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | Displaying readiness warnings could mislead users about the safety of a transaction. |
| Review | Readiness warnings are accurate and never suppress errors. Mainnet-blocked transactions are clearly marked. |
| Files | [`app/payments/page.tsx`](../apps/web/app/payments/page.tsx) |
| Docs | Threat model TR-T1 to TR-T6 |

### `app/escrow/page.tsx` — Escrow milestone UI

| Property | Value |
|----------|-------|
| Sensitivity | **HIGH** |
| Risk | UI could display incorrect milestone state or allow actions that the contract would reject. |
| Review | Milestone transitions match the contract DAG. UI is read-only (no on-chain writes). |
| Files | [`app/escrow/page.tsx`](../apps/web/app/escrow/page.tsx) |
| Docs | [SOROBAN_ESCROW_CONTRACT.md](./SOROBAN_ESCROW_CONTRACT.md) |

### `components/ui.tsx` — Badge and alert components

| Property | Value |
|----------|-------|
| Sensitivity | **LOW** |
| Risk | Badges could display incorrect severity levels, misleading users about transaction or account status. |
| Review | Badge tones match the canonical `StatusSeverity` mapping. No hardcoded colours — always use `badgeClasses()`. |
| Files | [`components/ui.tsx`](../apps/web/components/ui.tsx) |
| Docs | [STATUS_SEVERITY_MAPPING.md](./STATUS_SEVERITY_MAPPING.md) |

---

## 8. Full sensitivity map

| Module | Tier | Key concern |
|--------|------|-------------|
| `stellar-kit/src/keys.ts` | CRITICAL | Secret key generation, validation, redaction |
| `stellar-kit/src/redaction.ts` | CRITICAL | Redact regex, call-site coverage |
| `stellar-kit/src/errors.ts` | CRITICAL | Error message redaction |
| `stellar-kit/src/logging.ts` | CRITICAL | Safe logger, redaction in log output |
| `types/src/errors.ts` | CRITICAL | `redactSecrets` / `redactObject` correctness |
| `config/src/index.ts` | CRITICAL | Mainnet gate, network URLs |
| `contracts/treasury-escrow/src/lib.rs` | CRITICAL | Admin auth, DAG transitions, evidence, release |
| `stellar-kit/src/accounts.ts` | HIGH | Mainnet gate, account data safety |
| `stellar-kit/src/intent.ts` | HIGH | Amount/asset/memo validation |
| `stellar-kit/src/readiness.ts` | HIGH | Readiness stage correctness |
| `stellar-kit/src/balances.ts` | HIGH | Spendable balance accuracy |
| `stellar-kit/src/diagnostics.ts` | HIGH | Diagnostic data, mainnet gate |
| `validators/src/schemas/stellar.ts` | HIGH | Key/asset/amount schema strictness |
| `validators/src/schemas/anchor.ts` | HIGH | Callback URL, asset config |
| `validators/src/schemas/escrow.ts` | HIGH | Escrow state match with contract |
| `validators/src/validationEngine.ts` | HIGH | Error message redaction |
| `contracts/treasury-escrow/src/test.rs` | HIGH | DAG edge coverage |
| `apps/web/accounts/page.tsx` | CRITICAL | Client-side secret handling |
| `apps/web/payments/page.tsx` | HIGH | Readiness display accuracy |
| `apps/web/escrow/page.tsx` | HIGH | Milestone state display |
| `stellar-kit/src/assetRegistry.ts` | MEDIUM | Registry correctness |
| `stellar-kit/src/assets.ts` | MEDIUM | Asset parsing |
| `types/src/index.ts` | MEDIUM | Branded type integrity |
| `anchor-utils/src/index.ts` | MEDIUM | Status transitions |
| `stellar-kit/src/explorer.ts` | LOW | URL construction |
| `apps/web/components/ui.tsx` | LOW | Badge styling |

---

## 9. Quick reference for contributors

Before making changes in a **CRITICAL** or **HIGH** sensitivity module:

1. Read the relevant threat model section in [SECURITY_THREAT_MODEL.md](./SECURITY_THREAT_MODEL.md)
2. Review R0–R6 rules in [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md)
3. Check that `assertNetworkAllowed` is called before any network-bound operation
4. Verify that every new error path redacts secrets
5. Run the full test suite: `pnpm verify`
6. Run package-boundary check: `pnpm check:boundaries`

See [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) for the general contribution flow and
[MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) for the full review checklist.
