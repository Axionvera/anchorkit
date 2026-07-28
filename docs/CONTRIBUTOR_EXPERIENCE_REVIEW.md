# Contributor experience review

Date: 2026-07-28
Reviewer: AnchorKit maintainer team
Scope: All packages, apps, docs, CI, issue workflow, examples

## Summary

AnchorKit is exceptionally well-documented for a v0.1.x project (45 docs files,
comprehensive threat model, detailed PR template). Most friction points are
structural — missing CI, stale README, documentation sprawl — not fundamental
design problems. The review identifies 14 findings across 5 areas with severity
ratings and follow-up recommendations.

---

## 1. Setup and command friction

### F-1. README contains unresolved merge conflict markers

| Property | Value |
|----------|-------|
| Severity | **HIGH** |
| File | `README.md` lines 32, 137, 187, 200, 215, 233, 279-280 |

The README has `<<<<<<< HEAD`, `=======`, and `>>>>>>> upstream/main` markers
in at least 7 places, producing two duplicate copies of the feature list and
docs index. A new contributor cloning the repo sees a broken README immediately.

**Recommendation:** Resolve the merge conflict and deduplicate the feature list
and docs index tables.

---

### F-2. No CI workflow in the repository

| Property | Value |
|----------|-------|
| Severity | **HIGH** |
| File | `.github/workflows/` |

There is only one workflow file (`trigger-auto-merge.yml`) that dispatches PR
events to an external automation repository. There is **no** `.github/workflows/ci.yml`
or similar that runs lint, typecheck, test, or build on pull requests.

New contributors cannot see whether their PR passes automated checks without
running `pnpm verify` locally. Maintainers cannot rely on GitHub status checks
for merge readiness.

**Recommendation:** Add a CI workflow that runs `pnpm verify` (and optionally
`pnpm verify:full`) on `pull_request` and `push` to `main`.

---

### F-3. Git clone URL targets unreachable organisation

| Property | Value |
|----------|-------|
| Severity | **MEDIUM** |
| Files | `README.md`, `docs/LOCAL_SETUP.md`, `CONTRIBUTING.md` |

The clone URL used in docs is:

```
git clone git@github.com:stellar-commons-labs/anchorkit.git
```

A contributor who runs this will get a `Repository not found` error. The actual
repository is under a different organisation or user fork.

**Recommendation:** Update the clone URL to the correct upstream repository
once it is finalised. Add an `upstream` remote setup step for forked workflows.

---

### F-4. No Dockerised development environment

| Property | Value |
|----------|-------|
| Severity | **MEDIUM** |
| Files | Entire repo |

There is no `Dockerfile` or `docker-compose.yml`. Contributors must install
Node.js 20+, pnpm 9.x, Rust 1.81+, `wasm32-unknown-unknown`, `cargo-clippy`,
and optionally the Soroban CLI manually. The Rust toolchain alone takes 15–30
minutes for a first-time setup.

The prerequisites table in `docs/LOCAL_SETUP.md` lists 7 tools. This is a high
barrier for a contributor who only wants to fix a documentation typo or a
simple TypeScript bug.

**Recommendation:** Add a `Dockerfile` for the web app and a `docker-compose.yml`
that lets contributors run the dashboard and tests with a single `docker compose up`.
Clearly document that Rust contract work still needs the local toolchain.

---

### F-5. `pnpm verify` fails fast on the first error

| Property | Value |
|----------|-------|
| Severity | **LOW** |
| File | `scripts/verify.mts` |

`pnpm verify` stops at the first failing step. If lint fails, the contributor
does not learn whether typecheck, tests, or build also fail. This is slightly
frustrating during iterative development.

**Recommendation:** Add a `--continue` flag (or a separate `pnpm verify:all`
command) that runs all steps regardless of intermediate failures and reports
a summary at the end.

---

## 2. Documentation gaps

### F-6. Documentation sprawl — 45 files at the top level

| Property | Value |
|----------|-------|
| Severity | **MEDIUM** |
| File | `docs/` |

The `docs/` directory contains 45 markdown files with no subdirectories. Files
use inconsistent naming: some are `UPPERCASE.md` (e.g., `SECURITY_NOTES.md`),
others are `lowercase.md` (e.g., `account-diagnostics.md`, `asset-display.md`).
Several documents have duplicate or near-duplicate content:

| Duplicate pair | Notes |
|----------------|-------|
| `TRANSACTION_READINESS.md` / `transaction-readiness.md` | Same topic, different scope |
| `FIXTURE_FRAMEWORK.md` / `fixtures.md` | Same topic, different scope |
| `ISSUE_STANDARD.md` / `advanced-issues.md` | Same topic, different versions |

A new contributor scanning `docs/` for the right file cannot tell which
convention to follow.

**Recommendation:** 
1. Organise docs into subdirectories: `docs/guides/`, `docs/reference/`, `docs/security/`, `docs/process/`
2. Remove or merge duplicate documents
3. Standardise on lowercase-kebab-case filenames

---

### F-7. No changelog

| Property | Value |
|----------|-------|
| Severity | **LOW** |
| File | Entire repo |

There is no `CHANGELOG.md`. The `MAINTAINER_GUIDE.md` mentions "Cut a GitHub
release with changelog" but no changelog file exists. Contributors cannot
easily see what changed between releases.

**Recommendation:** Add `CHANGELOG.md` following Keep a Changelog convention,
and add a `scripts/generate-changelog.sh` helper that aggregates commits since
the last tag.

---

## 3. Testing and example friction

### F-8. No CI for tests means no test gate on PRs

| Property | Value |
|----------|-------|
| Severity | **HIGH** |
| File | `.github/workflows/` |

(Same root cause as F-2, but with a testing-specific impact.)

Without CI, a contributor can open a PR that breaks tests and the maintainer
will not know until they run `pnpm test` locally. For GrantFox issues where
test coverage is a reward-readiness criterion, this adds manual overhead.

**Recommendation:** See F-2 — a CI workflow that runs `pnpm test` on PRs.

---

### F-9. Example fixtures have no schema-validation CI gate

| Property | Value |
|----------|-------|
| Severity | **LOW** |
| File | `scripts/check-examples.mts`, `.github/workflows/` |

`pnpm check:examples` validates JSON fixtures against Zod schemas, but it is
only run manually or as part of `pnpm verify:full`. It is not run in CI (see
F-2). An invalid example fixture could be merged without detection.

**Recommendation:** Include `pnpm check:examples` in the proposed CI workflow
when `examples/` or `packages/validators/` change.

---

## 4. Issue workflow clarity

### F-10. No stale-issue management

| Property | Value |
|----------|-------|
| Severity | **MEDIUM** |
| File | `.github/workflows/` |

The 14-day inactivity timeout for GrantFox assignments is documented in
`GRANTFOX_WORKFLOW.md`, but there is no automated stale-issue or stale-PR
workflow. Maintainers must manually track inactivity.

**Recommendation:** Add a `stale.yml` workflow that marks issues and PRs with
no activity for 60 days (14 days for GrantFox assignments) and closes after a
further 7 days.

---

### F-11. PR template is very long

| Property | Value |
|----------|-------|
| Severity | **LOW** |
| File | `.github/PULL_REQUEST_TEMPLATE.md` |

The PR template is 127 lines with 7 major sections. While comprehensive, it
may discourage contributors who are submitting a small fix or documentation
change from filling it out completely.

**Recommendation:** Add a note at the top: "For small fixes or docs-only
changes, delete sections that do not apply and add N/A instead." Consider a
separate, shorter template for non-GrantFox PRs.

---

## 5. Architecture confusion

### F-12. All six packages use identical build configs

| Property | Value |
|----------|-------|
| Severity | **LOW** |
| Files | `packages/*/tsup.config.ts`, `packages/*/vitest.config.ts` |

Every package has an identical `tsup.config.ts` (entry `src/index.ts`, formats
`cjs`+`esm`, `dts: true`, `sourcemap: true`, `clean: true`, target `es2022`)
and `vitest.config.ts` (environment `node`, `globals: true`, `test/**/*.test.ts`).

A new contributor adding a package must copy-paste these files. If the shared
config needs to change (e.g., adding a new format), all 6 copies must be
updated.

**Recommendation:** Create a shared `packages/shared-config/` (or use an
`exports` map in the root `package.json`) that provides the tsup and vitest
presets as reusable objects.

---

### F-13. Dependency graph requires full build before test

| Property | Value |
|----------|-------|
| Severity | **LOW** |
| File | `turbo.json` |

The `build` pipeline depends on `^build` (upstream builds first), which is
correct. However, a contributor working on `stellar-kit` who only runs
`pnpm test --filter=@anchorkit/stellar-kit` will get resolution errors if
`@anchorkit/types`, `@anchorkit/config`, or `@anchorkit/validators` have not
been built.

The contributor must either run `pnpm build` first or understand Turbo's
pipeline dependency graph.

**Recommendation:** Document this in `CONTRIBUTOR_GUIDE.md` under a "Before you
test" section: run `pnpm build` once after cloning, then `pnpm test
--filter=<package>` for iterative work.

---

### F-14. No dependency update automation

| Property | Value |
|----------|-------|
| Severity | **LOW** |
| File | Entire repo |

There is no Dependabot or Renovate configuration. Dependencies are updated
manually. For a project with 7 workspaces and ~30 direct dependencies, this
means security updates can lag.

**Recommendation:** Add `.github/dependabot.yml` with weekly updates for
`pnpm` and `cargo` dependencies.

---

## Summary of findings

| ID | Finding | Severity | Area |
|----|---------|----------|------|
| F-1 | README has merge conflict markers | HIGH | Docs |
| F-2 | No CI workflow | HIGH | CI |
| F-8 | No test gate on PRs (same root cause as F-2) | HIGH | CI/Testing |
| F-3 | Clone URL targets unreachable org | MEDIUM | Setup |
| F-4 | No Dockerised development environment | MEDIUM | Setup |
| F-6 | Documentation sprawl (45 flat files, duplicates) | MEDIUM | Docs |
| F-10 | No stale-issue management | MEDIUM | Process |
| F-5 | `pnpm verify` fails fast (no --continue) | LOW | Setup |
| F-7 | No changelog | LOW | Docs |
| F-9 | No CI gate for example fixtures | LOW | Testing |
| F-11 | PR template is very long | LOW | Process |
| F-12 | Identical build configs in all packages | LOW | Architecture |
| F-13 | Full build required before test | LOW | Architecture |
| F-14 | No dependency update automation | LOW | Maintenance |

---

## Recommended follow-up issues

### P0 (blocking contributor experience)

1. **Resolve README merge conflict** — Clear the `<<<<<<< HEAD` markers and
   deduplicate the feature list and docs index tables.

2. **Add CI workflow** — Create `.github/workflows/ci.yml` that runs
   `pnpm verify` on `pull_request` and `push` to `main`. Include
   `pnpm check:examples` when examples change.

### P1 (significant improvement)

3. **Fix clone URL in docs** — Update all references from the unreachable
   organisation to the actual repository URL.

4. **Add stale-issue workflow** — Auto-mark issues with 60 days of inactivity
   (14 for GrantFox assignments) and close after 7 more days.

5. **Organise docs into subdirectories** — Group by topic (guides, reference,
   security, process) and deduplicate or merge overlapping documents.

### P2 (nice to have)

6. **Add Docker Compose setup** — Let contributors run the dashboard and
   TypeScript tests with `docker compose up`.

7. **Add changelog** — Introduce `CHANGELOG.md` with generate helper.

8. **Add `pnpm verify:all`** — Non-failing variant that reports all failures.

9. **Add Dependabot config** — Weekly updates for pnpm and cargo deps.

10. **Add `pnpm test:filter` guidance** to CONTRIBUTOR_GUIDE.md.
