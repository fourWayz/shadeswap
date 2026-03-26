// ── Types ────────────────────────────────────────────────────────────────────

export type Direction = '0for1' | '1for0';

export interface Reserves {
  reserve0: bigint;
  reserve1: bigint;
  lpTotalSupply: bigint;
}

export interface SwapParams {
  tokenRecord: string;
  amountIn: bigint;
  minOut: bigint;
  direction: Direction;
}

export interface AddLiquidityParams {
  t0Record: string;
  t1Record: string;
  amount0: bigint;
  amount1: bigint;
  minShares: bigint;
}

export interface RemoveLiquidityParams {
  lpRecord: string;
  shares: bigint;
  minAmount0: bigint;
  minAmount1: bigint;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const PROGRAM_ID = 'shadeswap_v4.aleo';
export const NETWORK    = 'testnet';
export const API_URL    = 'https://api.provable.com/v2/testnet';
export const DECIMALS   = 6;

const FEE_NUMERATOR   = 3n;
const FEE_DENOMINATOR = 1000n;
const MINIMUM_LIQUIDITY = 1000n;

// ── Formatting ────────────────────────────────────────────────────────────────

/** Convert on-chain bigint (6 decimals) to human-readable string */
export function formatAmount(amount: bigint, decimals = DECIMALS): string {
  const d = BigInt(10 ** decimals);
  const whole = amount / d;
  const frac  = amount % d;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}

/** Parse human-readable string to on-chain bigint (6 decimals) */
export function parseAmount(value: string, decimals = DECIMALS): bigint {
  if (!value || value === '.' ) return 0n;
  const [wholePart, fracPart = ''] = value.split('.');
  const whole = BigInt(wholePart || '0');
  const fracPadded = fracPart.slice(0, decimals).padEnd(decimals, '0');
  const frac = BigInt(fracPadded);
  const d = BigInt(10 ** decimals);
  return whole * d + frac;
}

// ── AMM Math ──────────────────────────────────────────────────────────────────

/** AMM getAmountOut — mirrors compute_amount_out in the Leo contract */
export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (reserveIn === 0n || reserveOut === 0n || amountIn === 0n) return 0n;
  const amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
  const numerator       = amountInWithFee * reserveOut;
  const denominator     = reserveIn * FEE_DENOMINATOR + amountInWithFee;
  return numerator / denominator;
}

/** Compute price impact as a percentage (0-100) */
export function getPriceImpact(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === 0n || reserveOut === 0n || amountIn === 0n) return 0;
  const midPrice  = Number(reserveOut) / Number(reserveIn);
  const amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
  const execPrice = Number(amountOut) / Number(amountIn);
  return Math.max(0, ((midPrice - execPrice) / midPrice) * 100);
}

/** Apply slippage: returns minimum output after slippage */
export function applySlippage(amount: bigint, slippagePct: number): bigint {
  const factor = BigInt(Math.floor((1 - slippagePct / 100) * 10000));
  return (amount * factor) / 10000n;
}

/** Integer square root (mirrors isqrt in Leo) */
export function isqrt(n: bigint): bigint {
  if (n < 0n) return 0n;
  if (n === 0n) return 0n;
  let x = n / 2n;
  for (let i = 0; i < 8; i++) {
    const next = (x + n / x) / 2n;
    x = next < x ? next : x;
  }
  return x;
}

/** Compute LP shares for adding liquidity */
export function computeShares(
  amount0: bigint,
  amount1: bigint,
  reserve0: bigint,
  reserve1: bigint,
  totalLp: bigint
): bigint {
  if (totalLp === 0n) {
    const raw = isqrt(amount0 * amount1);
    return raw > MINIMUM_LIQUIDITY ? raw - MINIMUM_LIQUIDITY : 0n;
  }
  const shares0 = reserve0 > 0n ? (amount0 * totalLp) / reserve0 : 0n;
  const shares1 = reserve1 > 0n ? (amount1 * totalLp) / reserve1 : 0n;
  return shares0 < shares1 ? shares0 : shares1;
}

/** Compute token amounts for removing liquidity */
export function computeRemoveAmounts(
  shares: bigint,
  reserve0: bigint,
  reserve1: bigint,
  totalLp: bigint
): { amount0: bigint; amount1: bigint } {
  if (totalLp === 0n || shares === 0n) return { amount0: 0n, amount1: 0n };
  return {
    amount0: (shares * reserve0) / totalLp,
    amount1: (shares * reserve1) / totalLp,
  };
}

// ── On-chain helpers ──────────────────────────────────────────────────────────

/** Fetch a public mapping value from the Aleo API */
export async function fetchMapping(
  programId: string,
  mappingName: string,
  key: string
): Promise<string | null> {
  try {
    const url = `${API_URL}/program/${programId}/mapping/${mappingName}/${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Fetch pool reserves from on-chain mappings */
export async function fetchReserves(): Promise<Reserves> {
  const [r0Str, r1Str, lpStr] = await Promise.all([
    fetchMapping(PROGRAM_ID, 'reserve0',        '0u8'),
    fetchMapping(PROGRAM_ID, 'reserve1',        '0u8'),
    fetchMapping(PROGRAM_ID, 'lp_total_supply', '0u8'),
  ]);

  const parse = (s: string | null): bigint => {
    if (!s) return 0n;
    const unquoted = s.replace(/^"|"$/g, '');
    const clean = unquoted.match(/^\d+/)?.[0] ?? '';
    return clean ? BigInt(clean) : 0n;
  };

  return {
    reserve0:      parse(r0Str),
    reserve1:      parse(r1Str),
    lpTotalSupply: parse(lpStr),
  };
}

// ── Transaction builders ──────────────────────────────────────────────────────
// Returns AleoTxOptions — the flat shape that executeTransaction expects

export interface AleoTxOptions {
  program: string;
  function: string;
  inputs: string[];
  fee?: number;
  privateFee?: boolean;
}

export function buildSwapTransaction(params: SwapParams): AleoTxOptions {
  return {
    program: PROGRAM_ID,
    function: params.direction === '0for1' ? 'swap_0_for_1' : 'swap_1_for_0',
    inputs: [
      params.tokenRecord,
      `${params.amountIn}u128`,
      `${params.minOut}u128`,
    ],
    fee: 1_500_000,
    privateFee: false,
  };
}

export function buildAddLiquidityTransaction(params: AddLiquidityParams): AleoTxOptions {
  return {
    program: PROGRAM_ID,
    function: 'add_liquidity',
    inputs: [
      params.t0Record,
      params.t1Record,
      `${params.amount0}u128`,
      `${params.amount1}u128`,
      `${params.minShares}u128`,
    ],
    fee: 1_500_000,
    privateFee: false,
  };
}

export function buildRemoveLiquidityTransaction(params: RemoveLiquidityParams): AleoTxOptions {
  return {
    program: PROGRAM_ID,
    function: 'remove_liquidity',
    inputs: [
      params.lpRecord,
      `${params.shares}u128`,
      `${params.minAmount0}u128`,
      `${params.minAmount1}u128`,
    ],
    fee: 1_500_000,
    privateFee: false,
  };
}
