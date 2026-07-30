# Release Readiness Checklist

Use this checklist when preparing an AnchorKit release. It covers the full surface area of the
monorepo — packages, web app, docs, examples, security assumptions, public APIs, and contributor
workflows — so that every release is repeatable and nothing is overlooked.

This is a **maintainer** document. Contributors preparing a PR should use the
[Evaluation-Readiness Dashboard](./EVALUATION_READINESS.md) instead.

---

## 1. Package readiness

- [ ] Every package builds cleanly: `pnpm build` (via turbo).
- [ ] Every package passes `pnpm lint` and `pnpm typecheck`.
- [ ] Every package passes `pnpm test` — all Vitest suites across the workspace.
- [ ] `pnpm check:boundaries` passes — no dependency direction violations. See
      [ARCHITECTURE.md](./ARCHITECTURE.md) for the boundary rules.
- [ ] No unused internal dependencies remain in `packages/*/package.json`. See
      [ARCHITECTURE.md](./ARCHITECTURE.md) for the dependency audit recommendation.
- [ ] Each package's entry point (`src/index.ts`) exports only intended public APIs — no internal
      helpers leaked. See the public API governance notes in
      [SECURITY_ARCHITECTURE_REVIEW.md](./SECURITY_ARCHITECTURE_REVIEW.md) (AR-1).

Commands:

```bash
pnpm verify:full
pnpm check:boundaries
```

See [LOCAL_VERIFICATION.md](./LOCAL_VERIFICATION.md) for what each verification step covers.

## 2. Web application readiness

- [ ] `pnpm web:build` succeeds with no errors.
- [ ] `apps/web` ESLint passes: `pnpm lint` (turbo includes the web app).
- [ ] Web tests pass: `pnpm test` covers `apps/web/test/`.
- [ ] Visual smoke test: start `pnpm web:dev`, confirm accounts, payments, anchors, escrow, and
      docs pages render against testnet without console errors.
- [ ] No hardcoded mainnet endpoints or credentials visible in the web build output.

## 3. Documentation readiness

- [ ] All files under `docs/` are current with the release's changes. Key files to check: - [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — project scope and principles. - [ARCHITECTURE.md](./ARCHITECTURE.md) — package boundaries and dependency direction. - [ROADMAP.md](./ROADMAP.md) — capability states, release gates, and known limitations. - [DEVELOPER_JOURNEY.md](./DEVELOPER_JOURNEY.md) — end-to-end walkthrough. - [SECURITY_NOTES.md](./SECURITY_NOTES.md) — security posture and assumptions. - [STELLAR_TESTNET_USAGE.md](./STELLAR_TESTNET_USAGE.md) — network defaults and testnet
      safety.
- [ ] `README.md` docs index table includes every document under `docs/` — any new docs are
      added, any removed docs are cleaned up.
- [ ] No broken relative links in documentation. Check at least the files touched this release.
- [ ] If public APIs changed, [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) or the relevant topic
      doc is updated.

## 4. Example validation

- [ ] `pnpm check:examples` passes — all JSON examples in `examples/` validate against their
      expected Zod schemas.
- [ ] `examples/registry.ts` is consistent with the actual example files present.
- [ ] Examples reflect any changed APIs, schemas, or data shapes from this release.

## 5. Security review

- [ ] Secret leakage (R0–R6) confirmed across all changed code since the last release. See
      [SECRET_KEY_HANDLING.md](./SECRET_KEY_HANDLING.md) for the rule definitions.
- [ ] `git diff --name-only $(git rev-list --max-parents=0 HEAD)..HEAD` — or the range since the
      last tag — reviewed for any accidental secret key commits (grep for `/S[A-Z2-7]{50,}/`).
- [ ] `console.log`, `console.warn`, `console.error` in changed code routes through
      `redactSecrets()` or `createSafeLogger`.
- [ ] Any new security-sensitive API surfaces are documented in
      [SECURITY_NOTES.md](./SECURITY_NOTES.md) or the relevant security doc.
- [ ] If the Soroban contract changed, confirm admin authorisation, write-once evidence, and
      status-transition guards remain intact. See
      [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md) for the full contract
      correctness checklist.
- [ ] `SECURITY_ARCHITECTURE_REVIEW.md` is updated if a high-severity finding was fixed or a new
      finding was introduced. See the review maintenance guidance in that document (§18).

The per-PR security checks in [MAINTAINER_REVIEW_CHECKLIST.md](./MAINTAINER_REVIEW_CHECKLIST.md)
(Secret leakage, Mainnet safety) serve as the source of truth for individual PRs. This release
check verifies aggregate compliance across all merged PRs.

## 6. Testnet-safety review

- [ ] `DEFAULT_ENV_CONFIG.allowMainnet` remains `false` in the default configuration.
- [ ] No new code paths can reach mainnet Horizon or Soroban RPC without an explicit
      `assertNetworkAllowed` call. See [STELLAR_TESTNET_USAGE.md](./STELLAR_TESTNET_USAGE.md).
- [ ] The web dashboard has no UI toggle for mainnet — it remains configuration-only.
- [ ] All documented commands, examples, and tutorials use testnet endpoints.
- [ ] Soroban contract (if changed) remains usable on testnet; any new functions do not assume
      mainnet availability.

## 7. Public API review

- [ ] Every `packages/*/src/index.ts` reviewed for: - Stable exports intended for external consumers. - Experimental exports that should be marked or separated. - Deprecated exports that should be removed or documented with a migration path.
- [ ] Breaking changes are documented in the changelog and, if user-facing, called out in a
      migration notice in the relevant topic doc.
- [ ] New public functions follow the established validation pattern: `validate` → `is` →
      `assert`. See [ARCHITECTURE.md](./ARCHITECTURE.md) and
      [REVIEWER_QUALITY_CHECKLIST.md](./REVIEWER_QUALITY_CHECKLIST.md) for conventions.

## 8. Contributor workflow review

- [ ] [CONTRIBUTING.md](../CONTRIBUTING.md) — quick-start instructions remain accurate (clone,
      install, build, test commands).
- [ ] [CONTRIBUTOR_GUIDE.md](./CONTRIBUTOR_GUIDE.md) — contribution loop matches current project
      conventions.
- [ ] Issue templates under `.github/ISSUE_TEMPLATE/` — labels, fields, and instructions are
      up to date.
- [ ] [PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md) — sections and referenced
      docs match current project structure.
- [ ] Labels in [LABELS.yml](../.github/LABELS.yml) are still accurate for the current
      project scope and campaign structure.
- [ ] [MAINTAINER_GUIDE.md](./MAINTAINER_GUIDE.md) — triage, review, merge, and assignment
      policies are current.

## 9. Release preparation

- [ ] Version bump applied to all affected `package.json` files. Follow semver for `0.x` MVP
      stage as noted in [MAINTAINER_GUIDE.md](./MAINTAINER_GUIDE.md).
- [ ] Changelog entry prepared summarising merged PRs since the last release. Include notable
      features, breaking changes, dependency changes, and security fixes.
- [ ] GitHub release drafted with the changelog content and tagged with the new version.
- [ ] If the Soroban contract changed: - Tag the contract crate version. - Build the `.wasm` and pin the corresponding SHA in a contract reference doc under
      `docs/`. See [MAINTAINER_GUIDE.md](./MAINTAINER_GUIDE.md).

## 10. Post-release verification

- [ ] GitHub release is published and the tag is pushed.
- [ ] `pnpm build` succeeds from a clean `git clone` at the release tag.
- [ ] `pnpm test` passes from a clean clone (CI confirms this automatically).
- [ ] The web dashboard builds and runs from the release tag.
- [ ] Published npm packages (if any) are installable: `npm view @anchorkit/<name>` shows the
      expected version.
- [ ] If the release includes the Soroban contract, confirm the `.wasm` SHA matches the
      documented pinned value.
- [ ] Repository discussion or announcement (if applicable) is posted.

---

## Related documents

- [Maintainer Guide](./MAINTAINER_GUIDE.md) — triage, review, merge, release, and automation
  policies.
- [Maintainer Review Checklist](./MAINTAINER_REVIEW_CHECKLIST.md) — per-PR review standard.
- [Evaluation-Readiness Dashboard](./EVALUATION_READINESS.md) — contributor-facing PR readiness.
- [Local Verification](./LOCAL_VERIFICATION.md) — verification command reference.
- [Architecture](./ARCHITECTURE.md) — package boundaries and dependency rules.
- [Security & Architecture Readiness Review](./SECURITY_ARCHITECTURE_REVIEW.md) — current
  security assessment and minimum production gates.
- [Roadmap](./ROADMAP.md) — capability states, planned releases, and production readiness gates.
- [Secret Key Handling](./SECRET_KEY_HANDLING.md) — R0–R6 rules.
- [Stellar Testnet Usage](./STELLAR_TESTNET_USAGE.md) — network defaults and safety.
- [Project Overview](./PROJECT_OVERVIEW.md) — project scope and design principles.
