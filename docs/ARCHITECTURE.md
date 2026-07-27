# Architecture

## Guiding choices

AnchorKit is intentionally small and modular. The TypeScript packages are pure libraries where
possible (no runtime singletons, no DB, no secrets). They lean on Zod for validation and
`@stellar/stellar-sdk` for keypair generation and Horizon interactions. The web app is a thin
UI on top of those packages.

## Package boundaries

| Package | Responsibilities | Dependencies inside the repo |
| --- | --- | --- |
| `@anchorkit/types` | Branded types: `StellarPublicKey`, `AnchorTransactionStatus`, `Milestone`, … | None |
| `@anchorkit/config` | Testnet/mainnet Horizon URLs, passphrases, env defaults, mainnet gating. | `types` |
| `@anchorkit/validators` | Zod schemas for all public API shapes. | `types`, `config` |
| `@anchorkit/stellar-kit` | Keypair handling, account lookup, asset parsing, payment intents, memo validation, tx hash parsing, expert links, error mapping. | `types`, `config`, `validators` |
| `@anchorkit/anchor-utils` | Deposit/withdrawal metadata parsing, anchor status-to-message mapping, callback URL validation, mock lifecycle fixtures. | `types`, `config`, `validators`, `stellar-kit` |
| `@anchorkit/web` | Next.js dashboard pages. | all above packages |

Rule of thumb: if a module only needs types, put it in `validators` or `config`; if it needs
Horizon calls, live keypair generation, or event mapping, put it in `stellar-kit`; if it is
about anchor metadata and fixtures that don’t call Horizon, put it in `anchor-utils`.

## Soroban contract

`contracts/treasury-escrow` uses `soroban-sdk = "21.x"` and targets `wasm32-unknown-unknown`.
It is a **standalone crate** exposed to the monorepo via a shim `package.json` so Turborepo can
run `cargo test`/`cargo build` as workspace tasks.

Contract responsibilities are strictly limited to treasury escrow lifecycle: milestones,
evidence, approval, dispute, ready-for-release, release. Transfer of Stellar assets to/from
the escrow contract address is intentionally out of scope for the MVP.

## Data model notes

- All public key / secret key / transaction hash strings are **branded** in TypeScript via
  `Zod.brand`. This catches mixing them up at the type level.
- Amounts are strings throughout (not `number` / `bigint`) to match how Stellar Horizon and
  the classic SEP APIs usually serialise them.
- Anchor transaction records are plain objects with ISO8601 strings — suitable for persisting
  to JSON, Postgres JSONB, or a SEP transaction table later.

## Dependency direction

```
web → anchor-utils → stellar-kit → validators → config → types
                             ↘                  ↗
                               (validators uses types+config)
```

No package should ever depend on `web`. Keep `stellar-kit` side-effect free except for
outbound Horizon fetches.

## Caching and Turborepo

Turborepo caches `build`, `lint`, `typecheck`, and `test` outputs. Tests are not cached by
default (`cache: false`) to avoid staleness when fixtures or contract behaviour changes. If
you add expensive contract compilation steps, cache them in `turbo.json` carefully.
