# Advanced Issue Standard (GrantFox-ready)

This standard defines the bar an issue must meet to be labelled `GrantFox OSS` and
`Maybe Rewarded`. Anything less is still a valid GitHub issue; it just won’t be picked up by
the campaign board or be reward-eligible.

## Mandatory sections

Every GrantFox-ready issue must have these sections, exactly titled:

### Summary

1–3 sentences. What is the business problem, and why does it matter for Stellar builders?

### Background

Relevant links: Stellar docs, SEP numbers, Soroban SDK references, prior art, screenshots,
error logs, sample fixtures. A contributor should be able to start work without asking a
maintainer “what does this mean?”.

### Proposed scope

**In scope**: bulleted list of changes the contributor will make. Be concrete (files, modules,
data structures).
**Out of scope**: bulleted list of what this issue explicitly does **not** do. This avoids
scope creep and reviewer frustration later.

### Acceptance criteria (checkboxes)

- [ ] …
- [ ] …

Each checkbox must be objectively verifiable by a maintainer without having to interpret
intent. Examples:

- ❌ “improve UX”
- ✅ “Accounts page shows a Friendbot CTA _only_ when `status === unfunded` and network === testnet”

### Tests required

List the new or updated tests that must exist before a PR can merge. Example:

- `packages/stellar-kit/test/accounts.test.ts` → case “network failure emits SOURCE_NETWORK_ERROR”.
- Dashboard payments page → screenshot or video of the new state (visual-only changes).

### Docs required

Which `docs/*.md` file must be updated? Usually at least one. If your change is entirely
internal and invisible to package consumers you may write “None required” and justify.

### Security and Stellar correctness notes

Specifically call out:

- Does it touch secret keys? If yes, cite how each of the [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md)
  rules R0–R6 is preserved.
- Does it enable or touch mainnet paths? If yes, cite the exact mainnet guard used.
- For Soroban issues: list the admin-auth checks, storage invariants, and event emissions
  affected.

### Estimate

`small` / `medium` / `large` + short reasoning.

### Labels (to be applied by maintainer)

At minimum:

- `GrantFox OSS`
- `Maybe Rewarded`
- `Official Campaign | FWC26`
- Scope: one or more of `stellar`, `soroban`, `anchor`, `sep`, `wallet`, `payments`, `escrow`
- Type: at least one of `security`, `test`, `documentation`, `bug`, `enhancement`
- Difficulty: `good first issue` **or** `expert` (not both; the default is unlabelled for
  medium-difficulty)

## GrantFox issue template

Use the `GrantFox Campaign Issue` template under `.github/ISSUE_TEMPLATE/` to create a
compliant issue quickly.
