# AnchorKit seed examples

The fixtures in this directory are imported by tests, the anchor-utils package, and the web
dashboard demos. They are all testnet-only and do **not** contain any secret keys that have
ever held real value.

| File                                 | Purpose                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `accounts-funded.json`               | Example funded testnet account fixture (public keys + synthetic balances)                  |
| `accounts-unfunded.json`             | Example unfunded testnet account fixture (public keys only)                                |
| `assets-native-xlm.json`             | Native XLM asset descriptor                                                                |
| `assets-issued-example.json`         | Example issued asset (USDC-like) with a test issuer                                        |
| `payments-valid-intent.json`         | A payment intent that passes all validation                                                |
| `payments-invalid-intent.json`       | A payment intent deliberately crafted to fail multiple checks                              |
| `anchors-deposit-lifecycle.json`     | Array of 4 deposit status records (pending_user → completed)                               |
| `anchors-withdrawal-lifecycle.json`  | Array of 5 withdrawal records (incl. failed, refunded)                                     |
| `escrow-milestone-lifecycle.json`    | Treasury escrow milestones across the full state DAG                                       |
| `escrow-events-example.json`         | Raw Soroban-style escrow contract events, one per event type                               |
| `status-badges.example.json`         | Shared labels and severity mappings across payment, anchor, escrow, and diagnostic domains |
| `transaction-receipts.example.json`  | Normalized post-submit outcomes across all receipt statuses                                |
| `transaction-summaries.example.json` | Review-before-action summaries for payment, anchor, and escrow operations                  |

Do not commit a secret key (S…) that has ever held mainnet funds to this directory. All
synthetic secrets used here are only valid structurally and are derived at runtime in tests.
