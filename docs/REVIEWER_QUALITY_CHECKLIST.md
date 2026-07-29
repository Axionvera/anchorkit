# Reviewer Quality Checklist

This document provides a standard quality checklist for AnchorKit maintainers and peer reviewers. Every pull request (PR) submitted to the repository must be evaluated against this checklist before merging to ensure consistent engineering quality, reliable test evidence, unbroken CI status, and full completion of issue acceptance criteria.

---

## 1. Overview and Review Workflow

AnchorKit uses a two-phase evaluation process:

1. **Phase 1 — Pre-Merge Code Quality Review:** Technical review conducted by maintainers before merging a pull request.
2. **Phase 2 — Post-Merge Evaluation & Reward Readiness:** Campaign and reward readiness assessment conducted for GrantFox issues after code merge.

Reviewers should copy the checklist below into their PR review comment to record explicit confirmation for each item.

---

## 2. Implementation Completeness Audit

Reviewers must verify that the implementation is complete, well-architected, and fully integrated across all affected components.

### 2.1 Type System and Schema Validation

- [ ] New public APIs, request objects, and external payloads are validated using Zod schemas in `packages/validators`.
- [ ] Branded types (`StellarPublicKey`, `StellarSecretKey`, etc.) in `packages/types` are enforced at component boundaries.
- [ ] Numeric precision rules are preserved: amounts are represented as 7-decimal strings to prevent floating-point loss.
- [ ] Exhaustive type guards and `never` checks exist for enum and status switch statements (for example, status-to-badge or status-to-message mapping).

### 2.2 Architecture and Package Boundaries

- [ ] Package import boundaries strictly conform to dependency guidelines (`pnpm check:boundaries`).
- [ ] Public functionality is exported via clean barrel files (`index.ts`) without exposing internal helper modules.
- [ ] Code avoids redundant state mutations and maintains idempotency where operations may be re-executed.
- [ ] Utility functions prefer reusability over duplicative helper declarations.

### 2.3 Domain and Protocol Correctness

- [ ] **Stellar SDK Integration:** Key parsing, transaction readiness checks, network gating (`assertNetworkAllowed`), and Horizon error mapping follow existing patterns.
- [ ] **Anchor and SEP Flows:** Lifecycle state transitions strictly utilize `isTransitionValid` and `transition` guards from `lifecycle.ts`.
- [ ] **Payment Intent Utilities:** Payments pass Zod validation through `PaymentIntentSchema` prior to execution or storage.
- [ ] **Soroban Treasury Escrow (Rust):** Admin guards (`require_admin()`), state transition DAGs, evidence hash immutability, dispute logic, and event emissions are verified.

### 2.4 Security and Secret Handling (R0–R6 Rules)

- [ ] **R0:** Logs, console statements, and error strings use secret redaction helpers (`redactSecrets` or `createSafeLogger`).
- [ ] **R1:** Secrets are never echoed in plain text UI elements or unmasked form fields.
- [ ] **R2:** Persistent storage (localStorage, IndexedDB, cookies) does not store raw secret keys.
- [ ] **R3:** HTTP headers, query parameters, and URL paths contain no secret tokens.
- [ ] **R4:** Structural key validation executes prior to SDK keypair instantiation.
- [ ] **R5:** Secret-accepting interfaces sanitize and return branded types.
- [ ] **R6:** Synthetic key factories (`makeFakeSecret`) are used exclusively in test code; no committed secrets exist.

---

## 3. Test Coverage and Verification Evidence Audit

Reviewers must verify that code changes are backed by deterministic tests and clear verification evidence.

### 3.1 Test Completeness

- [ ] **Positive Test Paths:** Happy-path tests cover standard operations for all new or modified functions.
- [ ] **Negative Test Paths:** Error handling, invalid inputs, edge cases (empty strings, zero amounts, invalid keys), and boundary conditions are explicitly tested.
- [ ] **Contract Tests:** Any changes under `contracts/treasury-escrow` include corresponding Rust unit/integration tests under `src/test.rs`.
- [ ] **No Flakiness:** Tests are deterministic and do not depend on external network calls or un-mocked dynamic state (timestamps, random generators).

### 3.2 Verification Evidence

- [ ] The PR description includes a explicit summary under **Testing Performed** detailing commands run and results obtained.
- [ ] UI changes in `apps/web` include before-and-after screenshots or recordings in the PR description.
- [ ] Console logs, CLI output, or test report snippets are attached when relevant.

---

## 4. Continuous Integration (CI) Status Audit

Reviewers must confirm that automated checks pass cleanly without overrides or skipped jobs.

- [ ] `pnpm verify` passes locally and in CI (runs formatting check, linting, typechecking, unit tests, and build).
- [ ] `pnpm check:boundaries` passes with zero architectural violations.
- [ ] `pnpm contract:test` passes when Rust contracts are modified.
- [ ] No ESLint warnings, TypeScript build errors, or unresolved compiler warnings are ignored.
- [ ] Code formatting strictly complies with repository Prettier configuration (`pnpm format:check`).

---

## 5. Issue Acceptance Criteria Audit

Reviewers must check that every requirement defined in the issue is satisfied.

- [ ] **Acceptance Criteria Traceability:** The PR body includes a completed Acceptance Criteria table mapping each item from the issue to file locations and tests.
- [ ] **Scope Match:** The PR solves the requested issue without introducing out-of-scope refactors or extra unrequested changes.
- [ ] **No Deferred Items:** All criteria are completed in the PR. If an item is deferred, a follow-up issue is linked with maintainer approval.
- [ ] **Documentation Updates:** Documentation in `/docs` and `README.md` is updated to reflect public API changes or workflow modifications.

---

## 6. Reviewer Decision Matrix

After completing the audit, reviewers must mark the final PR verdict in their review comment.

| Decision                   | Criteria                                                                            | Required Action                               |
| -------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| **Approve and Merge**      | All implementation, test, CI, and acceptance criteria checks pass cleanly.          | Merge PR and notify author.                   |
| **Approve with Follow-up** | Core scope passes; minor non-blocking items exist and have linked follow-up issues. | Document follow-up issue in merge comment.    |
| **Request Changes**        | Implementation incomplete, tests missing, CI failing, or criteria unsatisfied.      | Provide clear, actionable feedback to author. |

---

## 7. Maintainer Review Comment Template

Maintainers should copy the markdown block below when reviewing pull requests:

```markdown
## Maintainer Review Audit

### 1. Implementation Completeness

- [ ] Type validation and branded schemas enforced
- [ ] Architecture boundaries preserved
- [ ] Protocol and state machine rules satisfied
- [ ] Secret key handling (R0-R6) verified

### 2. Test Coverage & Evidence

- [ ] Unit and edge case tests present
- [ ] Test execution evidence included in PR description
- [ ] Deterministic test assertions confirmed

### 3. CI Status

- [ ] pnpm verify passes cleanly
- [ ] pnpm check:boundaries passes cleanly
- [ ] Contract tests pass (if contracts/ touched)

### 4. Acceptance Criteria

- [ ] Issue criteria mapped and verified
- [ ] Relevant documentation updated

### Decision

- [ ] Approved for merge
- [ ] Changes requested
```
