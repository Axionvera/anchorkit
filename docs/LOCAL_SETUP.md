# Local Setup

AnchorKit is a pnpm workspace with a Rust Soroban contract. You do not need the Rust toolchain to
work on the TypeScript packages or the Next.js web app, but you do need it to run the Soroban
contract tests.

## 1. Prerequisites

| Tool | Minimum version | Used by |
| --- | --- | --- |
| Node.js | 20.x | All packages + web |
| pnpm | 9.x | Workspace install |
| Rust (rustup) | 1.81+ (stable) | `contracts/treasury-escrow` |
| `wasm32-unknown-unknown` target | latest | Contract `.wasm` builds |
| `cargo-clippy` | latest | Lint step |
| Soroban CLI (`soroban`) | 21.x+ | Deploying / invoking the contract |
| Git | any | Development workflow |

### macOS / Linux quick installs

Install Node.js 20+ (via volta, nvm, or your system package manager), then install pnpm globally:

```bash
npm install -g pnpm@9
```

Install the Rust toolchain (only required for contract tests/builds):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
rustup component add clippy
```

(Optional) Install the Soroban CLI for deploying and invoking the contract:

```bash
cargo install --locked soroban-cli --version 21.0.0-rc.1
```

## 2. Install monorepo dependencies

```bash
git clone git@github.com:stellar-commons-labs/anchorkit.git
cd anchorkit
pnpm install
```

## 3. Run the web dashboard

Start the web app:

```bash
pnpm web:dev
```

Or start every workspace package that has a dev script:

```bash
pnpm dev
```

The web app runs at `http://localhost:3000`.


The dashboard is **testnet-first**. It never talks to mainnet unless you explicitly override the
environment config (advanced).

## 4. Run all tests

Run the TypeScript test suite:

```bash
pnpm test
```

Run the Soroban Rust contract tests:

```bash
pnpm contract:test
```

## 5. Lint / typecheck / build

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Check Prettier formatting:

```bash
pnpm format:check
```

Apply Prettier formatting:

```bash
pnpm format
```

## 6. Build and inspect the Soroban contract

Build the WASM release artifact:

```bash
pnpm contract:build
```

The output is located at:
`contracts/treasury-escrow/target/wasm32-unknown-unknown/release/treasury_escrow.wasm`

## 7. Seed fixtures

Example fixtures live under `examples/` and are imported by the web dashboard tests and the
anchor-utils package. See [EXAMPLES_README.md](../examples/README.md) for the full list.

## Troubleshooting

- **Node/pnpm version errors** – verify you are on Node 20+ and `pnpm --version` reports 9.x. Reinstall with `npm i -g pnpm@9` if needed.
- **Rust target missing** – run `rustup target add wasm32-unknown-unknown`.
- **Horizon rate limit / network errors** – dashboard runs without live lookups, but you can re-run the accounts page lookup with the default public testnet Horizon endpoint.
- **Next.js transpile** – workspace packages are transpiled via `next.config.js` `transpilePackages`. Clear `.next/` and re-run after adding new packages.
