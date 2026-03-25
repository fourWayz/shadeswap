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

  // Mirrors the working example exactly:
  //   const tx = await executeTransaction({ program, function, inputs, fee, privateFee })
  //   const txId = typeof tx === 'string' ? tx : tx?.transactionId
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
        await pollConfirmation(id, transactionStatus);
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

// Poll via wallet's transactionStatus — mirrors the working example
async function pollConfirmation(
  txId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactionStatus: any
): Promise<void> {
  if (!txId || !transactionStatus) return;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await transactionStatus(txId);
        if (!result) return;

        if (result.status === 'Accepted' && result.transactionId) {
          clearInterval(interval);
          resolve();
        } else if (result.status !== 'pending') {
          clearInterval(interval);
          reject(new Error(`Transaction ${result.status}`));
        }
      } catch (err) {
        console.log(err,'err')
        clearInterval(interval);
        reject(err);
      }
    }, 2_000);

    // Safety timeout — assume confirmed after 3 min (testnet can be slow)
    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 180_000);
  });
}
