'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { PROGRAM_ID } from '@/src/utils/aleo';

export interface FetchedRecord {
  ciphertext: string;
  decrypted: string;  // decrypted plaintext of best record — pass as tx input
  balance: bigint;    // total balance across all unspent records
  count: number;      // number of unspent records found
}

export type RecordName = 'Token0' | 'Token1' | 'LPToken';

const BALANCE_FIELD: Record<RecordName, string> = {
  Token0:  'amount',
  Token1:  'amount',
  LPToken: 'shares',
};

/**
 * Try to read balance from the data field without decrypting.
 * The Leo Wallet may return plaintext values in data for records it owns.
 * Returns 0n if the field is missing, a ciphertext, or unparseable.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryReadBalance(data: any, field: string): bigint {
  const raw = data?.[field];
  if (!raw || typeof raw !== 'string') return 0n;
  if (raw.startsWith('ciphertext') || raw.startsWith('record')) return 0n;
  const match = raw.match(/(\d+)u\d+/);
  return match ? BigInt(match[1]) : 0n;
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

      // Step 1: try to read balances from data field — no decrypt calls needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withBalances = matches.map((r: any) => ({
        r,
        balance: tryReadBalance(r.data, field),
      }));

      const totalFromData = withBalances.reduce((s, x) => s + x.balance, 0n);
      const dataBalancesAvailable = totalFromData > 0n;

      // Step 2: pick the best record (highest balance). If data was unreadable,
      // fall back to the last record (most recently received).
      const best = dataBalancesAvailable
        ? withBalances.reduce((a, b) => (b.balance > a.balance ? b : a)).r
        : matches[matches.length - 1];

      // Step 3: decrypt only the ONE best record — at most one wallet prompt
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decrypted: string = await (decrypt as any)(best.recordCiphertext);

      // Parse balance from decrypted string as authoritative source for best record
      const match = decrypted.match(new RegExp(`${field}:\\s*(\\d+)u\\d+`));
      const bestBalance = BigInt(match?.[1] ?? '0');

      // Total: sum from data if available, otherwise just the decrypted best
      const totalBalance = dataBalancesAvailable ? totalFromData : bestBalance;

      setRecord({
        ciphertext: best.recordCiphertext,
        decrypted,
        balance: totalBalance,
        count: matches.length,
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
