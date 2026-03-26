'use client';

import { useState } from 'react';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (tx: any) => Promise<void>;
  reset: () => void;
}

export function useTransaction(): UseTransactionReturn {
  const { executeTransaction, transactionStatus } = useWallet();

  const [status, setStatus] = useState<TxStatus>(TxStatus.IDLE);
  const [txId,   setTxId]   = useState<string | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const execute = async (tx: any) => {
    setStatus(TxStatus.SIGNING);
    setTxId(null);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (executeTransaction as any)({
        program:     tx.program,
        function:    tx.function,
        inputs:      tx.inputs,
        fee:         tx.fee,
        privateFee:  tx.privateFee,
      });

      const id: string = typeof result === 'string' ? result : (result?.transactionId ?? '');
      setTxId(id || null);
      setStatus(TxStatus.PENDING);

      if (id) {
        const confirmedId = await pollConfirmation(id, transactionStatus);
        if (confirmedId && confirmedId !== id) setTxId(confirmedId);
      }

      setStatus(TxStatus.CONFIRMED);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transaction failed';
      setError(msg);
      setStatus(TxStatus.FAILED);
    }
  };

  const reset = () => {
    setStatus(TxStatus.IDLE);
    setTxId(null);
    setError(null);
  };

  return { status, txId, error, execute, reset };
}

// Poll via wallet's transactionStatus
async function pollConfirmation(
  txId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionStatus: any
): Promise<string | null> {
  if (!txId || !transactionStatus) return null;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await transactionStatus(txId);
        if (!result) return;

        if (result.status === 'Accepted') {
          clearInterval(interval);
          resolve(result.transactionId ?? null);
        } else if (result.status !== 'pending') {
          clearInterval(interval);
          reject(new Error(`Transaction ${result.status}`));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 2_000);

    // Safety timeout 
    setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, 180_000);
  });
}
