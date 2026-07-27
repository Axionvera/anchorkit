name: Feature / Enhancement
description: Propose a new feature or enhancement to AnchorKit packages, contract, dashboard, or docs.
labels: ["enhancement"]
title: "[Feature] "
body:
  - type: markdown
    attributes:
      value: |
        Use this template for feature requests. If you are requesting a GrantFox-eligible issue,
        please use the "GrantFox Campaign Issue" template instead so the advanced standard is met.
  - type: textarea
    id: problem
    attributes:
      label: Problem or gap
      description: What is AnchorKit missing today? Who benefits from solving this?
      placeholder: e.g. "I cannot easily validate a SEP-9 KYC payload before passing it into my anchor server handler."
    validations:
      required: true
  - type: textarea
    id: proposed-solution
    attributes:
      label: Proposed solution
      description: Describe the API or behaviour you want. Pseudo-code, function signatures, or UI mockups are helpful.
    validations:
      required: true
  - type: dropdown
    id: component
    attributes:
      label: Component(s)
      multiple: true
      options:
        - packages/stellar-kit
        - packages/anchor-utils
        - packages/validators
        - packages/config
        - packages/types
        - apps/web
        - contracts/treasury-escrow
        - docs
        - examples
        - CI / tooling
    validations:
      required: true
  - type: checkboxes
    id: acceptance
    attributes:
      label: Acceptance criteria suggestions
      options:
        - label: I am willing to implement this myself once the issue is scoped.
        - label: I expect this to require new Vitest and/or Rust tests.
        - label: I expect this to require documentation updates in /docs.
        - label: This change must remain testnet-first by default.
        - label: This change must not introduce any mainnet risk or secret leakage.
  - type: textarea
    id: references
    attributes:
      label: Related docs / links
      description: Stellar SEPs, Soroban docs, prior art, or related repositories.
