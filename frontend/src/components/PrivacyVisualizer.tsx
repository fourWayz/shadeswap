'use client';

import { useEffect, useState } from 'react';
import type { Direction, Reserves } from '@/src/utils/aleo';
import { formatAmount } from '@/src/utils/aleo';
import { TOKEN0_SYMBOL, TOKEN1_SYMBOL } from '@/src/utils/tokens';

interface Props {
  amountIn: bigint;
  amountOut: bigint;
  direction: Direction;
  reserves: Reserves | null;
}

function RedactedRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-1.5 px-3 rounded-lg mb-1.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--shade-border)',
      }}
    >
      <span
        style={{
          color: 'var(--shade-muted)',
          fontFamily: 'var(--font-space-mono)',
          fontSize: '0.62rem',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-space-mono)',
          fontSize: '0.68rem',
          color: active ? 'var(--shade-border2)' : 'var(--shade-border2)',
          letterSpacing: active ? '0.04em' : '0',
          opacity: active ? 1 : 0.4,
        }}
      >
        {active ? value : '——'}
      </span>
    </div>
  );
}

function PublicRow({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between py-1.5 px-3 rounded-lg mb-1.5"
      style={{
        background: green ? 'rgba(61,220,132,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${green ? 'rgba(61,220,132,0.18)' : 'var(--shade-border)'}`,
      }}
    >
      <span
        style={{
          color: 'var(--shade-muted)',
          fontFamily: 'var(--font-space-mono)',
          fontSize: '0.62rem',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-space-mono)',
          fontSize: '0.68rem',
          color: green ? 'var(--shade-green)' : 'var(--shade-sub)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function PrivacyVisualizer({ amountIn, amountOut, direction, reserves }: Props) {
  const [proving, setProving] = useState(false);

  const hasAmount = amountIn > 0n && amountOut > 0n;
  const fromToken = direction === '0for1' ? TOKEN0_SYMBOL : TOKEN1_SYMBOL;
  const toToken   = direction === '0for1' ? TOKEN1_SYMBOL : TOKEN0_SYMBOL;

  // Simulate brief "proving" state whenever the user changes the amount
  useEffect(() => {
    if (!hasAmount) { setProving(false); return; }
    setProving(true);
    const t = setTimeout(() => setProving(false), 900);
    return () => clearTimeout(t);
  }, [amountIn, direction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute expected reserve state after the swap
  const r0 = reserves?.reserve0 ?? 0n;
  const r1 = reserves?.reserve1 ?? 0n;

  let r0After = r0;
  let r1After = r1;
  if (hasAmount) {
    if (direction === '0for1') {
      r0After = r0 + amountIn;
      r1After = r1 - amountOut;
    } else {
      r0After = r0 - amountOut;
      r1After = r1 + amountIn;
    }
  }

  const feeAmount = hasAmount ? (amountIn * 3n) / 1000n : 0n;
  const kSatisfied = !hasAmount || r0After * r1After >= r0 * r1;

  const proofLabel = proving ? '⟳ generating proof…' : hasAmount ? '✓ proof ready' : 'idle';
  const proofColor = proving ? 'var(--shade-amber)' : hasAmount ? 'var(--shade-green)' : 'var(--shade-muted)';
  const proofBg = proving
    ? 'rgba(245,166,35,0.08)'
    : hasAmount
    ? 'rgba(61,220,132,0.08)'
    : 'transparent';

  return (
    <div
      className="w-full max-w-[480px] rounded-2xl p-5"
      style={{
        background: 'var(--shade-surface)',
        border: '1px solid var(--shade-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: 'var(--shade-amber)' }}>◈</span>
        <span
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'var(--shade-text)',
          }}
        >
          What the chain sees
        </span>
        <span
          className="ml-auto px-2 py-0.5 rounded-md text-xs transition-all"
          style={{
            fontFamily: 'var(--font-space-mono)',
            fontSize: '0.6rem',
            color: proofColor,
            background: proofBg,
            animation: proving ? 'pulse-amber 0.9s ease-in-out infinite' : 'none',
          }}
        >
          {proofLabel}
        </span>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-3">

        {/* Left — private */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span style={{ fontSize: '0.75rem' }}>🔒</span>
            <span
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '0.58rem',
                color: 'var(--shade-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Private · ZK proof
            </span>
          </div>
          <RedactedRow label="your address"    value="0xF3a1…9c2b"           active={hasAmount} />
          <RedactedRow label={`${fromToken} in`}    value={`████ ${fromToken}`}  active={hasAmount} />
          <RedactedRow label={`${toToken} out`}     value={`████ ${toToken}`}    active={hasAmount} />
          <RedactedRow label="your balance"    value="████████"               active={hasAmount} />
          <div
            className="mt-2.5 px-2 py-1.5 rounded text-center"
            style={{
              background: 'rgba(255,95,87,0.05)',
              border: '1px solid rgba(255,95,87,0.12)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '0.58rem',
                color: 'var(--shade-red)',
              }}
            >
              never stored on-chain
            </span>
          </div>
        </div>

        {/* Right — public */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span style={{ fontSize: '0.75rem' }}>🌐</span>
            <span
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '0.58rem',
                color: 'var(--shade-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Public · on-chain
            </span>
          </div>
          <PublicRow
            label={`${TOKEN0_SYMBOL} reserve`}
            value={
              hasAmount
                ? `${formatAmount(r0)} → ${formatAmount(r0After)}`
                : formatAmount(r0)
            }
          />
          <PublicRow
            label={`${TOKEN1_SYMBOL} reserve`}
            value={
              hasAmount
                ? `${formatAmount(r1)} → ${formatAmount(r1After)}`
                : formatAmount(r1)
            }
          />
          <PublicRow
            label="0.3% fee"
            value={hasAmount ? `${formatAmount(feeAmount)} ${fromToken}` : '——'}
          />
          <PublicRow
            label="k-invariant"
            value={hasAmount ? (kSatisfied ? '✓ holds' : '✗ violated') : '——'}
            green={hasAmount && kSatisfied}
          />
          <div
            className="mt-2.5 px-2 py-1.5 rounded text-center"
            style={{
              background: 'rgba(61,220,132,0.05)',
              border: '1px solid rgba(61,220,132,0.12)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-space-mono)',
                fontSize: '0.58rem',
                color: 'var(--shade-green)',
              }}
            >
              publicly verifiable
            </span>
          </div>
        </div>
      </div>

      {/* Footer explanation */}
      <div
        className="mt-4 pt-3 flex items-start gap-2"
        style={{ borderTop: '1px solid var(--shade-border)' }}
      >
        <span style={{ color: 'var(--shade-amber)', fontSize: '0.7rem', marginTop: '1px' }}>→</span>
        <p
          style={{
            fontFamily: 'var(--font-space-mono)',
            fontSize: '0.6rem',
            color: 'var(--shade-muted)',
            lineHeight: 1.7,
          }}
        >
          Your wallet proves the trade satisfies the AMM rules locally — without revealing your
          address, balance, or amounts. Only pool reserve totals update on-chain.
          {hasAmount && (
            <span style={{ color: 'var(--shade-sub)' }}>
              {' '}Enter an amount above to see what changes.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
