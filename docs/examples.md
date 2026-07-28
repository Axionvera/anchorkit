# Examples & Fixture Consistency (issue #33)

AnchorKit ships example/fixture JSON files under `examples/` that are consumed
by tests, the `anchor-utils` package, and the web dashboard demos. To stop
those examples from silently drifting out of sync with the real schemas, every
example is validated against the same Zod schemas the application uses.

## How it works

- `examples/registry.ts` — **the single source of truth.** Each entry maps a
  fixture file to the schema it must satisfy, plus whether it is expected to be
  `valid` or `invalid` (used for fixtures deliberately crafted to fail, e.g.
  `payments-invalid-intent.json`).
- `scripts/check-examples.mts` — loads each fixture and runs it through the
  mapped schema. Examples marked `expect: 'invalid'` MUST fail validation; all
  others MUST pass. Exits non-zero on any mismatch.
- `packages/validators/test/examples.test.ts` — the same checks, run as a vitest
  suite so a broken example fails CI.

## Commands

```bash
pnpm check:examples          # local fixture validation script
pnpm --filter=@anchorkit/validators test   # includes the examples suite
```

## Adding a new example

1. Drop the JSON file in `examples/`.
2. Add one entry to `examples/registry.ts`:

   ```ts
   {
     id: "my-example",
     path: "examples/my-example.json",
     schema: "PaymentIntent",   // one of the schema names in the registry
     expect: "valid",           // or "invalid"
     isArray: false,             // true when the file is a JSON array
   }
   ```

3. Run `pnpm check:examples`. If your example is `expect: 'valid'` it must pass
   the schema; if `expect: 'invalid'` it must be rejected.

## Web app

The web dashboard reuses the same fixtures (e.g. anchor lifecycle demos build
records that mirror `examples/anchors-*-lifecycle.json`). Because both the demos
and the examples are validated by the shared schemas, a schema change is caught
in one place.

## Relationship to `@anchorkit/fixtures`

`examples/*.json` are JSON files used for schema-drift checking
(`pnpm check:examples`). `@anchorkit/fixtures` is a TypeScript package that
exports the same (or closely mirrored) sample data as importable values for
package test suites — see [Fixtures](./fixtures.md) for the full breakdown
and the "no real secrets" rule that applies to both.
