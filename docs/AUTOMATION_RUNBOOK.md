# Axionvera Automation Runbook

This runbook covers the central automation workflows used across Axionvera repos
(**AnchorKit** and **PocketPay**) for issue creation, label sync, auto-merge, and
batch recovery. It is intended for maintainers who need to operate or debug the
automation pipeline.

## Repository aliases

The automation system references repos by short aliases. These are used in
dispatch payloads, batch configs, and CLI one-liners.

| Alias | Full repo | Purpose |
| --- | --- | --- |
| `anchorkit` | `Axionvera/anchorkit` | Stellar developer toolkit monorepo |
| `pocketpay` | `Axionvera/pocketpay` | PocketPay product repo |
| `pocketpay-issue-automation` | `Axionvera/pocketpay-issue-automation` | Central automation dispatcher |

All automation commands in this document assume you have the **GitHub CLI (`gh`)** installed
and authenticated with a token that has `repo` scope.

## Required secrets and tokens

| Secret | Where used | Required scopes | Notes |
| --- | --- | --- | --- |
| `AXIONVERA_AUTOMATION_TOKEN` | Each repo's `trigger-auto-merge.yml` workflow | `repo`, `workflow` | PAT used to dispatch events to the central automation repo. Must belong to a user with write access to the target repo. |
| `GH_TOKEN` (local) | CLI commands in this runbook | `repo`, `read:org`, `workflow` | Your personal PAT or `gh auth login` session. Used for all `gh` commands below. |

### Verifying token permissions

```bash
# Check current auth status
gh auth status

# Required scopes: repo, read:org, workflow
# If missing scopes, refresh:
gh auth refresh -h github.com -s repo,read:org,workflow
```

## Label management

Labels are defined in `.github/LABELS.yml`. Apply them once on new repos or
re-sync after changes.

### Sync labels from LABELS.yml

```bash
# Dry-run (preview what would be created)
gh label list -R Axionvera/anchorkit

# Apply labels from the manifest
# Run from repo root where LABELS.yml lives
cat .github/LABELS.yml | yq -r '.[] | "\(.name)\t\(.color)\t\(.description)"' | \
  while IFS=$'\t' read -r name color desc; do
    gh label create "$name" \
      --color "$color" \
      --description "$desc" \
      -R Axionvera/anchorkit \
      --force
  done
```

If `yq` is not available, install it via `npm i -g yq` or use the manual approach
below.

### Manual label creation (fallback)

```bash
gh label create "GrantFox OSS" --color "9443fb" --description "Participates in GrantFox open source program." -R Axionvera/anchorkit --force
gh label create "Maybe Rewarded" --color "f59e0b" --description "Candidate for GrantFox reward if fully delivered and reviewed." -R Axionvera/anchorkit --force
gh label create "Official Campaign | FWC26" --color "ec4899" --description "Part of the FWC26 official campaign scope." -R Axionvera/anchorkit --force
gh label create "stellar" --color "2563eb" --description "Relates to classic Stellar primitives." -R Axionvera/anchorkit --force
gh label create "soroban" --color "7e22ce" --description "Relates to Soroban smart contracts, SDK, or RPC." -R Axionvera/anchorkit --force
gh label create "anchor" --color "15803d" --description "Relates to anchor-side flows." -R Axionvera/anchorkit --force
gh label create "sep" --color "0ea5e9" --description "Relates to a Stellar Ecosystem Proposal." -R Axionvera/anchorkit --force
gh label create "wallet" --color "38bdf8" --description "Relates to wallet-side integrations." -R Axionvera/anchorkit --force
gh label create "payments" --color "f97316" --description "Payment building, readiness, submission, or reconciliation logic." -R Axionvera/anchorkit --force
gh label create "escrow" --color "6366f1" --description "Soroban treasury-escrow contract or its TypeScript client / UI." -R Axionvera/anchorkit --force
gh label create "security" --color "dc2626" --description "Security impact, secret handling, safe defaults." -R Axionvera/anchorkit --force
gh label create "test" --color "0d9488" --description "Adds or improves tests." -R Axionvera/anchorkit --force
gh label create "documentation" --color "a16207" --description "Docs, examples, README, setup guides." -R Axionvera/anchorkit --force
gh label create "good first issue" --color "70cfff" --description "Approachable for first-time contributors." -R Axionvera/anchorkit --force
gh label create "expert" --color "475569" --description "Requires Stellar/Soroban domain depth or security experience." -R Axionvera/anchorkit --force
gh label create "bug" --color "b91c1c" --description "Something is broken." -R Axionvera/anchorkit --force
gh label create "enhancement" --color "a855f7" --description "New feature or request." -R Axionvera/anchorkit --force
gh label create "needs-repro" --color "fca5a5" --description "Issue needs a reproducer from the reporter." -R Axionvera/anchorkit --force
```

## Issue creation

### Single issue

```bash
gh issue create \
  --repo Axionvera/anchorkit \
  --title "[GrantFox] Short title" \
  --label "GrantFox OSS,Maybe Rewarded,Official Campaign | FWC26,documentation,expert" \
  --body-file issue-body.md
```

### Batch issue creation

When creating multiple issues at once (e.g., from a JSON or YAML batch file):

```bash
# Example: issues.json is an array of {title, labels, body} objects
cat issues.json | jq -c '.[]' | while read -r item; do
  title=$(echo "$item" | jq -r '.title')
  labels=$(echo "$item" | jq -r '.labels | join(",")')
  body=$(echo "$item" | jq -r '.body')

  echo "Creating: $title"
  gh issue create \
    --repo Axionvera/anchorkit \
    --title "$title" \
    --label "$labels" \
    --body "$body" \
    || echo "FAILED: $title"
done
```

### Batch naming convention

Use a consistent prefix for batch-created issues to track them:

```
[GrantFox] Feature name — description
```

Examples:
- `[GrantFox] Add secret leakage regression tests`
- `[GrantFox] Implement testnet-first network safety gate`

### Dry-run (preview without creating)

```bash
# Just print what would be created
cat issues.json | jq -r '.[] | "Would create: \(.title) [\(.labels | join(", "))]"'
```

## Auto-merge workflow

The auto-merge system works through GitHub Actions `workflow_dispatch` events:

1. A PR is opened/reopened/synced in `anchorkit` or `pocketpay`.
2. The `trigger-auto-merge.yml` workflow fires and dispatches an event to
   `Axionvera/pocketpay-issue-automation`.
3. The central automation repo processes the event (e.g., auto-merge if CI passes,
   apply labels, notify GrantFox).

### Triggering auto-merge manually

```bash
# Dispatch the auto-merge event for a specific PR
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/Axionvera/pocketpay-issue-automation/dispatches \
  -f event_type=axionvera-pr-opened \
  -F client_payload[repo]="Axionvera/anchorkit" \
  -F client_payload[pr_number]=42
```

### Checking auto-merge status

```bash
# List recent workflow runs in the automation repo
gh run list -R Axionvera/pocketpay-issue-automation --limit 10

# View a specific run
gh run view <run-id> -R Axionvera/pocketpay-issue-automation
```

## Partial failure recovery

### Failed issue batch

If a batch of issues fails partway through:

1. **Identify which issues were created:**
   ```bash
   gh issue list -R Axionvera/anchorkit --state open --json number,title \
     --jq '.[] | "\(.number)\t\(.title)"' | grep "GrantFox"
   ```

2. **Identify which issues are missing** by comparing against your batch file.

3. **Re-run only the missing issues:**
   ```bash
   # Create only the issues that don't already exist
   cat issues.json | jq -c '.[]' | while read -r item; do
     title=$(echo "$item" | jq -r '.title')
     # Check if issue already exists
     existing=$(gh issue list -R Axionvera/anchorkit --search "$title" --json number --jq '.[0].number // empty')
     if [ -z "$existing" ]; then
       echo "Creating: $title"
       gh issue create \
         --repo Axionvera/anchorkit \
         --title "$title" \
         --label "$(echo "$item" | jq -r '.labels | join(",")')" \
         --body "$(echo "$item" | jq -r '.body')"
     else
       echo "Already exists (#$existing): $title"
     fi
   done
   ```

### Missing labels

If issues were created but labels are missing:

```bash
# Check labels on an issue
gh issue view 42 -R Axionvera/anchorkit --json labels

# Add missing labels
gh issue edit 42 -R Axionvera/anchorkit --add-label "GrantFox OSS,Maybe Rewarded"
```

### Failed auto-merge dispatch

If the auto-merge workflow failed to dispatch:

1. **Check the workflow run logs:**
   ```bash
   gh run list -R Axionvera/anchorkit --workflow=trigger-auto-merge.yml --limit 5
   gh run view <run-id> -R Axionvera/anchorkit --log
   ```

2. **Re-trigger manually:**
   ```bash
   gh api \
     --method POST \
     -H "Accept: application/vnd.github+json" \
     /repos/Axionvera/pocketpay-issue-automation/dispatches \
     -f event_type=axionvera-pr-opened \
     -F client_payload[repo]="Axionvera/anchorkit" \
     -F client_payload[pr_number]=<PR_NUMBER>
   ```

3. **If the token is expired**, update `AXIONVERA_AUTOMATION_TOKEN` in the repo
   secrets under Settings > Secrets and variables > Actions.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `gh: Not authenticated` | Token missing or expired | Run `gh auth login` or set `GH_TOKEN` env var |
| `Resource not found` | Insufficient token scope | Run `gh auth refresh -h github.com -s repo,workflow` |
| Labels not appearing | LABELS.yml not applied | Run the label sync script above |
| Auto-merge not triggering | Workflow file missing or broken | Verify `.github/workflows/trigger-auto-merge.yml` exists |
| Dispatch fails with 404 | `AXIONVERA_AUTOMATION_TOKEN` missing or wrong | Check repo Settings > Secrets |
| Issues created without labels | Label names don't match exactly | Check for typos; labels are case-sensitive |

## Security notes

- Never commit tokens or secrets to the repository.
- The `AXIONVERA_AUTOMATION_TOKEN` should only have `repo` and `workflow` scopes —
  do not use a super-admin token.
- All `gh` commands in this runbook use HTTPS and are safe for CI environments.
- If you suspect a token leak, revoke it immediately at
  https://github.com/settings/tokens and rotate the secret in the repo.

## Related docs

- [MAINTAINER_GUIDE.md](./MAINTAINER_GUIDE.md) — triage, review, merge rules
- [GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md) — contributor reward flow
- [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) — how to contribute
- [LABELS.yml](../.github/LABELS.yml) — label definitions
