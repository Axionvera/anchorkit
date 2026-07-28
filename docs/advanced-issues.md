# Advanced Issue Standard

This document outlines the standard for creating "GrantFox-style" advanced issue JSON files in the `anchorkit` repository.

## Overview
To automate and standardize the issue creation process, issue batches are defined as JSON files inside the `issues/` directory. These issues must adhere to strict schema rules before they can be created on GitHub.

## Schema Requirements

Every issue JSON file must have the following fields:

- `title` (string, required): A concise title for the issue.
- `description` (string, required): A detailed description of the problem or feature.
- `labels` (array of strings, required): At least one valid label.
- `complexity` (string, required): The difficulty of the issue.
- `acceptanceCriteria` (array of strings, required): Specific requirements that must be met to close the issue.

### Supported Labels
- `bug`
- `enhancement`
- `documentation`
- `good first issue`
- `help wanted`
- `feature`

### Allowed Complexities
- `low`
- `medium`
- `high`
- `expert`

### Acceptance Criteria Rules
- There must be at least one acceptance criterion.
- Each criterion must be sufficiently detailed (greater than 10 characters). Weak criteria like "works" or "tests pass" will be rejected.

## Example

```json
{
  "title": "Add a local validator for GrantFox-style advanced issue JSON files.",
  "description": "Issue batches can contain missing fields, unsupported labels, weak acceptance criteria, or low-value tasks. AnchorKit automation should validate issue batch structure and advanced issue quality before creation.",
  "labels": ["feature"],
  "complexity": "expert",
  "acceptanceCriteria": [
    "Issue batch schema validator is implemented.",
    "Unsupported labels are detected before GitHub issue creation.",
    "Missing required fields are reported clearly.",
    "Weak or empty acceptance criteria are flagged."
  ]
}
```
