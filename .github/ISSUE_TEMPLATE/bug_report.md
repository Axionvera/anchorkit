name: Bug Report
description: Report a reproducible bug or regression in AnchorKit.
labels: ["bug"]
title: "[Bug] "
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug! Please fill out the sections below so we can reproduce and triage quickly.
        Before filing, please search existing open/closed issues for duplicates.
  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: 1–3 sentences on what went wrong and what you expected instead.
      placeholder: "e.g. validatePublicKey() returns true for a 55-char key that is missing the last character"
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction steps
      description: Minimal, runnable code or exact dashboard steps. Include package versions if you modified them.
      placeholder: |
        1. cd packages/stellar-kit && node
        2. import { isPublicKeyValid } from "./dist/index.js";
        3. isPublicKeyValid("G".repeat(55))
        Expected: false / Actual: true
    validations:
      required: true
  - type: dropdown
    id: component
    attributes:
      label: Affected component
      multiple: true
      options:
        - packages/stellar-kit
        - packages/anchor-utils
        - packages/validators
        - packages/config
        - packages/types
        - apps/web
        - contracts/treasury-escrow
        - docs / examples
        - .github CI workflows
    validations:
      required: true
  - type: dropdown
    id: network
    attributes:
      label: Network
      options:
        - testnet (default)
        - futurenet
        - mainnet (advanced / gated config)
        - N/A (offline / pure validation logic)
    validations:
      required: true
  - type: checkboxes
    id: security
    attributes:
      label: Security & secrets
      description: Confirm the following. If any box cannot be checked, describe mitigation.
      options:
        - label: The bug report does **not** contain a real Stellar secret key (S…).
          required: true
        - label: I have searched open and closed issues for the same symptom.
          required: true
        - label: This is **not** a security vulnerability (if it is, email maintainers instead per SECURITY.md).
          required: true
  - type: textarea
    id: logs
    attributes:
      label: Logs / diagnostic output
      description: Paste CLI output, screenshots, or error stack traces. Redact any secrets.
      render: shell
  - type: textarea
    id: suggestion
    attributes:
      label: Suggested fix (optional)
      description: If you already know the root cause or want to propose a fix, note it here.
