'use client';

import { Navbar }      from '@/src/components/Navbar';
import { FaucetPanel } from '@/src/components/FaucetPanel';

export default function FaucetPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-16">
        <div className="w-full max-w-[480px] space-y-4">
          <div className="mb-2">
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--shade-text)' }}
            >
              Faucet
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}
            >
              Get testnet tokens to try ShadeSwap — no signup required.
            </p>
          </div>
          <FaucetPanel />
        </div>
      </main>
    </div>
  );
}
