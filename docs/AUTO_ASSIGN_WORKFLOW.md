# Auto-assign workflow

AnchorKit uses a central automation repository (`Axionvera/pocketpay-issue-automation`)
to manage first-comment assignment for GrantFox campaign issues. This document
explains how the auto-assign system works, what happens when assignment
succeeds or fails, and how maintainers recover from edge cases.

## Table of contents

1. [How it works](#1-how-it-works)
2. [Trigger workflow](#2-trigger-workflow)
3. [Central automation dispatch](#3-central-automation-dispatch)
4. [Assignment behaviour](#4-assignment-behaviour)
5. [Failure cases](#5-failure-cases)
6. [Maintainer recovery steps](#6-maintainer-recovery-steps)
7. [Related documentation](#7-related-documentation)

---

## 1. How it works

The flow is:

```text
Contributor comments on a GrantFox issue
                    ↓
GitHub issue_comment event fires
                    ↓
Central automation receives the event
                    ↓
Automation checks:
  - issue has GrantFox labels
  - issue has no existing assignee
  - comment is from a non-maintainer
  - comment is the first on the issue
                    ↓
If all checks pass:
  Automation assigns the contributor
  Automation posts a confirmation comment
                    ↓
If any check fails:
  Automation takes no action or posts a fallback comment
```

The auto-assign logic lives **entirely in the central automation repository**.
Source repositories (AnchorKit, PocketPay) do not contain an auto-assign
workflow file. They only dispatch events that the central repository consumes.

---

## 2. Trigger workflow

There is **no** `auto-assign.yml` in `.github/workflows/`. The auto-assign
workflow runs in the central automation repository and listens for
`issue_comment` events from the source repositories.

### What triggers the central workflow

| Event | Source | Listener |
|-------|--------|----------|
| `issue_comment.created` | Any source repository | Central automation repo |
| `issues.unassigned` | Any source repository | Central automation repo (cleanup) |

The central automation repository uses a GitHub App or a personal access token
(organisation-scoped) to receive webhooks or poll for events across the
organisation's repositories.

### Source-repository workflow file

AnchorKit does **not** need a local auto-assign workflow. The only local
workflow that communicates with the central automation is:

- `trigger-auto-merge.yml` — dispatches `pull_request` events to the central
  automation for auto-merge policy. This is unrelated to auto-assign but
  uses the same dispatch mechanism.

See [AUTOMATION_RUNBOOK.md](./AUTOMATION_RUNBOOK.md) for the dispatch model
and repository aliases.

---

## 3. Central automation dispatch

### Event types

The central automation repository may listen for the following dispatch events
in addition to direct webhook delivery:

| Dispatch event | Source | Purpose |
|----------------|--------|---------|
| `axionvera-pr-opened` | `trigger-auto-merge.yml` | Auto-merge policy |
| `axionvera-issue-comment` | (optional) | Auto-assign trigger |

### Payload format

When a source repository sends a `repository_dispatch` to the central
automation, the payload follows this structure:

```json
{
  "event_type": "axionvera-issue-comment",
  "client_payload": {
    "repo": "Axionvera/anchorkit",
    "issue_number": 89,
    "commenter": "octocat",
    "comment_id": 123456789
  }
}
```

### Authentication

The central automation authenticates using:

- `AXIONVERA_AUTOMATION_TOKEN` — an organisation-scoped secret stored in
  each source repository's Actions secrets. See Section 4 of
  [AUTOMATION_RUNBOOK.md](./AUTOMATION_RUNBOOK.md#4-authentication-and-secrets).
- A GitHub App installation with `Issues: write` and `Metadata: read`
  permissions across the organisation.

---

## 4. Assignment behaviour

### First-comment assignment

When a contributor posts their **first comment** on a GrantFox-eligible issue,
the central automation performs these checks:

| Check | Pass condition | Fail behaviour |
|-------|---------------|----------------|
| Issue has all three GrantFox labels | `GrantFox OSS` + `Maybe Rewarded` + `Official Campaign \| FWC26` | No action |
| Issue has no existing assignee | Assignee field is empty | No action (already assigned) |
| Commenter is not the issue author | Commenter login differs from opener | No action |
| Commenter is not a maintainer | Commenter is not in the maintainer team | No action |
| Comment is the first on the issue | No prior comments from other non-maintainers | No action |

When **all checks pass**, the automation:

1. Adds the commenter as the issue **Assignee** via the GitHub API.
2. Posts a confirmation comment:

   > Thank you for your interest, @{commenter}. You have been automatically
   > assigned to this issue. Please review the
   > [GrantFox contribution workflow](GRANTFOX_WORKFLOW.md) before starting
   > work.

3. Applies the `in-progress` label (if configured in the central workflow).

### Post-assignment behaviour

- If the assignee later comments, no re-assignment occurs.
- If the issue is unassigned (e.g., after 14 days of inactivity), the next
  first-time commenter may be auto-assigned.
- If the issue is closed and reopened, the assignment history is reset.

### What the automation does NOT do

- Does **not** assign maintainers or issue authors.
- Does **not** override an existing manual assignment.
- Does **not** assign on PR comments or review comments.
- Does **not** assign on non-GrantFox issues.
- Does **not** open or close issues.
- Does **not** modify issue titles, bodies, or milestones.

---

## 5. Failure cases

### 5.1 Commenter cannot be assigned

GitHub may refuse the assignment API call when:

| Cause | Error | Outcome |
|-------|-------|---------|
| Commenter is not a repository collaborator | `403` | Assignment skipped; fallback comment posted |
| Commenter has no GitHub account | N/A | Not possible — comments require an account |
| Commenter is the issue author | Assignment skipped | No action (maintainer assigns manually) |
| Commenter is a maintainer | Assignment skipped | No action |
| Token lacks `Issues: write` scope | `403` or `401` | Assignment skipped; maintainer alerted |
| Repository is archived | `410` | No action |
| Assignee limit reached (10 per issue) | `422` | Cannot occur — single assignee policy |

### 5.2 Fallback comment

When assignment fails, the central automation posts a comment:

> @{commenter}, we were unable to automatically assign you to this issue.
> This may happen if you are not a repository collaborator or if the
> automation token lacks the required permissions.
>
> A maintainer will review your application manually. Please allow up to
> 3 business days for a response.

The issue remains unassigned. A maintainer must complete the assignment
manually (see [Section 6](#6-maintainer-recovery-steps)).

### 5.3 Duplicate application detection

If a contributor has already been auto-assigned on another open GrantFox
issue, the central automation may (at its discretion) skip assignment and
post a reminder comment:

> @{commenter}, you are already assigned to #{otherIssue}. Please focus on
> completing that issue before applying for another, or ask a maintainer
> to unassign you from the first issue.

This behaviour depends on the central automation's configuration.

### 5.4 Automation unavailable

If the central automation repository is down or the dispatch fails:

- No auto-assignment occurs.
- Contributors who comment will not receive an automated response.
- Maintainers should fall back to manual assignment (Section 6).

---

## 6. Maintainer recovery steps

### 6.1 Manual assignment when auto-assign fails

If the automation cannot assign a user (Section 5.1), or if the central
automation is unavailable:

```bash
ISSUE_NUMBER=89
ASSIGNEE="octocat"
TARGET_REPO="Axionvera/anchorkit"

gh issue edit "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --add-assignee "$ASSIGNEE"
```

Verify:

```bash
gh issue view "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --json number,title,assignees
```

### 6.2 Post a manual confirmation comment

```bash
gh issue comment "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --body "Hi @$ASSIGNEE, you have been manually assigned to this issue. Please review the [GrantFox contribution workflow](GRANTFOX_WORKFLOW.md) before starting work."
```

### 6.3 Unassign and reassign

If a contributor was incorrectly auto-assigned (e.g., they applied on the
wrong issue):

```bash
gh issue edit "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --remove-assignee "$WRONG_ASSIGNEE"

gh issue edit "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --add-assignee "$CORRECT_ASSIGNEE"
```

### 6.4 Override auto-assignment for a maintainer-picked contributor

If a maintainer wants to assign a specific contributor who did not make the
first comment:

1. Wait for the automation to post its fallback or confirmation comment (or
   act immediately if the automation is unavailable).
2. Manually assign the desired contributor using `gh issue edit`.
3. Post a comment explaining the decision:

   > @{contributor}, you have been assigned to this issue by a maintainer.
   > Please review the [GrantFox contribution workflow](GRANTFOX_WORKFLOW.md).

4. If the automation assigned a different user first, unassign them first
   (Section 6.3) and add a polite note.

### 6.5 Recover from a stalled assignment

If the assignee has been inactive for 14 days (per the GrantFox stall policy):

```bash
gh issue edit "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --remove-assignee "$STALLED_ASSIGNEE"
```

Then post an unassignment comment:

```bash
gh issue comment "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --body "Unassigning @$STALLED_ASSIGNEE due to 14 days of inactivity. The issue is open for other contributors."
```

The next eligible commenter will be auto-assigned (if the automation is
active).

### 6.6 Disable auto-assign for a specific issue

Auto-assign is controlled by the GrantFox labels. To prevent auto-assignment
on a particular issue (e.g., a reserved issue), remove the GrantFox labels:

```bash
gh issue edit "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --remove-label "GrantFox OSS,Maybe Rewarded,Official Campaign | FWC26"
```

Re-add the labels when the issue is ready for auto-assignment again.

### 6.7 Verify central automation health

Check whether the central automation is processing events:

```bash
AUTOMATION_REPO="Axionvera/pocketpay-issue-automation"

gh run list \
  --repo "$AUTOMATION_REPO" \
  --event repository_dispatch \
  --limit 10
```

Inspect recent runs:

```bash
gh run list \
  --repo "$AUTOMATION_REPO" \
  --limit 10 \
  --json name,status,conclusion,createdAt
```

If no runs appear, the central workflow may be disabled or the dispatch did
not reach it. See Section 18 of [AUTOMATION_RUNBOOK.md](./AUTOMATION_RUNBOOK.md)
for dispatch recovery steps.

---

## 7. Related documentation

- [AUTOMATION_RUNBOOK.md](./AUTOMATION_RUNBOOK.md) — Central automation
  dispatch, token management, and recovery.
- [GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md) — Contribution workflow,
  application process, and assignment rules.
- [MAINTAINER_GUIDE.md](./MAINTAINER_GUIDE.md) — Maintainer responsibilities
  for triage and assignment.
- `trigger-auto-merge.yml` — Source-repository workflow for dispatching PR
  events to the central automation.
