"use client";

import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Alert, Button, Card, Input, Label, Select } from "@/components/ui";
import {
  DEFAULT_TESTNET_REGISTRY,
  checkAssetOnNetwork,
  parseAssetString,
  getNativeAsset,
} from "@anchorkit/stellar-kit";
import type { StellarAsset, StellarNetwork } from "@anchorkit/types";

const NETWORKS: StellarNetwork[] = ["testnet", "mainnet", "futurenet"];

export default function AssetsPage() {
  const [input, setInput] = useState("USDC:GC5HTWCIAUD72MGI7AHMJEF5ZJRKXS7II2PYVYOJEYKN4UYH6QTPCPZV");
  const [network, setNetwork] = useState<StellarNetwork>("testnet");
  const [result, setResult] = useState<ReturnType<typeof checkAssetOnNetwork> | null>(null);

  const native = getNativeAsset();
  const registryAssets: StellarAsset[] = [
    native,
    ...DEFAULT_TESTNET_REGISTRY.entries.map((e) => e.asset),
  ];

  function handleCheck() {
    const parsed = parseAssetString(input);
    if (!parsed.success) {
      setResult({
        ok: false,
        code: "ASSET_INVALID",
        error: parsed.error.issues[0]?.message ?? "Invalid asset string",
      });
      return;
    }
    setResult(checkAssetOnNetwork(parsed.data, network));
  }

  return (
    <PageShell
      title="Asset registry"
      subtitle="Network-aware Stellar asset registry and validation. Native XLM is always supported; issued assets are checked against the per-network registry."
    >
      <div className="grid gap-4">
        <Card>
          <h2 className="text-base font-semibold tracking-tight">Check an asset</h2>
          <div className="mt-3 space-y-3">
            <div>
              <Label htmlFor="asset-input">Asset (XLM, native, or CODE:ISSUER)</Label>
              <Input
                id="asset-input"
                value={input}
                onChange={(e: { target: { value: string } }) => setInput(e.target.value)}
                placeholder="USDC:GC5H..."
              />
            </div>
            <div>
              <Label htmlFor="network-select">Network</Label>
              <Select
                id="network-select"
                value={network}
                onChange={(e: { target: { value: string } }) => setNetwork(e.target.value as StellarNetwork)}
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={handleCheck}>Check support</Button>

            {result && !result.ok && (
              <Alert tone="error" title={`${result.code}`}>
                {result.error}
              </Alert>
            )}
            {result && result.ok && (
              <Alert tone="success" title="Supported">
                Supported on {network}.
              </Alert>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold tracking-tight">Registered assets (testnet MVP)</h2>
          <ul className="mt-3 divide-y divide-ink-200 dark:divide-ink-800">
            {registryAssets.map((a) => {
              const key = a.type === "native" ? "XLM" : `${a.code}:${a.issuer}`;
              const entry = DEFAULT_TESTNET_REGISTRY.byKey.get(key) ?? null;
              return (
                <li key={key} className="py-2 text-sm">
                  <div className="font-mono">{key}</div>
                  <div className="text-ink-500 dark:text-ink-300">
                    {a.type === "native"
                      ? "Native — supported on all networks."
                      : entry?.testnetOnly
                        ? "Testnet-only issued asset."
                        : "Issued asset."}
                    {entry?.note ? ` ${entry.note}` : ""}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
