#!/usr/bin/env bash
# Quick helper to generate a fresh testnet keypair and print the public key +
# redacted secret for CI smoke tests. Never prints the full secret; use Node instead when you need it.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d "packages/stellar-kit" ]; then
  echo "Run this from the repo root."
  exit 1
fi

node -e '
const { generateTestnetKeypair, secretKeyToRedactedString, getStellarExpertAccountUrl } = require("./packages/stellar-kit/dist/index.js");
const kp = generateTestnetKeypair();
console.log("public:", kp.publicKey);
console.log("secret:", secretKeyToRedactedString(kp.secretKey));
console.log("expert:", getStellarExpertAccountUrl(kp.publicKey, "testnet"));
'
