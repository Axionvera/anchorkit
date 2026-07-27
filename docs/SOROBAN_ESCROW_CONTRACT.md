# Soroban Escrow Contract

Location: `contracts/treasury-escrow/` — a Rust Soroban crate.

## Purpose

Showcase a basic community treasury escrow: milestones are created by an admin, evidence is
submitted (hash of deliverables), admin approves, possibly disputes, marks ready for release,
and finally releases the milestone. The contract emits typed events at each step and guards
against double release, pre-approval release, and approvals after an open dispute.

This is an MVP reference contract. Treat it as educational / extendable, not as a production
treasury product.

## Initialisation

```rust
fn initialize(env: Env, admin: Address) -> Result<(), EscrowError>
```

- Must be called exactly once.
- `AlreadyInitialized` on subsequent calls.
- `admin.require_auth()` is enforced on every admin-only entry point.

## Milestone lifecycle

```
draft → active → evidence_submitted → approved → ready_for_release → released
                  \
                    → disputed   (blocks further approval until explicitly resolved)
```

| Step | Function | Authorisation | Guards |
| --- | --- | --- | --- |
| Create | `create_milestone(env, id, title, amount)` | admin only | `id != 0`, `amount > 0`, unique id |
| Assign amount | `assign_amount(env, id, amount)` | admin only | status ≤ Active, amount > 0 |
| Evidence | `submit_evidence(env, id, hash)` | Any caller (evidence submitter) | Status ≤ Released |
| Approve | `approve_milestone(env, id)` | admin only | Evidence present, not disputed, not already released |
| Dispute | `dispute_milestone(env, id, reason)` | admin only | Evidence submitted, status < Released |
| Ready | `mark_ready_for_release(env, id)` | admin only | Status == Approved |
| Release | `release_milestone(env, id)` | admin only | Status == ReadyForRelease; DuplicateRelease on 2nd call |

## Reads

```rust
read_milestone(env, id) -> Milestone
read_summary(env) -> EscrowSummary {
    admin, total_milestones, total_amount,
    released_amount, pending_amount, disputed_count, completed_count,
}
```

## Error codes

`NotInitialized`, `AlreadyInitialized`, `UnauthorizedAdmin`, `InvalidMilestoneId`,
`MilestoneNotFound`, `MilestoneAlreadyExists`, `InvalidMilestoneStatus`, `DuplicateRelease`,
`ReleaseBeforeApproval`, `ApprovalAfterDispute`, `InvalidAmount`, `EvidenceRequired`,
`DisputeWithoutEvidence`, `DisputeResolutionRequired`.

## Events

Published on the matching function call:

- `(escrow, init) → admin`
- `(milestone, created) → (id, title, amount)`
- `(milestone, evidence) → (id, evidence_hash)`
- `(milestone, approved) → id`
- `(milestone, disputed) → (id, reason)`
- `(milestone, ready) → id`
- `(milestone, released) → (id, amount)`

Consume these events from your webhook / indexer to build an audit log of a grant program.

## Test coverage

`src/test.rs` covers:

1. Happy-path lifecycle through release plus summary numbers.
2. Duplicate release prevention.
3. Release before ready is blocked.
4. Non-admin caller cannot run admin-only functions.
5. Approve-after-dispute is blocked.
6. Evidence must exist before approval.
7. Invalid milestone ids yield `InvalidMilestoneId` / `MilestoneNotFound`.
8. Multi-milestone summary aggregation.

## Building and deploying

```bash
pnpm contract:build
# wasm: contracts/treasury-escrow/target/wasm32-unknown-unknown/release/treasury_escrow.wasm

# install + deploy to testnet (requires soroban-cli 21.x)
soroban contract install --wasm target/wasm32-unknown-unknown/release/treasury_escrow.wasm --network testnet
soroban contract deploy --wasm-hash <hash> --source <admin_account> --network testnet
soroban contract invoke --id <deployed_id> -- initialize --admin <admin_address> --network testnet
```
