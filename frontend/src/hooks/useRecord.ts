'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { PROGRAM_ID } from '@/src/utils/aleo';

export interface FetchedRecord {
  decrypted: string;  // decrypted ciphertext — pass directly as tx input
  balance: bigint;    // parsed amount/shares from record data
}

export type RecordName = 'Token0' | 'Token1' | 'LPToken';

// Which data field holds the balance for each record type
const BALANCE_FIELD: Record<RecordName, string> = {
  Token0:  'amount',
  Token1:  'amount',
  LPToken: 'shares',
};

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
      // requestRecords(programId, includeSpent)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all: any[] = await (requestRecords as any)(PROGRAM_ID, false);

      // Find the first unspent record matching this type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = all.find((r: any) => r.recordName === recordName && !r.spent);

      if (!found) {
        setError(`No unspent ${recordName} record found in your wallet.`);
        return;
      }

      // Decrypt so the wallet can use it as a private record input
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decrypted: string = await (decrypt as any)(found.recordCiphertext);

      // Parse balance from record data field (e.g. "1000000u128.private")
      const field = BALANCE_FIELD[recordName];
      const raw: string = found.data?.[field] ?? '0u128.private';
      const balance = BigInt(raw.replace(/[^0-9]/g, '') || '0');

      console.log(`Fetched record for ${recordName}: balance=${balance}, decrypted=${decrypted}`);
      setRecord({ decrypted, balance });
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
