# Maintainer Review Checklist

Copy the checklist below into **every PR review comment** so GrantFox campaign reviewers can
audit decisions. The PR author fills out their self-check first; the maintainer confirms each
item or marks it as needing changes.

## PR self-check (author)

- [ ] References the original issue with `Closes #NNN` in the PR body.
- [ ] Acceptance criteria on the issue are checked off individually in the PR description,
      each with a file/line or commit reference.
- [ ] `pnpm lint` passes locally.
- [ ] `pnpm typecheck` passes locally.
- [ ] `pnpm test` passes locally.
- [ ] `pnpm contract:test` passes locally (if anything under `contracts/` changed).
- [ ] `pnpm format:check` passes or `pnpm format` was applied.

## Stellar correctness

- [ ] Any new Stellar public-key / secret-key parsing matches the branded types.
- [ ] Amounts remain 7-decimal strings (not `number` / floats) through the change.
- [ ] Memo rules (28-byte text; ID digits; 64-hex hash) are enforced if touched.
- [ ] Horizon error handling still maps to the typed `StellarKitError` codes correctly.

## Soroban correctness (only if `contracts/` changed)

- [ ] Every new admin-only function calls `require_auth()` on the stored admin Address.
- [ ] Milestone status transitions remain in the allowed DAG.
- [ ] Evidence hash is still required before approval.
- [ ] `ApprovalAfterDispute` is still enforced unless a `resolve_dispute` call was added.
- [ ] `DuplicateRelease` is still enforced.
- [ ] Events are published with the correct tuple topic.
- [ ] `read_summary` aggregations still add up (no underflow / overflow arithmetic in a way
      that breaks the test suite).

## Security impact

- [ ] R0: No new `console.log` / logger / error `.message` contains a raw secret.
- [ ] R1: No secret echoed in UI text, copy-to-clipboard, or URL.
- [ ] R2: No new `localStorage` / cookie / persistent store of secrets.
- [ ] R3: No secret in a constructed URL, callback, query param, or auth header.
- [ ] R4: Structural validation runs before `Keypair.fromSecret` or similar SDK calls that
      could leak into stack traces.
- [ ] R5: All new secret-accepting APIs accept `unknown`, Zod-validate, and return branded
      types.
- [ ] R6: No committed real secret keys anywhere in fixtures/examples; only synthetic
      throwaway keypairs.

## Test coverage

- [ ] New public functions in packages/ have a positive and a negative Vitest case.
- [ ] Any new branch in error mapping or status transitions has a test.
- [ ] For contract changes: happy path + error path tests added under `src/test.rs` covering
      the specific new guard.
- [ ] Tests do not print or assert on raw secret keys.

## Documentation updates

- [ ] `/docs/PROJECT_OVERVIEW.md` or the relevant topic doc updated for any new user-facing
      package export.
- [ ] README or `/docs/LOCAL_SETUP.md` updated if setup steps changed.
- [ ] Contributor-facing `/docs/*.md` updated if the issue-template or review workflow changed.

## No secret leakage

- [ ] Search the diff for the regexp `/S[A-Z2-7]{50,}/` — zero hits outside of intentional
      test fixtures (and those fixtures are test-only throwaway keys).
- [ ] Error messages, new alerts, and UI labels only show redacted secrets when needed.

## No mainnet risk

- [ ] Defaults remain testnet-first.
- [ ] Any new mainnet code path is behind `assertNetworkAllowed(...)` and is not reachable from
      the web dashboard without an explicit env override.
- [ ] No hardcoded mainnet production URLs, custodial wallets, or payment submission that
      could be triggered accidentally.

## Issue acceptance criteria

- [ ] Every checkbox from the issue’s Acceptance Criteria is satisfied in this PR or explicitly
      deferred to a follow-up issue with that issue linked.
- [ ] No out-of-scope refactors or unrelated changes slipped in; if they did, they are split
      into a separate PR.

## Final maintainer verdict

- [ ] **Approve and merge.**
- [ ] **Approve with follow-up issue** (link): …
- [ ] **Changes requested before re-review.**

Maintainer notes / GrantFox reviewer context:
> …
