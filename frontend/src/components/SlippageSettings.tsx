'use client';

import { useState, useRef, useEffect } from 'react';

interface SlippageSettingsProps {
  value: number;
  onChange: (v: number) => void;
}

const PRESETS = [0.1, 0.5, 1.0];

export function SlippageSettings({ value, onChange }: SlippageSettingsProps) {
  const [open,   setOpen]   = useState(false);
  const [custom, setCustom] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCustom = (v: string) => {
    setCustom(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0 && n <= 50) onChange(n);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors"
        style={{
          color:      open ? 'var(--shade-amber)' : 'var(--shade-sub)',
          background: open ? 'rgba(245,166,35,0.08)' : 'transparent',
          fontFamily: 'var(--font-space-mono)',
        }}
        title="Slippage settings"
      >
        <span>⚙</span>
        <span>{value}%</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 p-4 rounded-xl border w-52 z-50 animate-slide-up"
          style={{
            background:  'var(--shade-surface)',
            borderColor: 'var(--shade-border)',
            boxShadow:   '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <p
            className="text-xs mb-3 uppercase tracking-widest"
            style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
          >
            Slippage Tolerance
          </p>
          <div className="flex gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { onChange(p); setCustom(''); }}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
                style={{
                  fontFamily: 'var(--font-space-mono)',
                  background: value === p ? 'var(--shade-amber)' : 'var(--shade-surface2)',
                  color:      value === p ? '#000' : 'var(--shade-sub)',
                }}
              >
                {p}%
              </button>
            ))}
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{ borderColor: 'var(--shade-border2)', background: 'var(--shade-surface2)' }}
          >
            <input
              type="text"
              placeholder="Custom"
              value={custom}
              onChange={(e) => handleCustom(e.target.value)}
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: 'var(--shade-text)', fontFamily: 'var(--font-space-mono)' }}
            />
            <span style={{ color: 'var(--shade-muted)', fontSize: '0.7rem' }}>%</span>
          </div>
        </div>
      )}
    </div>
  );
}
