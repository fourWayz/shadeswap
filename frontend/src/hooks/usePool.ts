'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchReserves,
  getAmountOut,
  formatAmount,
  type Reserves,
  type Direction,
} from '@/src/utils/aleo';

interface UsePoolReturn {
  reserves: Reserves | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  price0Per1: string;
  price1Per0: string;
  getAmountOutForDirection: (amountIn: bigint, direction: Direction) => bigint;
}

const POLL_INTERVAL_MS = 15_000;

export function usePool(): UsePoolReturn {
  const [reserves, setReserves] = useState<Reserves | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReserves();
      setReserves(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch pool data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const price0Per1 = (() => {
    if (!reserves || reserves.reserve0 === 0n || reserves.reserve1 === 0n) return '—';
    // 1 TOKEN0 in terms of TOKEN1
    const oneUnit = BigInt(10 ** 6);
    const out = getAmountOut(oneUnit, reserves.reserve0, reserves.reserve1);
    return formatAmount(out);
  })();

  const price1Per0 = (() => {
    if (!reserves || reserves.reserve0 === 0n || reserves.reserve1 === 0n) return '—';
    const oneUnit = BigInt(10 ** 6);
    const out = getAmountOut(oneUnit, reserves.reserve1, reserves.reserve0);
    return formatAmount(out);
  })();

  const getAmountOutForDirection = useCallback(
    (amountIn: bigint, direction: Direction): bigint => {
      if (!reserves) return 0n;
      const [reserveIn, reserveOut] =
        direction === '0for1'
          ? [reserves.reserve0, reserves.reserve1]
          : [reserves.reserve1, reserves.reserve0];
      return getAmountOut(amountIn, reserveIn, reserveOut);
    },
    [reserves]
  );

  return {
    reserves,
    loading,
    error,
    refresh,
    price0Per1,
    price1Per0,
    getAmountOutForDirection,
  };
}
