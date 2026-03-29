program shadeswap_v7.aleo;

record Token0:
    owner as address.private;
    amount as u128.private;

record Token1:
    owner as address.private;
    amount as u128.private;

record LPToken:
    owner as address.private;
    shares as u128.private;

mapping reserve0:
    key as u8.public;
    value as u128.public;

mapping reserve1:
    key as u8.public;
    value as u128.public;

mapping lp_total_supply:
    key as u8.public;
    value as u128.public;

mapping admin:
    key as u8.public;
    value as address.public;

mapping pool_initialized:
    key as u8.public;
    value as boolean.public;

function initialize_pool:
    async initialize_pool self.caller into r0;
    output r0 as shadeswap_v7.aleo/initialize_pool.future;

finalize initialize_pool:
    input r0 as address.public;
    get.or_use pool_initialized[0u8] false into r1;
    not r1 into r2;
    assert.eq r2 true;
    set r0 into admin[0u8];
    set 0u128 into reserve0[0u8];
    set 0u128 into reserve1[0u8];
    set 0u128 into lp_total_supply[0u8];
    set true into pool_initialized[0u8];

function mint_token0:
    input r0 as address.public;
    input r1 as u128.private;
    gt r1 0u128 into r2;
    assert.eq r2 true;
    cast r0 r1 into r3 as Token0.record;
    async mint_token0 self.caller into r4;
    output r3 as Token0.record;
    output r4 as shadeswap_v7.aleo/mint_token0.future;

finalize mint_token0:
    input r0 as address.public;
    get admin[0u8] into r1;
    assert.eq r0 r1;

function mint_token1:
    input r0 as address.public;
    input r1 as u128.private;
    gt r1 0u128 into r2;
    assert.eq r2 true;
    cast r0 r1 into r3 as Token1.record;
    output r3 as Token1.record;

function transfer_token0:
    input r0 as Token0.record;
    input r1 as address.private;
    input r2 as u128.private;
    gt r2 0u128 into r3;
    assert.eq r3 true;
    gte r0.amount r2 into r4;
    assert.eq r4 true;
    cast r1 r2 into r5 as Token0.record;
    sub r0.amount r2 into r6;
    cast self.signer r6 into r7 as Token0.record;
    output r5 as Token0.record;
    output r7 as Token0.record;

function transfer_token1:
    input r0 as Token1.record;
    input r1 as address.private;
    input r2 as u128.private;
    gt r2 0u128 into r3;
    assert.eq r3 true;
    gte r0.amount r2 into r4;
    assert.eq r4 true;
    cast r1 r2 into r5 as Token1.record;
    sub r0.amount r2 into r6;
    cast self.signer r6 into r7 as Token1.record;
    output r5 as Token1.record;
    output r7 as Token1.record;

function merge_token0:
    input r0 as Token0.record;
    input r1 as Token0.record;
    add r0.amount r1.amount into r2;
    cast self.signer r2 into r3 as Token0.record;
    output r3 as Token0.record;

function merge_token1:
    input r0 as Token1.record;
    input r1 as Token1.record;
    add r0.amount r1.amount into r2;
    cast self.signer r2 into r3 as Token1.record;
    output r3 as Token1.record;

function add_liquidity:
    input r0 as Token0.record;
    input r1 as Token1.record;
    input r2 as u128.private;
    input r3 as u128.private;
    input r4 as u128.private;
    input r5 as u128.private;
    gt r2 0u128 into r6;
    assert.eq r6 true;
    gt r3 0u128 into r7;
    assert.eq r7 true;
    gte r0.amount r2 into r8;
    assert.eq r8 true;
    gte r1.amount r3 into r9;
    assert.eq r9 true;
    gte r4 r5 into r10;
    assert.eq r10 true;
    sub r0.amount r2 into r11;
    cast self.signer r11 into r12 as Token0.record;
    sub r1.amount r3 into r13;
    cast self.signer r13 into r14 as Token1.record;
    cast self.signer r4 into r15 as LPToken.record;
    async add_liquidity r2 r3 r4 r5 into r16;
    output r12 as Token0.record;
    output r14 as Token1.record;
    output r15 as LPToken.record;
    output r16 as shadeswap_v7.aleo/add_liquidity.future;

finalize add_liquidity:
    input r0 as u128.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as u128.public;
    get.or_use reserve0[0u8] 0u128 into r4;
    get.or_use reserve1[0u8] 0u128 into r5;
    get.or_use lp_total_supply[0u8] 0u128 into r6;
    mul r0 r1 into r7;
    div r7 2u128 into r8;
    div r7 r8 into r9;
    add r8 r9 into r10;
    div r10 2u128 into r11;
    div r7 r11 into r12;
    add r11 r12 into r13;
    div r13 2u128 into r14;
    div r7 r14 into r15;
    add r14 r15 into r16;
    div r16 2u128 into r17;
    div r7 r17 into r18;
    add r17 r18 into r19;
    div r19 2u128 into r20;
    div r7 r20 into r21;
    add r20 r21 into r22;
    div r22 2u128 into r23;
    div r7 r23 into r24;
    add r23 r24 into r25;
    div r25 2u128 into r26;
    div r7 r26 into r27;
    add r26 r27 into r28;
    div r28 2u128 into r29;
    div r7 r29 into r30;
    add r29 r30 into r31;
    div r31 2u128 into r32;
    lt r32 r29 into r33;
    ternary r33 r32 r29 into r34;
    gt r34 1000u128 into r35;
    sub r34 1000u128 into r36;
    ternary r35 r36 0u128 into r37;
    is.eq r4 0u128 into r38;
    ternary r38 1u128 r4 into r39;
    is.eq r5 0u128 into r40;
    ternary r40 1u128 r5 into r41;
    mul r0 r6 into r42;
    div r42 r39 into r43;
    mul r1 r6 into r44;
    div r44 r41 into r45;
    lt r43 r45 into r46;
    ternary r46 r43 r45 into r47;
    is.eq r6 0u128 into r48;
    ternary r48 r37 r47 into r49;
    gte r49 r2 into r50;
    assert.eq r50 true;
    gte r2 r3 into r51;
    assert.eq r51 true;
    gt r2 0u128 into r52;
    assert.eq r52 true;
    add r4 r0 into r53;
    set r53 into reserve0[0u8];
    add r5 r1 into r54;
    set r54 into reserve1[0u8];
    add r6 r2 into r55;
    set r55 into lp_total_supply[0u8];

function remove_liquidity:
    input r0 as LPToken.record;
    input r1 as u128.private;
    input r2 as u128.private;
    input r3 as u128.private;
    input r4 as u128.private;
    input r5 as u128.private;
    gt r1 0u128 into r6;
    assert.eq r6 true;
    gte r0.shares r1 into r7;
    assert.eq r7 true;
    gte r2 r4 into r8;
    assert.eq r8 true;
    gte r3 r5 into r9;
    assert.eq r9 true;
    cast self.signer r2 into r10 as Token0.record;
    cast self.signer r3 into r11 as Token1.record;
    sub r0.shares r1 into r12;
    cast self.signer r12 into r13 as LPToken.record;
    async remove_liquidity r1 r2 r3 r4 r5 into r14;
    output r10 as Token0.record;
    output r11 as Token1.record;
    output r13 as LPToken.record;
    output r14 as shadeswap_v7.aleo/remove_liquidity.future;

finalize remove_liquidity:
    input r0 as u128.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as u128.public;
    input r4 as u128.public;
    get reserve0[0u8] into r5;
    get reserve1[0u8] into r6;
    get lp_total_supply[0u8] into r7;
    gt r7 0u128 into r8;
    assert.eq r8 true;
    lte r0 r7 into r9;
    assert.eq r9 true;
    mul r0 r5 into r10;
    div r10 r7 into r11;
    mul r0 r6 into r12;
    div r12 r7 into r13;
    gte r11 r1 into r14;
    assert.eq r14 true;
    gte r13 r2 into r15;
    assert.eq r15 true;
    gte r1 r3 into r16;
    assert.eq r16 true;
    gte r2 r4 into r17;
    assert.eq r17 true;
    sub r5 r1 into r18;
    set r18 into reserve0[0u8];
    sub r6 r2 into r19;
    set r19 into reserve1[0u8];
    sub r7 r0 into r20;
    set r20 into lp_total_supply[0u8];

function swap_0_for_1:
    input r0 as Token0.record;
    input r1 as u128.private;
    input r2 as u128.private;
    gt r1 0u128 into r3;
    assert.eq r3 true;
    gte r0.amount r1 into r4;
    assert.eq r4 true;
    sub r0.amount r1 into r5;
    cast self.signer r5 into r6 as Token0.record;
    cast self.signer r2 into r7 as Token1.record;
    async swap_0_for_1 r1 r2 into r8;
    output r6 as Token0.record;
    output r7 as Token1.record;
    output r8 as shadeswap_v7.aleo/swap_0_for_1.future;

finalize swap_0_for_1:
    input r0 as u128.public;
    input r1 as u128.public;
    get reserve0[0u8] into r2;
    get reserve1[0u8] into r3;
    gt r2 0u128 into r4;
    assert.eq r4 true;
    gt r3 0u128 into r5;
    assert.eq r5 true;
    mul r0 997u128 into r6;
    mul r6 r3 into r7;
    mul r2 1000u128 into r8;
    add r8 r6 into r9;
    div r7 r9 into r10;
    gte r10 r1 into r11;
    assert.eq r11 true;
    lt r10 r3 into r12;
    assert.eq r12 true;
    add r2 r0 into r13;
    sub r3 r10 into r14;
    mul r13 r14 into r15;
    mul r2 r3 into r16;
    gte r15 r16 into r17;
    assert.eq r17 true;
    set r13 into reserve0[0u8];
    set r14 into reserve1[0u8];

function swap_1_for_0:
    input r0 as Token1.record;
    input r1 as u128.private;
    input r2 as u128.private;
    gt r1 0u128 into r3;
    assert.eq r3 true;
    gte r0.amount r1 into r4;
    assert.eq r4 true;
    sub r0.amount r1 into r5;
    cast self.signer r5 into r6 as Token1.record;
    cast self.signer r2 into r7 as Token0.record;
    async swap_1_for_0 r1 r2 into r8;
    output r6 as Token1.record;
    output r7 as Token0.record;
    output r8 as shadeswap_v7.aleo/swap_1_for_0.future;

finalize swap_1_for_0:
    input r0 as u128.public;
    input r1 as u128.public;
    get reserve0[0u8] into r2;
    get reserve1[0u8] into r3;
    gt r2 0u128 into r4;
    assert.eq r4 true;
    gt r3 0u128 into r5;
    assert.eq r5 true;
    mul r0 997u128 into r6;
    mul r6 r2 into r7;
    mul r3 1000u128 into r8;
    add r8 r6 into r9;
    div r7 r9 into r10;
    gte r10 r1 into r11;
    assert.eq r11 true;
    lt r10 r2 into r12;
    assert.eq r12 true;
    sub r2 r10 into r13;
    add r3 r0 into r14;
    mul r13 r14 into r15;
    mul r2 r3 into r16;
    gte r15 r16 into r17;
    assert.eq r17 true;
    set r13 into reserve0[0u8];
    set r14 into reserve1[0u8];

constructor:
    assert.eq edition 0u16;
