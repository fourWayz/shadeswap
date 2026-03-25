'use client';

import { useState } from 'react';
import { Navbar }          from '@/src/components/Navbar';
import { AddLiquidity }    from '@/src/components/AddLiquidity';
import { RemoveLiquidity } from '@/src/components/RemoveLiquidity';
import { PoolStats }       from '@/src/components/PoolStats';
import { usePool }         from '@/src/hooks/usePool';

type Tab = 'add' | 'remove';

export default function PoolPage() {
  const [activeTab, setActiveTab] = useState<Tab>('add');
  const { reserves, loading, refresh } = usePool();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-16">
        <div className="w-full max-w-[520px] space-y-4">
          {/* Tab header */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--shade-surface)' }}
          >
            <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--shade-surface2)' }}>
              {(['add', 'remove'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    fontFamily:  'var(--font-syne)',
                    background:  activeTab === tab ? 'var(--shade-surface)' : 'transparent',
                    color:       activeTab === tab ? 'var(--shade-amber)' : 'var(--shade-sub)',
                    boxShadow:   activeTab === tab ? '0 1px 8px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {tab === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}
                </button>
              ))}
            </div>

            {activeTab === 'add'    && <AddLiquidity    reserves={reserves} />}
            {activeTab === 'remove' && <RemoveLiquidity reserves={reserves} />}
          </div>

          <PoolStats reserves={reserves} loading={loading} onRefresh={refresh} />
        </div>
      </main>
    </div>
  );
}
