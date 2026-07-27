# Validation Governance Pattern

This document outlines the governance pattern for validation schemas shared across AnchorKit's packages and web forms.

## Principles

To prevent duplication and maintain a clear structure for reusable validation schemas, inferred types, error mapping, and package ownership, AnchorKit enforces the following rules:

### 1. Schema Ownership (`@anchorkit/validators`)
The `@anchorkit/validators` package is the single source of truth for runtime validation schemas.
- All Zod schemas (`z.object()`, `z.string().refine()`, etc.) must be defined here.
- Schemas are organized by domain (e.g., `stellar.ts`, `anchor.ts`, `escrow.ts`).
- Consumers (such as `@anchorkit/stellar-kit`, `@anchorkit/anchor-utils`, or `apps/web`) must import these shared schemas rather than re-defining them inline.

### 2. Inferred Types
To prevent drift between static TypeScript types and runtime validation, schemas that produce complex objects should have their inferred types exported safely.
- Naming convention: `Parsed[SchemaName]`, e.g., `export type ParsedAnchorAssetConfig = z.infer<typeof AnchorAssetConfigSchema>;`
- `@anchorkit/types` remains the owner of branded primitives (e.g., `StellarPublicKey`) and literal unions (e.g., `AnchorTransactionStatus`), which are imported by validators to ensure schema parity.

### 3. Error Mapping
Directly exposing raw Zod errors to end-users or API consumers can leak implementation details.
- Use the shared Validation Engine (`validationEngine.ts`) located in `@anchorkit/validators`.
- The engine standardizes raw validation output into a safe, uniform `ValidationResult` with user-friendly error codes and messages.
- Web forms and API endpoints should rely on the validation engine wrappers rather than `Schema.safeParse` directly when presenting errors.

## Adding a New Validator

When contributing a new shared feature or web form that requires validation:
1. Determine the domain (e.g., `anchor`, `escrow`, `stellar`).
2. Add the schema to the corresponding file in `packages/validators/src/schemas/`.
3. Export any complex inferred types.
4. Export the schema from `packages/validators/src/index.ts`.
5. Add unit tests for your schema in `packages/validators/test/`.
6. (Optional) If it requires complex conditional validation, create a wrapper function in `validationEngine.ts` to map the errors.
