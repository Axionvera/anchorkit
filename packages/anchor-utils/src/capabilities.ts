import type { PackageCapability } from "@anchorkit/types";

export const ANCHOR_UTILS_CAPABILITIES: PackageCapability = {
  packageName: "anchor-utils",
  overallState: "implemented",
  features: [
    {
      id: "validation",
      label: "Anchor Request Validation",
      state: "implemented",
      description: "Validate deposit/withdrawal request parameters against Zod schema rules.",
    },
    {
      id: "config-validation",
      label: "Asset & Rail Config Validation",
      state: "implemented",
      description: "Validate anchor asset definitions, payment rails, and callback URLs.",
    },
    {
      id: "lifecycle",
      label: "Lifecycle State Machine",
      state: "implemented",
      description: "Advance anchor transactions through valid transitions (e.g. pending_user -> pending_anchor).",
    },
    {
      id: "status-mapping",
      label: "Status Severity Mapping",
      state: "implemented",
      description: "Map anchor transaction states to localized user headlines, detail messages, and tones.",
    },
    {
      id: "mock-records",
      label: "Mock Record Generator",
      state: "implemented",
      description: "Create valid mock anchor transaction records with auto-filled dates and identifiers.",
    },
    {
      id: "fixtures",
      label: "Lifecycle Fixtures",
      state: "implemented",
      description: "Pre-built arrays representing successful deposits and failed/refunded withdrawals.",
    },
  ],
  docsHref: "/docs#anchor-utils",
};
