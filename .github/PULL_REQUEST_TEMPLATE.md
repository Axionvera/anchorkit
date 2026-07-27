## Summary

Closes #ISSUE_NUMBER_HERE

Describe what this PR delivers in 1-3 sentences.

## Issue scope

Copy the Acceptance Criteria checkboxes from the issue and check off each delivered line:

- [ ] …
- [ ] …
- [ ] …

## Maintainer Review Checklist (self-check)

Paste the current [MAINTAINER_REVIEW_CHECKLIST.md](./docs/MAINTAINER_REVIEW_CHECKLIST.md) and mark each Self-check item:

- [ ] References the original issue with `Closes #NNN` in the PR body.
- [ ] Acceptance criteria on the issue are checked off individually in the PR description.
- [ ] `pnpm lint` passes locally.
- [ ] `pnpm typecheck` passes locally.
- [ ] `pnpm test` passes locally.
- [ ] `pnpm contract:test` passes locally (if anything under `contracts/` changed).
- [ ] `pnpm format:check` passes or `pnpm format` was applied.

### Stellar correctness
- [ ] Any new Stellar public-key / secret-key parsing matches the branded types.
- [ ] Amounts remain 7-decimal strings (not `number` / floats) through the change.
- [ ] Memo rules are enforced if touched.
- [ ] Horizon error handling still maps to the typed `StellarKitError` codes correctly.

### Security impact
- [ ] R0: No new `console.log` / logger / error `.message` contains a raw secret.
- [ ] R1: No secret echoed in UI text, copy-to-clipboard, or URL.
- [ ] R2: No new `localStorage` / cookie / persistent store of secrets.
- [ ] R3: No secret in a constructed URL, callback, query param, or auth header.
- [ ] R4: Structural validation runs before SDK calls that could leak into stack traces.
- [ ] R5: All new secret-accepting APIs accept `unknown`, Zod-validate, and return branded types.
- [ ] R6: No committed real secret keys anywhere in fixtures/examples.

### Tests
- [ ] New public functions in packages/ have a positive and a negative Vitest case.
- [ ] Any new branch in error mapping or status transitions has a test.
- [ ] For contract changes: happy path + error path tests added under `src/test.rs` covering the specific new guard.
- [ ] Tests do not print or assert on raw secret keys.

### Documentation updates
- [ ] `/docs/_____.md` updated for any new user-facing package export.
- [ ] README or `/docs/LOCAL_SETUP.md` updated if setup steps changed.

### No secret leakage + no mainnet risk
- [ ] Diff search for S-prefixed 56-char secrets shows only synthetic throwaway fixtures.
- [ ] Defaults remain testnet-first; any new mainnet path is behind `assertNetworkAllowed(...)`.

## Risk / follow-ups

Any out-of-scope follow-up issues or known follow-up work. List them here and (if already created) link the follow-up issue numbers.
