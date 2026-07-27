"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import {
  Alert,
  AnchorStatusBadge,
  Button,
  Card,
  DataRow,
  Input,
  Label,
  Select,
} from "@/components/ui";
import {
  anchorStatusToUserMessage,
  buildDepositLifecycle,
  buildWithdrawalLifecycle,
  createMockAnchorTransactionRecord,
  isAnchorAssetConfigValid,
  isCallbackUrlValid,
  isDepositRequestValid,
  isWithdrawalRequestValid,
  parseDepositRequestMetadata,
  parseWithdrawalRequestMetadata,
  sampleDepositRequest,
  sampleWithdrawalRequest,
  validateAnchorRequest,
} from "@anchorkit/anchor-utils";
import { validateCallbackUrl } from "@anchorkit/validators";
import type {
  AnchorAssetConfig,
  AnchorTransactionKind,
  AnchorTransactionRecord,
  AnchorTransactionStatus,
  DepositRequestMetadata,
  StellarPublicKey,
  WithdrawalRequestMetadata,
} from "@anchorkit/types";

const FRIENDBOT: StellarPublicKey =
  "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR" as StellarPublicKey;

function validSampleAsset(): AnchorAssetConfig {
  return {
    code: "USDC",
    issuer: FRIENDBOT,
    schema: "stellar",
    enabled: true,
    depositEnabled: true,
    withdrawalEnabled: true,
    depositMinAmount: "1",
    depositMaxAmount: "1000000",
    feeFixed: "0.1",
    feePercent: "0.005",
  };
}

export default function AnchorsPage() {
  const depositRecords = useMemo(() => buildDepositLifecycle(), []);
  const withdrawalRecords = useMemo(() => buildWithdrawalLifecycle(), []);

  const [depositAsset, setDepositAsset] = useState<string>(sampleDepositRequest.assetCode);
  const [depositAmount, setDepositAmount] = useState<string>(sampleDepositRequest.amount);
  const [depositAccount, setDepositAccount] = useState<string>(sampleDepositRequest.account);
  const [depositRail, setDepositRail] = useState<string>(sampleDepositRequest.railId ?? "");
  const [depositEmail, setDepositEmail] = useState<string>(sampleDepositRequest.emailAddress ?? "");

  const [withdrawAsset, setWithdrawAsset] = useState<string>(sampleWithdrawalRequest.assetCode);
  const [withdrawAmount, setWithdrawAmount] = useState<string>(sampleWithdrawalRequest.amount);
  const [withdrawAccount, setWithdrawAccount] = useState<string>(sampleWithdrawalRequest.account);
  const [withdrawDest, setWithdrawDest] = useState<string>(sampleWithdrawalRequest.dest);
  const [withdrawRail, setWithdrawRail] = useState<string>(sampleWithdrawalRequest.railId ?? "");

  const [mockKind, setMockKind] = useState<AnchorTransactionKind>("deposit");
  const [mockAsset, setMockAsset] = useState("XLM");
  const [mockAmount, setMockAmount] = useState("125.0000000");
  const [mockStatus, setMockStatus] = useState<AnchorTransactionStatus>("pending_user");

  const [assetCfg, setAssetCfg] = useState<AnchorAssetConfig>(validSampleAsset());
  const [cbUrl, setCbUrl] = useState("https://anchor.example.com/webhooks/sep6");

  const depositDraft: DepositRequestMetadata = {
    assetCode: depositAsset,
    amount: depositAmount,
    account: depositAccount as StellarPublicKey,
    railId: depositRail || undefined,
    emailAddress: depositEmail || undefined,
    type: "SEPA",
  };
  const withdrawDraft: WithdrawalRequestMetadata = {
    assetCode: withdrawAsset,
    amount: withdrawAmount,
    account: withdrawAccount as StellarPublicKey,
    dest: withdrawDest,
    railId: withdrawRail || undefined,
    type: "ACH",
  };

  const mockRecord = useMemo(
    () =>
      createMockAnchorTransactionRecord({
        id: `demo_${Date.now().toString(36)}`,
        kind: mockKind,
        status: mockStatus,
        assetCode: mockAsset,
        amountIn: mockAmount,
        stellarAccount: FRIENDBOT,
      }),
    [mockKind, mockStatus, mockAsset, mockAmount]
  );

  return (
    <PageShell
      eyebrow="Anchors"
      title="Anchor flows & SEP-style utilities"
      subtitle="Create mock deposit/withdrawal requests, inspect anchor transaction records across their typed lifecycle statuses, and validate anchor configurations."
      warning="AnchorKit anchor-utils is a developer helper package with typed fixtures and parsing utilities. It does not implement a production SEP server. Build your own SEP-6/24/31 server on top of these primitives."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold tracking-tight">Mock deposit request</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Parse + validate a SEP deposit request using Zod schemas.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <Label>Asset code</Label>
              <Input value={depositAsset} onChange={(e) => setDepositAsset(e.target.value)} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Stellar account (destination)</Label>
              <Input value={depositAccount} onChange={(e) => setDepositAccount(e.target.value.trim())} />
            </div>
            <div>
              <Label>Rail id</Label>
              <Input value={depositRail} onChange={(e) => setDepositRail(e.target.value)} placeholder="sepa_eu" />
            </div>
            <div>
              <Label>Contact email (optional)</Label>
              <Input value={depositEmail} onChange={(e) => setDepositEmail(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            {isDepositRequestValid(depositDraft) ? (
              <Alert tone="success" title="Valid deposit metadata">
                Accepted by <span className="text-mono-xs">parseDepositRequestMetadata</span>
              </Alert>
            ) : (
              <Alert tone="error" title="Invalid deposit metadata">
                {(() => {
                  const r = parseDepositRequestMetadata(depositDraft);
                  if (!r.success) return r.error.issues.map((i) => i.message).join("; ");
                  return "";
                })()}
              </Alert>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold tracking-tight">Mock withdrawal request</h2>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Requires the external destination (e.g. bank account) plus a Stellar refund account.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <Label>Asset code</Label>
              <Input value={withdrawAsset} onChange={(e) => setWithdrawAsset(e.target.value)} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Stellar account (sender / refund)</Label>
              <Input value={withdrawAccount} onChange={(e) => setWithdrawAccount(e.target.value.trim())} />
            </div>
            <div>
              <Label>External destination</Label>
              <Input value={withdrawDest} onChange={(e) => setWithdrawDest(e.target.value)} />
            </div>
            <div>
              <Label>Rail id</Label>
              <Input value={withdrawRail} onChange={(e) => setWithdrawRail(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            {isWithdrawalRequestValid(withdrawDraft) ? (
              <Alert tone="success" title="Valid withdrawal metadata">
                Accepted by <span className="text-mono-xs">parseWithdrawalRequestMetadata</span>
              </Alert>
            ) : (
              <Alert tone="error" title="Invalid withdrawal metadata">
                {(() => {
                  const r = parseWithdrawalRequestMetadata(withdrawDraft);
                  if (!r.success) return r.error.issues.map((i) => i.message).join("; ");
                  return "";
                })()}
              </Alert>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold tracking-tight">Anchor config validation</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Asset code</Label>
                <Input
                  value={assetCfg.code}
                  onChange={(e) => setAssetCfg({ ...assetCfg, code: e.target.value })}
                />
              </div>
              <div>
                <Label>Issuer (G…)</Label>
                <Input
                  value={assetCfg.issuer}
                  onChange={(e) =>
                    setAssetCfg({ ...assetCfg, issuer: e.target.value.trim() as StellarPublicKey })
                  }
                />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assetCfg.enabled}
                  onChange={(e) => setAssetCfg({ ...assetCfg, enabled: e.target.checked })}
                />{" "}
                Enabled
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assetCfg.depositEnabled}
                  onChange={(e) => setAssetCfg({ ...assetCfg, depositEnabled: e.target.checked })}
                />{" "}
                Deposits
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assetCfg.withdrawalEnabled}
                  onChange={(e) =>
                    setAssetCfg({ ...assetCfg, withdrawalEnabled: e.target.checked })
                  }
                />{" "}
                Withdrawals
              </label>
            </div>
            {isAnchorAssetConfigValid(assetCfg) ? (
              <Alert tone="success" title="Anchor asset config valid">
                Passes AnchorAssetConfigSchema.
              </Alert>
            ) : (
              <Alert tone="error" title="Anchor asset config invalid">
                Check code length, issuer public key format, and required boolean fields.
              </Alert>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <Label>Callback / webhook URL</Label>
              <Input value={cbUrl} onChange={(e) => setCbUrl(e.target.value)} />
            </div>
            {isCallbackUrlValid(cbUrl) ? (
              <Alert tone="success" title="Callback URL valid">
                HTTPS required in production. localhost is allowed for tests.
              </Alert>
            ) : (
              <Alert tone="warning" title="Callback URL should be HTTPS in production">
                Plain HTTP is only accepted for localhost.
              </Alert>
            )}
            <div>
              <Label>Preview a mock anchor record</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Select value={mockKind} onChange={(e) => setMockKind(e.target.value as any)}>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </Select>
                <Select value={mockStatus} onChange={(e) => setMockStatus(e.target.value as any)}>
                  {(
                    [
                      "pending_user",
                      "pending_anchor",
                      "pending_stellar",
                      "completed",
                      "failed",
                      "refunded",
                    ] as const
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Input
                  value={mockAsset}
                  onChange={(e) => setMockAsset(e.target.value)}
                  placeholder="asset"
                  className="max-w-[160px]"
                />
                <Input
                  value={mockAmount}
                  onChange={(e) => setMockAmount(e.target.value)}
                  placeholder="amount"
                  className="max-w-[200px]"
                />
              </div>
              <div className="mt-3 rounded-lg border border-ink-200 p-3 text-sm dark:border-ink-800">
                <dl className="divide-y divide-ink-100 dark:divide-ink-800">
                  <DataRow label="Status" value={<AnchorStatusBadge status={mockRecord.status} />} />
                  <DataRow label="Headline" value={anchorStatusToUserMessage(mockStatus, mockKind).headline} />
                  <DataRow label="Detail" value={anchorStatusToUserMessage(mockStatus, mockKind).detail} />
                  <DataRow label="Amount in" value={<span className="text-mono-sm">{mockRecord.amountIn} {mockRecord.assetCode}</span>} />
                </dl>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">
              Deposit lifecycle fixtures
            </h2>
            <span className="text-mono-xs text-ink-500 dark:text-ink-400">
              buildDepositLifecycle()
            </span>
          </div>
          <ol className="space-y-3">
            {depositRecords.map((r) => (
              <LifecycleRow key={r.id} r={r} />
            ))}
          </ol>
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">
              Withdrawal lifecycle (incl. failed + refunded)
            </h2>
            <span className="text-mono-xs text-ink-500 dark:text-ink-400">
              buildWithdrawalLifecycle()
            </span>
          </div>
          <ol className="space-y-3">
            {withdrawalRecords.map((r) => (
              <LifecycleRow key={r.id} r={r} />
            ))}
          </ol>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold tracking-tight">Validation engine</h2>
        <p className="mb-3 text-sm text-ink-500">
          The shared anchor validation engine (<span className="text-mono-xs">
            @anchorkit/validators
          </span>) returns a uniform typed <span className="text-mono-xs">ValidationResult</span>{" "}
          with user-safe errors, instead of raw schema output.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Deposit amount</Label>
            <Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          </div>
          <div>
            <Label>Withdrawal destination</Label>
            <Input value={withdrawDest} onChange={(e) => setWithdrawDest(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <ValidationPanel
            title="Deposit (engine)"
            result={validateAnchorRequest("deposit", depositDraft)}
          />
          <ValidationPanel
            title="Withdrawal (engine)"
            result={validateAnchorRequest("withdrawal", withdrawDraft)}
          />
          <ValidationPanel
            title="Callback URL (engine)"
            result={validateCallbackUrl(cbUrl)}
          />
        </div>
      </Card>
    </PageShell>
  );
}

function ValidationPanel({
  title,
  result,
}: {
  title: string;
  result: { ok: boolean; errors?: { code: string; message: string; field?: string }[] };
}) {
  if (result.ok) {
    return (
      <Alert tone="success" title={title}>
        Validation passed.
      </Alert>
    );
  }
  return (
    <Alert tone="error" title={`${title} — ${result.errors?.length ?? 0} issue(s)`}>
      <ul className="list-disc pl-4">
        {result.errors?.map((e, i) => (
          <li key={i}>
            <span className="text-mono-xs">[{e.code}]</span> {e.message}
            {e.field ? ` (${e.field})` : ""}
          </li>
        ))}
      </ul>
    </Alert>
  );
}

function LifecycleRow({ r }: { r: AnchorTransactionRecord }) {
  const msg = anchorStatusToUserMessage(r.status, r.kind);
  return (
    <li className="rounded-lg border border-ink-200 p-3 text-sm dark:border-ink-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AnchorStatusBadge status={r.status} />
          <span className="text-mono-xs text-ink-500 dark:text-ink-400">
            {r.kind.toUpperCase()} · {r.assetCode} {r.amountIn}
          </span>
        </div>
        <span className="text-mono-xs text-ink-500 dark:text-ink-400">
          updated {new Date(r.updatedAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-2 text-ink-700 dark:text-ink-200">{msg.headline}</p>
      <p className="text-sm text-ink-500 dark:text-ink-300">{msg.detail}</p>
      {r.message && (
        <p className="mt-1 rounded bg-ink-50 p-2 text-mono-xs dark:bg-ink-900">{r.message}</p>
      )}
    </li>
  );
}
