# Issue application guide

This document explains how to apply to work on an open AnchorKit issue: what to say in your
application comment, when you're allowed to start work, how to keep the issue thread useful
while you're assigned, and how to link your PR back to the issue. It applies to **every**
AnchorKit issue, not only GrantFox campaign issues.

> **Key rule:** Comment and wait for an assignee before opening a PR. Unassigned, unsolicited
> PRs slow down review and may be closed without a full review.

## Table of contents

1. [Who this is for](#1-who-this-is-for)
2. [How to apply](#2-how-to-apply)
3. [Example application comments](#3-example-application-comments)
4. [Assignment-before-work rule](#4-assignment-before-work-rule)
5. [While you're assigned](#5-while-youre-assigned)
6. [PR linking expectations](#6-pr-linking-expectations)
7. [Submitting your PR](#7-submitting-your-pr)
8. [Maintainer assignment notes](#8-maintainer-assignment-notes)
9. [Common mistakes](#9-common-mistakes)
10. [Related documentation](#10-related-documentation)

---

## 1. Who this is for

- First-time contributors looking for a `good first issue`.
- Regular contributors picking up `bug`, `enhancement`, or `documentation` issues.
- GrantFox campaign contributors applying for issues labelled `GrantFox OSS` +
  `Maybe Rewarded` + `Official Campaign | FWC26`. Read this guide first, then read
  [GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md) for the reward-specific rules on top of it.

If an issue does not carry the GrantFox labels, everything in this guide still applies except
the reward-readiness review — it's simply a normal open-source contribution.

---

## 2. How to apply

1. Read the full issue body before commenting, including Acceptance Criteria and any
   "Out of scope" section. See [ISSUE_STANDARD.md](./ISSUE_STANDARD.md) for the format
   maintainers use when writing issues.
2. Check the **Assignees** field. If someone is already assigned, don't apply — comment
   only if you have a clarifying question, or look for a different issue.
3. Post a single comment on the issue containing:
   - **Relevant experience** — a sentence or two on background that applies to this issue
     (prior Stellar/Soroban/TypeScript work, links to past contributions).
   - **Approach** — a short bullet list of the files or modules you expect to touch and your
     high-level plan.
   - **Timeline** — when you expect to open a draft PR.
4. Wait for a maintainer to reply. Do not start implementation before that reply (see
   [Section 4](#4-assignment-before-work-rule)).

---

## 3. Example application comments

**Good first issue / general bug fix:**

> Hi, I'd like to work on this. I've fixed a couple of small TypeScript bugs in
> `packages/stellar-kit` before (see PR #53). My plan is to update `mapHorizonError` in
> `packages/stellar-kit/src/errors.ts` to handle the new status code and add a Vitest case
> for it. I can have a draft PR up within 2 days.

**Documentation issue:**

> I'd like to take this one. I'll add the new page under `docs/`, link it from the README docs
> index table, and cross-reference the existing contributor guide so the two don't drift.
> Draft PR within a day.

**GrantFox campaign issue** (see [GRANTFOX_WORKFLOW.md § 2](./GRANTFOX_WORKFLOW.md#2-application-process)
for the full three-part format this campaign requires):

> **Experience:** I've built two Soroban contracts for a Stellar DEX and contributed to the
> `@stellar/stellar-sdk` TypeScript bindings.
>
> **Approach:**
> - Add `SOURCE_NETWORK_ERROR` to `StellarErrorCode` in `packages/types/src/index.ts`
> - Update `mapHorizonError` to map timeout errors to the new code
> - Add Vitest cases for both network timeout and connection refused
>
> **Timeline:** First PR draft within 2 days.

What makes these applications useful to a maintainer: they're specific about *what* will
change, not just *that* the contributor wants to help. "I'd like to work on this" with nothing
else is not an actionable application — a maintainer cannot judge fit or assign confidently
from it alone.

---

## 4. Assignment-before-work rule

- **Do not open a PR before you are assigned.** Assignment is what a maintainer uses to signal
  "yes, go ahead" — it avoids two contributors duplicating work on the same issue, and for
  GrantFox issues it's a precondition for reward-readiness review.
- Some repositories in this org run first-comment auto-assignment. See
  [AUTO_ASSIGN_WORKFLOW.md](./AUTO_ASSIGN_WORKFLOW.md) for exactly when that applies, what the
  automation checks before assigning you, and what happens if the automated assignment fails
  (a maintainer completes it manually — you don't need to do anything differently).
- If you're not sure whether you've been assigned, check the issue's **Assignees** field in the
  GitHub sidebar, or wait for the confirmation comment.
- Draft PRs opened for early feedback are fine **after** assignment; opening one before
  assignment doesn't skip the queue and may be closed with a note to apply first.

---

## 5. While you're assigned

- If you get blocked or need to pause, comment on the issue explaining the situation instead of
  going quiet. Assignments with no activity for 14 days may be released back to the pool (see
  [AUTO_ASSIGN_WORKFLOW.md § 6.5](./AUTO_ASSIGN_WORKFLOW.md#65-recover-from-a-stalled-assignment)).
- If the scope turns out to be different from what the issue describes, comment on the issue and
  wait for maintainer sign-off before implementing the new scope — don't silently expand or
  shrink it.
- Keep implementation questions on the issue thread (or the PR once it's open), not in DMs or
  email, so the discussion stays visible to reviewers and other contributors.

---

## 6. PR linking expectations

- The PR title's first line should reference the issue number, e.g. `[#98] Add issue
  application guidance`.
- The PR body **must** contain `Closes #NNN` or `Fixes #NNN` so the issue closes automatically
  on merge.
- If a PR only partially addresses an issue, use `Refs #NNN` instead of `Closes #NNN` and say
  so explicitly in the PR body — don't let a partial PR auto-close a not-yet-finished issue.
- Use the [PR template](../.github/PULL_REQUEST_TEMPLATE.md); GitHub pre-fills it automatically.
  Fill in every section — mark items `N/A` rather than deleting them.

---

## 7. Submitting your PR

1. Fork the repo and branch from `main`: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, or
   `chore/<slug>`.
2. Implement the change, add or update tests, and update the relevant `docs/*.md` file if the
   change is user-facing.
3. Run `pnpm verify` locally before pushing (see [LOCAL_VERIFICATION.md](./LOCAL_VERIFICATION.md)).
4. Open the PR with the linking expectations from [Section 6](#6-pr-linking-expectations).
5. Respond to review feedback with new commits rather than force-pushing, so comment threads
   stay intact.

For the full contribution loop (setup, tests, security awareness), see
[CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md).

---

## 8. Maintainer assignment notes

When reviewing an application comment:

- Confirm the issue has no existing assignee before assigning a new applicant.
- A useful application names concrete files/modules and a plan — don't require the same
  three-part format from [GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md) on non-campaign issues,
  but do expect more than "I'll take this."
- Reply on the issue thread with either an explicit assignment or a short, polite decline —
  silence leaves the applicant unsure whether to wait or move on.
- If [auto-assign](./AUTO_ASSIGN_WORKFLOW.md) already handled the assignment, you don't need to
  assign manually — just confirm it landed correctly and step in only for the failure cases
  documented there.
- One assignee per issue. If you want to override the automated or first-accepted applicant in
  favour of someone else, follow
  [AUTO_ASSIGN_WORKFLOW.md § 6.4](./AUTO_ASSIGN_WORKFLOW.md#64-override-auto-assignment-for-a-maintainer-picked-contributor).
- See [MAINTAINER_GUIDE.md § GrantFox assignments](./MAINTAINER_GUIDE.md#grantfox-assignments) for
  the campaign-specific assignment rules on top of the above.

---

## 9. Common mistakes

| Mistake | What to do instead |
|---------|--------------------|
| Opening a PR before being assigned | Comment to apply, wait for a maintainer reply |
| Applying with no plan ("I'll take this") | Name the files/modules you expect to touch and a rough timeline |
| Applying to an already-assigned issue | Check the Assignees field first; look for a different issue |
| Going quiet after being assigned | Comment on the issue if you're blocked or need more time |
| Omitting `Closes #NNN` from the PR body | Always link the issue so it closes on merge (or use `Refs #NNN` for partial work) |
| Expanding scope without asking | Comment on the issue and wait for approval before implementing beyond the stated scope |

---

## 10. Related documentation

- [GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md) — full campaign application, review, and
  reward-readiness process for GrantFox-labelled issues.
- [AUTO_ASSIGN_WORKFLOW.md](./AUTO_ASSIGN_WORKFLOW.md) — how first-comment auto-assignment
  works and how maintainers recover from failure cases.
- [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) — the full contribution loop: setup, testing,
  security awareness, docs.
- [MAINTAINER_GUIDE.md](./MAINTAINER_GUIDE.md) — triage, review, and assignment responsibilities.
- [ISSUE_STANDARD.md](./ISSUE_STANDARD.md) — the format issues are expected to follow.
