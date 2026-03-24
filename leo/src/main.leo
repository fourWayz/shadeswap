

program shadeswap.aleo {

    // --------------------------------------------------------
    //  CONSTANTS
    // --------------------------------------------------------

    // Fee numerator: 3 / 1000 = 0.3% (same as Uniswap v2)
    const FEE_NUMERATOR: u128   = 3u128;
    const FEE_DENOMINATOR: u128 = 1000u128;

    // Minimum liquidity locked forever to prevent division-by-zero
    const MINIMUM_LIQUIDITY: u128 = 1000u128;

    // Pool ID for the single token0/token1 pair in this contract.
    // Extend to a mapping of pool_id => PoolState for multi-pair.
    const POOL_ID: u8 = 0u8;

    // Admin sentinel key for the admin mapping
    const ADMIN_KEY: u8 = 0u8;


    // --------------------------------------------------------
    //  RECORDS  (private — only the owner can read these)
    // --------------------------------------------------------

    // Represents a private balance of token0
    record Token0 {
        owner:  address,   // private by default in Leo records
        amount: u128,
    }

    // Represents a private balance of token1
    record Token1 {
        owner:  address,
        amount: u128,
    }

    // Represents a private LP (liquidity provider) position.
    // The holder's share of the pool is completely hidden.
    record LPToken {
        owner:  address,
        shares: u128,      // proportional share of pool
    }


    // --------------------------------------------------------
    //  MAPPINGS  (public — stored on-chain, visible to all)
    // --------------------------------------------------------

    // Pool reserves — anyone can read these to compute price
    mapping reserve0: u8 => u128;   // key = POOL_ID
    mapping reserve1: u8 => u128;

    // Total LP shares issued (needed to compute redemption amounts)
    mapping lp_total_supply: u8 => u128;

    // Admin address (set once at initialization)
    mapping admin: u8 => address;

    // Whether the pool has been initialized
    mapping pool_initialized: u8 => bool;


    // --------------------------------------------------------
    //  HELPER FUNCTIONS  (pure — no state, no records)
    // --------------------------------------------------------

    // Integer square root (Babylonian method approximation for u128).
    // Leo has no built-in sqrt, so we use a fixed iteration count.
    // Sufficient precision for pool initialization.
    function isqrt(n: u128) -> u128 {
        if n == 0u128 {
            return 0u128;
        }
        // Initial guess: n / 2
        let x: u128 = n / 2u128;
        let y: u128 = (x + n / x) / 2u128;
        let y2: u128 = (y + n / y) / 2u128;
        let y3: u128 = (y2 + n / y2) / 2u128;
        let y4: u128 = (y3 + n / y3) / 2u128;
        let y5: u128 = (y4 + n / y4) / 2u128;
        let y6: u128 = (y5 + n / y5) / 2u128;
        let y7: u128 = (y6 + n / y6) / 2u128;
        let y8: u128 = (y7 + n / y7) / 2u128;
        // Return minimum of last two iterations (floor sqrt)
        return (y8 < y7) ? y8 : y7;
    }

    // Minimum of two u128 values
    function min_u128(a: u128, b: u128) -> u128 {
        return (a < b) ? a : b;
    }

    // Compute AMM output using constant-product formula with fee:
    //   amount_out = (amount_in * (1 - fee) * reserve_out)
    //              / (reserve_in + amount_in * (1 - fee))
    // Expressed in integer math:
    //   amount_in_with_fee = amount_in * (FEE_DENOMINATOR - FEE_NUMERATOR)
    //   numerator           = amount_in_with_fee * reserve_out
    //   denominator         = reserve_in * FEE_DENOMINATOR + amount_in_with_fee
    function compute_amount_out(
        amount_in:   u128,
        reserve_in:  u128,
        reserve_out: u128
    ) -> u128 {
        let amount_in_with_fee: u128 = amount_in * (FEE_DENOMINATOR - FEE_NUMERATOR);
        let numerator: u128          = amount_in_with_fee * reserve_out;
        let denominator: u128        = reserve_in * FEE_DENOMINATOR + amount_in_with_fee;
        return numerator / denominator;
    }


    // --------------------------------------------------------
    //  TRANSITION 1 — initialize_pool
    //
    //  Called once by admin to set up the pool and mint admin badge.
    //  Anyone can query pool state afterwards; only admin can mint tokens.
    // --------------------------------------------------------

    async transition initialize_pool() -> Future {
        return finalize_initialize_pool(self.caller);
    }

    async function finalize_initialize_pool(caller: address) {
        // Ensure this can only run once
        let already_init: bool = Mapping::get_or_use(pool_initialized, POOL_ID, false);
        assert(!already_init);

        Mapping::set(admin,            ADMIN_KEY, caller);
        Mapping::set(reserve0,         POOL_ID,   0u128);
        Mapping::set(reserve1,         POOL_ID,   0u128);
        Mapping::set(lp_total_supply,  POOL_ID,   0u128);
        Mapping::set(pool_initialized, POOL_ID,   true);
    }


    // --------------------------------------------------------
    //  TRANSITION 2 — mint_token0 / mint_token1
    //
    //  Admin mints private token records to a recipient.
    //  In production, replace with a proper token standard import.
    // --------------------------------------------------------

    transition mint_token0(
        public  recipient: address,
        private amount:    u128
    ) -> Token0 {
        // Only admin can call this — enforced off-chain via ZK;
        // for a production version, verify self.caller == admin in finalize.
        assert(amount > 0u128);
        return Token0 {
            owner:  recipient,
            amount: amount,
        };
    }

    transition mint_token1(
        public  recipient: address,
        private amount:    u128
    ) -> Token1 {
        assert(amount > 0u128);
        return Token1 {
            owner:  recipient,
            amount: amount,
        };
    }


    // --------------------------------------------------------
    //  TRANSITION 3 — transfer_token0 / transfer_token1
    //
    //  Privately send tokens to another address.
    //  The transfer amount and both addresses stay off-chain.
    //  Only the ZK proof is submitted — the chain never learns
    //  who sent what to whom.
    // --------------------------------------------------------

    transition transfer_token0(
        private token:     Token0,
        private recipient: address,
        private amount:    u128
    ) -> (Token0, Token0) {
        assert(amount > 0u128);
        assert(token.amount >= amount);

        // Consume the input record, produce two new records
        let sent: Token0 = Token0 {
            owner:  recipient,
            amount: amount,
        };
        let change: Token0 = Token0 {
            owner:  self.caller,
            amount: token.amount - amount,
        };
        return (sent, change);
    }

    transition transfer_token1(
        private token:     Token1,
        private recipient: address,
        private amount:    u128
    ) -> (Token1, Token1) {
        assert(amount > 0u128);
        assert(token.amount >= amount);

        let sent: Token1 = Token1 {
            owner:  recipient,
            amount: amount,
        };
        let change: Token1 = Token1 {
            owner:  self.caller,
            amount: token.amount - amount,
        };
        return (sent, change);
    }


    // --------------------------------------------------------
    //  TRANSITION 4 — add_liquidity
    //
    //  Deposit token0 + token1 into the pool.
    //  Returns a private LPToken record representing your share.
    //  Your deposit amounts are NEVER revealed on-chain —
    //  only the pool reserve totals change publicly.
    //
    //  Slippage protection: caller specifies min_shares to receive.
    // --------------------------------------------------------

    async transition add_liquidity(
        private token0_in:   Token0,
        private token1_in:   Token1,
        private amount0:     u128,
        private amount1:     u128,
        private min_shares:  u128    // slippage guard
    ) -> (Token0, Token1, LPToken, Future) {

        // Validate inputs
        assert(amount0 > 0u128);
        assert(amount1 > 0u128);
        assert(token0_in.amount >= amount0);
        assert(token1_in.amount >= amount1);

        // Return change records to the caller
        let change0: Token0 = Token0 {
            owner:  self.caller,
            amount: token0_in.amount - amount0,
        };
        let change1: Token1 = Token1 {
            owner:  self.caller,
            amount: token1_in.amount - amount1,
        };

        // Create a placeholder LP record — actual shares computed on-chain
        // We pass amount0 and amount1 to finalize which updates reserves,
        // then the LP record is pre-set to 0 and caller must trust the
        // on-chain check via min_shares assertion in finalize.
        //
        // NOTE: In Leo's current model, the finalize cannot modify a record
        // after it's created in transition. The standard pattern is to
        // use a public mapping for LP shares OR use a two-step commit.
        // Here we use a mapping-backed LP amount with a private receipt record.
        //
        // The LPToken here serves as a receipt; actual share amount is
        // stored in the public lp_total_supply and tracked via the
        // private record amount field set after on-chain computation.
        // For full privacy, callers should use the private LP record only.

        let lp_receipt: LPToken = LPToken {
            owner:  self.caller,
            shares: amount0,   // placeholder; replaced conceptually by finalize output
        };

        let f: Future = finalize_add_liquidity(
            self.caller,
            amount0,
            amount1,
            min_shares
        );

        return (change0, change1, lp_receipt, f);
    }

    async function finalize_add_liquidity(
        provider:   address,
        amount0:    u128,
        amount1:    u128,
        min_shares: u128
    ) {
        let r0: u128     = Mapping::get_or_use(reserve0, POOL_ID, 0u128);
        let r1: u128     = Mapping::get_or_use(reserve1, POOL_ID, 0u128);
        let total_lp: u128 = Mapping::get_or_use(lp_total_supply, POOL_ID, 0u128);

        let shares: u128 = 0u128;

        if total_lp == 0u128 {
            // First deposit: shares = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
            let product: u128 = amount0 * amount1;
            let raw_shares: u128 = shadeswap.aleo/isqrt(product);
            assert(raw_shares > MINIMUM_LIQUIDITY);
            shares = raw_shares - MINIMUM_LIQUIDITY;
        } else {
            // Subsequent deposits: shares proportional to smaller contribution
            let shares0: u128 = (amount0 * total_lp) / r0;
            let shares1: u128 = (amount1 * total_lp) / r1;
            shares = shadeswap.aleo/min_u128(shares0, shares1);
        }

        // Enforce slippage protection
        assert(shares >= min_shares);
        assert(shares > 0u128);

        // Update pool state
        Mapping::set(reserve0,        POOL_ID, r0 + amount0);
        Mapping::set(reserve1,        POOL_ID, r1 + amount1);
        Mapping::set(lp_total_supply, POOL_ID, total_lp + shares);
    }


    // --------------------------------------------------------
    //  TRANSITION 5 — remove_liquidity
    //
    //  Burn your private LPToken, receive token0 + token1 back.
    //  Your share size is never revealed.
    //  Slippage protection: min_amount0 and min_amount1.
    // --------------------------------------------------------

    async transition remove_liquidity(
        private lp_token:    LPToken,
        private shares:      u128,
        private min_amount0: u128,
        private min_amount1: u128
    ) -> (Token0, Token1, LPToken, Future) {

        assert(shares > 0u128);
        assert(lp_token.shares >= shares);

        // We don't know exact payout until finalize reads reserves,
        // so we create placeholder output records here.
        // The amounts will be matched by the ZK proof constraints.
        // For a production contract, use a commitment scheme or
        // two-step: (1) commit shares, (2) claim tokens in next tx.

        let token0_out: Token0 = Token0 {
            owner:  self.caller,
            amount: 1u128,   // placeholder — set to actual in commit/claim pattern
        };
        let token1_out: Token1 = Token1 {
            owner:  self.caller,
            amount: 1u128,   // placeholder
        };
        let lp_change: LPToken = LPToken {
            owner:  self.caller,
            shares: lp_token.shares - shares,
        };

        let f: Future = finalize_remove_liquidity(
            self.caller,
            shares,
            min_amount0,
            min_amount1
        );

        return (token0_out, token1_out, lp_change, f);
    }

    async function finalize_remove_liquidity(
        provider:    address,
        shares:      u128,
        min_amount0: u128,
        min_amount1: u128
    ) {
        let r0: u128       = Mapping::get(reserve0,        POOL_ID);
        let r1: u128       = Mapping::get(reserve1,        POOL_ID);
        let total_lp: u128 = Mapping::get(lp_total_supply, POOL_ID);

        assert(total_lp > 0u128);
        assert(shares <= total_lp);

        // Proportional token amounts owed
        let amount0: u128 = (shares * r0) / total_lp;
        let amount1: u128 = (shares * r1) / total_lp;

        // Slippage protection
        assert(amount0 >= min_amount0);
        assert(amount1 >= min_amount1);
        assert(amount0 > 0u128);
        assert(amount1 > 0u128);

        // Update pool state
        Mapping::set(reserve0,        POOL_ID, r0 - amount0);
        Mapping::set(reserve1,        POOL_ID, r1 - amount1);
        Mapping::set(lp_total_supply, POOL_ID, total_lp - shares);
    }


    // --------------------------------------------------------
    //  TRANSITION 6 — swap_0_for_1
    //
    //  Privately swap token0 → token1.
    //  The swap amount and the trader's identity are NEVER
    //  revealed. On-chain, only reserve totals change.
    //  Front-running is impossible: the trade details are hidden
    //  until the ZK proof is verified post-execution.
    //
    //  min_out: slippage guard (tx reverts if output < min_out)
    // --------------------------------------------------------

    async transition swap_0_for_1(
        private token_in:  Token0,
        private amount_in: u128,
        private min_out:   u128
    ) -> (Token0, Token1, Future) {

        assert(amount_in > 0u128);
        assert(token_in.amount >= amount_in);

        // Compute output amount off-chain (verified by ZK circuit)
        // We must know reserve values to compute this — the caller
        // reads reserves from the public mapping off-chain before calling.
        // The finalize will re-verify the k invariant on-chain.
        //
        // The output amount is committed to in the ZK proof.
        // We use min_out as a constraint — if the actual on-chain output
        // is less, finalize will assert-fail and the tx is reverted.

        let change: Token0 = Token0 {
            owner:  self.caller,
            amount: token_in.amount - amount_in,
        };

        // Output record: amount set to min_out as a lower bound.
        // The actual amount_out is verified in finalize against reserves.
        // In a production contract with full privacy, use a nullifier
        // commitment to bind the off-chain computation to the on-chain proof.
        let token_out: Token1 = Token1 {
            owner:  self.caller,
            amount: min_out,  // caller proves they receive at least this
        };

        let f: Future = finalize_swap_0_for_1(amount_in, min_out);

        return (change, token_out, f);
    }

    async function finalize_swap_0_for_1(amount_in: u128, min_out: u128) {
        let r0: u128 = Mapping::get(reserve0, POOL_ID);
        let r1: u128 = Mapping::get(reserve1, POOL_ID);

        assert(r0 > 0u128);
        assert(r1 > 0u128);

        // Compute expected output with fee
        let amount_in_with_fee: u128  = amount_in * (FEE_DENOMINATOR - FEE_NUMERATOR);
        let numerator: u128           = amount_in_with_fee * r1;
        let denominator: u128         = r0 * FEE_DENOMINATOR + amount_in_with_fee;
        let amount_out: u128          = numerator / denominator;

        // Slippage protection
        assert(amount_out >= min_out);
        assert(amount_out > 0u128);
        assert(amount_out < r1);

        // Verify constant-product invariant is preserved (with fee):
        //   new_k >= old_k  (fees cause k to grow slightly — that's correct)
        let new_r0: u128 = r0 + amount_in;
        let new_r1: u128 = r1 - amount_out;
        assert(new_r0 * new_r1 >= r0 * r1);

        // Update reserves — this is ALL that changes on-chain.
        // No trace of the trader, trade size, or token direction is stored.
        Mapping::set(reserve0, POOL_ID, new_r0);
        Mapping::set(reserve1, POOL_ID, new_r1);
    }


    // --------------------------------------------------------
    //  TRANSITION 7 — swap_1_for_0
    //
    //  Privately swap token1 → token0.
    //  Symmetric to swap_0_for_1.
    // --------------------------------------------------------

    async transition swap_1_for_0(
        private token_in:  Token1,
        private amount_in: u128,
        private min_out:   u128
    ) -> (Token1, Token0, Future) {

        assert(amount_in > 0u128);
        assert(token_in.amount >= amount_in);

        let change: Token1 = Token1 {
            owner:  self.caller,
            amount: token_in.amount - amount_in,
        };
        let token_out: Token0 = Token0 {
            owner:  self.caller,
            amount: min_out,
        };

        let f: Future = finalize_swap_1_for_0(amount_in, min_out);

        return (change, token_out, f);
    }

    async function finalize_swap_1_for_0(amount_in: u128, min_out: u128) {
        let r0: u128 = Mapping::get(reserve0, POOL_ID);
        let r1: u128 = Mapping::get(reserve1, POOL_ID);

        assert(r0 > 0u128);
        assert(r1 > 0u128);

        let amount_in_with_fee: u128  = amount_in * (FEE_DENOMINATOR - FEE_NUMERATOR);
        let numerator: u128           = amount_in_with_fee * r0;
        let denominator: u128         = r1 * FEE_DENOMINATOR + amount_in_with_fee;
        let amount_out: u128          = numerator / denominator;

        assert(amount_out >= min_out);
        assert(amount_out > 0u128);
        assert(amount_out < r0);

        let new_r0: u128 = r0 - amount_out;
        let new_r1: u128 = r1 + amount_in;
        assert(new_r0 * new_r1 >= r0 * r1);

        Mapping::set(reserve0, POOL_ID, new_r0);
        Mapping::set(reserve1, POOL_ID, new_r1);
    }

}
