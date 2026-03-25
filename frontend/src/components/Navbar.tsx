'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';

const NAV_LINKS = [
  { href: '/swap',   label: 'Swap'   },
  { href: '/pool',   label: 'Pool'   },
  { href: '/faucet', label: 'Faucet' },
  { href: '/stats',  label: 'Stats'  },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, connect, disconnect, connected } = useWallet()
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
      style={{
        background:   'var(--shade-surface)',
        borderColor:  'var(--shade-border)',
      }}
    >
      {/* Logo */}
      <Link
        href="/swap"
        className="text-xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-syne)', color: 'var(--shade-amber)' }}
      >
        ◈ ShadeSwap
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="relative px-4 py-2 text-sm font-medium transition-colors"
              style={{
                fontFamily: 'var(--font-space-mono)',
                color: isActive ? 'var(--shade-amber)' : 'var(--shade-sub)',
              }}
            >
              {label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: 'var(--shade-amber)' }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Wallet button */}
      <WalletMultiButton />
    </nav>
  );
}
