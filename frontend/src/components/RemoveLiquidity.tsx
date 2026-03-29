'use client';

import { useState, useEffect } from 'react';
import { TxStatusCard } from './TxStatus';
import { RecordCard }   from './RecordCard';
import { useTransaction, TxStatus } from '@/src/hooks/useTransaction';
import { useRecord } from '@/src/hooks/useRecord';
import {
  formatAmount,
  applySlippage,
  computeRemoveAmounts,
  buildRemoveLiquidityTransaction,
  type Reserves,
} from '@/src/utils/aleo';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TOKEN0_SYMBOL, TOKEN1_SYMBOL } from '@/src/utils/tokens';

interface RemoveLiquidityProps {
  reserves: Reserves | null;
}

export function RemoveLiquidity({ reserves }: RemoveLiquidityProps) {
  const { connected } = useWallet();
  const { status, txId, error, execute, reset } = useTransaction();

  const lp = useRecord('LPToken');

  // Once the record is fetched, default to removing all shares
  const [sharesStr, setSharesStr] = useState('');

  useEffect(() => {
    if (lp.record && !sharesStr) {
      setSharesStr(formatAmount(lp.record.balance));
    }
  }, [lp.record]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxShares = lp.record?.balance ?? 0n;

  // Parse shares: the user types in human-readable (6 decimals)
  const sharesRaw = (() => {
    if (!sharesStr) return 0n;
    const [w, f = ''] = sharesStr.split('.');
    const whole = BigInt(w || '0');
    const frac  = BigInt(f.slice(0, 6).padEnd(6, '0'));
    return whole * 1_000_000n + frac;
  })();

  const exceedsMax = maxShares > 0n && sharesRaw > maxShares;

  const { amount0, amount1 } = reserves
    ? computeRemoveAmounts(sharesRaw, reserves.reserve0, reserves.reserve1, reserves.lpTotalSupply)
    : { amount0: 0n, amount1: 0n };

  const min0 = applySlippage(amount0, 0.5);
  const min1 = applySlippage(amount1, 0.5);

  const handleRemove = async () => {
    if (!connected || sharesRaw === 0n || !lp.record) return;
    const tx = buildRemoveLiquidityTransaction({
      lpRecord:    lp.record.decrypted,
      shares:      sharesRaw,
      amount0,
      amount1,
      minAmount0:  min0,
      minAmount1:  min1,
    });
    execute(tx);
  };

  const buttonDisabled =
    !connected ||
    !lp.record ||
    sharesRaw === 0n ||
    exceedsMax ||
    status === TxStatus.SIGNING ||
    status === TxStatus.PENDING;

  return (
    <>
      <div className="space-y-4">
        {/* LP record fetch */}
        <RecordCard label="LP Token Record" hook={lp} tokenSymbol="LP" tokenType="LPToken" />

        {/* Shares input — auto-filled from record */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--shade-surface2)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
            >
              LP Shares to Remove
            </label>
            {lp.record && (
              <button
                onClick={() => setSharesStr(formatAmount(lp.record!.balance))}
                className="text-xs font-bold"
                style={{ color: 'var(--shade-amber)', fontFamily: 'var(--font-space-mono)' }}
              >
                MAX
              </button>
            )}
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.000000"
            value={sharesStr}
            disabled={!lp.record}
            onChange={(e) => {
              const v = e.target.value;
              if (/^(\d+\.?\d*|\.?\d+)?$/.test(v)) setSharesStr(v);
            }}
            className="w-full bg-transparent outline-none text-3xl font-bold"
            style={{
              fontFamily: 'var(--font-space-mono)',
              color: lp.record ? 'var(--shade-text)' : 'var(--shade-muted)',
              cursor: lp.record ? 'text' : 'not-allowed',
            }}
          />
          {lp.record && (
            <p className="text-xs mt-1" style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}>
              Available: {formatAmount(lp.record.balance)} LP
            </p>
          )}
        </div>

        {exceedsMax && (
          <p className="text-xs" style={{ color: 'var(--shade-red)', fontFamily: 'var(--font-space-mono)' }}>
            Exceeds your LP balance of {formatAmount(maxShares)}
          </p>
        )}

        {/* Estimated output */}
        {sharesRaw > 0n && !exceedsMax && (
          <div
            className="px-4 py-3 rounded-xl border space-y-2"
            style={{ background: 'var(--shade-surface2)', borderColor: 'var(--shade-border)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1"
               style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}>
              You Will Receive
            </p>
            <InfoRow label={TOKEN0_SYMBOL} value={formatAmount(amount0)} />
            <InfoRow label={TOKEN1_SYMBOL} value={formatAmount(amount1)} />
            <div style={{ borderTop: '1px solid var(--shade-border)', paddingTop: '8px', marginTop: '4px' }}>
              <InfoRow label={`Min ${TOKEN0_SYMBOL} (0.5% slippage)`} value={formatAmount(min0)} />
              <InfoRow label={`Min ${TOKEN1_SYMBOL} (0.5% slippage)`} value={formatAmount(min1)} />
            </div>
          </div>
        )}

        <button
          onClick={handleRemove}
          disabled={buttonDisabled}
          className="w-full py-4 rounded-xl font-bold text-base transition-all"
          style={{
            fontFamily: 'var(--font-syne)',
            background: buttonDisabled
              ? 'var(--shade-surface2)'
              : 'linear-gradient(135deg, var(--shade-amber) 0%, var(--shade-amber2) 100%)',
            color:  buttonDisabled ? 'var(--shade-muted)' : '#000',
            cursor: buttonDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {!connected ? 'Connect Wallet' : !lp.record ? 'Fetch LP Record First' : 'Remove Liquidity'}
        </button>
      </div>

      <TxStatusCard status={status} txId={txId} error={error} onClose={reset} successMessage="Liquidity removed!" successSubtext="Tokens returned to your wallet" />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}>{label}</span>
      <span style={{ color: 'var(--shade-text)',  fontFamily: 'var(--font-space-mono)' }}>{value}</span>
    </div>
  );
}
