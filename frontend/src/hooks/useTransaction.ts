'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import type { AleoTxOptions } from '@/src/utils/aleo';

export { type AleoTxOptions };

export enum TxStatus {
  IDLE      = 'IDLE',
  SIGNING   = 'SIGNING',
  PENDING   = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED    = 'FAILED',
}

export type TxStatusType = keyof typeof TxStatus;

interface UseTransactionReturn {
  status: TxStatus;
  txId: string | null;
  error: string | null;
  execute: (tx: AleoTxOptions) => Promise<void>;
  reset: () => void;
}

export function useTransaction(): UseTransactionReturn {
  const { executeTransaction } = useWallet();
  const [status, setStatus] = useState<TxStatus>(TxStatus.IDLE);
  const [txId,   setTxId]   = useState<string | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  const execute = useCallback(
    async (tx: AleoTxOptions) => {
      setStatus(TxStatus.SIGNING);
      setTxId(null);
      setError(null);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (executeTransaction as any)(tx);
        const id: string = result?.transactionId ?? result ?? '';
        setTxId(id || null);
        setStatus(TxStatus.PENDING);
        await pollConfirmation(id);
        setStatus(TxStatus.CONFIRMED);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transaction failed';
        setError(msg);
        setStatus(TxStatus.FAILED);
      }
    },
    [executeTransaction]
  );

  const reset = useCallback(() => {
    setStatus(TxStatus.IDLE);
    setTxId(null);
    setError(null);
  }, []);

  return { status, txId, error, execute, reset };
}

// Poll the Aleo API for tx confirmation (up to 60s)
async function pollConfirmation(txId: string): Promise<void> {
  if (!txId) return;
  const API = 'https://api.explorer.aleo.org/v2/testnet';
  const maxAttempts = 12;
  const delay = 5_000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delay));
    try {
      const res = await fetch(`${API}/transaction/${txId}`);
      if (res.ok) return; // tx found = confirmed
    } catch {
      // continue polling
    }
  }
  // After timeout, assume confirmed (testnet can be slow)
}
