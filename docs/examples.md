# Example validation (issues #33, #94)

AnchorKit ships example/fixture JSON under `examples/`. Those files are consumed
by tests, packages, and the web dashboard. To stop them from drifting away from
shared Zod schemas, every registered example is validated by a CI-ready script.

## When to run validation

Run example validation whenever you:

- add or edit a file under `examples/`
- change Zod schemas in `packages/validators`
- change branded types that schemas depend on
- update `examples/registry.ts`

Before opening a PR that touches any of the above:

```bash
pnpm check:examples
# or, with detailed schema issue lines:
pnpm check:examples -- --verbose
```

`pnpm verify:full` also includes `check:examples`. The dedicated CI workflow
`.github/workflows/check-examples.yml` runs the same command on relevant PRs.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm check:examples` | CLI validation of every registry entry (exit 1 on mismatch) |
| `pnpm check:examples -- --verbose` | Same, plus schema issue details for rejected fixtures |
| `pnpm test:examples` | Unit tests for the script + registry vitest suite |

## How it works

1. **`examples/registry.ts`** — single source of truth. Each entry maps a
   fixture path to a shared schema name and an expectation (`valid` | `invalid`).
2. **`scripts/check-examples.mts`** — loads each fixture, validates with the
   mapped Zod schema from `@anchorkit/validators`, prints a pass/fail report,
   and exits non-zero on failure. Unexpected failures print clear path + message
   lines (e.g. `sourcePublicKey: Stellar public key must be exactly 56 characters`).
3. **`packages/validators/test/examples.test.ts`** — same registry checks as
   Vitest so broken examples fail the package test suite.
4. **`scripts/check-examples.test.ts`** — unit tests covering valid fixtures,
   intentionally invalid fixtures, and clear error output.

Examples marked `expect: 'invalid'` (for example
`payments-invalid-intent.json`) **must** fail schema validation. All others
**must** pass.

## Adding a new example

1. Add the JSON file under `examples/`.
2. Register it in `examples/registry.ts`:

   ```ts
   {
     id: "my-example",
     path: "examples/my-example.json",
     schema: "PaymentIntent", // registry schema name
     expect: "valid",         // or "invalid"
     isArray: false,          // true when the file is a JSON array
     // arrayKey: "receipts", // optional nested array property
   }
   ```

3. Run:

   ```bash
   pnpm check:examples -- --verbose
   pnpm test:examples
   ```

## CI

On pull requests and pushes to `main` that touch examples, validators, types,
config, or the validation script, GitHub Actions runs:

1. `pnpm check:examples -- --verbose`
2. `pnpm test:examples`

See `.github/workflows/check-examples.yml`.

## Relationship to `@anchorkit/fixtures`

`examples/*.json` are JSON files used for schema-drift checking
(`pnpm check:examples`). `@anchorkit/fixtures` exports importable TypeScript
sample data for package tests — see [fixtures.md](./fixtures.md).
