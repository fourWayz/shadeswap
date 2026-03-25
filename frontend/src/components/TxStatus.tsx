'use client';

import { useEffect } from 'react';
import { TxStatus } from '@/src/hooks/useTransaction';

interface TxStatusProps {
  status: TxStatus;
  txId: string | null;
  error: string | null;
  onClose: () => void;
}

const EXPLORER_BASE = 'https://testnet.explorer.provable.com/transaction';

function truncate(s: string, n = 12) {
  if (s.length <= n * 2 + 3) return s;
  return `${s.slice(0, n)}...${s.slice(-n)}`;
}

export function TxStatusCard({ status, txId, error, onClose }: TxStatusProps) {
  // Auto-dismiss on CONFIRMED
  useEffect(() => {
    if (status === TxStatus.CONFIRMED) {
      const id = setTimeout(onClose, 5_000);
      return () => clearTimeout(id);
    }
  }, [status, onClose]);

  if (status === TxStatus.IDLE) return null;

  const ExplorerLink = txId ? (
    <a
      href={`${EXPLORER_BASE}/${txId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs underline mt-1 block"
      style={{ color: 'var(--shade-amber)', fontFamily: 'var(--font-space-mono)' }}
    >
      {truncate(txId)} ↗
    </a>
  ) : null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-2xl border p-5 w-80 animate-slide-up"
      style={{
        background:  'var(--shade-surface)',
        borderColor: 'var(--shade-border2)',
        boxShadow:   '0 8px 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-xs opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--shade-sub)' }}
      >
        ✕
      </button>

      {status === TxStatus.SIGNING && (
        <div className="flex items-center gap-3">
          <Spinner />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--shade-text)', fontFamily: 'var(--font-syne)' }}>
              Waiting for wallet...
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}>
              Approve in your wallet
            </p>
          </div>
        </div>
      )}

      {status === TxStatus.PENDING && (
        <div className="flex items-start gap-3">
          <Spinner />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--shade-text)', fontFamily: 'var(--font-syne)' }}>
              Confirming on Aleo...
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}>
              ZK proof being verified
            </p>
            {ExplorerLink}
          </div>
        </div>
      )}

      {status === TxStatus.CONFIRMED && (
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--shade-green)', fontFamily: 'var(--font-syne)' }}>
              Swap confirmed!
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}>
              Your trade settled privately
            </p>
            {ExplorerLink}
          </div>
        </div>
      )}

      {status === TxStatus.FAILED && (
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5" style={{ color: 'var(--shade-red)' }}>✗</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--shade-red)', fontFamily: 'var(--font-syne)' }}>
              Transaction failed
            </p>
            {error && (
              <p className="text-xs mt-1 break-words" style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}>
                {error}
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: 'var(--shade-red)',
                color: '#fff',
                fontFamily: 'var(--font-space-mono)',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-t-transparent flex-shrink-0 mt-0.5 animate-spin"
      style={{ borderColor: 'var(--shade-amber)', borderTopColor: 'transparent' }}
    />
  );
}
