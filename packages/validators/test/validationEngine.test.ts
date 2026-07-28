/**
 * Validation engine tests (issue #6).
 * Verifies the shared anchor validation engine returns uniform, typed,
 * user-safe results for valid and invalid deposit/withdrawal/asset/callback
 * inputs.
 */

import { describe, it, expect } from 'vitest';
import {
  FRIENDBOT_PUBLIC_KEY,
  sampleDepositRequest,
  sampleWithdrawalRequest,
  invalidDepositRequest,
  invalidWithdrawalRequest,
  invalidAnchorAssetConfig,
  invalidCallbackUrl,
} from '@anchorkit/fixtures';
import {
  validateDepositRequest,
  validateWithdrawalRequest,
  validateAnchorAssetConfig,
  validateCallbackUrl,
  validateAmount,
  firstErrorMessage,
  type ValidationResult,
} from '../src/validationEngine';

const FRIENDBOT = FRIENDBOT_PUBLIC_KEY;

const goodDeposit = sampleDepositRequest;

const goodWithdrawal = sampleWithdrawalRequest;

const goodAsset = {
  code: 'USDC',
  issuer: FRIENDBOT,
  schema: 'stellar',
  enabled: true,
  depositEnabled: true,
  withdrawalEnabled: true,
  depositMinAmount: '1',
  depositMaxAmount: '1000000',
  feeFixed: '0.1',
  feePercent: '0.005',
};

describe('validateDepositRequest', () => {
  it('accepts a well-formed deposit', () => {
    const r = validateDepositRequest(goodDeposit) as ValidationResult<unknown>;
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.account).toBe(FRIENDBOT);
  });

  it('rejects a deposit missing account and with zero amount', () => {
    const r = validateDepositRequest(invalidDepositRequest);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors[0]?.code).toBe('INVALID_DEPOSIT_METADATA');
      expect(r.errors.some((e) => e.field === 'account')).toBe(true);
    }
  });

  it('rejects a deposit with a malformed account', () => {
    const r = validateDepositRequest({ ...goodDeposit, account: 'GSHORT' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('INVALID_DEPOSIT_METADATA');
  });
});

describe('validateWithdrawalRequest', () => {
  it('accepts a well-formed withdrawal', () => {
    const r = validateWithdrawalRequest(goodWithdrawal);
    expect(r.ok).toBe(true);
  });

  it('rejects a withdrawal with empty destination', () => {
    const r = validateWithdrawalRequest({ ...goodWithdrawal, dest: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('INVALID_WITHDRAWAL_METADATA');
  });

  it('rejects a withdrawal with an invalid destination and non-numeric amount', () => {
    const r = validateWithdrawalRequest(invalidWithdrawalRequest);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('INVALID_WITHDRAWAL_METADATA');
  });
});

describe('validateAnchorAssetConfig', () => {
  it('accepts a valid asset config', () => {
    expect(validateAnchorAssetConfig(goodAsset).ok).toBe(true);
  });

  it('rejects an asset config with a bad issuer', () => {
    const r = validateAnchorAssetConfig({ ...goodAsset, issuer: 'GTOO' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('INVALID_ASSET_CONFIG');
  });

  it('rejects the shared invalid asset config fixture (short issuer)', () => {
    const r = validateAnchorAssetConfig(invalidAnchorAssetConfig);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('INVALID_ASSET_CONFIG');
  });
});

describe('validateCallbackUrl', () => {
  it('accepts an https url', () => {
    expect(validateCallbackUrl('https://anchor.example.com/cb').ok).toBe(true);
  });

  it('accepts a localhost url (test allowlist)', () => {
    expect(validateCallbackUrl('http://localhost:3000/cb').ok).toBe(true);
  });

  it('rejects a plaintext non-localhost url', () => {
    const r = validateCallbackUrl(invalidCallbackUrl);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.code).toBe('INVALID_CALLBACK_URL');
  });
});

describe('validateAmount', () => {
  it('accepts a valid Stellar amount', () => {
    expect(validateAmount('12.5').ok).toBe(true);
  });

  it('rejects a non-positive amount', () => {
    expect(validateAmount('0').ok).toBe(false);
  });

  it('rejects too many decimals', () => {
    expect(validateAmount('1.0000000001').ok).toBe(false);
  });
});

describe('firstErrorMessage', () => {
  it('returns undefined on success', () => {
    expect(firstErrorMessage(validateAmount('1'))).toBeUndefined();
  });
  it('returns the first user-safe message on failure', () => {
    const msg = firstErrorMessage(validateCallbackUrl('http://example.com'));
    expect(typeof msg).toBe('string');
    expect(msg!.length).toBeGreaterThan(0);
  });
});
