'use client';

import { useState, useEffect } from 'react';
import { type useRecord, type RecordName } from '@/src/hooks/useRecord';
import { formatAmount, buildMergeTransaction } from '@/src/utils/aleo';
import { useTransaction, TxStatus } from '@/src/hooks/useTransaction';

interface RecordCardProps {
  label: string;
  tokenSymbol: string;
  tokenType: RecordName;
  hook: ReturnType<typeof useRecord>;
}

export function RecordCard({ label, tokenSymbol, tokenType, hook }: RecordCardProps) {
  const { record, loading, error, fetch, clear } = hook;
  const { status, execute, reset } = useTransaction();

  const [merging, setMerging]         = useState(false);
  const [mergeConfirmed, setMergeConfirmed] = useState(false);

  // Watch for merge confirmation — only clear AFTER the tx lands
  useEffect(() => {
    if (!merging) return;
    if (status === TxStatus.CONFIRMED) {
      setMerging(false);
      setMergeConfirmed(true);
      reset();
      clear();
    } else if (status === TxStatus.FAILED) {
      setMerging(false);
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, merging]);

  const isMerging = merging || status === TxStatus.SIGNING || status === TxStatus.PENDING;
  const canMerge  = !!record && record.count >= 2 && (tokenType === 'Token0' || tokenType === 'Token1');

  const handleMerge = () => {
    if (!record || record.all.length < 2) return;
    const [r1, r2] = record.all;
    setMerging(true);
    setMergeConfirmed(false);
    execute(buildMergeTransaction(tokenType as 'Token0' | 'Token1', r1.decrypted, r2.decrypted));
  };

  const handleFetchAfterMerge = () => {
    setMergeConfirmed(false);
    fetch();
  };

  return (
    <div
      className="rounded-xl px-4 py-3 border"
      style={{
        background:  record ? 'rgba(61,220,132,0.06)' : 'var(--shade-surface2)',
        borderColor: record
          ? 'rgba(61,220,132,0.3)'
          : error
          ? 'rgba(255,95,87,0.3)'
          : 'var(--shade-border)',
        transition: 'all 0.2s',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: status info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-1"
            style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
          >
            {label}
          </p>

          {loading && (
            <p className="text-xs flex items-center gap-1.5"
               style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}>
              <span className="animate-spin inline-block" style={{ color: 'var(--shade-amber)' }}>◌</span>
              Scanning wallet…
            </p>
          )}

          {!loading && record && (
            <div className="space-y-0.5">
              {record.all.map((entry, i) => (
                <p key={i} className="text-xs flex items-center gap-1.5"
                   style={{ color: i === 0 ? 'var(--shade-green)' : 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}>
                  <span>{i === 0 ? '✓' : '·'}</span>
                  <span className={i === 0 ? 'font-bold' : ''}>{formatAmount(entry.balance)} {tokenSymbol}</span>
                  {i === 0 && record.count === 1 && <span style={{ color: 'var(--shade-muted)' }}>· ready</span>}
                  {i === 0 && record.count > 1 && <span style={{ color: 'var(--shade-amber)' }}>← will use</span>}
                </p>
              ))}
              {record.count > 1 && (
                <p className="text-xs mt-1" style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}>
                  Total: {formatAmount(record.balance)} {tokenSymbol}
                </p>
              )}
            </div>
          )}

          {!loading && !record && !error && (
            <p className="text-xs" style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}>
              Not fetched yet
            </p>
          )}

          {!loading && error && (
            <p className="text-xs truncate" style={{ color: 'var(--shade-red)', fontFamily: 'var(--font-space-mono)' }}>
              {error}
            </p>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {record ? (
            <>
              {canMerge && (
                <button
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                  style={{
                    fontFamily: 'var(--font-space-mono)',
                    background: isMerging ? 'var(--shade-surface)' : 'rgba(245,166,35,0.15)',
                    color:      isMerging ? 'var(--shade-muted)' : 'var(--shade-amber)',
                    border:     `1px solid ${isMerging ? 'var(--shade-border)' : 'var(--shade-amber)'}`,
                    cursor:     isMerging ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isMerging ? 'Merging…' : 'Merge'}
                </button>
              )}
              <button
                onClick={clear}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  fontFamily: 'var(--font-space-mono)',
                  color:      'var(--shade-muted)',
                  background: 'var(--shade-surface)',
                  border:     '1px solid var(--shade-border)',
                }}
              >
                Clear
              </button>
            </>
          ) : mergeConfirmed ? (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleFetchAfterMerge}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                style={{
                  fontFamily: 'var(--font-space-mono)',
                  background: loading ? 'var(--shade-surface)' : 'rgba(61,220,132,0.15)',
                  color:      loading ? 'var(--shade-muted)' : 'var(--shade-green)',
                  border:     `1px solid ${loading ? 'var(--shade-border)' : 'rgba(61,220,132,0.4)'}`,
                  cursor:     loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '…' : '✓ Fetch merged'}
              </button>
              <span style={{ fontSize: '0.55rem', color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)', textAlign: 'right' }}>
                if unchanged, wait ~30s
              </span>
            </div>
          ) : (
            <button
              onClick={fetch}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
              style={{
                fontFamily: 'var(--font-space-mono)',
                background: loading ? 'var(--shade-surface)' : 'rgba(245,166,35,0.15)',
                color:      loading ? 'var(--shade-muted)' : 'var(--shade-amber)',
                border:     `1px solid ${loading ? 'var(--shade-border)' : 'var(--shade-amber)'}`,
                cursor:     loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '…' : 'Fetch from wallet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
