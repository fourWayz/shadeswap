/** 
 * ShadeSwap — Private AMM on Aleo
 * Similar to Uniswap v2, but balances and trades stay private
 */
program shadeswap_v8.aleo {

    /** 0.3% fee (Uniswap-style) */
    const FEE_NUMERATOR: u128   = 3u128;
    const FEE_DENOMINATOR: u128 = 1000u128;

    /** Small liquidity locked forever to avoid edge cases */
    const MINIMUM_LIQUIDITY: u128 = 1000u128;

    /** Single pool for now (can be extended later) */
    const POOL_ID: u8 = 0u8;

    /** Key used to store admin */
    const ADMIN_KEY: u8 = 0u8;


    /**
     * Private token balances (not visible on-chain)
     */
    record Token0 {
        owner:  address,
        amount: u128,
    }

    record Token1 {
        owner:  address,
        amount: u128,
    }

    /**
     * Private LP position (user's share stays hidden)
     */
    record LPToken {
        owner:  address,
        shares: u128,
    }


    /**
     * Public pool state (used for pricing)
     */
    mapping reserve0: u8 => u128;
    mapping reserve1: u8 => u128;

    /** Total LP supply */
    mapping lp_total_supply: u8 => u128;

    /** Admin + init flag */
    mapping admin: u8 => address;
    mapping pool_initialized: u8 => bool;


    /**
     * Integer square root (used for initial liquidity)
     */
    inline isqrt(n: u128) -> u128 {
        let x: u128  = n / 2u128;
        let y: u128  = (x  + n / x)  / 2u128;
        let y2: u128 = (y  + n / y)  / 2u128;
        let y3: u128 = (y2 + n / y2) / 2u128;
        let y4: u128 = (y3 + n / y3) / 2u128;
        let y5: u128 = (y4 + n / y4) / 2u128;
        let y6: u128 = (y5 + n / y5) / 2u128;
        let y7: u128 = (y6 + n / y6) / 2u128;
        let y8: u128 = (y7 + n / y7) / 2u128;
        return (y8 < y7) ? y8 : y7;
    }

    /** Returns the smaller of two values */
    inline min_u128(a: u128, b: u128) -> u128 {
        return (a < b) ? a : b;
    }

    /**
     * AMM pricing formula with fee applied
     */
    inline compute_amount_out(
        amount_in:   u128,
        reserve_in:  u128,
        reserve_out: u128
    ) -> u128 {
        let amount_in_with_fee: u128 = amount_in * (FEE_DENOMINATOR - FEE_NUMERATOR);
        let numerator: u128          = amount_in_with_fee * reserve_out;
        let denominator: u128        = reserve_in * FEE_DENOMINATOR + amount_in_with_fee;
        return numerator / denominator;
    }

    @noupgrade
    async constructor(
        ) {}

    /**
     * Initializes the pool (only once)
     */
    async transition initialize_pool() -> Future {
        return finalize_initialize_pool(self.caller);
    }

    async function finalize_initialize_pool(caller: address) {
        let already_init: bool = Mapping::get_or_use(pool_initialized, POOL_ID, false);
        assert(!already_init);

        Mapping::set(admin,            ADMIN_KEY, caller);
        Mapping::set(reserve0,         POOL_ID,   0u128);
        Mapping::set(reserve1,         POOL_ID,   0u128);
        Mapping::set(lp_total_supply,  POOL_ID,   0u128);
        Mapping::set(pool_initialized, POOL_ID,   true);
    }


    /**
     * Mint Token0 (admin-only in practice)
     */
    async transition mint_token0(public recipient: address, private amount: u128) -> (Token0, Future) {
        assert(amount > 0u128);
        let token: Token0 = Token0 { owner: recipient, amount };
        let f: Future     = finalize_mint_token0(self.caller);
        return (token, f);
    }

    async function finalize_mint_token0(caller: address) {
        let stored_admin: address = Mapping::get(admin, ADMIN_KEY);
        assert_eq(caller, stored_admin);
    }

    /**
     * Mint Token1
     */
    transition mint_token1(
        public  recipient: address,
        private amount:    u128
    ) -> Token1 {
        assert(amount > 0u128);
        return Token1 { owner: recipient, amount };
    }


    /**
     * Private transfer of Token0
     */
    transition transfer_token0(
        private token:     Token0,
        private recipient: address,
        private amount:    u128
    ) -> (Token0, Token0) {
        assert(amount > 0u128);
        assert(token.amount >= amount);

        let sent: Token0 = Token0 { owner: recipient, amount };
        let change: Token0 = Token0 {
            owner:  self.signer,
            amount: token.amount - amount,
        };
        return (sent, change);
    }

    /**
     * Private transfer of Token1
     */
    transition transfer_token1(
        private token:     Token1,
        private recipient: address,
        private amount:    u128
    ) -> (Token1, Token1) {
        assert(amount > 0u128);
        assert(token.amount >= amount);

        let sent: Token1 = Token1 { owner: recipient, amount };
        let change: Token1 = Token1 {
            owner:  self.signer,
            amount: token.amount - amount,
        };
        return (sent, change);
    }


    /**
     * Merge two Token0 records into one (consolidate SHADE records)
     */
    transition merge_token0(private r1: Token0, private r2: Token0) -> Token0 {
        return Token0 { owner: self.signer, amount: r1.amount + r2.amount };
    }

    /**
     * Merge two Token1 records into one (consolidate USDC records)
     */
    transition merge_token1(private r1: Token1, private r2: Token1) -> Token1 {
        return Token1 { owner: self.signer, amount: r1.amount + r2.amount };
    }

    /**
     * Merge two LPToken records into one (consolidate LP positions)
     */
    transition merge_lp(private r1: LPToken, private r2: LPToken) -> LPToken {
        return LPToken { owner: self.signer, shares: r1.shares + r2.shares };
    }


    /**
     * Add liquidity and receive LP shares
     */
    async transition add_liquidity(
        private token0_in:       Token0,
        private token1_in:       Token1,
        private amount0:         u128,
        private amount1:         u128,
        private expected_shares: u128,
        private min_shares:      u128
    ) -> (Token0, Token1, LPToken, Future) {

        assert(amount0 > 0u128);
        assert(amount1 > 0u128);
        assert(token0_in.amount >= amount0);
        assert(token1_in.amount >= amount1);
        assert(expected_shares >= min_shares);

        let change0: Token0 = Token0 {
            owner:  self.signer,
            amount: token0_in.amount - amount0,
        };
        let change1: Token1 = Token1 {
            owner:  self.signer,
            amount: token1_in.amount - amount1,
        };

        let lp_receipt: LPToken = LPToken {
            owner:  self.signer,
            shares: expected_shares,
        };

        let f: Future = finalize_add_liquidity(
            amount0,
            amount1,
            expected_shares,
            min_shares
        );

        return (change0, change1, lp_receipt, f);
    }

    async function finalize_add_liquidity(
        amount0:         u128,
        amount1:         u128,
        expected_shares: u128,
        min_shares:      u128
    ) {
        let r0: u128       = Mapping::get_or_use(reserve0,        POOL_ID, 0u128);
        let r1: u128       = Mapping::get_or_use(reserve1,        POOL_ID, 0u128);
        let total_lp: u128 = Mapping::get_or_use(lp_total_supply, POOL_ID, 0u128);

        let raw_sqrt: u128     = isqrt(amount0 * amount1);
        let first_shares: u128 = (raw_sqrt > MINIMUM_LIQUIDITY) ? raw_sqrt - MINIMUM_LIQUIDITY : 0u128;

        let safe_r0: u128           = (r0 == 0u128) ? 1u128 : r0;
        let safe_r1: u128           = (r1 == 0u128) ? 1u128 : r1;
        let shares0: u128           = (amount0 * total_lp) / safe_r0;
        let shares1: u128           = (amount1 * total_lp) / safe_r1;
        let subsequent_shares: u128 = min_u128(shares0, shares1);

        let actual_shares: u128 = (total_lp == 0u128) ? first_shares : subsequent_shares;

        // Verify the frontend's expected_shares <= what the formula gives
        assert(actual_shares >= expected_shares);
        assert(expected_shares >= min_shares);
        assert(expected_shares > 0u128);

        Mapping::set(reserve0,        POOL_ID, r0 + amount0);
        Mapping::set(reserve1,        POOL_ID, r1 + amount1);
        Mapping::set(lp_total_supply, POOL_ID, total_lp + expected_shares);
    }


    /**
     * Remove liquidity and get tokens back
     */
    async transition remove_liquidity(
        private lp_token:    LPToken,
        private shares:      u128,
        private amount0:     u128,
        private amount1:     u128,
        private min_amount0: u128,
        private min_amount1: u128
    ) -> (Token0, Token1, LPToken, Future) {

        assert(shares > 0u128);
        assert(lp_token.shares >= shares);
        assert(amount0 >= min_amount0);
        assert(amount1 >= min_amount1);

        let token0_out: Token0 = Token0 { owner: self.signer, amount: amount0 };
        let token1_out: Token1 = Token1 { owner: self.signer, amount: amount1 };

        let lp_change: LPToken = LPToken {
            owner:  self.signer,
            shares: lp_token.shares - shares,
        };

        let f: Future = finalize_remove_liquidity(
            shares,
            amount0,
            amount1,
            min_amount0,
            min_amount1
        );

        return (token0_out, token1_out, lp_change, f);
    }

    async function finalize_remove_liquidity(
        shares:      u128,
        amount0:     u128,
        amount1:     u128,
        min_amount0: u128,
        min_amount1: u128
    ) {
        let r0: u128       = Mapping::get(reserve0,        POOL_ID);
        let r1: u128       = Mapping::get(reserve1,        POOL_ID);
        let total_lp: u128 = Mapping::get(lp_total_supply, POOL_ID);

        assert(total_lp > 0u128);
        assert(shares <= total_lp);

        // Verify the amounts the frontend computed match on-chain formula.
        // We assert formula_amount >= amount so if reserves moved favorably
        // the extra stays in the pool (acts as slippage floor).
        let formula0: u128 = (shares * r0) / total_lp;
        let formula1: u128 = (shares * r1) / total_lp;

        assert(formula0 >= amount0);
        assert(formula1 >= amount1);
        assert(amount0 >= min_amount0);
        assert(amount1 >= min_amount1);

        Mapping::set(reserve0,        POOL_ID, r0 - amount0);
        Mapping::set(reserve1,        POOL_ID, r1 - amount1);
        Mapping::set(lp_total_supply, POOL_ID, total_lp - shares);
    }


    /**
     * Swap Token0 → Token1 privately
     */
    async transition swap_0_for_1(
        private token_in:  Token0,
        private amount_in: u128,
        private min_out:   u128
    ) -> (Token0, Token1, Future) {

        assert(amount_in > 0u128);
        assert(token_in.amount >= amount_in);

        let change: Token0 = Token0 {
            owner:  self.signer,
            amount: token_in.amount - amount_in,
        };

        let token_out: Token1 = Token1 {
            owner:  self.signer,
            amount: min_out,
        };

        let f: Future = finalize_swap_0_for_1(amount_in, min_out);
        return (change, token_out, f);
    }

    async function finalize_swap_0_for_1(amount_in: u128, min_out: u128) {
        let r0: u128 = Mapping::get(reserve0, POOL_ID);
        let r1: u128 = Mapping::get(reserve1, POOL_ID);

        assert(r0 > 0u128);
        assert(r1 > 0u128);

        let amount_out: u128 = compute_amount_out(amount_in, r0, r1);

        assert(amount_out >= min_out);
        assert(amount_out < r1);

        let new_r0: u128 = r0 + amount_in;
        let new_r1: u128 = r1 - amount_out;

        assert(new_r0 * new_r1 >= r0 * r1);

        Mapping::set(reserve0, POOL_ID, new_r0);
        Mapping::set(reserve1, POOL_ID, new_r1);
    }


    /**
     * Swap Token1 → Token0
     */
    async transition swap_1_for_0(
        private token_in:  Token1,
        private amount_in: u128,
        private min_out:   u128
    ) -> (Token1, Token0, Future) {

        assert(amount_in > 0u128);
        assert(token_in.amount >= amount_in);

        let change: Token1 = Token1 {
            owner:  self.signer,
            amount: token_in.amount - amount_in,
        };

        let token_out: Token0 = Token0 {
            owner:  self.signer,
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

        let amount_out: u128 = compute_amount_out(amount_in, r1, r0);

        assert(amount_out >= min_out);
        assert(amount_out < r0);

        let new_r0: u128 = r0 - amount_out;
        let new_r1: u128 = r1 + amount_in;

        assert(new_r0 * new_r1 >= r0 * r1);

        Mapping::set(reserve0, POOL_ID, new_r0);
        Mapping::set(reserve1, POOL_ID, new_r1);
    }

}