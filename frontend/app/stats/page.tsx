'use client';

import { Navbar }    from '@/src/components/Navbar';
import { PoolStats } from '@/src/components/PoolStats';
import { usePool }   from '@/src/hooks/usePool';

const EXPLORER_BASE = 'https://testnet.explorer.provable.com';

export default function StatsPage() {
  const { reserves, loading, refresh } = usePool();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-16">
        <div className="w-full max-w-[640px] space-y-5">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--shade-text)' }}
          >
            Stats
          </h1>

          <PoolStats reserves={reserves} loading={loading} onRefresh={refresh} />

          {/* Contract info */}
          <Card title="Contract Info">
            <InfoRow label="Program"  value="shadeswap_v5.aleo" />
            <InfoRow label="Network"  value="Aleo Testnet"   />
            <InfoRow
              label="Explorer"
              value={
                <a
                  href={EXPLORER_BASE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--shade-amber)' }}
                >
                  testnet.explorer.provable.com ↗
                </a>
              }
            />
          </Card>

          {/* Privacy model */}
          <Card title="Privacy Model">
            {[
              'Swap amounts are never stored on-chain',
              'Trader identity is hidden — only a ZK proof is submitted',
              'LP positions are private records — your share is invisible to others',
              'Pool reserves are public — pricing is always transparent',
            ].map((point) => (
              <div key={point} className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--shade-border)' }}>
                <span style={{ color: 'var(--shade-green)' }}>◈</span>
                <span
                  className="text-sm"
                  style={{ color: 'var(--shade-text)', fontFamily: 'var(--font-space-mono)' }}
                >
                  {point}
                </span>
              </div>
            ))}
          </Card>

          {/* Ecosystem */}
          <Card title="Ecosystem">
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}
            >
              ShadeSwap is the spot layer of Aleo&apos;s private DeFi stack. For private perpetual futures, explore ZKPerp.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 border"
      style={{ background: 'var(--shade-surface)', borderColor: 'var(--shade-border)' }}
    >
      <h2
        className="text-sm font-bold uppercase tracking-widest mb-4"
        style={{ fontFamily: 'var(--font-syne)', color: 'var(--shade-sub)' }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex justify-between items-center py-2.5"
      style={{ borderBottom: '1px solid var(--shade-border)' }}
    >
      <span
        className="text-xs"
        style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
      >
        {label}
      </span>
      <span
        className="text-sm"
        style={{ color: 'var(--shade-text)', fontFamily: 'var(--font-space-mono)' }}
      >
        {value}
      </span>
    </div>
  );
}
