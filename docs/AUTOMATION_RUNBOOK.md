# Axionvera Maintainer Automation Runbook

This runbook explains how maintainers operate the central Axionvera automation system across AnchorKit and PocketPay.

It covers:

- repository aliases;
- authentication and token permissions;
- label generation and synchronization;
- issue-batch validation and dry runs;
- single and batch issue creation;
- batch naming;
- partial failure recovery;
- missing-label recovery;
- auto-merge activation;
- central repository dispatch;
- workflow monitoring and troubleshooting.

This document describes maintainer operations. Contributors should not run issue-creation, label-sync, dispatch, or auto-merge commands unless a maintainer has explicitly authorised them.

## 1. Repository map

The automation system uses short aliases so that commands and batch records remain consistent.

| Alias           | GitHub repository                      | Responsibility                                      |
| --------------- | -------------------------------------- | --------------------------------------------------- |
| `anchorkit`     | `Axionvera/anchorkit`                  | AnchorKit monorepo                                  |
| `pocketpay`     | `Axionvera/pocketpay-sdk`              | PocketPay SDK repository                            |
| `pocketpay-sdk` | `Axionvera/pocketpay-sdk`              | Explicit PocketPay SDK alias                        |
| `automation`    | `Axionvera/pocketpay-issue-automation` | Central automation dispatcher and policy repository |

The central automation repository may be private. A `404` response can therefore mean either:

- the repository name is incorrect;
- the authenticated account cannot access it;
- the token does not include that repository.

Do not use the obsolete repository value:

```text
Axionvera/pocketpay
```

The PocketPay target covered by this runbook is:

```text
Axionvera/pocketpay-sdk
```

## 2. Resolve a repository alias

Use one of the documented aliases rather than repeatedly typing repository names.

```bash
REPO_ALIAS="${REPO_ALIAS:-anchorkit}"

case "$REPO_ALIAS" in
  anchorkit)
    TARGET_REPO="Axionvera/anchorkit"
    ;;
  pocketpay|pocketpay-sdk)
    TARGET_REPO="Axionvera/pocketpay-sdk"
    ;;
  *)
    echo "Unknown repository alias: $REPO_ALIAS" >&2
    exit 1
    ;;
esac

AUTOMATION_REPO="Axionvera/pocketpay-issue-automation"

echo "Target repository: $TARGET_REPO"
echo "Automation repository: $AUTOMATION_REPO"
```

Examples:

```bash
REPO_ALIAS=anchorkit
```

```bash
REPO_ALIAS=pocketpay
```

After changing the alias, rerun the resolution block before running any write command.

## 3. Required local tools

Maintainer commands may require:

| Tool    | Purpose                                                         |
| ------- | --------------------------------------------------------------- |
| `git`   | Repository and branch operations                                |
| `gh`    | GitHub issues, labels, pull requests, Actions, and API requests |
| `jq`    | JSON validation, preview, and batch processing                  |
| `yq`    | Reading `.github/LABELS.yml` for label synchronization          |
| Node.js | Running repository validation scripts                           |
| `pnpm`  | Running AnchorKit validation commands                           |

Confirm the main tools:

```bash
git --version
gh --version
jq --version
yq --version
node --version
pnpm --version
```

A maintainer running repository scripts must first install the locked dependencies:

```bash
pnpm install --frozen-lockfile
```

A missing `node_modules` directory means commands using `tsx`, Vitest, Turborepo, or other local packages cannot run.

## 4. Authentication and secrets

### 4.1 Local GitHub authentication

Local `gh` commands use either:

- the authenticated `gh` session; or
- the `GH_TOKEN` environment variable.

Check the active account:

```bash
gh auth status
```

Confirm access to both target repositories:

```bash
gh repo view Axionvera/anchorkit \
  --json nameWithOwner,viewerPermission

gh repo view Axionvera/pocketpay-sdk \
  --json nameWithOwner,viewerPermission
```

Confirm access to the central automation repository:

```bash
gh repo view Axionvera/pocketpay-issue-automation \
  --json nameWithOwner,viewerPermission
```

Do not continue with write operations unless the account and repository targets are correct.

### 4.2 Repository Actions secret

The source repositories may use this Actions secret:

```text
AXIONVERA_AUTOMATION_TOKEN
```

Purpose:

- authenticate from AnchorKit or PocketPay to the central automation repository;
- create the central `repository_dispatch` event;
- allow the central workflow to receive the repository and pull-request details.

Store it under:

```text
Repository Settings
→ Secrets and variables
→ Actions
→ Repository secrets
```

The secret must exist separately in every repository that sends dispatch events.

### 4.3 Token permission matrix

Use the least privilege that supports the required operation.

| Operation                                            | Required access                                      |
| ---------------------------------------------------- | ---------------------------------------------------- |
| View repositories and metadata                       | Repository metadata read                             |
| Create or edit issues                                | Issues write                                         |
| Create or edit labels                                | Issues write                                         |
| Read pull-request state                              | Pull requests read                                   |
| Enable native auto-merge                             | Pull requests write and repository write access      |
| View workflow runs                                   | Actions read                                         |
| Trigger `workflow_dispatch`                          | Actions write                                        |
| Send `repository_dispatch` to the central repository | Contents write on the central automation repository  |
| Read organisation-owned private repositories         | Access to the organisation and selected repositories |

For a classic personal access token, maintainers may require:

```text
repo
workflow
read:org
```

Use `read:org` only when organisation membership or private repository discovery requires it.

For a fine-grained token:

- select only the required Axionvera repositories;
- grant `Issues: write` for issue and label operations;
- grant `Pull requests: write` for auto-merge operations;
- grant `Actions: read` or `Actions: write` as required;
- grant `Contents: write` on the central automation repository for `repository_dispatch`.

### 4.4 Token safety

Never:

- commit a token;
- paste a token into an issue or pull request;
- place a token in a batch JSON file;
- print a token in workflow logs;
- place a token directly in a command saved in shell history;
- reuse a broad personal administrator token when a narrower token works.

If exposure is suspected:

1. revoke the token immediately;
2. create a replacement with minimum permissions;
3. update affected repository secrets;
4. rerun only the failed operation;
5. review Actions logs for accidental disclosure.

## 5. Preflight checklist

Before any label, issue, or auto-merge operation:

```bash
git status --short
gh auth status
```

Resolve the target alias and print it:

```bash
echo "$REPO_ALIAS"
echo "$TARGET_REPO"
echo "$AUTOMATION_REPO"
```

Confirm repository access:

```bash
gh repo view "$TARGET_REPO" \
  --json nameWithOwner,viewerPermission
```

Confirm the central repository is accessible:

```bash
gh repo view "$AUTOMATION_REPO" \
  --json nameWithOwner,viewerPermission
```

Confirm that the intended batch file is valid JSON:

```bash
jq empty "$BATCH_FILE"
```

Never run a write command while any target variable is empty:

```bash
test -n "$TARGET_REPO" || {
  echo "TARGET_REPO is empty" >&2
  exit 1
}
```

## 6. Label management

AnchorKit’s label source of truth is:

```text
.github/LABELS.yml
```

Before creating a campaign issue, ensure every requested label exists in the target repository.

### 6.1 List current labels

```bash
gh label list \
  --repo "$TARGET_REPO" \
  --limit 200
```

For machine-readable output:

```bash
gh label list \
  --repo "$TARGET_REPO" \
  --limit 200 \
  --json name,color,description
```

### 6.2 Preview label synchronization

Run from a checkout containing `.github/LABELS.yml`:

```bash
yq -r \
  '.[] | "Would sync: \(.name) [#\(.color)] — \(.description)"' \
  .github/LABELS.yml
```

This command does not modify GitHub.

### 6.3 Synchronize labels

Review the preview before running this write operation:

```bash
yq -r \
  '.[] | [.name, .color, .description] | @tsv' \
  .github/LABELS.yml |
while IFS=$'\t' read -r name color description; do
  echo "Syncing label: $name"

  gh label create "$name" \
    --repo "$TARGET_REPO" \
    --color "$color" \
    --description "$description" \
    --force
done
```

`--force` updates an existing label and creates it when missing.

### 6.4 Synchronize both repositories

Resolve and inspect each repository before running:

```bash
for TARGET_REPO in \
  Axionvera/anchorkit \
  Axionvera/pocketpay-sdk
do
  echo "Synchronizing labels in $TARGET_REPO"

  yq -r \
    '.[] | [.name, .color, .description] | @tsv' \
    .github/LABELS.yml |
  while IFS=$'\t' read -r name color description; do
    gh label create "$name" \
      --repo "$TARGET_REPO" \
      --color "$color" \
      --description "$description" \
      --force
  done
done
```

Only synchronize one common manifest across both repositories when maintainers have confirmed that both repositories use the same taxonomy.

### 6.5 Recover a missing label

Check whether a label exists:

```bash
LABEL_NAME="GrantFox OSS"

gh label list \
  --repo "$TARGET_REPO" \
  --limit 200 \
  --json name \
  | jq -e --arg label "$LABEL_NAME" \
      'any(.[]; .name == $label)'
```

Create or update the missing label from the manifest:

```bash
LABEL_NAME="GrantFox OSS"

label_json=$(
  yq -o=json \
    ".[] | select(.name == \"$LABEL_NAME\")" \
    .github/LABELS.yml
)

test -n "$label_json" || {
  echo "Label is not defined in .github/LABELS.yml: $LABEL_NAME" >&2
  exit 1
}

color=$(printf '%s' "$label_json" | jq -r '.color')
description=$(printf '%s' "$label_json" | jq -r '.description')

gh label create "$LABEL_NAME" \
  --repo "$TARGET_REPO" \
  --color "$color" \
  --description "$description" \
  --force
```

Add recovered labels to an existing issue:

```bash
ISSUE_NUMBER=39

gh issue edit "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --add-label "GrantFox OSS,Maybe Rewarded,Official Campaign | FWC26"
```

Verify:

```bash
gh issue view "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --json number,title,labels
```

## 7. Issue-batch naming

Name batch files consistently:

```text
YYYY-MM-DD-<repo-alias>-<purpose>.json
```

Examples:

```text
2026-07-28-anchorkit-security-readiness.json
2026-07-28-pocketpay-sdk-release-readiness.json
```

A batch file contains a JSON array of:

```json
[
  {
    "title": "Issue title",
    "labels": ["documentation", "expert"],
    "body": "Complete Markdown issue body"
  }
]
```

Do not add tokens, repository credentials, or private vulnerability details to a batch file.

## 8. Validate an issue batch

AnchorKit provides two different validators.

### 8.1 Batch validator

Use this for JSON arrays containing `title`, `labels`, and `body`:

```bash
pnpm validate:issues path/to/batch.json
```

Equivalent script:

```text
scripts/validate-issue-batch.mts
```

### 8.2 Individual issue-file validator

Use this for the older individual JSON files under `issues/`:

```bash
pnpm validate:issue-files
```

Equivalent script:

```text
scripts/validate-issues.mts
```

Do not interchange these commands.

### 8.3 Validation when dependencies are unavailable

If dependencies are not installed, the validator cannot run.

Record the limitation honestly:

```text
Issue-batch validator not executed locally because node_modules was not installed.
The batch JSON was checked with jq and will be validated in a prepared maintainer environment or CI before issue creation.
```

Do not claim the batch validator passed when `tsx` was unavailable.

## 9. Dry-run an issue batch

Set the batch and target:

```bash
BATCH_FILE="path/to/batch.json"
REPO_ALIAS="anchorkit"
TARGET_REPO="Axionvera/anchorkit"
```

Validate the JSON:

```bash
jq empty "$BATCH_FILE"
```

Run the repository validator when dependencies are installed:

```bash
pnpm validate:issues "$BATCH_FILE"
```

Preview every issue without creating anything:

```bash
jq -r \
  '.[] | "Would create: \(.title) [\(.labels | join(", "))]"' \
  "$BATCH_FILE"
```

Check all requested labels against the target repository:

```bash
available_labels=$(
  gh label list \
    --repo "$TARGET_REPO" \
    --limit 200 \
    --json name
)

jq -r '.[].labels[]' "$BATCH_FILE" |
sort -u |
while IFS= read -r label; do
  if printf '%s' "$available_labels" |
    jq -e --arg label "$label" \
      'any(.[]; .name == $label)' >/dev/null
  then
    echo "OK: $label"
  else
    echo "MISSING: $label"
  fi
done
```

Do not proceed while any label is reported as missing.

## 10. Create one issue

Create the issue body in a file:

```text
issue-body.md
```

Then run:

```bash
gh issue create \
  --repo "$TARGET_REPO" \
  --title "Add maintainer automation runbook" \
  --label "documentation,expert,GrantFox OSS,Maybe Rewarded,Official Campaign | FWC26" \
  --body-file issue-body.md
```

Verify the result using the URL or issue number returned by `gh`.

## 11. Create an issue batch

The safest batch operation is idempotent by exact title. It checks all open and closed issues before creating each entry.

Set:

```bash
BATCH_FILE="path/to/batch.json"
RUN_LOG="${BATCH_FILE%.json}.created.tsv"
```

Run only after completing validation and dry-run review:

```bash
touch "$RUN_LOG"

jq -c '.[]' "$BATCH_FILE" |
while IFS= read -r item; do
  title=$(printf '%s' "$item" | jq -r '.title')
  labels=$(printf '%s' "$item" | jq -r '.labels | join(",")')
  body=$(printf '%s' "$item" | jq -r '.body')

  existing_url=$(
    gh issue list \
      --repo "$TARGET_REPO" \
      --state all \
      --limit 1000 \
      --json title,url |
    jq -r --arg title "$title" \
      '.[] | select(.title == $title) | .url' |
    head -n 1
  )

  if [ -n "$existing_url" ]; then
    echo "SKIP: $title already exists at $existing_url"
    printf 'skipped\t%s\t%s\n' "$title" "$existing_url" >> "$RUN_LOG"
    continue
  fi

  echo "Creating: $title"

  issue_url=$(
    gh issue create \
      --repo "$TARGET_REPO" \
      --title "$title" \
      --label "$labels" \
      --body "$body"
  )

  status=$?

  if [ "$status" -eq 0 ]; then
    echo "CREATED: $issue_url"
    printf 'created\t%s\t%s\n' "$title" "$issue_url" >> "$RUN_LOG"
  else
    echo "FAILED: $title" >&2
    printf 'failed\t%s\t\n' "$title" >> "$RUN_LOG"
  fi
done
```

Keep the original batch file unchanged after the run. It is the recovery source of truth.

Do not commit the local run log unless the maintainers explicitly want it retained.

## 12. Partial issue-batch failure recovery

A partial failure must not be handled by blindly rerunning a non-idempotent creation loop.

### 12.1 Identify created issues

Review the run log:

```bash
cat "$RUN_LOG"
```

List matching repository issues:

```bash
gh issue list \
  --repo "$TARGET_REPO" \
  --state all \
  --limit 1000 \
  --json number,title,state,url
```

### 12.2 Compare the batch with GitHub

```bash
repo_issues=$(
  gh issue list \
    --repo "$TARGET_REPO" \
    --state all \
    --limit 1000 \
    --json title,url
)

jq -r '.[].title' "$BATCH_FILE" |
while IFS= read -r title; do
  existing_url=$(
    printf '%s' "$repo_issues" |
    jq -r --arg title "$title" \
      '.[] | select(.title == $title) | .url' |
    head -n 1
  )

  if [ -n "$existing_url" ]; then
    echo "EXISTS: $title — $existing_url"
  else
    echo "MISSING: $title"
  fi
done
```

### 12.3 Rerun safely

Use the idempotent creation command in Section 11. It skips exact-title matches and creates only missing issues.

### 12.4 Recover an issue created without labels

```bash
ISSUE_NUMBER=123

gh issue edit "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --add-label "documentation,expert"
```

### 12.5 Recover an issue with an incorrect body

Write the corrected body to a file:

```text
corrected-issue-body.md
```

Then:

```bash
gh issue edit "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO" \
  --body-file corrected-issue-body.md
```

### 12.6 Recover an accidental duplicate

Do not delete issue history.

Add a duplicate comment:

```bash
gh issue comment "$DUPLICATE_NUMBER" \
  --repo "$TARGET_REPO" \
  --body "Closing as a duplicate of #$CANONICAL_NUMBER."
```

Then close it:

```bash
gh issue close "$DUPLICATE_NUMBER" \
  --repo "$TARGET_REPO"
```

## 13. Auto-merge model

There are two related but different operations:

1. **GitHub native auto-merge** enables a pull request to merge after required checks and reviews pass.
2. **Central automation dispatch** notifies the automation repository so it can apply the Axionvera policy.

Neither operation should bypass:

- required reviews;
- required status checks;
- branch protection;
- merge conflicts;
- repository merge-method rules;
- maintainer approval policy.

## 14. Enable native GitHub auto-merge

Set the target and pull request:

```bash
TARGET_REPO="Axionvera/anchorkit"
PR_NUMBER=42
```

Review the PR first:

```bash
gh pr view "$PR_NUMBER" \
  --repo "$TARGET_REPO" \
  --json number,title,state,isDraft,mergeable,reviewDecision,statusCheckRollup
```

Enable squash auto-merge:

```bash
gh pr merge "$PR_NUMBER" \
  --repo "$TARGET_REPO" \
  --auto \
  --squash
```

Alternative merge methods may be used only when allowed by repository policy:

```bash
--merge
```

```bash
--rebase
```

Verify:

```bash
gh pr view "$PR_NUMBER" \
  --repo "$TARGET_REPO" \
  --json number,state,autoMergeRequest,mergeable,reviewDecision
```

If GitHub reports that auto-merge is unavailable, confirm:

- auto-merge is enabled in repository settings;
- the authenticated account has write permission;
- the PR targets a protected branch with unmet requirements;
- an allowed merge method was selected.

## 15. Central automation dispatch

The current central event type is:

```text
axionvera-pr-opened
```

Send the event:

```bash
TARGET_REPO="Axionvera/anchorkit"
AUTOMATION_REPO="Axionvera/pocketpay-issue-automation"
PR_NUMBER=42

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$AUTOMATION_REPO/dispatches" \
  -f event_type="axionvera-pr-opened" \
  -F client_payload[repo]="$TARGET_REPO" \
  -F client_payload[pr_number]="$PR_NUMBER"
```

For PocketPay:

```bash
TARGET_REPO="Axionvera/pocketpay-sdk"
```

A successful `repository_dispatch` request returns no response body.

The payload contains:

| Property                   | Meaning                     |
| -------------------------- | --------------------------- |
| `event_type`               | Central workflow event name |
| `client_payload.repo`      | Full source repository name |
| `client_payload.pr_number` | Source pull-request number  |

Do not send an alias in place of the full repository name unless the central workflow explicitly supports it.

## 16. `repository_dispatch` versus `workflow_dispatch`

These are different GitHub Actions events.

### `repository_dispatch`

Sent through the repository dispatch API:

```bash
gh api \
  --method POST \
  "/repos/$AUTOMATION_REPO/dispatches" \
  -f event_type="axionvera-pr-opened" \
  -F client_payload[repo]="$TARGET_REPO" \
  -F client_payload[pr_number]="$PR_NUMBER"
```

The receiving workflow must contain:

```yaml
on:
  repository_dispatch:
    types:
      - axionvera-pr-opened
```

### `workflow_dispatch`

Started directly against a named workflow:

```bash
gh workflow run <workflow-file.yml> \
  --repo "$AUTOMATION_REPO" \
  --ref main \
  -f repo="$TARGET_REPO" \
  -f pr_number="$PR_NUMBER"
```

This works only when the receiving workflow explicitly defines:

```yaml
on:
  workflow_dispatch:
```

Do not describe a repository-dispatch API request as `workflow_dispatch`.

## 17. Workflow behaviour

The intended central flow is:

```text
Pull request opened, reopened, or synchronized
                    ↓
Source repository trigger workflow
                    ↓
AXIONVERA_AUTOMATION_TOKEN
                    ↓
repository_dispatch: axionvera-pr-opened
                    ↓
Axionvera/pocketpay-issue-automation
                    ↓
Central validation and auto-merge policy
                    ↓
Required checks and reviews remain authoritative
```

Before relying on this flow, confirm the source repository contains the expected trigger workflow:

```bash
find .github/workflows -maxdepth 1 -type f -print
```

Inspect recent source-repository runs:

```bash
gh run list \
  --repo "$TARGET_REPO" \
  --limit 10
```

Inspect central automation runs:

```bash
gh run list \
  --repo "$AUTOMATION_REPO" \
  --limit 10
```

Filter repository-dispatch runs:

```bash
gh run list \
  --repo "$AUTOMATION_REPO" \
  --event repository_dispatch \
  --limit 10
```

View a specific run:

```bash
gh run view "$RUN_ID" \
  --repo "$AUTOMATION_REPO"
```

View logs:

```bash
gh run view "$RUN_ID" \
  --repo "$AUTOMATION_REPO" \
  --log
```

## 18. Failed dispatch recovery

### 18.1 Confirm the source PR

```bash
gh pr view "$PR_NUMBER" \
  --repo "$TARGET_REPO" \
  --json number,title,state,url
```

### 18.2 Confirm central repository access

```bash
gh repo view "$AUTOMATION_REPO" \
  --json nameWithOwner,viewerPermission
```

### 18.3 Check the token secret

Confirm that the source repository has:

```text
AXIONVERA_AUTOMATION_TOKEN
```

Do not print its value.

### 18.4 Resend one dispatch

Use the command in Section 15.

Dispatching the same PR again should be treated as a retry. The central workflow should check current PR state before making any write or merge decision.

### 18.5 Interpret common errors

| Result                 | Likely cause                                                 | Recovery                                     |
| ---------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| `204` with no body     | Dispatch accepted                                            | Check central workflow runs                  |
| `401`                  | Missing or invalid authentication                            | Reauthenticate or rotate token               |
| `403`                  | Token lacks permission or policy blocks the action           | Review token and organisation policy         |
| `404`                  | Wrong repository or token cannot access a private repository | Verify repository name and token selection   |
| `422`                  | Invalid event or payload                                     | Check event type, field names, and PR number |
| No central run appears | Receiving workflow does not match the event or is disabled   | Inspect the central workflow trigger         |

## 19. Auto-merge recovery

If dispatch succeeds but the PR does not merge:

```bash
gh pr checks "$PR_NUMBER" \
  --repo "$TARGET_REPO"
```

Inspect PR state:

```bash
gh pr view "$PR_NUMBER" \
  --repo "$TARGET_REPO" \
  --json state,isDraft,mergeable,reviewDecision,statusCheckRollup,autoMergeRequest
```

Common blockers:

- failing required check;
- pending required review;
- requested changes;
- merge conflict;
- draft status;
- auto-merge disabled;
- unsupported merge method;
- central policy intentionally rejected the PR;
- contributor pushed after auto-merge was enabled and GitHub disabled it.

Do not bypass a failed security, test, or review requirement simply to complete automation.

## 20. Missing-label recovery during issue creation

If `gh issue create` fails because a label is absent:

1. stop the batch;
2. note the last successfully created issue;
3. synchronize or create the missing label;
4. confirm the label exists;
5. rerun the idempotent batch command.

Confirm one label:

```bash
LABEL_NAME="documentation"

gh label list \
  --repo "$TARGET_REPO" \
  --limit 200 \
  --json name |
jq -e --arg label "$LABEL_NAME" \
  'any(.[]; .name == $label)'
```

Never remove label validation from a batch merely to force issue creation.

## 21. Operational audit record

For a significant batch or auto-merge recovery, record:

```text
Date:
Maintainer:
Repository alias:
Full repository:
Batch filename:
Batch validation result:
Dry-run result:
Issues created:
Issues skipped:
Issues failed:
Labels recovered:
Pull request:
Dispatch event:
Central workflow run:
Recovery actions:
Final outcome:
```

Do not include token values.

## 22. Maintainer completion checklist

### Labels

- [ ] Correct repository alias was selected.
- [ ] The full repository name was printed and checked.
- [ ] Every requested label exists.
- [ ] Manifest changes were previewed before synchronization.
- [ ] Label descriptions and colours match the source of truth.

### Issue batches

- [ ] JSON syntax passed.
- [ ] Repository validation passed, or the unavailable check was recorded honestly.
- [ ] Dry-run output was reviewed.
- [ ] Batch filename follows the convention.
- [ ] Existing issues were checked by exact title.
- [ ] Creation output was recorded.
- [ ] Partial failures were recovered without duplicates.

### Auto-merge

- [ ] Pull request number and repository are correct.
- [ ] The PR is not a draft.
- [ ] Required checks and reviews are visible.
- [ ] Native auto-merge uses an allowed merge method.
- [ ] The dispatch uses the full repository name.
- [ ] `repository_dispatch` and `workflow_dispatch` are not confused.
- [ ] The central workflow run was inspected.
- [ ] No protected requirement was bypassed.

### Security

- [ ] No token was printed or committed.
- [ ] Token permissions follow least privilege.
- [ ] The central token can access only required repositories.
- [ ] Expired or exposed tokens were revoked.
- [ ] Operational logs contain no secrets.

## 23. Related documentation

- [Auto-Assign Workflow](./AUTO_ASSIGN_WORKFLOW.md)
- [Issue Batch Validator](./ISSUE_BATCH_VALIDATOR.md)
- [Issue Standard](./ISSUE_STANDARD.md)
- [Issue Writing Guide](./ISSUE_WRITING_GUIDE.md)
- [GrantFox Workflow](./GRANTFOX_WORKFLOW.md)
- [Maintainer Guide](./MAINTAINER_GUIDE.md)
- [Maintainer Review Checklist](./MAINTAINER_REVIEW_CHECKLIST.md)
- [Contributor Guide](./CONTRIBUTOR_GUIDE.md)
