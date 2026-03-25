'use client';

import { useState, useEffect } from 'react';
import { TokenInput }   from './TokenInput';
import { TxStatusCard } from './TxStatus';
import { RecordCard }   from './RecordCard';
import { useTransaction, TxStatus } from '@/src/hooks/useTransaction';
import { useRecord } from '@/src/hooks/useRecord';
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

  const t0 = useRecord('Token0');
  const t1 = useRecord('Token1');

  const [amount0Str, setAmount0Str] = useState('');
  const [amount1Str, setAmount1Str] = useState('');

  const amount0 = parseAmount(amount0Str);
  const amount1 = parseAmount(amount1Str);

  const isFirstDeposit = !reserves || (reserves.reserve0 === 0n && reserves.reserve1 === 0n);

  // Auto-fill amount1 from pool ratio (subsequent deposits)
  useEffect(() => {
    if (isFirstDeposit || !reserves || reserves.reserve0 === 0n) return;
    if (amount0 === 0n) { setAmount1Str(''); return; }
    const ratio = Number(reserves.reserve1) / Number(reserves.reserve0);
    const out   = BigInt(Math.floor(Number(amount0) * ratio));
    setAmount1Str(formatAmount(out));
  }, [amount0Str]); // eslint-disable-line react-hooks/exhaustive-deps

  const estimatedShares = reserves
    ? computeShares(amount0, amount1, reserves.reserve0, reserves.reserve1, reserves.lpTotalSupply)
    : 0n;

  const poolSharePct =
    reserves && reserves.lpTotalSupply > 0n && estimatedShares > 0n
      ? ((Number(estimatedShares) / (Number(reserves.lpTotalSupply) + Number(estimatedShares))) * 100).toFixed(2)
      : null;

  const exceeds0 = t0.record && amount0 > t0.record.balance;
  const exceeds1 = t1.record && amount1 > t1.record.balance;

  const handleAdd = async () => {
    if (!connected || amount0 === 0n || amount1 === 0n || !t0.record || !t1.record) return;
    const minShares = applySlippage(estimatedShares, 0.5);
    const tx = buildAddLiquidityTransaction({
      t0Record: t0.record.decrypted,
      t1Record: t1.record.decrypted,
      amount0,
      amount1,
      minShares,
    });
    execute(tx);
  };

  const buttonDisabled =
    !connected ||
    !t0.record ||
    !t1.record ||
    amount0 === 0n ||
    amount1 === 0n ||
    !!exceeds0 ||
    !!exceeds1 ||
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

        {/* Token0 */}
        <TokenInput
          label={`${TOKEN0_SYMBOL} Amount`}
          tokenName={TOKEN0_SYMBOL}
          value={amount0Str}
          onChange={setAmount0Str}
          balance={t0.record ? formatAmount(t0.record.balance) : undefined}
        />
        {exceeds0 && (
          <p className="text-xs" style={{ color: 'var(--shade-red)', fontFamily: 'var(--font-space-mono)' }}>
            Exceeds {TOKEN0_SYMBOL} balance ({formatAmount(t0.record!.balance)})
          </p>
        )}
        <RecordCard label={`${TOKEN0_SYMBOL} Record`} hook={t0} tokenSymbol={TOKEN0_SYMBOL} />

        {/* Token1 */}
        <TokenInput
          label={`${TOKEN1_SYMBOL} Amount`}
          tokenName={TOKEN1_SYMBOL}
          value={amount1Str}
          onChange={isFirstDeposit ? setAmount1Str : undefined}
          readOnly={!isFirstDeposit}
          balance={t1.record ? formatAmount(t1.record.balance) : undefined}
        />
        {exceeds1 && (
          <p className="text-xs" style={{ color: 'var(--shade-red)', fontFamily: 'var(--font-space-mono)' }}>
            Exceeds {TOKEN1_SYMBOL} balance ({formatAmount(t1.record!.balance)})
          </p>
        )}
        <RecordCard label={`${TOKEN1_SYMBOL} Record`} hook={t1} tokenSymbol={TOKEN1_SYMBOL} />

        {/* LP share estimate */}
        {estimatedShares > 0n && (
          <div
            className="px-4 py-3 rounded-xl border space-y-1"
            style={{ background: 'var(--shade-surface2)', borderColor: 'var(--shade-border)' }}
          >
            <InfoRow label="Estimated LP Shares" value={formatAmount(estimatedShares)} />
            {poolSharePct && <InfoRow label="Your pool share" value={`${poolSharePct}%`} />}
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
          {!connected ? 'Connect Wallet' : !t0.record || !t1.record ? 'Fetch Both Token Records First' : 'Add Liquidity'}
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
      <span style={{ color: 'var(--shade-text)',  fontFamily: 'var(--font-space-mono)' }}>{value}</span>
    </div>
  );
}
