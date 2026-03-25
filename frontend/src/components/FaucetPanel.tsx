'use client';

import { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useTransaction, TxStatus } from '@/src/hooks/useTransaction';
import { TxStatusCard }  from './TxStatus';
import { TOKEN0_SYMBOL, TOKEN1_SYMBOL, FAUCET_AMOUNT } from '@/src/utils/tokens';
import { PROGRAM_ID, formatAmount } from '@/src/utils/aleo';

export function FaucetPanel() {
  const { connected, publicKey } = useWallet();
  const { status, txId, error, execute, reset } = useTransaction();
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    if (!connected || !publicKey) return;

    const tx = {
      transitions: [
        {
          program: PROGRAM_ID,
          functionName: 'mint_token1',
          inputs: [publicKey, `${FAUCET_AMOUNT}u128`],
        },
      ],
      fee: 1_000_000,
      privateFee: false,
    };

    await execute(tx as Parameters<typeof execute>[0]);
    setClaimed(true);
  };

  const buttonDisabled =
    !connected ||
    status === TxStatus.SIGNING ||
    status === TxStatus.PENDING ||
    status === TxStatus.CONFIRMED;

  return (
    <>
      <div
        className="w-full max-w-[480px] rounded-2xl p-6"
        style={{ background: 'var(--shade-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--shade-amber)' }}
          >
            ◈
          </div>
          <div>
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--shade-text)' }}
            >
              Testnet Faucet
            </h2>
            <p
              className="text-xs"
              style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}
            >
              Free testnet tokens for trying ShadeSwap
            </p>
          </div>
        </div>

        {/* Token cards */}
        <div className="space-y-3 mb-6">
          {/* USDC — claimable */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: 'var(--shade-surface2)', borderColor: 'var(--shade-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                  style={{
                    color: 'var(--shade-amber)',
                    borderColor: 'var(--shade-amber)',
                    background: 'rgba(245,166,35,0.08)',
                    fontFamily: 'var(--font-space-mono)',
                  }}
                >
                  {TOKEN1_SYMBOL}
                </span>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--shade-text)', fontFamily: 'var(--font-syne)' }}
                  >
                    USD Coin (Testnet)
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}
                  >
                    Claim {formatAmount(FAUCET_AMOUNT)} {TOKEN1_SYMBOL} · No restrictions
                  </p>
                </div>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(61,220,132,0.12)',
                  color: 'var(--shade-green)',
                  fontFamily: 'var(--font-space-mono)',
                }}
              >
                Open
              </span>
            </div>
          </div>

          {/* SHADE — admin only */}
          <div
            className="rounded-xl p-4 border opacity-60"
            style={{ background: 'var(--shade-surface2)', borderColor: 'var(--shade-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                  style={{
                    color: 'var(--shade-muted)',
                    borderColor: 'var(--shade-muted)',
                    background: 'transparent',
                    fontFamily: 'var(--font-space-mono)',
                  }}
                >
                  {TOKEN0_SYMBOL}
                </span>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-syne)' }}
                  >
                    Shade Token
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
                  >
                    Admin-minted · Swap USDC → SHADE after pool launches
                  </p>
                </div>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(74,86,110,0.2)',
                  color: 'var(--shade-muted)',
                  fontFamily: 'var(--font-space-mono)',
                }}
              >
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Claimed success state */}
        {status === TxStatus.CONFIRMED && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm animate-slide-up"
            style={{
              background:  'rgba(61,220,132,0.10)',
              borderColor: 'var(--shade-green)',
              border: '1px solid',
              color: 'var(--shade-green)',
              fontFamily: 'var(--font-space-mono)',
            }}
          >
            ✓ {formatAmount(FAUCET_AMOUNT)} {TOKEN1_SYMBOL} sent to your wallet as a private record.
            <br />
            <span style={{ color: 'var(--shade-sub)', fontSize: '0.7rem' }}>
              Check your Leo Wallet → Records tab to find it.
            </span>
          </div>
        )}

        {/* Claim button */}
        <button
          onClick={handleClaim}
          disabled={buttonDisabled}
          className="w-full py-4 rounded-xl font-bold text-base transition-all"
          style={{
            fontFamily: 'var(--font-syne)',
            background: buttonDisabled
              ? 'var(--shade-surface2)'
              : 'linear-gradient(135deg, var(--shade-amber) 0%, var(--shade-amber2) 100%)',
            color:     buttonDisabled ? 'var(--shade-muted)' : '#000',
            cursor:    buttonDisabled ? 'not-allowed' : 'pointer',
            boxShadow: !buttonDisabled ? '0 4px 20px rgba(245,166,35,0.3)' : 'none',
          }}
        >
          {!connected
            ? 'Connect Wallet to Claim'
            : status === TxStatus.SIGNING
            ? 'Waiting for wallet...'
            : status === TxStatus.PENDING
            ? 'Minting...'
            : status === TxStatus.CONFIRMED
            ? `✓ Claimed ${formatAmount(FAUCET_AMOUNT)} ${TOKEN1_SYMBOL}`
            : `Claim ${formatAmount(FAUCET_AMOUNT)} ${TOKEN1_SYMBOL}`}
        </button>

        {/* Instructions */}
        <div
          className="mt-5 pt-5 space-y-3"
          style={{ borderTop: '1px solid var(--shade-border)' }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
          >
            How to get started
          </p>
          {[
            ['1', 'Claim USDC here → tokens arrive as a private record in your wallet'],
            ['2', 'Go to Pool → Add Liquidity to seed the pool (admin adds SHADE)'],
            ['3', 'Go to Swap → trade USDC for SHADE or vice versa'],
          ].map(([step, text]) => (
            <div key={step} className="flex gap-3 items-start">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: 'rgba(245,166,35,0.15)',
                  color: 'var(--shade-amber)',
                  fontFamily: 'var(--font-space-mono)',
                }}
              >
                {step}
              </span>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div className="mt-4 flex justify-center">
          <span
            className="text-xs px-3 py-1.5 rounded-full border"
            style={{
              fontFamily:  'var(--font-space-mono)',
              color:       'var(--shade-muted)',
              borderColor: 'var(--shade-border)',
              background:  'var(--shade-surface2)',
            }}
          >
            ◈ Tokens are private records — your balance is never public
          </span>
        </div>
      </div>

      <TxStatusCard status={status} txId={txId} error={error} onClose={reset} />
    </>
  );
}
