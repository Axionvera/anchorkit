## Summary

Closes #ISSUE_NUMBER_HERE

Describe what this PR delivers in 1-3 sentences. For implementation-heavy issues, self-check the scope against [docs/MEANINGFUL_IMPLEMENTATION_CHECKLIST.md](../docs/MEANINGFUL_IMPLEMENTATION_CHECKLIST.md).

## PR Evidence Checklist

Before requesting review, confirm the following evidence is present in this PR description. Each item links to detailed guidance. PRs missing evidence will be sent back for completion.

- [ ] **Issue reference:** PR body links the issue with `Closes #NNN`.
- [ ] **Implementation summary:** 1–3 sentence description of what changed and why.
- [ ] **Tests added or updated:** Test file names and test descriptions listed, or a specific no-test justification (see [TEST_EVIDENCE_REQUIREMENT.md](../docs/TEST_EVIDENCE_REQUIREMENT.md) for acceptable justifications).
- [ ] **Commands run:** Exact commands and their output or status (e.g. `pnpm verify`, `pnpm contract:test`, `pnpm check:boundaries`). See [TEST_EVIDENCE_REQUIREMENT.md](../docs/TEST_EVIDENCE_REQUIREMENT.md).
- [ ] **CI status:** State `Passing`, `Pending`, `Failing-fixed`, `Failing-unrelated`, or `Skipped` with supporting evidence. See [FAILING_CI_RESPONSE_GUIDE.md](../docs/FAILING_CI_RESPONSE_GUIDE.md).
- [ ] **Acceptance criteria coverage:** Link to a completion table or traceability table mapping each criterion to implementation evidence and tests. See [ACCEPTANCE_CRITERIA_COMPLETION.md](../docs/ACCEPTANCE_CRITERIA_COMPLETION.md).

## Issue scope

Fill in a completion table mapping every Acceptance Criterion from the issue to its status,
implementation evidence, and tests.

For cross-package issues, use [docs/ACCEPTANCE_CRITERIA_TRACEABILITY.md](../docs/ACCEPTANCE_CRITERIA_TRACEABILITY.md) to map each criterion to affected packages, tests, docs, examples, and behavior. See
[docs/ACCEPTANCE_CRITERIA_COMPLETION.md](../docs/ACCEPTANCE_CRITERIA_COMPLETION.md) for the full
format, status legend, and a worked example.

| Acceptance Criterion | Status | Implementation Evidence | Tests | Notes |
| -------------------- | ------ | ----------------------- | ----- | ----- |
| …                    |        |                         |       |       |
| …                    |        |                         |       |       |
| …                    |        |                         |       |       |

## Affected packages / apps

Check every workspace this PR touches (helps reviewers scope the diff and route it to the right
maintainer):

- [ ] `apps/web`
- [ ] `packages/types`
- [ ] `packages/config`
- [ ] `packages/fixtures`
- [ ] `packages/validators`
- [ ] `packages/stellar-kit`
- [ ] `packages/anchor-utils`
- [ ] `contracts/treasury-escrow`
- [ ] `docs/`
- [ ] Other (list):

## Testing performed

If any CI check is failing, summarize the failure and the fix or evidence that it is unrelated. See [docs/FAILING_CI_RESPONSE_GUIDE.md](../docs/FAILING_CI_RESPONSE_GUIDE.md).

Describe what you ran and how you verified the change (commands run, manual steps in the`ndashboard, contract test output, etc.). Include affected packages/apps, tests added or updated,`ncommands run, CI status, and any no-test justification. See`n[docs/TEST_EVIDENCE_REQUIREMENT.md](../docs/TEST_EVIDENCE_REQUIREMENT.md) and the area-specific minimums in [docs/MINIMUM_TESTING_STANDARD.md](../docs/MINIMUM_TESTING_STANDARD.md). This is required even when the checklist below is filled
in — the checklist confirms _that_ something was tested, this explains _how_.

## Screenshots / recordings

Required for any `apps/web` UI change. Mark N/A otherwise.

| Before | After |
| ------ | ----- |
|        |       |

## Security impact

- [ ] This PR touches secret handling, callback URLs, network selection, or contract
      admin/authorization logic (see Secret leakage / Mainnet safety checklist below).
- [ ] No security-relevant surface touched.

If checked, summarise the impact and mitigation here.

## Documentation impact

- [ ] Docs under `/docs` updated for this change.
- [ ] README updated (new package, script, or workflow).
- [ ] No user-facing behaviour changed — no docs update needed.

## Maintainer Review Checklist (self-check)

Paste the [MAINTAINER_REVIEW_CHECKLIST.md](./docs/MAINTAINER_REVIEW_CHECKLIST.md) **Phase 1** into
your PR description and mark each item. Do not fill out Phase 2 (GrantFox reward-readiness) —
that is completed by the campaign reviewer after merge.

GrantFox reviewers can use [docs/GRANTFOX_REVIEWER_CHECKLIST.md](../docs/GRANTFOX_REVIEWER_CHECKLIST.md) for scope, tests, CI, docs/examples, and acceptance-criteria review.

### PR self-check

- [ ] References the original issue with `Closes #NNN` in the PR body.
- [ ] Acceptance criteria on the issue are checked off individually in the PR description.
- [ ] `pnpm verify` passes locally (format, lint, typecheck, test, build).
- [ ] `pnpm check:boundaries` passes locally (if any `packages/*/src` import changed).
- [ ] `pnpm contract:test` passes locally (if anything under `contracts/` changed).
      Optionally use `pnpm verify:full` to cover verify + examples + boundaries + contract tests.

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

## Acceptance Criteria Audit

For multi-criterion issues, use or link the audit table in [docs/ACCEPTANCE_CRITERIA_AUDIT_TEMPLATE.md](../docs/ACCEPTANCE_CRITERIA_AUDIT_TEMPLATE.md) and mark incomplete criteria explicitly.

## GrantFox payment expectations

For `GrantFox OSS` / `Maybe Rewarded` issues, remember that merge does not guarantee payment. Before asking about a reward, self-review acceptance criteria, scope, test evidence, CI status, and any documented claim step in [docs/CONTRIBUTOR_PAYMENT_EXPECTATIONS.md](../docs/CONTRIBUTOR_PAYMENT_EXPECTATIONS.md).

## Contributor self-review

Before requesting review on a non-trivial issue, complete the self-review template in [docs/CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md](../docs/CONTRIBUTOR_SELF_REVIEW_TEMPLATE.md). Confirm affected packages, tests, CI, docs/examples, acceptance criteria, and residual risk are ready.
