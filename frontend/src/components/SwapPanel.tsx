'use client';

import { useState, useEffect } from 'react';
import { TokenInput }       from './TokenInput';
import { PriceInfo }        from './PriceInfo';
import { SlippageSettings } from './SlippageSettings';
import { TxStatusCard }     from './TxStatus';
import { RecordCard }       from './RecordCard';
import { useTransaction, TxStatus } from '@/src/hooks/useTransaction';
import { useRecord } from '@/src/hooks/useRecord';
import {
  parseAmount,
  formatAmount,
  applySlippage,
  getPriceImpact,
  buildSwapTransaction,
  type Direction,
  type Reserves,
} from '@/src/utils/aleo';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { TOKEN0_SYMBOL, TOKEN1_SYMBOL } from '@/src/utils/tokens';

interface SwapPanelProps {
  reserves: Reserves | null;
  getAmountOut: (amountIn: bigint, direction: Direction) => bigint;
}

const TOKEN_NAMES: Record<Direction, [string, string]> = {
  '0for1': [TOKEN0_SYMBOL, TOKEN1_SYMBOL],
  '1for0': [TOKEN1_SYMBOL, TOKEN0_SYMBOL],
};

export function SwapPanel({ reserves, getAmountOut }: SwapPanelProps) {
  const { connected } = useWallet();
  const { status, txId, error, execute, reset } = useTransaction();

  const [direction,    setDirection]   = useState<Direction>('0for1');
  const [amountInStr,  setAmountInStr] = useState('');
  const [amountOutStr, setAmountOutStr] = useState('');
  const [slippage,     setSlippage]    = useState(0.5);
  const [clickCount,   setClickCount]  = useState(0);

  // Fetch the correct record based on direction
  const token0Record = useRecord('Token0');
  const token1Record = useRecord('Token1');
  const activeRecord = direction === '0for1' ? token0Record : token1Record;
  const [fromToken, toToken] = TOKEN_NAMES[direction];

  const amountInBig  = parseAmount(amountInStr);
  const amountOutBig = parseAmount(amountOutStr);

  const maxBalance = activeRecord.record?.balance ?? 0n;

  const [reserveIn, reserveOut] = reserves
    ? direction === '0for1'
      ? [reserves.reserve0, reserves.reserve1]
      : [reserves.reserve1, reserves.reserve0]
    : [0n, 0n];

  const priceImpact =
    amountInBig > 0n && reserveIn > 0n
      ? getPriceImpact(amountInBig, reserveIn, reserveOut)
      : 0;

  const poolHasLiquidity = reserves && reserves.reserve0 > 0n && reserves.reserve1 > 0n;
  const exceedsBalance   = maxBalance > 0n && amountInBig > maxBalance;

  // Live compute output
  useEffect(() => {
    if (!amountInStr || amountInBig === 0n) { setAmountOutStr(''); return; }
    const out = getAmountOut(amountInBig, direction);
    setAmountOutStr(out > 0n ? formatAmount(out) : '0');
  }, [amountInStr, direction, getAmountOut, amountInBig]);

  const handleFlip = () => {
    setDirection((d) => (d === '0for1' ? '1for0' : '0for1'));
    setAmountInStr('');
    setAmountOutStr('');
    setClickCount(0);
    // Records for the other direction stay cached — no need to re-fetch
  };

  const handleSwap = async () => {
    if (!connected || !poolHasLiquidity || amountInBig === 0n || !activeRecord.record) return;

    const minOut = applySlippage(amountOutBig, slippage);
    const tx = buildSwapTransaction({
      tokenRecord: activeRecord.record.decrypted,
      amountIn: amountInBig,
      minOut,
      direction,
    });

    if (priceImpact > 15) {
      setClickCount((c) => {
        if (c === 0) return 1;
        execute(tx);
        return 0;
      });
    } else {
      execute(tx);
    }
  };

  const buttonLabel = () => {
    if (!connected)                          return 'Connect Wallet';
    if (!poolHasLiquidity)                   return 'Pool Not Initialized';
    if (!activeRecord.record)                return `Fetch ${fromToken} Record First`;
    if (amountInBig === 0n)                  return 'Enter an Amount';
    if (exceedsBalance)                      return 'Insufficient Balance';
    if (priceImpact > 15 && clickCount === 1) return 'Click Again to Confirm';
    if (priceImpact > 15)                    return 'Swap Anyway';
    return 'Swap';
  };

  const buttonDisabled =
    !connected ||
    !poolHasLiquidity ||
    !activeRecord.record ||
    amountInBig === 0n ||
    exceedsBalance ||
    status === TxStatus.SIGNING ||
    status === TxStatus.PENDING;

  return (
    <>
      <div
        className="w-full max-w-[480px] rounded-2xl p-6"
        style={{ background: 'var(--shade-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--shade-text)' }}
          >
            Swap
          </h2>
          <SlippageSettings value={slippage} onChange={setSlippage} />
        </div>

        {/* Token inputs */}
        <div className="space-y-2">
          <TokenInput
            label="You Pay"
            tokenName={fromToken}
            value={amountInStr}
            onChange={setAmountInStr}
            balance={activeRecord.record ? formatAmount(activeRecord.record.balance) : undefined}
          />

          {/* Flip button */}
          <div className="flex justify-center">
            <button
              onClick={handleFlip}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border transition-all hover:scale-110 active:scale-95"
              style={{
                background:  'var(--shade-surface2)',
                borderColor: 'var(--shade-border)',
                color:       'var(--shade-amber)',
              }}
            >
              ⇅
            </button>
          </div>

          <TokenInput
            label="You Receive"
            tokenName={toToken}
            value={amountOutStr}
            readOnly
          />
        </div>

        {/* Record fetch */}
        <div className="mt-3">
          <RecordCard
            label={`${fromToken} Record`}
            hook={activeRecord}
            tokenSymbol={fromToken}
          />
        </div>

        {/* Exceeds balance warning */}
        {exceedsBalance && (
          <div
            className="mt-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(255,95,87,0.1)', color: 'var(--shade-red)', fontFamily: 'var(--font-space-mono)' }}
          >
            Amount exceeds your {fromToken} balance of {formatAmount(maxBalance)}
          </div>
        )}

        {/* Price info */}
        {amountInBig > 0n && poolHasLiquidity && reserves && (
          <PriceInfo
            amountIn={amountInBig}
            amountOut={amountOutBig}
            direction={direction}
            slippagePct={slippage}
            reserve0={reserves.reserve0}
            reserve1={reserves.reserve1}
          />
        )}

        {/* Price impact warnings */}
        {priceImpact > 5 && priceImpact <= 15 && (
          <div
            className="mt-3 px-4 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(240,165,0,0.12)', color: '#f0a500', fontFamily: 'var(--font-space-mono)' }}
          >
            ⚠ High price impact: {priceImpact.toFixed(1)}%. Your trade may move the market significantly.
          </div>
        )}
        {priceImpact > 15 && (
          <div
            className="mt-3 px-4 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(255,95,87,0.12)', color: 'var(--shade-red)', fontFamily: 'var(--font-space-mono)' }}
          >
            ✗ Extreme price impact: {priceImpact.toFixed(1)}%. You will lose a significant portion of your funds.
          </div>
        )}

        {/* Swap button */}
        <button
          onClick={handleSwap}
          disabled={buttonDisabled}
          className="mt-4 w-full py-4 rounded-xl font-bold text-base transition-all active:scale-98"
          style={{
            fontFamily:  'var(--font-syne)',
            background:  buttonDisabled
              ? 'var(--shade-surface2)'
              : 'linear-gradient(135deg, var(--shade-amber) 0%, var(--shade-amber2) 100%)',
            color:    buttonDisabled ? 'var(--shade-muted)' : '#000',
            cursor:   buttonDisabled ? 'not-allowed' : 'pointer',
            boxShadow: !buttonDisabled ? '0 4px 20px rgba(245,166,35,0.3)' : 'none',
          }}
        >
          {buttonLabel()}
        </button>

        {/* Privacy badge */}
        <div className="mt-4 flex justify-center">
          <span
            className="text-xs px-3 py-1.5 rounded-full border"
            style={{
              fontFamily:  'var(--font-space-mono)',
              color:       'var(--shade-muted)',
              borderColor: 'var(--shade-border)',
              background:  'var(--shade-surface2)',
            }}
          >
            ◈ Zero-knowledge swap — your trade is never stored on-chain
          </span>
        </div>
      </div>

      <TxStatusCard status={status} txId={txId} error={error} onClose={reset} />
    </>
  );
}
