'use client';

import { Navbar }    from '@/src/components/Navbar';
import { SwapPanel } from '@/src/components/SwapPanel';
import { PoolStats } from '@/src/components/PoolStats';
import { usePool }   from '@/src/hooks/usePool';

export default function SwapPage() {
  const { reserves, loading, error, refresh, getAmountOutForDirection } = usePool();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-16">
        <div className="w-full max-w-[480px] space-y-4">
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-xs"
              style={{ background: 'rgba(255,95,87,0.1)', color: 'var(--shade-red)', fontFamily: 'var(--font-space-mono)' }}
            >
              Failed to load pool: {error}
            </div>
          )}
          <SwapPanel reserves={reserves} getAmountOut={getAmountOutForDirection} />
          <PoolStats reserves={reserves} loading={loading} onRefresh={refresh} />
        </div>
      </main>
    </div>
  );
}
