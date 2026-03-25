'use client';

import { useState } from 'react';
import { TxStatusCard } from './TxStatus';
import { useTransaction, TxStatus } from '@/src/hooks/useTransaction';
import {
  parseAmount,
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

  const [sharesStr, setSharesStr] = useState('');
  const [lpRecord,  setLpRecord]  = useState('');

  const shares = parseAmount(sharesStr);

  const { amount0, amount1 } = reserves
    ? computeRemoveAmounts(shares, reserves.reserve0, reserves.reserve1, reserves.lpTotalSupply)
    : { amount0: 0n, amount1: 0n };

  const min0 = applySlippage(amount0, 0.5);
  const min1 = applySlippage(amount1, 0.5);

  const handleRemove = async () => {
    if (!connected || shares === 0n) return;
    const tx = buildRemoveLiquidityTransaction({
      lpRecord: lpRecord || `{owner: aleo1placeholder, shares: ${shares}u128}`,
      shares,
      minAmount0: min0,
      minAmount1: min1,
    });
    execute(tx);
  };

  const buttonDisabled =
    !connected ||
    shares === 0n ||
    status === TxStatus.SIGNING ||
    status === TxStatus.PENDING;

  return (
    <>
      <div className="space-y-4">
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--shade-surface2)' }}
        >
          <label
            className="text-xs uppercase tracking-widest block mb-2"
            style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
          >
            LP Shares to Remove
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.000000"
            value={sharesStr}
            onChange={(e) => {
              const v = e.target.value;
              if (/^(\d+\.?\d*|\.?\d+)?$/.test(v)) setSharesStr(v);
            }}
            className="w-full bg-transparent outline-none text-3xl font-bold"
            style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--shade-text)' }}
          />
        </div>

        <input
          type="text"
          placeholder="LP token record (paste from wallet)"
          value={lpRecord}
          onChange={(e) => setLpRecord(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-xs border bg-transparent outline-none"
          style={{
            fontFamily:  'var(--font-space-mono)',
            color:       'var(--shade-sub)',
            borderColor: 'var(--shade-border)',
          }}
        />

        {/* Estimated output */}
        {shares > 0n && (
          <div
            className="px-4 py-3 rounded-xl border space-y-2"
            style={{ background: 'var(--shade-surface2)', borderColor: 'var(--shade-border)' }}
          >
            <InfoRow label="You Will Receive"       value="" />
            <InfoRow label={`  ${TOKEN0_SYMBOL}`}               value={formatAmount(amount0)} />
            <InfoRow label={`  ${TOKEN1_SYMBOL}`}               value={formatAmount(amount1)} />
            <div style={{ borderTop: '1px solid var(--shade-border)', paddingTop: '8px', marginTop: '8px' }}>
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
          {connected ? 'Remove Liquidity' : 'Connect Wallet'}
        </button>
      </div>

      <TxStatusCard status={status} txId={txId} error={error} onClose={reset} />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}>{label}</span>
      {value && <span style={{ color: 'var(--shade-text)', fontFamily: 'var(--font-space-mono)' }}>{value}</span>}
    </div>
  );
}
