# GrantFox Contribution Workflow

This document is authoritative for how contributors, maintainers, and campaign reviewers
interact during a GrantFox OSS campaign on AnchorKit. Read this before applying for any
issue carrying the `GrantFox OSS` label.

> **Key rule:** Do not open a PR until you are assigned. Unassigned PRs will not be
> reviewed for reward-readiness and may be closed without review.

---

## Table of contents

1. [Eligible issues](#1-eligible-issues)
2. [Application process](#2-application-process)
3. [Assignment rules](#3-assignment-rules)
4. [Implementation expectations](#4-implementation-expectations)
5. [PR submission requirements](#5-pr-submission-requirements)
6. [Maintainer review process](#6-maintainer-review-process)
7. [Communication rules](#7-communication-rules)
8. [Merge and reward readiness](#8-merge-and-reward-readiness)
9. [Earn-out and follow-up](#9-earn-out-and-follow-up)
10. [Common mistakes](#10-common-mistakes)

---

## 1. Eligible issues

Issues eligible for GrantFox rewards carry **all three** labels:

- `GrantFox OSS`
- `Maybe Rewarded`
- `Official Campaign | FWC26`

They also follow [ISSUE_STANDARD.md](./ISSUE_STANDARD.md) with mandatory sections
(Summary, Background, Scope, Acceptance Criteria, Tests, Docs, Security Notes, Estimate).

**Issues without all three labels are normal open-source issues.** Contributions are
welcome but will not be routed through the GrantFox reward process.

### How to find eligible issues

1. Go to the [Issues](../../issues) page.
2. Filter by label: `GrantFox OSS` + `Maybe Rewarded` + `Official Campaign | FWC26`.
3. Look for issues labelled `good first issue` (onboarding-friendly) or `expert`
   (Stellar/Rust deep expertise required).
4. Read the full issue body — it should follow the [ISSUE_STANDARD.md](./ISSUE_STANDARD.md)
   format with all mandatory sections.

---

## 2. Application process

### Step 1: Comment on the issue

Write an application comment containing **all three** of the following:

**1. Relevant experience** (one paragraph):
- Prior Stellar, Soroban, Rust, or TypeScript work.
- Links to prior OSS contributions or relevant projects.
- Any GrantFox campaign history.

**2. Approach plan** (1–4 bullets):
- Which files or modules you plan to change.
- High-level implementation strategy.
- Any design decisions or trade-offs you foresee.

**3. Estimated timeline:**
- When you will open the first PR draft (e.g. "within 3 days").

### Example application comment

> **Experience:** I've built two Soroban contracts for a Stellar DEX and contributed
> to `@stellar/stellar-sdk` TypeScript bindings. Previously rewarded on GrantFox for
> issue #42 (anchor lifecycle fixes).
>
> **Approach:**
> - Add `SOURCE_NETWORK_ERROR` to `StellarErrorCode` in `packages/types/src/index.ts`
> - Update `mapHorizonError` in `packages/stellar-kit/src/errors.ts` to map timeout
>   errors to the new code
> - Add Vitest cases for both network timeout and connection refused
> - Update `PAYMENT_INTENT_UTILITIES.md` with the new error code
>
> **Timeline:** First PR draft within 2 days.

### What NOT to do

- **Do not open a PR before being assigned.** This is the most common mistake.
- **Do not email maintainers directly.** All communication happens on the issue thread.
- **Do not apply on multiple issues simultaneously** unless you have maintainer approval.
  Focus on one issue at a time.

---

## 3. Assignment rules

### Who assigns

Only maintainers can assign GrantFox issues. A maintainer will reply on the issue thread
with one of:

- **Accepted:** You are added as Assignee. You may begin work.
- **Declined:** A short reason is provided (e.g. "another contributor with more relevant
  experience was assigned"). You are free to apply for other issues.

### Single assignee policy

- Each GrantFox issue has **one** assignee at a time.
- Only the assignee is eligible for a reward on that issue.
- Co-authored work requires explicit maintainer approval at assignment time and will
  usually be split into sub-issues instead.

### What if you are stalled?

- If you need to pause, comment on the issue explaining the situation.
- If there is no activity for **14 days** after assignment, the maintainer may unassign
  you so another contributor can pick it up.
- You may re-apply if the issue is still open after unassignment.

### What if you are declined?

- The maintainer will provide a brief reason.
- Apply for a different issue. Do not argue the decision on the issue thread.
- Common reasons: another contributor was a better fit, the scope does not match your
  expertise, or the issue needs redesign before implementation.

---

## 4. Implementation expectations

### Branch and setup

```bash
# Fork the repo on GitHub, then:
git clone git@github.com:<your-user>/anchorkit.git
cd anchorkit
git checkout -b feat/<short-slug>
pnpm install
```

Branch naming: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`.

### Code standards

- Follow existing code conventions (naming, structure, validation pattern:
  `validate` → `is` → `assert`).
- Use shared fixtures from `packages/stellar-kit/test/fixtures/` where available.
- Never commit real secret keys — use `makeFakeSecret()` / `makeFakeKeypair()`.
- All log output goes through `redactSecrets()` or `createSafeLogger`.
- Validate inputs with Zod before touching the network.

### Testing requirements

- **TypeScript changes:** Add or update Vitest tests under `packages/*/test/`.
- **Contract changes:** Add Rust tests under `contracts/treasury-escrow/src/test.rs`.
- **UI-only changes:** Add a note on how you tested manually.
- Every new public function needs a positive and a negative test case.
- Every new branch in error mapping or status transitions needs a test.

### Documentation requirements

- Update the relevant topic doc under `/docs/` for any new user-facing package export.
- Update the README docs index table if you add a new doc.
- Update security docs if you introduce new threat areas.

---

## 5. PR submission requirements

### PR title

First line must reference the issue number:

```
[#NNN] One-line summary of the change
```

Example: `[#42] Add SOURCE_NETWORK_ERROR to readiness engine`

### PR body structure

Use the [PR template](../../.github/PULL_REQUEST_TEMPLATE.md). It includes:

1. **Summary** — what this PR delivers (1–3 sentences).
2. **Issue scope** — copy the Acceptance Criteria checkboxes from the issue and check
   off each delivered line with a file/line or commit reference.
3. **Maintainer Review Checklist (self-check)** — paste Phase 1 from
   [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) and mark each item.
   Do not fill out Phase 2 (GrantFox reward-readiness) — that is completed by the
   campaign reviewer after merge.
4. **Risk / follow-ups** — any out-of-scope work or known limitations.

### PR body requirements

The PR body **must** contain:

- `Closes #NNN` or `Fixes #NNN` (so the issue closes on merge).
- Acceptance Criteria checkboxes checked off with commit/file references.
- Self-check of the Maintainer Review Checklist (Phase 1).

The PR body **should** contain:

- Design decisions and trade-offs.
- Screenshots or recordings for UI changes.
- Links to follow-up issues if any scope was deferred.

### CI requirements

All of these must pass before merge:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check:boundaries   # if packages/*/src imports changed
pnpm contract:test      # if contracts/ changed
pnpm format:check       # or run pnpm format first
```

---

## 6. Maintainer review process

### What maintainers evaluate

Using the [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md):

- Stellar network correctness (branded types, amounts, memos, assets, readiness).
- Anchor and SEP flow correctness (schemas, callbacks, lifecycle transitions).
- Payment intent and readiness correctness (validation, stages, balance model).
- Soroban contract correctness (admin auth, status DAG, evidence, events).
- Secret leakage (R0–R6 rules).
- Mainnet safety (testnet defaults, assertNetworkAllowed).
- Test coverage (positive/negative cases, branch coverage).
- Documentation updates.
- Exact match against issue Acceptance Criteria.

### Review rounds

Expect **1–3 rounds** of review. Each round:

1. The maintainer posts review comments on the PR.
2. You address feedback with new commits.
3. The maintainer re-reviews.

When all checklist items are satisfied and CI passes, the maintainer approves and merges.

### How to address feedback

- Reply to each comment explaining what you changed or why you disagree.
- Use fixup commits for small changes, then squash at the end.
- Do not force-push during review (it breaks comment threading).
- If you disagree with a review comment, explain your reasoning — maintainers may
  accept your approach if well-justified.

---

## 7. Communication rules

### Where to communicate

| Topic | Where |
|-------|-------|
| Application for an issue | Comment on the issue thread |
| Implementation questions | Comment on the issue thread or PR |
| Review feedback | PR review comments |
| Scope changes | Comment on the issue thread before implementing |
| Stalled progress | Comment on the issue thread |

### Response time

- Maintainers aim to respond within **3 business days**.
- If you have not heard back after 5 business days, ping the issue thread with a
  polite follow-up.
- Do not email maintainers directly or DM them on Discord for issue-related questions.

### Scope changes

If you discover the issue scope needs to change during implementation:

1. Comment on the issue explaining what you found.
2. Propose the scope change with rationale.
3. Wait for maintainer approval before implementing the new scope.
4. If the scope change is significant, the maintainer may create a follow-up issue
   instead of expanding the current one.

---

## 8. Merge and reward readiness

### What merge means

- All checklist items are satisfied.
- CI passes (lint, typecheck, test, build, contract tests).
- The maintainer approved and merged the PR.
- The issue is closed via `Closes #NNN`.

### What merge does NOT mean

> **Merging does not guarantee reward-readiness.**

Reward-readiness is decided by the GrantFox campaign reviewer **after merge**, evaluating:

1. **Scope match** — the PR addresses the exact issue scope, no significant deviation.
2. **Code quality** — follows existing patterns, no phantom deps, no circular imports.
3. **Test quality** — deterministic, clear descriptions, edge cases covered.
4. **Security posture** — no new attack surfaces, R0–R6 correctly applied.
5. **Documentation completeness** — all new APIs documented, breaking changes noted.
6. **Follow-up issues** — any known limitations are documented and linked.

### Reward-readiness verdicts

The campaign reviewer will mark one of:

- **Fully rewardable** — scope met, quality high, no follow-up needed.
- **Partially rewardable** — scope mostly met; follow-up PR needed for completion.
- **Not rewardable** — scope not met or quality below bar (written explanation provided).

---

## 9. Earn-out and follow-up

If your merged PR is judged "not yet rewardable":

1. You will receive a clear written explanation of what is missing.
2. Specific steps for an earn-out follow-up PR will be provided.
3. You may open the follow-up PR on the same issue (if re-opened) or a new linked issue.
4. The follow-up PR goes through the same review process.

If your merged PR is judged "partially rewardable":

1. A follow-up issue will be created with the remaining scope.
2. You may claim the follow-up issue using the standard application process.
3. The original PR + follow-up together must meet the full scope for reward-readiness.

---

## 10. Common mistakes

| Mistake | Why it's a problem | What to do instead |
|---------|-------------------|-------------------|
| Opening a PR before assignment | Not eligible for reward; may be closed without review | Apply via comment, wait for assignment |
| Applying for multiple issues at once | Spreads attention; risk of stalling | Focus on one issue; apply for more after completing the first |
| Skipping the self-check in PR body | Maintainers cannot verify your work efficiently | Paste and complete Phase 1 of the checklist |
| Not linking the issue with `Closes #NNN` | Issue stays open after merge | Always include `Closes #NNN` in PR body |
| Forcing push during review | Breaks review comment threading | Use fixup commits; squash at the end |
| Implementing scope changes without approval | May be out of scope for the issue | Comment on the issue first, wait for approval |
| Committing real secret keys | Security violation; PR will be rejected | Use `makeFakeSecret()` / `makeFakeKeypair()` |
| Ignoring review feedback | Delays merge; may be unassigned | Address each comment; explain disagreements |
