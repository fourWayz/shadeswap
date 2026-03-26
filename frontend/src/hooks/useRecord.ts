'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { PROGRAM_ID } from '@/src/utils/aleo';

export interface RecordEntry {
  ciphertext: string;
  decrypted: string;
  balance: bigint;
}

export interface FetchedRecord {
  ciphertext: string;  // best record (highest balance) 
  decrypted: string;
  balance: bigint;     // total across all records
  count: number;
  all: RecordEntry[];  // every unspent record with its individual balance
}

export type RecordName = 'Token0' | 'Token1' | 'LPToken';

const BALANCE_FIELD: Record<RecordName, string> = {
  Token0:  'amount',
  Token1:  'amount',
  LPToken: 'shares',
};

function parseDecryptedBalance(decrypted: string, field: string): bigint {
  const match = decrypted.match(new RegExp(`${field}:\\s*(\\d+)u\\d+`));
  return BigInt(match?.[1] ?? '0');
}

export function useRecord(recordName: RecordName) {
  const { requestRecords, decrypt } = useWallet();
  const [record,  setRecord]  = useState<FetchedRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecord(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all: any[] = await (requestRecords as any)(PROGRAM_ID, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matches = all.filter((r: any) => r.recordName === recordName && !r.spent);

      if (matches.length === 0) {
        setError(`No unspent ${recordName} record found in your wallet.`);
        return;
      }

      const field = BALANCE_FIELD[recordName];

      // Decrypt all records — UponRequest permission means wallet prompts once
      // then allows silently for the session. Accurate totals are worth it.
      const entries: RecordEntry[] = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matches.map(async (r: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const decrypted: string = await (decrypt as any)(r.recordCiphertext);
          const balance = parseDecryptedBalance(decrypted, field);
          return { ciphertext: r.recordCiphertext, decrypted, balance };
        })
      );

      // Sort descending — best (highest balance) first
      entries.sort((a, b) => (b.balance > a.balance ? 1 : -1));

      const totalBalance = entries.reduce((s, e) => s + e.balance, 0n);
      const best = entries[0];

      setRecord({
        ciphertext: best.ciphertext,
        decrypted:  best.decrypted,
        balance:    totalBalance,
        count:      entries.length,
        all:        entries,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch records from wallet');
    } finally {
      setLoading(false);
    }
  }, [requestRecords, decrypt, recordName]);

  const clear = useCallback(() => {
    setRecord(null);
    setError(null);
  }, []);

  return { record, loading, error, fetch, clear };
}
