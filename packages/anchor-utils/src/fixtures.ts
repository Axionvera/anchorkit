/**
 * Backward-compatible re-exports (issue #59).
 *
 * The fixture implementations that used to live in this file now live in
 * `@anchorkit/fixtures`, the shared fixture package. This file re-exports the
 * same names so existing consumers (including the `apps/web` anchors page)
 * keep working without changes. Add new fixtures to `@anchorkit/fixtures`
 * directly rather than here.
 */

export {
  sampleDepositRequest,
  sampleWithdrawalRequest,
  buildDepositLifecycle,
  buildWithdrawalLifecycle,
  invalidDepositRequest,
  invalidWithdrawalRequest,
  invalidAnchorAssetConfig,
  invalidCallbackUrl,
  invalidAmount,
} from "@anchorkit/fixtures";
