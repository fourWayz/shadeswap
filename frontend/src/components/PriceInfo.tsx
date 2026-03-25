import { getAmountOut, getPriceImpact, applySlippage, formatAmount, type Direction } from '@/src/utils/aleo';
import { TOKEN0_SYMBOL, TOKEN1_SYMBOL } from '@/src/utils/tokens';

interface PriceInfoProps {
  amountIn: bigint;
  amountOut: bigint;
  direction: Direction;
  slippagePct: number;
  reserve0: bigint;
  reserve1: bigint;
}

export function PriceInfo({
  amountIn,
  amountOut,
  direction,
  slippagePct,
  reserve0,
  reserve1,
}: PriceInfoProps) {
  if (amountIn === 0n || amountOut === 0n) return null;

  const [reserveIn, reserveOut] =
    direction === '0for1' ? [reserve0, reserve1] : [reserve1, reserve0];

  const impact = getPriceImpact(amountIn, reserveIn, reserveOut);
  const minReceived = applySlippage(amountOut, slippagePct);

  const [token0, token1] = [TOKEN0_SYMBOL, TOKEN1_SYMBOL];
  const [fromToken, toToken] =
    direction === '0for1' ? [token0, token1] : [token1, token0];

  // Rate: 1 FROM = ? TO
  const oneUnit = BigInt(10 ** 6);
  const rateOut = getAmountOut(oneUnit, reserveIn, reserveOut);
  const rateStr = formatAmount(rateOut);

  const impactColor =
    impact > 15 ? 'var(--shade-red)' :
    impact > 5  ? '#f0a500' :
    impact > 1  ? '#e0c000' :
    'var(--shade-green)';

  return (
    <div
      className="mt-2 pt-4 space-y-2 text-sm"
      style={{ borderTop: '1px solid var(--shade-border)' }}
    >
      <Row
        label="Rate"
        value={`1 ${fromToken} = ${rateStr} ${toToken}`}
      />
      <Row
        label="Price Impact"
        value={`${impact.toFixed(2)}%`}
        valueColor={impactColor}
      />
      <Row
        label={`Min. Received (${slippagePct}% slippage)`}
        value={`${formatAmount(minReceived)} ${toToken}`}
      />
    </div>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: 'var(--shade-sub)', fontFamily: 'var(--font-space-mono)', fontSize: '0.75rem' }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-space-mono)',
          fontSize: '0.78rem',
          color: valueColor ?? 'var(--shade-text)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
