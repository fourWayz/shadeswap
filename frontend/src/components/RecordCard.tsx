'use client';

import { type useRecord } from '@/src/hooks/useRecord';
import { formatAmount } from '@/src/utils/aleo';

interface RecordCardProps {
  label: string;
  tokenSymbol: string;
  hook: ReturnType<typeof useRecord>;
}

export function RecordCard({ label, tokenSymbol, hook }: RecordCardProps) {
  const { record, loading, error, fetch, clear } = hook;

  return (
    <div
      className="rounded-xl px-4 py-3 border flex items-center justify-between gap-3"
      style={{
        background:  record
          ? 'rgba(61,220,132,0.06)'
          : 'var(--shade-surface2)',
        borderColor: record
          ? 'rgba(61,220,132,0.3)'
          : error
          ? 'rgba(255,95,87,0.3)'
          : 'var(--shade-border)',
        transition: 'all 0.2s',
      }}
    >
      {/* Left: status info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium uppercase tracking-widest mb-0.5"
          style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
        >
          {label}
        </p>

        {loading && (
          <p className="text-xs flex items-center gap-1.5"
             style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}>
            <span className="animate-spin inline-block text-base" style={{ color: 'var(--shade-amber)' }}>◌</span>
            Scanning wallet…
          </p>
        )}

        {!loading && record && (
          <p className="text-xs flex items-center gap-1.5"
             style={{ color: 'var(--shade-green)', fontFamily: 'var(--font-space-mono)' }}>
            <span>✓</span>
            <span className="font-bold">{formatAmount(record.balance)} {tokenSymbol}</span>
            {record.count > 1
              ? <span style={{ color: 'var(--shade-amber)' }}>· {record.count} records (re-fetch after tx)</span>
              : <span style={{ color: 'var(--shade-muted)' }}>· record ready</span>
            }
          </p>
        )}

        {!loading && !record && !error && (
          <p className="text-xs"
             style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}>
            Not fetched yet
          </p>
        )}

        {!loading && error && (
          <p className="text-xs truncate"
             style={{ color: 'var(--shade-red)', fontFamily: 'var(--font-space-mono)' }}>
            {error}
          </p>
        )}
      </div>

      {/* Right: action button */}
      <div className="flex-shrink-0">
        {record ? (
          <button
            onClick={clear}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              fontFamily:  'var(--font-space-mono)',
              color:       'var(--shade-muted)',
              background:  'var(--shade-surface)',
              border:      '1px solid var(--shade-border)',
            }}
          >
            Clear
          </button>
        ) : (
          <button
            onClick={fetch}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
            style={{
              fontFamily:  'var(--font-space-mono)',
              background:  loading ? 'var(--shade-surface)' : 'rgba(245,166,35,0.15)',
              color:       loading ? 'var(--shade-muted)' : 'var(--shade-amber)',
              border:      `1px solid ${loading ? 'var(--shade-border)' : 'var(--shade-amber)'}`,
              cursor:      loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '…' : 'Fetch from wallet'}
          </button>
        )}
      </div>
    </div>
  );
}
