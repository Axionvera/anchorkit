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
  ValidationStateAlert,
} from "@/components/ui";
import {
  anchorStatusToUserMessage,
  anchorValidationUiState,
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
  transition,
  ALLOWED_TRANSITIONS,
} from "@anchorkit/anchor-utils";
import { anchorRecordToReceipt } from "@anchorkit/stellar-kit";
import { validateCallbackUrl } from "@anchorkit/validators";
import type { ValidationResult } from "@anchorkit/validators";
import { TransactionReceiptPanel } from "@/components/TransactionReceiptPanel";
import { useDebouncedLoading } from "@/lib/useDebouncedLoading";
import type {
  AnchorAssetConfig,
  AnchorTransactionKind,
  AnchorTransactionRecord,
  AnchorTransactionStatus,
  DepositRequestMetadata,
  StellarPublicKey,
  StellarTransactionHash,
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

  const ALL_STATUSES: AnchorTransactionStatus[] = [
    "pending_user",
    "pending_anchor",
    "pending_stellar",
    "completed",
    "failed",
    "refunded",
  ];
  const [fromStatus, setFromStatus] = useState<AnchorTransactionStatus>("pending_user");
  const [toStatus, setToStatus] = useState<AnchorTransactionStatus>("pending_anchor");
  const transitionResult = transition(fromStatus, toStatus);

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

  const depositFormatValid = isDepositRequestValid(depositDraft);
  const withdrawFormatValid = isWithdrawalRequestValid(withdrawDraft);
  const assetCfgValid = isAnchorAssetConfigValid(assetCfg);
  const cbUrlValid = isCallbackUrlValid(cbUrl);

  const mockRecord = useMemo(
    () =>
      createMockAnchorTransactionRecord({
        id: `demo_${Date.now().toString(36)}`,
        kind: mockKind,
        status: mockStatus,
        assetCode: mockAsset,
        amountIn: mockAmount,
        stellarAccount: FRIENDBOT,
        stellarTransactionId:
          mockStatus === "completed" || mockStatus === "pending_stellar"
            ? ("c".repeat(64) as StellarTransactionHash)
            : undefined,
      }),
    [mockKind, mockStatus, mockAsset, mockAmount]
  );

  const mockReceipt = useMemo(() => anchorRecordToReceipt(mockRecord, "testnet"), [mockRecord]);

  const validationLoading = useDebouncedLoading(
    JSON.stringify({ depositDraft, withdrawDraft, assetCfg, cbUrl })
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
              <Input
                value={depositAccount}
                onChange={(e) => setDepositAccount(e.target.value.trim())}
              />
            </div>
            <div>
              <Label>Rail id</Label>
              <Input
                value={depositRail}
                onChange={(e) => setDepositRail(e.target.value)}
                placeholder="sepa_eu"
              />
            </div>
            <div>
              <Label>Contact email (optional)</Label>
              <Input value={depositEmail} onChange={(e) => setDepositEmail(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <ValidationStateAlert
              state={validationLoading ? "loading" : depositFormatValid ? "ready" : "invalid"}
              title={depositFormatValid ? "Valid deposit metadata" : "Invalid deposit metadata"}
            >
              {validationLoading ? undefined : depositFormatValid ? (
                <>
                  Accepted by <span className="text-mono-xs">parseDepositRequestMetadata</span>
                </>
              ) : (
                (() => {
                  const r = parseDepositRequestMetadata(depositDraft);
                  return r.success ? "" : r.error.issues.map((i) => i.message).join("; ");
                })()
              )}
            </ValidationStateAlert>
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
              <Input
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value.trim())}
              />
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
            <ValidationStateAlert
              state={validationLoading ? "loading" : withdrawFormatValid ? "ready" : "invalid"}
              title={
                withdrawFormatValid ? "Valid withdrawal metadata" : "Invalid withdrawal metadata"
              }
            >
              {validationLoading ? undefined : withdrawFormatValid ? (
                <>
                  Accepted by <span className="text-mono-xs">parseWithdrawalRequestMetadata</span>
                </>
              ) : (
                (() => {
                  const r = parseWithdrawalRequestMetadata(withdrawDraft);
                  return r.success ? "" : r.error.issues.map((i) => i.message).join("; ");
                })()
              )}
            </ValidationStateAlert>
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
            <ValidationStateAlert
              state={validationLoading ? "loading" : assetCfgValid ? "ready" : "invalid"}
              title={assetCfgValid ? "Anchor asset config valid" : "Anchor asset config invalid"}
            >
              {validationLoading
                ? undefined
                : assetCfgValid
                  ? "Passes AnchorAssetConfigSchema."
                  : "Check code length, issuer public key format, and required boolean fields."}
            </ValidationStateAlert>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Callback / webhook URL</Label>
              <Input value={cbUrl} onChange={(e) => setCbUrl(e.target.value)} />
            </div>
            <ValidationStateAlert
              state={validationLoading ? "loading" : cbUrlValid ? "ready" : "warning"}
              title={
                cbUrlValid ? "Callback URL valid" : "Callback URL should be HTTPS in production"
              }
            >
              {validationLoading
                ? undefined
                : cbUrlValid
                  ? "HTTPS required in production. localhost is allowed for tests."
                  : "Plain HTTP is only accepted for localhost."}
            </ValidationStateAlert>
            <div>
              <Label>Preview a mock anchor record</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Select
                  value={mockKind}
                  onChange={(e) => setMockKind(e.target.value as AnchorTransactionKind)}
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </Select>
                <Select
                  value={mockStatus}
                  onChange={(e) => setMockStatus(e.target.value as AnchorTransactionStatus)}
                >
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
                  <DataRow
                    label="Status"
                    value={<AnchorStatusBadge status={mockRecord.status} />}
                  />
                  <DataRow
                    label="Headline"
                    value={anchorStatusToUserMessage(mockStatus, mockKind).headline}
                  />
                  <DataRow
                    label="Detail"
                    value={anchorStatusToUserMessage(mockStatus, mockKind).detail}
                  />
                  <DataRow
                    label="Amount in"
                    value={
                      <span className="text-mono-sm">
                        {mockRecord.amountIn} {mockRecord.assetCode}
                      </span>
                    }
                  />
                </dl>
              </div>
              <TransactionReceiptPanel receipt={mockReceipt} title="Normalized anchor receipt" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Deposit lifecycle fixtures</h2>
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
          The shared anchor validation engine (
          <span className="text-mono-xs">@anchorkit/validators</span>) returns a uniform typed{" "}
          <span className="text-mono-xs">ValidationResult</span> with user-safe errors, instead of
          raw schema output.
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
          <EngineValidationAlert
            title="Deposit (engine)"
            result={validateAnchorRequest("deposit", depositDraft)}
            loading={validationLoading}
            blocked={!assetCfg.depositEnabled}
          />
          <EngineValidationAlert
            title="Withdrawal (engine)"
            result={validateAnchorRequest("withdrawal", withdrawDraft)}
            loading={validationLoading}
            blocked={!assetCfg.withdrawalEnabled}
          />
          <EngineValidationAlert
            title="Callback URL (engine)"
            result={validateCallbackUrl(cbUrl)}
            loading={validationLoading}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold tracking-tight">Lifecycle transitions</h2>
        <p className="mb-3 text-sm text-ink-500">
          The SEP-style anchor lifecycle state machine (
          <span className="text-mono-xs">@anchorkit/anchor-utils</span>) rejects illegal status
          moves instead of silently wrapping.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>From</Label>
            <Select
              value={fromStatus}
              onChange={(e) => setFromStatus(e.target.value as AnchorTransactionStatus)}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>To</Label>
            <Select
              value={toStatus}
              onChange={(e) => setToStatus(e.target.value as AnchorTransactionStatus)}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                const allowed = ALLOWED_TRANSITIONS[fromStatus];
                if (allowed.length) setToStatus(allowed[0]!);
              }}
            >
              Use next valid
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {transitionResult.ok ? (
            <Alert tone="success" title="Legal transition">
              <code className="text-mono-xs">
                {fromStatus} → {toStatus}
              </code>{" "}
              is allowed.
            </Alert>
          ) : (
            <Alert tone="error" title="Illegal transition">
              <code className="text-mono-xs">
                {fromStatus} → {toStatus}
              </code>{" "}
              — {transitionResult.error}
            </Alert>
          )}
        </div>
      </Card>
    </PageShell>
  );
}

/**
 * Renders a `@anchorkit/validators` `ValidationResult` through the shared
 * {@link ValidationStateAlert}, deriving its state via
 * `anchorValidationUiState` (loading/invalid/ready, plus "blocked" when the
 * anchor asset config disables the operation) instead of a page-local
 * success/error switch.
 */
function EngineValidationAlert({
  title,
  result,
  loading,
  blocked,
}: {
  title: string;
  result: ValidationResult<unknown>;
  loading?: boolean;
  blocked?: boolean;
}) {
  const state = anchorValidationUiState(result, { loading, blocked });
  const issueCount = !result.ok ? result.errors.length : 0;

  return (
    <ValidationStateAlert
      state={state}
      title={!loading && !result.ok ? `${title} — ${issueCount} issue(s)` : title}
    >
      {loading ? undefined : blocked ? (
        "This operation is currently disabled for this asset in the config above."
      ) : result.ok ? (
        "Validation passed."
      ) : (
        <ul className="list-disc pl-4">
          {result.errors.map((e, i) => (
            <li key={i}>
              <span className="text-mono-xs">[{e.code}]</span> {e.message}
              {e.field ? ` (${e.field})` : ""}
            </li>
          ))}
        </ul>
      )}
    </ValidationStateAlert>
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
