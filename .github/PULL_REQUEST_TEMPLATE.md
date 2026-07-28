## Summary

Closes #ISSUE_NUMBER_HERE

Describe what this PR delivers in 1-3 sentences.

## Issue scope

Copy the Acceptance Criteria checkboxes from the issue and check off each delivered line:

- [ ] …
- [ ] …
- [ ] …

## Maintainer Review Checklist (self-check)

Paste the [MAINTAINER_REVIEW_CHECKLIST.md](./docs/MAINTAINER_REVIEW_CHECKLIST.md) **Phase 1** into
your PR description and mark each item. Do not fill out Phase 2 (GrantFox reward-readiness) —
that is completed by the campaign reviewer after merge.

### PR self-check
- [ ] References the original issue with `Closes #NNN` in the PR body.
- [ ] Acceptance criteria on the issue are checked off individually in the PR description.
- [ ] `pnpm lint` passes locally.
- [ ] `pnpm typecheck` passes locally.
- [ ] `pnpm test` passes locally.
- [ ] `pnpm check:boundaries` passes locally (if any `packages/*/src` import changed).
- [ ] `pnpm contract:test` passes locally (if anything under `contracts/` changed).
- [ ] `pnpm format:check` passes or `pnpm format` was applied.

### Stellar network correctness
- [ ] New key parsing matches branded types.
- [ ] Amounts remain 7-decimal strings.
- [ ] Memo rules enforced if touched.
- [ ] Horizon error handling maps to typed codes correctly.
- [ ] `assertNetworkAllowed` called before any Horizon/RPC call that could reach mainnet.

### Anchor and SEP flow correctness
- [ ] Deposit/withdrawal metadata uses correct Zod schemas.
- [ ] `validateCallbackUrl` rejects non-HTTPS if callbacks touched.
- [ ] Lifecycle transitions not bypassed — `isTransitionValid` / `transition` used.
- [ ] Exhaustive `never` checks in status-to-message/badge switches.

### Payment intent and readiness correctness
- [ ] Payment intents validated through `PaymentIntentSchema`.
- [ ] Readiness stages produce correct warnings for each scenario.
- [ ] Spendable balance model correctly integrated when provided.

### Soroban contract correctness (if `contracts/` changed)
- [ ] Admin-only functions call `require_admin()`.
- [ ] Status transitions remain in the allowed DAG.
- [ ] Evidence is write-once (`EvidenceAlreadySubmitted` enforced).
- [ ] `DuplicateRelease`, `ReleaseBeforeApproval`, `ApprovalAfterDispute` enforced.
- [ ] Events published with correct tuple topic for each state change.
- [ ] Summary aggregations use `saturating_add` / `saturating_sub`.

### Secret leakage (R0–R6)
- [ ] R0: No raw secret in logs/errors.
- [ ] R1: No secret echoed in UI/copy/URL.
- [ ] R2: No localStorage/cookie persistence.
- [ ] R3: No secret in URLs/headers.
- [ ] R4: Validation before SDK calls.
- [ ] R5: Branded types for secret-accepting APIs.
- [ ] R6: No real secrets in fixtures.
- [ ] Diff search for `/S[A-Z2-7]{50,}/` is clean.

### Mainnet safety
- [ ] Defaults remain testnet-first.
- [ ] New mainnet paths behind `assertNetworkAllowed`.
- [ ] No hardcoded mainnet production URLs.

### Tests
- [ ] New public functions have positive + negative Vitest cases.
- [ ] New branches in error mapping / status transitions have tests.
- [ ] Contract changes: happy path + error path tests in `src/test.rs`.
- [ ] Tests do not print or assert on raw secrets.

### Documentation
- [ ] Topic docs updated for new user-facing exports.
- [ ] README docs index updated if new doc added.
- [ ] Security docs updated if new threat areas introduced.

## Risk / follow-ups

Any out-of-scope follow-up issues or known follow-up work. List them here and (if already created) link the follow-up issue numbers.
