'use client';

import { useState, useEffect } from 'react';
import { TokenInput }   from './TokenInput';
import { TxStatusCard } from './TxStatus';
import { useTransaction, TxStatus } from '@/src/hooks/useTransaction';
import {
  parseAmount,
  formatAmount,
  applySlippage,
  computeShares,
  buildAddLiquidityTransaction,
  type Reserves,
} from '@/src/utils/aleo';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TOKEN0_SYMBOL, TOKEN1_SYMBOL } from '@/src/utils/tokens';

interface AddLiquidityProps {
  reserves: Reserves | null;
}

export function AddLiquidity({ reserves }: AddLiquidityProps) {
  const { connected } = useWallet();
  const { status, txId, error, execute, reset } = useTransaction();

  const [amount0Str,  setAmount0Str]  = useState('');
  const [amount1Str,  setAmount1Str]  = useState('');
  const [t0Record,    setT0Record]    = useState('');
  const [t1Record,    setT1Record]    = useState('');

  const amount0 = parseAmount(amount0Str);
  const amount1 = parseAmount(amount1Str);

  const isFirstDeposit = !reserves || (reserves.reserve0 === 0n && reserves.reserve1 === 0n);

  // Auto-fill amount1 based on pool ratio
  useEffect(() => {
    if (isFirstDeposit || !reserves || reserves.reserve0 === 0n) return;
    if (amount0 === 0n) { setAmount1Str(''); return; }
    const ratio  = Number(reserves.reserve1) / Number(reserves.reserve0);
    const out    = BigInt(Math.floor(Number(amount0) * ratio));
    setAmount1Str(formatAmount(out));
  }, [amount0Str]); // eslint-disable-line react-hooks/exhaustive-deps

  const estimatedShares =
    reserves
      ? computeShares(amount0, amount1, reserves.reserve0, reserves.reserve1, reserves.lpTotalSupply)
      : 0n;

  const poolSharePct =
    reserves && reserves.lpTotalSupply > 0n && estimatedShares > 0n
      ? ((Number(estimatedShares) / (Number(reserves.lpTotalSupply) + Number(estimatedShares))) * 100).toFixed(2)
      : null;

  const handleAdd = async () => {
    if (!connected || amount0 === 0n || amount1 === 0n) return;
    const minShares = applySlippage(estimatedShares, 0.5);
    const tx = buildAddLiquidityTransaction({
      t0Record: t0Record || `{owner: aleo1placeholder, amount: ${amount0}u128}`,
      t1Record: t1Record || `{owner: aleo1placeholder, amount: ${amount1}u128}`,
      amount0,
      amount1,
      minShares,
    });
    execute(tx);
  };

  const buttonDisabled =
    !connected ||
    amount0 === 0n ||
    amount1 === 0n ||
    status === TxStatus.SIGNING ||
    status === TxStatus.PENDING;

  return (
    <>
      <div className="space-y-4">
        {isFirstDeposit && (
          <div
            className="px-4 py-3 rounded-xl text-xs border"
            style={{
              background:  'rgba(245,166,35,0.08)',
              borderColor: 'var(--shade-amber)',
              color:       'var(--shade-amber)',
              fontFamily:  'var(--font-space-mono)',
            }}
          >
            ◈ You are the first liquidity provider. The ratio you set becomes the initial price.
          </div>
        )}

        <TokenInput
          label={`${TOKEN0_SYMBOL} Amount`}
          tokenName={TOKEN0_SYMBOL}
          value={amount0Str}
          onChange={setAmount0Str}
        />
        <TokenInput
          label={`${TOKEN1_SYMBOL} Amount`}
          tokenName={TOKEN1_SYMBOL}
          value={amount1Str}
          onChange={isFirstDeposit ? setAmount1Str : undefined}
          readOnly={!isFirstDeposit}
        />

        {/* Record inputs */}
        <RecordInput
          placeholder={`${TOKEN0_SYMBOL} record (paste from wallet)`}
          value={t0Record}
          onChange={setT0Record}
        />
        <RecordInput
          placeholder={`${TOKEN1_SYMBOL} record (paste from wallet)`}
          value={t1Record}
          onChange={setT1Record}
        />

        {/* LP share estimate */}
        {estimatedShares > 0n && (
          <div
            className="px-4 py-3 rounded-xl border space-y-1"
            style={{ background: 'var(--shade-surface2)', borderColor: 'var(--shade-border)' }}
          >
            <InfoRow label="Estimated LP Shares" value={formatAmount(estimatedShares)} />
            {poolSharePct && (
              <InfoRow label="Your pool share" value={`${poolSharePct}%`} />
            )}
          </div>
        )}

        <button
          onClick={handleAdd}
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
          {connected ? 'Add Liquidity' : 'Connect Wallet'}
        </button>
      </div>

      <TxStatusCard status={status} txId={txId} error={error} onClose={reset} />
    </>
  );
}

function RecordInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg text-xs border bg-transparent outline-none"
      style={{
        fontFamily:  'var(--font-space-mono)',
        color:       'var(--shade-sub)',
        borderColor: 'var(--shade-border)',
      }}
    />
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
