import type { PackageCapability } from "./index";

export const TYPES_PACKAGE_CAPABILITIES: PackageCapability = {
  packageName: "types",
  overallState: "implemented",
  features: [
    {
      id: "core-types",
      label: "Core Type Definitions",
      state: "implemented",
      description: "Define shared types for Stellar networks, keys, assets, accounts, payments, and transactions.",
    },
    {
      id: "error-taxonomy",
      label: "Error Taxonomy",
      state: "implemented",
      description: "AnchorKitError class with typed categories, error codes, secret redaction, and user-safe mapping.",
    },
    {
      id: "escrow-events",
      label: "Escrow Event Types",
      state: "implemented",
      description: "Typed escrow event interfaces and parser result types for Soroban contract event processing.",
    },
    {
      id: "capability-types",
      label: "Capability State Types",
      state: "implemented",
      description: "CapabilityState, ModuleCapability, and PackageCapability interfaces shared across all packages.",
    },
    {
      id: "severity-types",
      label: "Status Severity Types",
      state: "implemented",
      description: "SeverityLevel, BadgeTone, StatusSeverity, and RecommendedAction types for consistent UI rendering.",
    },
    {
      id: "asset-display-types",
      label: "Asset Display Types",
      state: "implemented",
      description: "AssetDisplayInfo, AssetDisplayMetadata, and AssetDisplayState types for registry-based asset resolution.",
    },
  ],
  docsHref: "/docs#types",
};
