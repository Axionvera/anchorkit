"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/PageShell";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { AssetDisplayCompact, AssetDisplayDetail } from "@/components/AssetDisplay";
import {
  DEFAULT_TESTNET_REGISTRY,
  resolveAssetDisplay,
  resolveAssetDisplaySafe,
  parseAssetString,
  getNativeAsset,
} from "@anchorkit/stellar-kit";
import type { AssetDisplayInfo, StellarNetwork } from "@anchorkit/types";

const NETWORKS: StellarNetwork[] = ["testnet", "mainnet", "futurenet"];

export default function AssetsPage() {
  const [input, setInput] = useState("USDC:GC5HTWCIAUD72MGI7AHMJEF5ZJRKXS7II2PYVYOJEYKN4UYH6QTPCPZV");
  const [network, setNetwork] = useState<StellarNetwork>("testnet");
  const [result, setResult] = useState<AssetDisplayInfo | null>(null);

  const native = getNativeAsset();
  const registryAssets = useMemo(() => {
    return [
      resolveAssetDisplay(native, network),
      ...DEFAULT_TESTNET_REGISTRY.entries.map((e) => resolveAssetDisplay(e.asset, network)),
    ];
  }, [network]);

  function handleCheck() {
    const parsed = parseAssetString(input);
    if (!parsed.success) {
      setResult(
        resolveAssetDisplaySafe(parsed, network)
      );
      return;
    }
    setResult(resolveAssetDisplay(parsed.data, network));
  }

  return (
    <PageShell
      title="Asset display metadata"
      subtitle="Resolve asset display metadata — code, issuer, display name, icon placeholder, network support, and trust assumptions."
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

            {result && <AssetDisplayDetail info={result} />}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold tracking-tight">Registered assets (testnet MVP)</h2>
          <div className="mt-3 space-y-2">
            {registryAssets.map((info) => {
              const key =
                info.asset.type === "native"
                  ? "XLM"
                  : `${info.asset.code}:${info.asset.issuer}`;
              return <AssetDisplayCompact key={key} info={info} />;
            })}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
