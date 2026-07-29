# Local verification (issue #128)

AnchorKit provides one command contributors should run before opening a pull
request. It mirrors the monorepo checks that most often fail CI when skipped.

## Quick start

```bash
pnpm install
pnpm verify
```

`pnpm verify` fails fast on the first failing step. Fix that step, then re-run.

## What `pnpm verify` runs

| Step | Script | Purpose |
| --- | --- | --- |
| 1 | `pnpm lint` | ESLint across workspace packages |
| 2 | `pnpm typecheck` | TypeScript `tsc --noEmit` / turbo typecheck |
| 3 | `pnpm test` | Vitest (and other package tests) via turbo |
| 4 | `pnpm build` | Full monorepo build via turbo |
| 5 | `pnpm format:check` | Prettier formatting gate |

The runner lives in `scripts/verify.mts` and fails fast on the first failing
step so you can fix one gate at a time. If formatting is the only failure,
run `pnpm format` and re-verify.

## Full verification (optional)

When your change touches package imports, fixtures, or Soroban contracts, also
run:

```bash
pnpm verify:full
```

That runs `pnpm verify`, then:

| Extra step | When it matters |
| --- | --- |
| `pnpm check:examples` | Fixture / schema / example registry changes |
| `pnpm check:boundaries` | Cross-package import / architecture boundary changes |
| `pnpm contract:test` | Anything under `contracts/` (requires Rust toolchain) |

If you only changed TypeScript packages or docs and do not have Rust installed,
`pnpm verify` is enough for day-to-day PR readiness. Run `pnpm contract:test`
separately whenever `contracts/` is in scope.

## Individual commands

You can still run each check alone while iterating:

```bash
pnpm format:check   # or: pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:examples
pnpm check:boundaries
pnpm contract:test
```

## Related docs

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) — install prerequisites and run the dashboard
- [examples.md](./examples.md) — example/fixture validation (`pnpm check:examples`)
- [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) — contribution loop
- [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) — PR self-check
- [GRANTFOX_WORKFLOW.md](./GRANTFOX_WORKFLOW.md) — GrantFox CI expectations
