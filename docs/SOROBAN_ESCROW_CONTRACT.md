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
| Evidence | `submit_evidence(env, id, hash)` | admin only | Status < Released; **write-once** — `EvidenceAlreadySubmitted` if a hash is already recorded |
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

Every variant, its discriminant, and when the contract returns it. The
discriminants are part of the contract ABI: existing values are never renumbered.

| # | Variant | Returned when |
| --- | --- | --- |
| 1 | `NotInitialized` | Any admin-gated call, or `read_summary`, before `initialize` |
| 2 | `AlreadyInitialized` | `initialize` on a contract that already has an admin |
| 3 | `UnauthorizedAdmin` | *Never returned* — see the note below |
| 4 | `InvalidMilestoneId` | `create_milestone` with `id == 0` |
| 5 | `MilestoneNotFound` | Any call naming a milestone id that was never created |
| 6 | `InvalidMilestoneStatus` | `assign_amount` past Active; `submit_evidence` or `dispute_milestone` on a released milestone; `approve_milestone` on a released one |
| 7 | `DuplicateRelease` | `release_milestone` on a milestone already Released |
| 8 | `ReleaseBeforeApproval` | `release_milestone` when status is not ReadyForRelease; `mark_ready_for_release` when status is not Approved |
| 9 | `ApprovalAfterDispute` | `approve_milestone` on a Disputed milestone |
| 10 | `InvalidAmount` | `create_milestone` or `assign_amount` with `amount <= 0` |
| 11 | `EvidenceRequired` | `approve_milestone` with no evidence hash recorded |
| 12 | `DisputeResolutionRequired` | *Never returned* — see the note below |
| 13 | `MilestoneAlreadyExists` | `create_milestone` reusing an existing id |
| 14 | `DisputeWithoutEvidence` | `dispute_milestone` before any evidence was submitted |
| 15 | `EvidenceAlreadySubmitted` | `submit_evidence` when a hash is already recorded |

### Two variants are declared but unreachable

Both are kept so the ABI discriminants stay stable, but neither can be observed:

- **`UnauthorizedAdmin`** — authorisation is enforced by `admin.require_auth()`,
  which traps in the host before the contract can return a typed error. A failed
  admin check therefore surfaces as a host authorisation error, not as this
  variant. Callers must not match on it to detect an auth failure.
- **`DisputeResolutionRequired`** — there is no dispute-resolution entry point.
  See the trust assumptions below: disputes are terminal.

## Trust model and assumptions

This contract is an **example**, and its security rests on assumptions that must
be understood before adapting it.

**It is single-party and fully admin-operated.** Every mutating entry point
except `initialize` requires the admin's authorisation, including
`submit_evidence`. There is no beneficiary, contractor, or arbiter role in
storage: `Milestone` records no counterparty address. The admin attests to
evidence, approves it, and releases it. Anyone integrating this as a real escrow
between two parties must add a counterparty role first.

> **Changed in #9.** `submit_evidence` was previously callable by anyone, and
> this document described that as intentional. It was not safe: the function
> unlocks the preconditions of both `approve_milestone` (which requires evidence
> to exist) and `dispute_milestone` (which requires status ≥ EvidenceSubmitted),
> so any account could drive another party's milestone up to the approval gate,
> or overwrite evidence that had already been reviewed.

**The admin is permanent.** There is no rotation or transfer function among the
public entry points. If the admin key is lost, the escrow is frozen: no milestone
can be created, approved, or released again. Deploy with a key you control
long-term, ideally a multisig account.

**`initialize` is first-caller-wins.** It does not require the incoming admin's
authorisation, so whoever calls it first on a freshly deployed contract becomes
the admin. Deploy and initialise in the same transaction; a contract left
uninitialised can be claimed by anyone.

**Disputes are terminal.** `dispute_milestone` moves a milestone to Disputed,
where `approve_milestone` rejects with `ApprovalAfterDispute` and
`mark_ready_for_release` requires Approved. Nothing transitions a milestone out
of Disputed, so a disputed milestone can never be released. Resolution has to
happen off-chain, or in a future entry point.

**Evidence is a hash, and it is write-once.** The contract stores a `BytesN<32>`
and never inspects it. It cannot tell a real document hash from an arbitrary
value — off-chain verification is the integrator's responsibility. Once
recorded, a hash cannot be replaced, only disputed.

**No funds are held.** `release_milestone` records state and emits an event; it
transfers no tokens. This contract is milestone bookkeeping, not custody. Any
actual payout is performed by whatever consumes the `(milestone, released)`
event.

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
9. Storage version reads before and after initialisation.

### Authorisation tests do not blanket-mock

`env.mock_all_auths()` makes every `require_auth()` succeed, so a suite built on
it cannot detect a missing authorisation check — which is why the open
`submit_evidence` went unnoticed. The admin-misuse tests therefore drive
authorisation with scoped `env.mock_auths(&[MockAuth { .. }])`, granting only a
specific address the right to invoke one named function:

10. An unauthenticated `submit_evidence` is rejected, and leaves the milestone
    with no evidence and its status unchanged.
11. An intruder cannot unlock the approval gate — after a rejected submission,
    `approve_milestone` still fails with `EvidenceRequired`.
12. Recorded evidence cannot be overwritten (`EvidenceAlreadySubmitted`).
13. Evidence cannot be swapped after approval; the reviewed hash still stands.
14. The admin *can* still submit evidence — a guard against the gate becoming a
    false positive.
15. Duplicate release remains impossible under scoped authorisation, not just
    under blanket mocking.

Each of tests 10-13 fails if the corresponding guard is removed; test 14 and 15
pass either way by design, since they assert behaviour the fix must preserve.

## Building and deploying

```bash
pnpm contract:build
# wasm: contracts/treasury-escrow/target/wasm32-unknown-unknown/release/treasury_escrow.wasm

# install + deploy to testnet (requires soroban-cli 22.x)
soroban contract install --wasm target/wasm32-unknown-unknown/release/treasury_escrow.wasm --network testnet
soroban contract deploy --wasm-hash <hash> --source <admin_account> --network testnet
soroban contract invoke --id <deployed_id> -- initialize --admin <admin_address> --network testnet
```
