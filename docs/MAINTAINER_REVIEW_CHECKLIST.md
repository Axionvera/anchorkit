# Maintainer Review Checklist

Copy the checklist below into **every PR review comment** so GrantFox campaign reviewers can
audit decisions. The PR author fills out their self-check first; the maintainer confirms each
item or marks it as needing changes.

> **Two-phase review:** Code approval and GrantFox reward-readiness are evaluated separately.
> A PR can be merged (code approved) without being reward-ready. The GrantFox section at the
> end is completed only after merge when the campaign reviewer evaluates the work.

---

## Phase 1 — Code review (required for merge)

### PR self-check (author)

- [ ] References the original issue with `Closes #NNN` in the PR body.
- [ ] Acceptance criteria on the issue are checked off individually in the PR description,
      each with a file/line or commit reference.
- [ ] `pnpm verify` passes locally (format, lint, typecheck, test, build — see
      [LOCAL_VERIFICATION.md](./LOCAL_VERIFICATION.md)).
- [ ] `pnpm check:boundaries` passes locally (required if any `packages/*/src` import changed —
      see [ARCHITECTURE.md §3](./ARCHITECTURE.md#3-dependency-direction)).
- [ ] `pnpm contract:test` passes locally (if anything under `contracts/` changed).
  Optionally use `pnpm verify:full` for verify + examples + boundaries + contract tests.

### Stellar network correctness

- [ ] Any new Stellar public-key / secret-key parsing matches the branded types
      (`StellarPublicKey`, `StellarSecretKey`).
- [ ] Amounts remain 7-decimal strings (not `number` / floats) through the change.
      `Number()` precision loss is acceptable only where upstream Zod validation already
      constrains the range.
- [ ] Memo rules enforced if touched: 28-byte text, digit-only ID, 64-char hex hash/return.
- [ ] Asset parsing handles native (`XLM`/`native`/empty) and issued (`CODE:ISSUER`) correctly.
- [ ] Balance model: `computeReserve` / `computeBalanceModel` math is not broken by the change.
- [ ] Transaction readiness stages produce correct warnings for each input scenario.
- [ ] Horizon error handling still maps to the typed `StellarKitError` codes correctly.
- [ ] `assertNetworkAllowed` is called before any Horizon or RPC call that could reach mainnet.
- [ ] Explorer link builders (`buildAccountLink`, `buildTransactionLink`) remain ungated (string
      only, no network call) — this is by design.

### Anchor and SEP flow correctness

- [ ] Deposit / withdrawal metadata parsing uses the correct Zod schema
      (`DepositRequestMetadataSchema` / `WithdrawalRequestMetadataSchema`).
- [ ] `validateCallbackUrl` rejects non-HTTPS URLs (except `localhost`) if callback handling
      is touched.
- [ ] Lifecycle state machine transitions (`ALLOWED_TRANSITIONS`) are not bypassed —
      `isTransitionValid` / `transition` must be the single source of truth.
- [ ] `advanceAnchorTransactionStatus` does not silently wrap to `pending_user` on unknown
      status in new code paths; prefer `nextStatus()` from `lifecycle.ts`.
- [ ] `anchorStatusToUserMessage` and `anchorStatusBadge` have exhaustive `never` checks —
      adding a new status requires updating both switches.
- [ ] Mock transaction record factories (`createMockAnchorTransactionRecord`) set correct
      defaults for `completedAt`, `userActionRequired`, and `refunded` based on status.

### Payment intent and readiness correctness

- [ ] `createPaymentIntent` / `validatePaymentIntent` validate through `PaymentIntentSchema`
      before returning.
- [ ] `estimateTransactionReadinessSync` / `estimateTransactionReadiness` produce correct
      stage-level warnings for each scenario (invalid key, bad asset, bad amount, mainnet
      disabled, unfunded, insufficient funds).
- [ ] Spendable balance model (`computeBalanceModel`) is correctly integrated into readiness
      when provided; when omitted, no balance claims are made.
- [ ] `normalizeAmount` / `compareAmounts` handle edge cases (Infinity, NaN) — upstream
      validation must reject these before they reach arithmetic.

### Soroban contract correctness (only if `contracts/` changed)

- [ ] Every new admin-only function calls `require_admin()` on the stored admin Address.
- [ ] Milestone status transitions remain in the allowed DAG:
      `draft → active → evidence_submitted → approved → ready_for_release → released`
      with `disputed` branching from `evidence_submitted` or later.
- [ ] Evidence hash is write-once: `EvidenceAlreadySubmitted` is returned if
      `evidence_hash.is_some()` before overwriting.
- [ ] `ApprovalAfterDispute` is still enforced unless a `resolve_dispute` call was added.
- [ ] `DuplicateRelease` is still enforced — `release_milestone` rejects `Released` status.
- [ ] `ReleaseBeforeApproval` is still enforced — `mark_ready_for_release` requires `Approved`.
- [ ] `DisputeWithoutEvidence` is still enforced — dispute requires `>= EvidenceSubmitted`.
- [ ] Events are published with the correct tuple topic for every state-changing function.
      `assign_amount` is the only current exception (known gap — emit if fixing).
- [ ] `read_summary` aggregations use `saturating_add` / `saturating_sub` and the test suite
      covers the edge cases.
- [ ] `storage_version` is set on `initialize` and not mutated elsewhere.
- [ ] No new function bypasses the status guard to jump directly to `Released`.

### Secret leakage (R0–R6)

- [ ] **R0:** No new `console.log` / `logger` / error `.message` contains a raw secret.
      All log output goes through `redactSecrets()` or `createSafeLogger`.
- [ ] **R1:** No secret echoed in UI text, copy-to-clipboard, or URL. Validation inputs
      use `type="password"`.
- [ ] **R2:** No new `localStorage` / cookie / IndexedDB / server log persistence of secrets.
- [ ] **R3:** No secret in a constructed URL, callback query param, or `Authorization` header.
- [ ] **R4:** Structural validation (`validateSecretKeyQuietly` or `StellarSecretKeySchema`)
      runs before `Keypair.fromSecret` or similar SDK calls that could leak into stack traces.
- [ ] **R5:** All new secret-accepting APIs accept `unknown`, Zod-validate, and return
      branded types.
- [ ] **R6:** No committed real secret keys anywhere in fixtures/examples; only synthetic
      throwaway keypairs via `makeFakeSecret()` / `makeFakeKeypair()`.
- [ ] Diff search for the regexp `/S[A-Z2-7]{50,}/` returns zero hits outside of intentional
      test fixtures (and those fixtures are test-only throwaway keys).
- [ ] Error messages, new alerts, and UI labels only show redacted secrets when needed.

### Mainnet safety

- [ ] Defaults remain testnet-first (`DEFAULT_ENV_CONFIG.allowMainnet = false`).
- [ ] Any new mainnet code path is behind `assertNetworkAllowed(...)` and is not reachable
      from the web dashboard without an explicit env override.
- [ ] No hardcoded mainnet production URLs, custodial wallets, or payment submission that
      could be triggered accidentally.
- [ ] Soroban RPC access is not yet gated — document if the change introduces RPC calls that
      would need mainnet gating in the future.

### Test coverage

- [ ] New public functions in `packages/` have a positive and a negative Vitest case.
- [ ] Any new branch in error mapping or status transitions has a test.
- [ ] Fixture data uses shared fixtures from `packages/stellar-kit/test/fixtures/` where
      available; new fixtures are added to the shared module.
- [ ] For contract changes: happy path + error path tests added under `src/test.rs` covering
      the specific new guard.
- [ ] Tests do not print or assert on raw secret keys.
- [ ] `pnpm contract:test` passes (if `contracts/` changed).

### Documentation updates

- [ ] `/docs/PROJECT_OVERVIEW.md` or the relevant topic doc updated for any new user-facing
      package export.
- [ ] README `/docs/` index table updated if a new doc was added.
- [ ] `/docs/LOCAL_SETUP.md` updated if setup steps changed.
- [ ] `/docs/SECRET_KEY_HANDLING.md` updated if R0–R6 rules changed.
- [ ] `/docs/SECURITY_NOTES.md` or `/docs/SECURITY_THREAT_MODEL.md` updated if new threat
      areas were introduced.

### Issue acceptance criteria

- [ ] Every checkbox from the issue's Acceptance Criteria is satisfied in this PR or explicitly
      deferred to a follow-up issue with that issue linked.
- [ ] No out-of-scope refactors or unrelated changes slipped in; if they did, they are split
      into a separate PR.

### Final code verdict

- [ ] **Approve and merge.**
- [ ] **Approve with follow-up issue** (link): …
- [ ] **Changes requested before re-review.**

Maintainer notes:
> …

---

## Phase 2 — GrantFox reward-readiness review (post-merge)

> Completed by the campaign reviewer after merge. Merging a PR does **not** guarantee
> reward-readiness. This section evaluates the work against the original GrantFox issue scope,
> code quality, and project standards.

### Scope match

- [ ] The PR addresses the exact issue scope — no significant deviation from the issue
      description and acceptance criteria.
- [ ] The solution approach matches or improves upon what was proposed at assignment time.
- [ ] No critical acceptance criteria were redefined or silently dropped during review.

### Code quality

- [ ] Code follows existing patterns and conventions in the codebase (naming, structure,
      validation pattern: `validate` → `is` → `assert`).
- [ ] No phantom dependencies introduced (unused imports in `package.json`).
- [ ] No circular imports between packages.
- [ ] Barrel exports (`index.ts`) do not leak internal modules that should be private.

### Test quality

- [ ] Tests are deterministic (no flaky network calls, no timestamp-dependent assertions
      without mocking).
- [ ] Test descriptions clearly state the scenario and expected outcome.
- [ ] Edge cases are covered (empty inputs, boundary values, error paths).
- [ ] Shared fixtures from `packages/stellar-kit/test/fixtures/` are used where applicable.

### Security posture

- [ ] The change does not introduce new attack surfaces (new URLs, new callback handling,
      new user input paths).
- [ ] The R0–R6 rules are correctly applied throughout the changed code.
- [ ] No regression in existing security guarantees (mainnet gate, secret redaction,
      validation-first pattern).

### Documentation completeness

- [ ] All new public APIs are documented in the relevant topic doc.
- [ ] Any breaking changes or migration steps are documented.
- [ ] The PR description clearly explains what was changed and why.

### Follow-up issues

- [ ] Any known limitations or future work are documented as follow-up issues and linked
      in the PR description.
- [ ] No unresolved security concerns that should block reward-readiness.

### Reward-readiness verdict

- [ ] **Fully rewardable** — scope met, quality high, no follow-up needed.
- [ ] **Partially rewardable** — scope mostly met; follow-up PR needed for completion
      (link follow-up issue).
- [ ] **Not rewardable** — scope not met or quality below bar (provide written explanation
      with specific steps for earn-out).

Reviewer notes:
> …
