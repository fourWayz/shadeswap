# ShadeSwap 🌑

> The private spot AMM DEX on Aleo — swap tokens without revealing who you are or how much you traded.

[![Aleo Testnet](https://img.shields.io/badge/Aleo-Testnet-blue)](https://explorer.aleo.org)
[![Leo v2.0](https://img.shields.io/badge/Leo-v2.0-green)](https://docs.leo-lang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## The Problem

Every spot DEX on every other chain leaks everything:

| What leaks | Consequence |
|---|---|
| Your swap amount | MEV bots front-run your trade |
| Your wallet address | Competitors track your strategy |
| Your LP position size | Targeted attacks on your liquidity |
| Your trade history | Full financial surveillance |

Aleo fixes this. ShadeSwap is built to use every bit of that privacy.

---

## What ShadeSwap Does

ShadeSwap is a constant-product AMM (like Uniswap v2) where:

- **Token balances** are private `record` types — encrypted on-chain, only the owner can read them
- **Swap amounts and trader identity** are proven off-chain via ZK and never stored on-chain
- **LP positions** are private records — nobody knows your share of the pool
- **Pool reserves** are public mappings — so anyone can compute the current price

The only thing that changes on-chain during a swap is the pool reserve totals. No trader address, no trade size, no token direction is ever written to the ledger.

---

## Ecosystem Positioning

ShadeSwap is designed as the **spot layer** of Aleo's private DeFi stack:

```
ShadeSwap    →   private spot swaps (token ↔ token)
ZKPerp       →   private perpetual futures (leveraged longs/shorts)
```

Together they form a complete private trading ecosystem. ShadeSwap specifically fills the gap ZKPerp explicitly lists as a future roadmap item: *"Classic DEX (swaps/liquidity)"*.

---

## How It Works

### Privacy model

```
User wallet (private records)
       ↓
Frontend dApp (Aleo Wallet Adapter + JS SDK)
       ↓
ZK proof generated off-chain
   — swap amount computed privately
   — trader identity never exposed
       ↓
shadeswap.aleo on-chain
   transition: consume token record → produce new token record
   finalize:   update public pool reserves only
```

### Constant-product formula with fee

```
amount_in_with_fee = amount_in × (1000 - 3)          // 0.3% fee
amount_out = (amount_in_with_fee × reserve_out)
           / (reserve_in × 1000 + amount_in_with_fee)
```

The `finalize` function re-verifies this on-chain and asserts `new_r0 × new_r1 ≥ r0 × r1`, making the invariant tamper-proof.

### Anti-front-running guarantee

The `swap` transitions take a `min_out` parameter. In `finalize`, the contract re-computes `amount_out` from live reserves and asserts `amount_out >= min_out`. If a sandwich bot shifts the price before your tx confirms, the assertion fails and your transaction reverts automatically.

---

## Contract: `shadeswap.aleo`

### Records (private state)

```leo
record Token0 { owner: address, amount: u128 }
record Token1 { owner: address, amount: u128 }
record LPToken { owner: address, shares: u128 }  // your pool share, hidden
```

### Mappings (public state)

```leo
mapping reserve0: u8 => u128        // pool reserves, visible for pricing
mapping reserve1: u8 => u128
mapping lp_total_supply: u8 => u128
mapping admin: u8 => address
mapping pool_initialized: u8 => bool
```

### Transitions

| # | Function | Privacy |
|---|---|---|
| 1 | `initialize_pool()` | Public — one-time setup |
| 2 | `mint_token0/1(recipient, amount)` | Private — admin issues token records |
| 3 | `transfer_token0/1(token, recipient, amount)` | Fully private — P2P, no trace |
| 4 | `add_liquidity(t0, t1, amt0, amt1, min_shares)` | Private deposit, public reserve update |
| 5 | `remove_liquidity(lp, shares, min0, min1)` | Private LP burn, private token return |
| 6 | `swap_0_for_1(token_in, amount_in, min_out)` | Fully private — trader never revealed |
| 7 | `swap_1_for_0(token_in, amount_in, min_out)` | Same, reverse direction |

---

## Getting Started

### Prerequisites

```bash
curl -sSf https://aleo.tools/install | sh   # installs Leo + Aleo CLI
leo --version   # should be 2.x
```

### Build

```bash
git clone https://github.com/yourname/shadeswap
cd shadeswap
leo build
```

### Run locally

```bash
# 1. Initialize the pool
leo run initialize_pool

# 2. Mint tokens to yourself
leo run mint_token0  aleo1youradress...  1000000u128
leo run mint_token1  aleo1youraddress... 1000000u128

# 3. Add liquidity (deposits 500k of each token, min 0 shares — set higher in prod)
leo run add_liquidity \
  '{owner: aleo1..., amount: 1000000u128}' \
  '{owner: aleo1..., amount: 1000000u128}' \
  500000u128 500000u128 0u128

# 4. Swap 1000 token0 for at least 990 token1 (0.1% slippage tolerance)
leo run swap_0_for_1 \
  '{owner: aleo1..., amount: 500000u128}' \
  1000u128 990u128
```

### Deploy to Aleo Testnet

```bash
leo deploy --network testnet
```

Get testnet ALEO for fees: https://faucet.aleo.org

---

## Key Technical Decisions

### Why `record` not `mapping` for balances?

Mappings are stored publicly on-chain — anyone can read your balance. Records are encrypted UTXO-style objects: only the owner can decrypt them. Every token balance in ShadeSwap is a record. Your wealth is completely hidden.

### Why is the pool price still visible?

Deliberate. Transparent pricing is a feature, not a bug — it lets users compute fair swap rates and prevents the pool from being manipulated silently. Only *who* swaps and *how much* stays hidden.

### The `isqrt` helper

Leo has no built-in square root. For the first liquidity deposit, shares are computed as `sqrt(amount0 × amount1)`. ShadeSwap implements this via 8 Babylonian iterations, giving correct floor-sqrt for all realistic liquidity amounts.

### `MINIMUM_LIQUIDITY` lock

On the first deposit, 1000 shares are permanently locked. This prevents a classic AMM price manipulation attack where an attacker drains the pool to near-zero to distort pricing.

### Safe subtraction pattern

Leo evaluates both branches of ternary operators, which can cause underflow. All subtractions in ShadeSwap use the cap-then-subtract pattern:
```leo
// ❌ unsafe — Leo evaluates `a - b` even when false
let result: u64 = a > b ? a - b : 0u64;

// ✅ safe
let capped_b: u64 = b <= a ? b : a;
let result: u64 = a - capped_b;
```

---

## Privacy Comparison

| Feature | Uniswap v2 | ShadeSwap |
|---|---|---|
| Token balances | Public | ✅ Private (records) |
| Swap amounts | Public | ✅ Hidden (ZK proof) |
| Trader identity | Public | ✅ Hidden |
| LP position size | Public | ✅ Private (records) |
| Pool price | Public | ✅ Public (by design) |
| Front-running protection | ❌ None | ✅ Built-in (min_out + ZK) |

---

## Roadmap

- [x] Core AMM contract (constant-product, 0.3% fee)
- [x] Private token records (Token0, Token1)
- [x] Private LP records
- [x] Slippage protection
- [x] k-invariant on-chain enforcement
- [ ] Frontend (React + Aleo Wallet Adapter)
- [ ] Multi-pool support (multiple token pairs)
- [ ] USDCx (Aleo testnet stablecoin) integration
- [ ] Private limit orders
- [ ] Mainnet deployment

---

## Resources

- [Aleo Developer Docs](https://developer.aleo.org)
- [Leo Language Docs](https://docs.leo-lang.org)
- [Aleo Testnet Faucet](https://faucet.aleo.org)
- [Aleo Explorer](https://explorer.aleo.org)
- [Shield Wallet](https://www.shieldwallet.xyz)

---

## License

MIT

---

*ShadeSwap — swap in the shade.*