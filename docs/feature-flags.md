# Feature Flags and Configuration Source Framework

AnchorKit provides a unified configuration source resolution and feature flag framework in `@anchorkit/config` and `@anchorkit/stellar-kit`.

## Overview

Experimental and non-standard SDK capabilities (such as experimental Soroban contract functions or Vault management) are managed through feature flags. By default, experimental capabilities are **disabled for safety** to prevent accidental invocation in production applications.

## Feature Flag Stability Levels

Feature flags define capabilities with one of three stability levels:

- **`stable`**: Fully tested, production-ready SDK capabilities. Enabled by default or safely togglable.
- **`experimental`**: Under active development or preview. **Disabled by default**.
- **`deprecated`**: Legacy capabilities planned for future removal.

### Registered Feature Flags

| Feature Flag ID | Name | Stability | Default State | Description |
|---|---|---|---|---|
| `experimental_soroban` | Experimental Soroban Support | `experimental` | **Disabled** | Soroban smart contract preview functions and RPC extensions. |
| `experimental_vault` | Experimental Vault Manager | `experimental` | **Disabled** | Vault session management and escrow rules. |
| `mainnet_access` | Mainnet Operations | `stable` | **Disabled** | Allows execution against Stellar Mainnet. |
| `advanced_diagnostics` | Advanced Diagnostics | `stable` | **Enabled** | Enriched configuration and network diagnostic pipelines. |

## Enabling Features

Features can be enabled per-environment by configuring `featureFlags` on `AnchorKitEnvConfig`:

```ts
import { DEFAULT_ENV_CONFIG, isFeatureEnabled, assertFeatureEnabled } from "@anchorkit/config";

const appConfig = {
  ...DEFAULT_ENV_CONFIG,
  featureFlags: {
    experimental_soroban: true,
  },
};

// Check if feature is enabled
if (isFeatureEnabled("experimental_soroban", appConfig)) {
  // Safe to use experimental features
}
```

## Disabled Feature Behaviour & Typed Errors

Invoking a disabled capability throws a typed `StellarKitError` with code `"FEATURE_DISABLED"`:

```ts
import { executeSorobanCapability } from "@anchorkit/stellar-kit";

try {
  // Throws StellarKitError with code "FEATURE_DISABLED" if experimental_soroban is false
  executeSorobanCapability("deploy_contract");
} catch (err: any) {
  if (err.code === "FEATURE_DISABLED") {
    console.error("Feature is disabled:", err.message);
  }
}
```

## Safe Configuration Source Metadata & Diagnostics

The framework exposes safe configuration source resolution metadata via `resolveConfigSourceMetadata()` and `diagnoseConfig()`. Sensitive environment fields (such as secret key prefixes or keys) are automatically marked as `isSensitive: true` and redacted (`"[REDACTED]"`).

```ts
import { diagnoseConfig } from "@anchorkit/stellar-kit";

const diag = diagnoseConfig();
console.log(diag.configSources);
// Output contains safe metadata for every config parameter

console.log(diag.isAllStable);
// Returns false if any active feature flag has experimental or deprecated stability
```

## Safety Guidelines

1. Never bypass `assertFeatureEnabled()` or force-enable experimental features in production without thorough review.
2. Diagnostics output is safe to pass to logging systems or tooltips as sensitive keys are automatically redacted.
