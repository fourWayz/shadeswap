'use client';

import { formatAmount, type Reserves } from '@/src/utils/aleo';

interface PoolStatsProps {
  reserves: Reserves | null;
  loading: boolean;
  onRefresh: () => void;
  spinning?: boolean;
}

export function PoolStats({ reserves, loading, onRefresh, spinning }: PoolStatsProps) {
  const initialized = reserves && (reserves.reserve0 > 0n || reserves.reserve1 > 0n);

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: 'var(--shade-surface)', borderColor: 'var(--shade-border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-bold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--shade-sub)' }}
        >
          Pool Statistics
        </h3>
        <button
          onClick={onRefresh}
          className="text-sm transition-all"
          style={{ color: 'var(--shade-amber)' }}
          title="Refresh"
        >
          <span className={spinning ? 'animate-spin inline-block' : ''}>↻</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-5 rounded" />
          ))}
        </div>
      ) : !initialized ? (
        <div className="text-center py-6">
          <p
            className="text-sm mb-2"
            style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}
          >
            Pool not initialized
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
          >
            Add liquidity to initialize the pool and set the initial price.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <StatRow label="TOKEN0 Reserve"    value={formatAmount(reserves!.reserve0)} />
          <StatRow label="TOKEN1 Reserve"    value={formatAmount(reserves!.reserve1)} />
          <StatRow label="Total LP Supply"   value={formatAmount(reserves!.lpTotalSupply)} />
          <div
            className="pt-3 space-y-3"
            style={{ borderTop: '1px solid var(--shade-border)' }}
          >
            <StatRow
              label="TOKEN0 per TOKEN1"
              value={
                reserves!.reserve1 > 0n
                  ? `${(Number(reserves!.reserve0) / Number(reserves!.reserve1)).toFixed(6)}`
                  : '—'
              }
            />
            <StatRow
              label="TOKEN1 per TOKEN0"
              value={
                reserves!.reserve0 > 0n
                  ? `${(Number(reserves!.reserve1) / Number(reserves!.reserve0)).toFixed(6)}`
                  : '—'
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span
        className="text-xs"
        style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--shade-text)', fontFamily: 'var(--font-space-mono)' }}
      >
        {value}
      </span>
    </div>
  );
}
