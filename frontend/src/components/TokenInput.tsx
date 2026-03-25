'use client';

interface TokenInputProps {
  label: string;
  tokenName: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  balance?: string;
}

export function TokenInput({
  label,
  tokenName,
  value,
  onChange,
  readOnly = false,
  balance,
}: TokenInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    const v = e.target.value;
    // Allow only numbers with one optional decimal point
    if (/^(\d+\.?\d*|\.?\d+)?$/.test(v)) {
      onChange(v);
    }
  };

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{ background: 'var(--shade-surface2)' }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--shade-muted)', fontFamily: 'var(--font-space-mono)' }}
        >
          {label}
        </span>
        {balance !== undefined && (
          <span
            className="text-xs"
            style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)' }}
          >
            Balance: {balance}
          </span>
        )}
      </div>

      {/* Input + token badge row */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          placeholder="0.000000"
          className="flex-1 bg-transparent outline-none border-none text-3xl font-bold placeholder-shade-muted focus:ring-0"
          style={{
            fontFamily: 'var(--font-space-mono)',
            color: value ? 'var(--shade-text)' : 'var(--shade-muted)',
            cursor: readOnly ? 'default' : 'text',
          }}
        />
        <span
          className="px-3 py-1.5 rounded-lg text-sm font-semibold border"
          style={{
            fontFamily:  'var(--font-space-mono)',
            color:       'var(--shade-amber)',
            borderColor: 'var(--shade-amber)',
            background:  'rgba(245,166,35,0.08)',
            whiteSpace: 'nowrap',
          }}
        >
          {tokenName}
        </span>
      </div>
    </div>
  );
}
