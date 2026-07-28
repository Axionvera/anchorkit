# AnchorKit Security and Architecture Readiness Review

> **Review date:** 28 July 2026
> **Project stage:** AnchorKit `0.1.x` MVP
> **Intended environment:** Stellar testnet and local developer demonstrations
> **Overall verdict:** **Conditionally ready for testnet development, but not ready for production custody, mainnet value, or unattended treasury operation**

## 1. Executive summary

AnchorKit has a strong foundation for a testnet-focused developer toolkit.

The monorepo now includes:

- documented package boundaries;
- a package-boundary checker;
- testnet-first configuration;
- explicit mainnet gating;
- secret-redaction utilities;
- runtime validation;
- typed transaction-readiness models;
- account diagnostics;
- reusable fixtures;
- package, web, integration, and contract tests;
- contract storage-version tracking;
- scoped-auth contract tests;
- write-once escrow evidence;
- contributor and maintainer guidance.

Several weaknesses identified by the earlier readiness review have been fixed.

Most importantly, `submit_evidence` in the Soroban escrow contract now:

- requires administrator authorisation;
- rejects unauthorised evidence submission;
- prevents evidence replacement;
- prevents evidence swapping after approval;
- preserves the original evidence hash;
- has scoped-auth regression tests.

The earlier unauthenticated evidence-submission problem must therefore no longer be listed as an open critical vulnerability.

AnchorKit remains an MVP and reference implementation. It is not ready for:

- custody of real user funds;
- production mainnet deployment;
- unattended payment submission;
- production anchor callback processing;
- production treasury custody;
- complete escrow dispute handling;
- single-administrator control of real value.

The highest-priority remaining risks are:

1. disputed milestones have no resolution path;
2. the escrow uses a single administrator;
3. milestone release records state but does not transfer assets;
4. generated web secrets can be repeatedly revealed;
5. package exports are broader than the documented stable API;
6. package-boundary enforcement does not cover the entire repository;
7. some important modules lack dedicated test coverage;
8. production callback, custody, deployment, and incident-response controls are incomplete.

## 2. Review scope and method

This review covers:

```text
apps/web
packages/types
packages/config
packages/fixtures
packages/validators
packages/stellar-kit
packages/anchor-utils
contracts/treasury-escrow
examples
scripts
tests
documentation
public package exports
contributor workflow
```

The assessment was based on:

- static source review;
- package entry-point review;
- test-file inventory;
- targeted security searches;
- the architecture boundary map;
- the package-boundary checker;
- contract code and Rust tests;
- security and maintainer documentation.

The following were not performed:

- an independent smart-contract audit;
- penetration testing;
- dependency vulnerability scanning;
- live mainnet tests;
- live anchor integration tests;
- deployed Soroban contract testing;
- formal verification;
- fuzz testing;
- load testing;
- review of private central automation infrastructure.

The TypeScript test suite was not executed during this documentation work because the checkout did not have installed dependencies. This review therefore distinguishes between:

- controls observed in source;
- test files observed in the repository;
- tests actually executed during this review.

No claim is made that the complete suite passed locally.

## 3. Readiness overview

| Area                    | Status                    | Assessment                                                           |
| ----------------------- | ------------------------- | -------------------------------------------------------------------- |
| Architecture boundaries | Mostly ready              | Documented and partially enforced automatically                      |
| Secret redaction        | Strong for MVP            | Reusable redaction and several tests exist                           |
| Secure key custody      | Not ready                 | No HSM, secure storage, signer policy, or recovery                   |
| Testnet safety          | Strong for MVP            | Testnet default and mainnet guards exist                             |
| Mainnet readiness       | Not ready                 | Production deployment controls are missing                           |
| Payment preparation     | Ready for demonstrations  | Typed validation and readiness models exist                          |
| Payment submission      | Not production ready      | Live submission and uncertain-result handling remain incomplete      |
| Anchor lifecycle        | Ready for mock/test flows | Validation and lifecycle helpers exist                               |
| Production anchors      | Not ready                 | Callback authentication and live protocol integration are incomplete |
| Escrow authorisation    | Improved                  | Privileged operations are administrator-gated                        |
| Escrow dispute handling | Not ready                 | No resolution transition exists                                      |
| Escrow custody          | Not ready                 | Release does not move tokens                                         |
| Public API governance   | Needs improvement         | Broad barrels expose a large API surface                             |
| Test coverage           | Moderate                  | Stronger than before, but important gaps remain                      |
| Documentation           | Strong                    | Extensive, but point-in-time reviews can become stale                |
| Contributor workflow    | Strong                    | Standards, review rules, and automation guidance exist               |
| Production readiness    | Not ready                 | The project remains testnet-first developer tooling                  |

## 4. Confirmed strengths

### 4.1 Architecture boundaries

AnchorKit documents package ownership for:

- `types`;
- `config`;
- `fixtures`;
- `validators`;
- `stellar-kit`;
- `anchor-utils`;
- `apps/web`;
- examples;
- the Soroban contract.

The intended dependency direction prevents lower-level packages from importing higher-level presentation or domain packages.

The repository includes:

```text
scripts/check-package-boundaries.mts
```

with the root command:

```bash
pnpm check:boundaries
```

The checker verifies selected package dependencies and rejects some deep imports and package-to-web imports.

### 4.2 Testnet-first configuration

The default configuration includes:

```text
allowMainnet: false
```

Network-aware account utilities call `assertNetworkAllowed` before reaching Horizon.

Relevant test files include:

```text
packages/config/test/mainnet-safety.test.ts
packages/stellar-kit/test/mainnet-safety.test.ts
```

This is stronger than relying only on web warnings.

### 4.3 Secret redaction

Secret redaction is implemented in:

- shared error utilities;
- Stellar error mapping;
- diagnostics;
- logging;
- validation errors;
- web error mapping.

The web scan found no use of:

- `localStorage`;
- `sessionStorage`;
- IndexedDB;
- cookies;
- direct web `console.log`;
- direct web `console.warn`;
- direct web `console.error`.

The secret-validation input uses `type="password"`.

Tests exist for:

- embedded secret redaction;
- log redaction;
- structured-error redaction;
- web-safe error mapping.

### 4.4 Runtime validation

The validators package provides schemas for:

- public keys;
- secret keys;
- transaction hashes;
- assets;
- amounts;
- memos;
- payment intents;
- receipts;
- anchor metadata;
- escrow data.

Untrusted input is generally validated before it reaches network or domain logic.

The validation engine redacts sensitive content before producing user-facing errors.

### 4.5 Transaction readiness and diagnostics

AnchorKit models:

- valid input;
- readiness stages;
- warnings;
- blocked states;
- unsafe-network states;
- account diagnostic states;
- receipt outcomes.

This helps prevent a syntactically valid request from being presented as a confirmed transaction.

### 4.6 Escrow evidence security

The earlier evidence-authorisation vulnerability is fixed.

`submit_evidence` now:

```text
requires administrator authentication
rejects evidence replacement
records evidence once
emits an evidence event
preserves evidence after approval
```

Scoped-auth tests verify that:

- an unauthorised caller cannot submit evidence;
- an intruder cannot unlock the approval gate;
- evidence cannot be overwritten;
- evidence cannot be replaced after approval;
- the administrator can still submit evidence;
- duplicate release remains impossible.

These scoped-auth tests are valuable because blanket `mock_all_auths()` cannot detect a missing `require_auth()` call.

### 4.7 Contract storage versioning

The contract records:

```text
CURRENT_STORAGE_VERSION
```

and exposes:

```text
storage_version()
```

Tests cover:

- version after initialisation;
- zero before initialisation;
- version persistence after state changes.

This is a useful foundation for future contract migrations.

### 4.8 Fixtures and examples

AnchorKit now includes a dedicated:

```text
@anchorkit/fixtures
```

package containing reusable data for:

- accounts;
- anchors;
- assets;
- diagnostics;
- escrow;
- payments;
- invalid states.

This reduces the need for runtime packages to own shared test data.

The repository also includes JSON examples, a registry, and example-validation tooling.

## 5. Architecture risks

### AR-1: Broad barrel exports

**Severity:** Medium

Broad `export *` patterns exist in package entry points, including:

```text
packages/types/src/index.ts
packages/validators/src/index.ts
packages/stellar-kit/src/index.ts
packages/anchor-utils/src/index.ts
packages/fixtures/src/index.ts
```

This makes it difficult to distinguish:

- stable public APIs;
- experimental APIs;
- deprecated APIs;
- internal helpers.

A helper can become a public contract simply because it was added to an exported module.

#### Recommendation

Create public API governance that:

1. classifies stable and experimental exports;
2. prefers explicit exports for security-sensitive packages;
3. requires review when package-root exports change;
4. adds API snapshots or export manifests;
5. documents deprecation before removal.

### AR-2: Root integration tests use private source imports

**Severity:** Medium

The scan found:

```text
tests/transaction-readiness.test.ts
```

importing from:

```text
../packages/stellar-kit/src
../packages/types/src
```

These imports bypass public package entry points.

The tests may therefore pass while package-root exports are incomplete or broken.

#### Recommendation

Use:

```typescript
import { ... } from "@anchorkit/stellar-kit";
import type { ... } from "@anchorkit/types";
```

in integration tests.

### AR-3: Boundary enforcement does not cover the whole repository

**Severity:** Medium

The package-boundary checker currently scans package `src` directories.

It does not fully cover:

```text
packages/*/test
apps/web
tests
scripts
examples/*.ts
package.json dependency declarations
```

It may also miss:

- multiline imports;
- dynamic imports;
- CommonJS `require`;
- package manifest drift.

This explains why root-test deep imports were not rejected.

#### Recommendation

Extend boundary enforcement to all TypeScript code and package manifests.

### AR-4: Manifest and source dependencies can drift

**Severity:** Low to medium

A package may declare internal dependencies it no longer uses.

Unused production dependencies:

- increase installation surface;
- increase maintenance work;
- make future coupling easier;
- weaken package ownership.

#### Recommendation

Add a periodic internal-dependency audit and remove unused production dependencies.

### AR-5: Parallel validation APIs

**Severity:** Medium

`anchor-utils` exposes:

- direct Zod-style wrappers;
- standard AnchorKit validation results;
- convenience validation functions.

Multiple interfaces for the same data can produce inconsistent error behaviour.

#### Recommendation

Define one preferred application-facing validation API.

Document which APIs:

- return Zod results;
- return AnchorKit validation results;
- are low-level;
- are recommended for normal consumers.

### AR-6: Contract and TypeScript model drift

**Severity:** Medium

Rust and TypeScript share conceptual escrow models without generated bindings.

They can drift in:

- status values;
- event names;
- event fields;
- error codes;
- storage versions;
- milestone structure.

#### Recommendation

Add contract-interface validation or generated bindings and compare:

- Rust event definitions;
- TypeScript schemas;
- example payloads;
- parser expectations.

## 6. Security gaps

### SG-1: No escrow dispute-resolution path

**Severity:** High

A milestone can enter `Disputed`, but there is no:

- `resolve_dispute`;
- `cancel_milestone`;
- refund transition;
- re-approval transition;
- recorded resolution decision.

The `DisputeResolutionRequired` error exists but is not part of an implemented resolution process.

A disputed milestone can remain permanently stuck.

#### Recommendation

Define a dispute-resolution state machine covering:

- authorised resolver;
- resolution outcomes;
- evidence replacement;
- cancellation or refund;
- release after resolution;
- timestamps;
- events;
- reversibility;
- TypeScript and web mappings.

### SG-2: Single-administrator escrow

**Severity:** High for real value

All privileged contract actions depend on one administrator address.

There is no:

- administrator rotation;
- multisig;
- threshold approval;
- role separation;
- timelock;
- emergency pause;
- recovery authority.

Loss or compromise of the administrator key can control or block every milestone.

#### Recommendation

Before real value is used, implement:

- administrator rotation;
- threshold or multisig authority;
- separate evidence, approval, and release roles;
- emergency pause;
- compromise-recovery procedures.

### SG-3: Release does not transfer assets

**Severity:** High if described as custody

`release_milestone` updates milestone state but does not transfer a token or asset.

A `Released` milestone is therefore not proof that funds moved.

#### Recommendation

Continue presenting the contract as a state-machine example until an audited transfer design exists.

A production implementation must define:

- asset type;
- decimals;
- recipient validation;
- contract funding;
- balance checks;
- atomic transfer and state update;
- transfer failure behaviour;
- replay protection.

### SG-4: Generated secret can be revealed repeatedly

**Severity:** Medium

The accounts page warns that a generated secret is shown once or redacted after initial display, but it includes a reveal/hide toggle.

This creates a mismatch between the security message and actual behaviour.

Repeated reveal increases exposure to:

- shoulder surfing;
- screen recording;
- malicious extensions;
- screenshots;
- browser automation.

#### Recommendation

Use one clear model:

1. show once and irreversibly redact; or
2. allow repeated reveal and change the warning.

For a security-focused toolkit, one-time display is preferable.

### SG-5: Public raw-secret validation

**Severity:** Medium

`StellarSecretKeySchema` is exported publicly.

Structural validation of a secret is legitimate, but a convenience export makes it easier for consumers to handle raw secrets without using redaction controls.

#### Recommendation

Make raw-secret handling explicit by:

- moving it to a clearly named security API;
- documenting mandatory no-log and no-storage rules beside it;
- reducing convenience re-exports;
- adding public API tests.

The original secret may still be required for legitimate cryptographic derivation, so replacing every result with only a redacted value would be incorrect.

### SG-6: Mainnet is enabled through configuration

**Severity:** Medium for production

The testnet default is strong, but mainnet can ultimately be enabled through:

```text
allowMainnet: true
```

There is no production:

- deployment approval;
- environment attestation;
- audit event;
- protected configuration;
- organisation policy gate.

#### Recommendation

Before mainnet deployment:

- separate testnet and mainnet builds;
- protect production configuration;
- require explicit deployment approval;
- prevent public demos from enabling mainnet;
- record non-secret mainnet activation.

### SG-7: Production callback trust is incomplete

**Severity:** Medium

HTTPS validation is a good baseline, with localhost exceptions for development.

Production callbacks would also require:

- domain allow-lists;
- signed messages;
- replay prevention;
- timestamp validation;
- idempotency;
- retries;
- timeout limits;
- redirect controls;
- audit logs.

#### Recommendation

Keep live callback processing out of production status until these controls are implemented and tested.

### SG-8: No production custody controls

**Severity:** High for production

AnchorKit does not implement:

- secure wallet storage;
- HSM-backed signing;
- hardware-wallet integration;
- spend policies;
- withdrawal approval;
- key rotation;
- secure recovery;
- custody incident response.

#### Recommendation

Continue stating that AnchorKit is not production custody software.

Any custody design should be treated as a separate security architecture project.

## 7. Payment and readiness risks

### 7.1 Readiness is not submission

A consumer may mistake a `ready` result for a submitted or confirmed transaction.

Maintain separate states for:

```text
valid
ready to construct
constructed
signed
submitted
submission uncertain
confirmed
failed
```

The web UI and documentation should never use readiness language as proof of network confirmation.

### 7.2 Amount precision

Stellar amounts should remain decimal strings.

Conversions to JavaScript `Number` can cause:

- precision loss;
- `Infinity`;
- `NaN`;
- incorrect comparisons;
- formatting exceptions.

Add or preserve tests for:

- very large amounts;
- minimum valid values;
- maximum decimals;
- `Infinity`;
- `NaN`;
- scientific notation;
- signs;
- leading and trailing zeros.

Use arbitrary-precision or decimal-string arithmetic where calculations are required.

### 7.3 Network failure behaviour

Production payment submission would require integration tests for:

- Horizon timeout;
- Soroban RPC timeout;
- rate limiting;
- malformed responses;
- transient 5xx responses;
- duplicate submission;
- uncertain submission;
- transaction expiry;
- network mismatch.

## 8. Anchor lifecycle risks

### 8.1 Mock lifecycle is not full protocol compliance

The current lifecycle is useful developer tooling, but it should not be described as a complete implementation of every Stellar anchor protocol.

Continue using language such as:

```text
SEP-style
mock lifecycle
developer demonstration
```

unless protocol compliance is implemented and tested end to end.

### 8.2 Multiple transition helpers can diverge

Several lifecycle and status helpers exist.

Duplicated transition logic can disagree about:

- valid next states;
- terminal states;
- unknown states;
- refunds;
- failures.

#### Recommendation

Use one canonical transition table to derive:

- allowed transitions;
- next-state behaviour;
- terminal-state checks;
- labels;
- fixtures;
- tests.

### 8.3 Invalid fixtures need clear separation

Invalid fixtures are useful for tests but should not appear to be recommended examples.

Keep them in an explicitly invalid namespace and record the expected failure.

## 9. Escrow contract assessment

### 9.1 Current controls

The contract currently provides:

- initialisation protection;
- administrator authentication;
- positive-amount validation;
- non-zero milestone IDs;
- duplicate milestone prevention;
- evidence requirements;
- write-once evidence;
- dispute-state checks;
- ready-for-release checks;
- duplicate-release prevention;
- persistent storage;
- summary calculation;
- storage versioning;
- contract events;
- scoped-auth tests.

### 9.2 Remaining contract risks

| ID    | Severity | Finding                                          |
| ----- | -------- | ------------------------------------------------ |
| EC-1  | High     | No dispute-resolution path                       |
| EC-2  | High     | Single administrator                             |
| EC-3  | High     | Release does not transfer assets                 |
| EC-4  | Medium   | No emergency pause                               |
| EC-5  | Medium   | No `assign_amount` event was observed            |
| EC-6  | Medium   | Summary calculation scans milestone IDs linearly |
| EC-7  | Medium   | No milestone pagination                          |
| EC-8  | Medium   | TypeScript and Rust models can drift             |
| EC-9  | Medium   | Older lifecycle tests use blanket auth mocking   |
| EC-10 | Low      | Some error paths appear reserved but unused      |

### 9.3 Recommended contract tests

Add or confirm tests for:

- initialising twice;
- creating a milestone with zero amount;
- assigning zero amount;
- disputing before evidence;
- assigning after lifecycle progression;
- every privileged method under scoped unauthorised auth;
- every state-changing event;
- non-sequential milestone IDs;
- large milestone counts;
- storage migrations;
- dispute resolution when implemented;
- token transfer when implemented.

`mock_all_auths()` may be used for ordinary lifecycle tests, but it must not be the only strategy for security-sensitive entry points.

## 10. Test coverage assessment

### 10.1 Test-file inventory observed

| Area                    |     Files observed |
| ----------------------- | -----------------: |
| `packages/types`        |                  1 |
| `packages/config`       |                  3 |
| `packages/validators`   |                  2 |
| `packages/stellar-kit`  |                 16 |
| `packages/anchor-utils` |                  3 |
| `packages/fixtures`     |                  1 |
| `apps/web/test`         |                  2 |
| root `tests`            |                  2 |
| `scripts`               |                  1 |
| Soroban contract        | 1 Rust test module |

This is substantially stronger than the earlier repository state.

### 10.2 Missing or weak coverage

#### TC-1: Public export snapshots

No dedicated public API snapshot was identified.

Add export manifests for:

```text
types
config
validators
stellar-kit
anchor-utils
fixtures
```

#### TC-2: Root deep imports

The root transaction-readiness test imports private package source paths.

Replace them with public package imports and make boundary automation cover root tests.

#### TC-3: Web security flows

Only two web test files were observed.

Add tests for:

- one-time secret display;
- reveal prevention;
- password inputs;
- mainnet warnings;
- readiness versus submission wording;
- callback navigation;
- escrow mock warnings;
- error recovery.

#### TC-4: Stellar error mapping

No dedicated `errors.test.ts` was observed for `stellar-kit`.

Cover:

- Horizon errors;
- unknown errors;
- secret-bearing causes;
- stack sanitisation;
- fallback user messages.

#### TC-5: Payment intent

No dedicated `intent.test.ts` was observed.

Cover:

- valid creation;
- invalid destination;
- invalid amount;
- unsupported asset;
- unsafe network;
- readiness warnings;
- configuration overrides.

#### TC-6: Boundary checker

No dedicated boundary-checker test was observed.

Add fixtures for:

- upward imports;
- private deep imports;
- web imports;
- root-test imports;
- manifest violations;
- multiline imports.

#### TC-7: Security-document drift

The earlier readiness review retained a fixed critical finding.

Add a maintainer rule requiring reviews to record:

- review date;
- reviewed revision;
- open findings;
- fixed findings;
- next review trigger.

## 11. Documentation assessment

### 11.1 Strong documentation areas

AnchorKit documents:

- architecture;
- security notes;
- threat modelling;
- secret handling;
- account diagnostics;
- payment readiness;
- transaction receipts;
- validation governance;
- feature flags;
- fixtures;
- escrow events;
- contract migration;
- contributor workflow;
- maintainer review;
- automation operations.

The README already links to this review.

### 11.2 Documentation gaps

#### DG-1: Production-readiness gate

There is no single checklist defining the minimum requirements for:

- mainnet;
- custody;
- live payment submission;
- live callbacks;
- deployed escrow;
- incident response;
- external audit.

#### DG-2: Public API stability

Package ownership is documented, but stable-export and deprecation rules need a dedicated policy.

#### DG-3: Dispute-resolution design

The missing escrow resolution path is documented, but no approved future transition diagram exists.

#### DG-4: Deployment security

More guidance is needed for:

- Content Security Policy;
- security headers;
- environment isolation;
- production secrets;
- monitoring;
- mainnet approval;
- incident handling.

#### DG-5: Test evidence

Reviews should state separately:

- test files observed;
- tests run;
- CI results;
- tests not run locally.

This review uses that distinction.

## 12. Contributor and maintainer workflow

### Strengths

The repository includes:

- issue standards;
- contributor guidance;
- maintainer review checklists;
- GrantFox workflow documentation;
- architecture boundaries;
- boundary automation;
- issue-batch validation;
- an automation runbook;
- security reporting instructions.

### Risks and recommendations

#### CW-1: Advanced issues may be oversized

Require advanced issues to identify:

- owning package;
- downstream consumers;
- security-sensitive files;
- public API changes;
- tests;
- documentation;
- excluded work.

#### CW-2: Security fixes need regression tests

Every security fix should include a test that fails before the fix.

The scoped-auth evidence tests are a good example.

#### CW-3: Documentation commands must be verified

Documentation work can expose implementation defects, such as conflicting package scripts.

Every documented command should be checked against current source before merge.

## 13. Consolidated risk register

| ID   | Area               | Severity | Status         | Finding                                                        |
| ---- | ------------------ | -------- | -------------- | -------------------------------------------------------------- |
| R-01 | Escrow             | High     | Open           | No dispute-resolution path                                     |
| R-02 | Escrow             | High     | Open           | Single administrator                                           |
| R-03 | Escrow             | High     | Open           | Release does not transfer assets                               |
| R-04 | Custody            | High     | MVP limitation | No production signer or custody model                          |
| R-05 | Web secrets        | Medium   | Open           | Generated secret can be revealed repeatedly                    |
| R-06 | Public API         | Medium   | Open           | Broad barrel exports                                           |
| R-07 | Boundaries         | Medium   | Open           | Checker does not cover the full repository                     |
| R-08 | Tests              | Medium   | Open           | Root integration test uses private imports                     |
| R-09 | Callbacks          | Medium   | Open           | Production trust model incomplete                              |
| R-10 | Mainnet            | Medium   | Open           | Production activation governance missing                       |
| R-11 | Contract audit     | Medium   | Open           | `assign_amount` event coverage should be reviewed              |
| R-12 | Errors             | Medium   | Open           | Dedicated Stellar error tests not observed                     |
| R-13 | Intent             | Medium   | Open           | Dedicated payment-intent tests not observed                    |
| R-14 | Web tests          | Medium   | Open           | Limited route-level security coverage                          |
| R-15 | Review drift       | Medium   | Addressed      | Obsolete findings replaced by current assessment               |
| R-16 | Evidence auth      | Critical | Fixed          | Evidence submission now requires admin auth                    |
| R-17 | Evidence integrity | High     | Fixed          | Evidence is write-once                                         |
| R-18 | Mainnet calls      | Medium   | Fixed          | Account calls enforce network permission                       |
| R-19 | Contract migration | Medium   | Partial        | Version marker exists; migration execution remains future work |

## 14. Recommended follow-up issues

### Priority 0: Before real value

#### 1. Implement escrow dispute resolution

Acceptance should include:

- valid resolution outcomes;
- authorisation;
- timestamps;
- resolution events;
- TypeScript types;
- parser updates;
- scoped-auth tests;
- lifecycle tests;
- documentation.

#### 2. Design production escrow authority and custody

Cover:

- administrator rotation;
- multisig or threshold control;
- role separation;
- emergency pause;
- token custody;
- atomic release;
- external security audit.

This should be treated as a production architecture initiative rather than a small patch.

### Priority 1: Security and architecture

#### 3. Enforce one-time generated-secret display

Cover:

- irreversible redaction;
- corrected UI copy;
- web tests;
- browser threat documentation.

#### 4. Expand package-boundary enforcement

Cover:

- package tests;
- root tests;
- web source;
- scripts;
- examples;
- package manifests;
- checker tests.

#### 5. Add public API governance

Cover:

- stable exports;
- experimental exports;
- explicit package exports;
- snapshots;
- deprecation rules.

#### 6. Define production callback security

Cover:

- allow-lists;
- signatures;
- replay prevention;
- idempotency;
- retries;
- redirects;
- audit events;
- integration tests.

### Priority 2: Tests and resilience

#### 7. Add Stellar error tests

Cover:

- Horizon errors;
- unknown failures;
- secret-bearing errors;
- safe fallbacks.

#### 8. Add payment-intent tests

Cover:

- valid creation;
- invalid input;
- network guards;
- unsupported assets;
- readiness stages.

#### 9. Add web security tests

Cover:

- secret display;
- mainnet warnings;
- callback navigation;
- readiness wording;
- error recovery.

#### 10. Complete escrow edge-case tests

Cover:

- duplicate initialisation;
- zero amounts;
- dispute before evidence;
- all privileged calls under scoped auth;
- events;
- summary scaling.

### Priority 3: Documentation and operations

#### 11. Add a production-readiness checklist

Include:

- external audit;
- custody;
- mainnet;
- callback security;
- contract migration;
- monitoring;
- incident response;
- rollback.

#### 12. Add review-expiry metadata

Security reviews should record:

- date;
- reviewed revision;
- unresolved findings;
- fixed findings;
- next review trigger.

## 15. Minimum production gates

AnchorKit should not be described as production ready until these gates are complete.

### Architecture

- [ ] Boundary enforcement covers the full repository.
- [ ] Public exports are explicitly governed.
- [ ] Contract bindings prevent Rust-TypeScript drift.
- [ ] Deployment architecture is documented.

### Secrets and custody

- [ ] A secure signing and custody model exists.
- [ ] Key rotation and recovery are defined.
- [ ] Repeated browser secret reveal is removed.
- [ ] Incident-response procedures exist.

### Mainnet

- [ ] Mainnet activation is deployment-controlled.
- [ ] Production configuration is protected and auditable.
- [ ] Production endpoints are configurable and monitored.
- [ ] Mainnet integration tests exist.

### Payments

- [ ] Construction, signing, submission, and confirmation are separate.
- [ ] Uncertain submission states are handled.
- [ ] Decimal arithmetic avoids JavaScript precision risk.
- [ ] Duplicate-submission controls exist.

### Anchors

- [ ] Live protocol compliance is tested.
- [ ] Callback authentication exists.
- [ ] Retry and idempotency policies exist.
- [ ] Production integrations are documented.

### Escrow

- [ ] Dispute resolution exists.
- [ ] Administrator rotation or threshold authority exists.
- [ ] Emergency pause exists.
- [ ] Token transfer is atomic with release state.
- [ ] Contract migration is tested.
- [ ] Independent audit is complete.

### Testing and operations

- [ ] Full CI suite passes.
- [ ] Every security fix has a regression test.
- [ ] Boundary-checker tests exist.
- [ ] Web security flows have route-level tests.
- [ ] Contract property or fuzz tests exist.
- [ ] Dependency scanning is enabled.
- [ ] Monitoring and alerting exist.
- [ ] Rollback procedures are documented.

## 16. Final assessment

AnchorKit is in a substantially stronger state than the earlier review suggested.

The repository demonstrates:

- testnet-first controls;
- secret redaction;
- mainnet guards;
- runtime validation;
- transaction-readiness models;
- reusable fixtures;
- architecture documentation;
- boundary automation;
- extensive Stellar utility tests;
- scoped-auth contract tests;
- write-once escrow evidence;
- storage-version awareness;
- strong contributor documentation.

The fixed evidence-authorisation flaw must no longer be represented as open.

The most important remaining limitations are:

- no dispute resolution;
- single-admin escrow authority;
- no real token custody or transfer;
- no production signer model;
- incomplete callback trust;
- broad public exports;
- incomplete repository-wide boundary enforcement;
- limited web security testing.

The appropriate readiness statement is:

> AnchorKit is suitable for testnet development, local demonstrations, documentation examples, and continued open-source development. It is not suitable for custody of real assets, production mainnet deployment, or unattended treasury operation without substantial additional engineering and an independent security review.

## 17. Evidence reviewed

### Architecture

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- `scripts/check-package-boundaries.mts`
- package entry points under `packages/*/src/index.ts`
- root `package.json`

### Security

- [`SECURITY_NOTES.md`](./SECURITY_NOTES.md)
- [`SECRET_KEY_HANDLING.md`](./SECRET_KEY_HANDLING.md)
- [`SECURITY_THREAT_MODEL.md`](./SECURITY_THREAT_MODEL.md)
- [`MAINTAINER_REVIEW_CHECKLIST.md`](./MAINTAINER_REVIEW_CHECKLIST.md)
- root [`SECURITY.md`](../SECURITY.md)

### Packages and web

- `packages/types`
- `packages/config`
- `packages/fixtures`
- `packages/validators`
- `packages/stellar-kit`
- `packages/anchor-utils`
- `apps/web/app`
- `apps/web/components`
- `apps/web/test`

### Contract

- `contracts/treasury-escrow/src/lib.rs`
- `contracts/treasury-escrow/src/test.rs`
- [`SOROBAN_ESCROW_CONTRACT.md`](./SOROBAN_ESCROW_CONTRACT.md)
- [`ESCROW_MIGRATION.md`](./ESCROW_MIGRATION.md)

### Tests and examples

- package test directories;
- root `tests`;
- `examples`;
- validation and boundary scripts.

## 18. Review maintenance

Refresh this document when:

- a high-severity finding is fixed;
- payment submission is added;
- mainnet behaviour changes;
- live anchor integration is added;
- the escrow contract changes;
- signing or custody is introduced;
- package exports materially change;
- the dependency graph changes;
- an external audit is completed;
- the project moves beyond `0.1.x`.

A fixed vulnerability must not remain listed as an open current finding.

Retain it in the risk register as `Fixed` only when the historical context remains useful.
