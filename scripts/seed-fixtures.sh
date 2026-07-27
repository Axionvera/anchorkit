#!/usr/bin/env bash
# Seed fixtures from the examples/ directory into a fresh local DB if we ever add one.
# Today it just validates JSON syntax for every fixture in examples/ as a sanity check.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLES="$ROOT/examples"

count=0
failures=0
while IFS= read -r -d '' file; do
  count=$((count + 1))
  if ! node --check "$file" 2>/dev/null; then
    # node --check fails on JSON files; use python as fallback if available, else jq.
    if command -v jq >/dev/null 2>&1; then
      if ! jq empty "$file"; then
        echo "INVALID JSON: $file"
        failures=$((failures + 1))
      fi
    elif command -v python3 >/dev/null 2>&1; then
      if ! python3 -c "import json,sys; json.load(open('$file'))"; then
        echo "INVALID JSON: $file"
        failures=$((failures + 1))
      fi
    else
      echo "skipping $file (no jq or python3 available)"
    fi
  fi
done < <(find "$EXAMPLES" -name '*.json' -print0)

echo "Checked $count fixture files. Failures: $failures"
if [ "$failures" -gt 0 ]; then
  exit 1
fi
