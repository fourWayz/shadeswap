program shadeswap.aleo;

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
    output r0 as shadeswap.aleo/initialize_pool.future;

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
    output r4 as shadeswap.aleo/mint_token0.future;

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

function add_liquidity:
    input r0 as Token0.record;
    input r1 as Token1.record;
    input r2 as u128.private;
    input r3 as u128.private;
    input r4 as u128.private;
    gt r2 0u128 into r5;
    assert.eq r5 true;
    gt r3 0u128 into r6;
    assert.eq r6 true;
    gte r0.amount r2 into r7;
    assert.eq r7 true;
    gte r1.amount r3 into r8;
    assert.eq r8 true;
    sub r0.amount r2 into r9;
    cast self.signer r9 into r10 as Token0.record;
    sub r1.amount r3 into r11;
    cast self.signer r11 into r12 as Token1.record;
    cast self.signer r2 into r13 as LPToken.record;
    async add_liquidity self.signer r2 r3 r4 into r14;
    output r10 as Token0.record;
    output r12 as Token1.record;
    output r13 as LPToken.record;
    output r14 as shadeswap.aleo/add_liquidity.future;

finalize add_liquidity:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as u128.public;
    get.or_use reserve0[0u8] 0u128 into r4;
    get.or_use reserve1[0u8] 0u128 into r5;
    get.or_use lp_total_supply[0u8] 0u128 into r6;
    mul r1 r2 into r7;
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
    gt r4 0u128 into r38;
    mul r1 r6 into r39;
    div r39 r4 into r40;
    ternary r38 r40 0u128 into r41;
    gt r5 0u128 into r42;
    mul r2 r6 into r43;
    div r43 r5 into r44;
    ternary r42 r44 0u128 into r45;
    lt r41 r45 into r46;
    ternary r46 r41 r45 into r47;
    is.eq r6 0u128 into r48;
    ternary r48 r37 r47 into r49;
    gte r49 r3 into r50;
    assert.eq r50 true;
    gt r49 0u128 into r51;
    assert.eq r51 true;
    add r4 r1 into r52;
    set r52 into reserve0[0u8];
    add r5 r2 into r53;
    set r53 into reserve1[0u8];
    add r6 r49 into r54;
    set r54 into lp_total_supply[0u8];

function remove_liquidity:
    input r0 as LPToken.record;
    input r1 as u128.private;
    input r2 as u128.private;
    input r3 as u128.private;
    gt r1 0u128 into r4;
    assert.eq r4 true;
    gte r0.shares r1 into r5;
    assert.eq r5 true;
    cast self.signer 1u128 into r6 as Token0.record;
    cast self.signer 1u128 into r7 as Token1.record;
    sub r0.shares r1 into r8;
    cast self.signer r8 into r9 as LPToken.record;
    async remove_liquidity self.signer r1 r2 r3 into r10;
    output r6 as Token0.record;
    output r7 as Token1.record;
    output r9 as LPToken.record;
    output r10 as shadeswap.aleo/remove_liquidity.future;

finalize remove_liquidity:
    input r0 as address.public;
    input r1 as u128.public;
    input r2 as u128.public;
    input r3 as u128.public;
    get reserve0[0u8] into r4;
    get reserve1[0u8] into r5;
    get lp_total_supply[0u8] into r6;
    gt r6 0u128 into r7;
    assert.eq r7 true;
    lte r1 r6 into r8;
    assert.eq r8 true;
    mul r1 r4 into r9;
    div r9 r6 into r10;
    mul r1 r5 into r11;
    div r11 r6 into r12;
    gte r10 r2 into r13;
    assert.eq r13 true;
    gte r12 r3 into r14;
    assert.eq r14 true;
    sub r4 r10 into r15;
    set r15 into reserve0[0u8];
    sub r5 r12 into r16;
    set r16 into reserve1[0u8];
    sub r6 r1 into r17;
    set r17 into lp_total_supply[0u8];

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
    output r8 as shadeswap.aleo/swap_0_for_1.future;

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
    output r8 as shadeswap.aleo/swap_1_for_0.future;

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
