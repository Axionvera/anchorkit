name: GrantFox Campaign Issue
description: Create an issue that meets the GrantFox advanced issue standard and is eligible for OSS rewards.
labels: ["GrantFox OSS", "Maybe Rewarded", "Official Campaign | FWC26"]
title: "[GrantFox] "
body:
  - type: markdown
    attributes:
      value: |
        This template follows [docs/ISSUE_STANDARD.md](../../../docs/ISSUE_STANDARD.md).
        A maintainer will review and may rename / relabel if any section is missing.
        Issues created with this template **are not automatically rewarded** — see
        [docs/GRANTFOX_WORKFLOW.md](../../../docs/GRANTFOX_WORKFLOW.md).
  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: 1–3 sentences. What is the business problem, and why does it matter for Stellar builders?
    validations:
      required: true
  - type: textarea
    id: background
    attributes:
      label: Background
      description: Link to Stellar docs, SEP numbers, Soroban SDK references, prior art, screenshots, error logs, sample fixtures.
    validations:
      required: true
  - type: textarea
    id: scope-in
    attributes:
      label: In scope
      description: Bulleted list of concrete deliverables (files, modules, data structures).
      value: |
        - …
        - …
        - …
    validations:
      required: true
  - type: textarea
    id: scope-out
    attributes:
      label: Out of scope
      description: Bulleted list of things this issue explicitly does NOT solve. Prevents scope creep later.
      value: |
        - …
        - …
    validations:
      required: true
  - type: textarea
    id: ac
    attributes:
      label: Acceptance criteria (checkboxes)
      description: Objective checkboxes. Maintainers will test against these lines.
      value: |
        - [ ] …
        - [ ] …
        - [ ] …
    validations:
      required: true
  - type: textarea
    id: tests
    attributes:
      label: Tests required
      description: New or updated test files. Mention specific positive/negative cases.
    validations:
      required: true
  - type: textarea
    id: docs
    attributes:
      label: Docs required
      description: Which docs/*.md file(s) must be updated? Write "None" and justify only if no user-visible surface changes.
    validations:
      required: true
  - type: textarea
    id: security
    attributes:
      label: Security & Stellar correctness notes
      description: Cite which of the secret-handling rules (R0–R6) apply, or how mainnet gating is preserved, or which contract invariants are affected.
    validations:
      required: true
  - type: dropdown
    id: size
    attributes:
      label: Estimated size
      options:
        - small (< 1 day, ~1 file change)
        - medium (1–2 days, 2–5 files)
        - large (> 2 days, likely needs sub-issues)
    validations:
      required: true
  - type: dropdown
    id: difficulty
    attributes:
      label: Difficulty label to apply (maintainer will confirm)
      options:
        - good first issue (onboarding-friendly)
        - medium (default, no extra label)
        - expert (Stellar / Rust deep expertise required)
  - type: checkboxes
    id: labels
    attributes:
      label: Scope labels (maintainer will apply)
      description: Select every domain this issue touches.
      options:
        - label: stellar
        - label: soroban
        - label: anchor
        - label: sep
        - label: wallet
        - label: payments
        - label: escrow
        - label: security
        - label: test
        - label: documentation
