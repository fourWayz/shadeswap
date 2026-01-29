program private_reputation_system.aleo;

record PrivateReputation:
    owner as address.private;
    score as u64.private;
    nonce as u64.private;
    commitment as field.private;

struct PublicAnchor:
    ownedBy as address;
    commitment as field;
    issuer as address;
    nonce as u64;

struct ThresholdProof:
    commitment as field;
    threshold as u64;
    nonce as u64;

mapping latest_commitment_by_owner:
    key as address.public;
    value as field.public;

mapping anchor_by_commitment:
    key as field.public;
    value as PublicAnchor.public;

mapping issuer_whitelist:
    key as address.public;
    value as boolean.public;

function initialize_reputation:
    input r0 as address.private;
    input r1 as u64.private;
    input r2 as address.private;
    input r3 as signature.private;
    hash.psd2 r0 into r4 as field;
    sign.verify r3 r2 r4 into r5;
    assert.eq r5 true;
    hash.psd2 r0 into r6 as field;
    cast r0 r1 0u64 r6 into r7 as PrivateReputation.record;
    cast r0 r6 r2 0u64 into r8 as PublicAnchor;
    async initialize_reputation r0 r6 r8 r2 into r9;
    output r7 as PrivateReputation.record;
    output r9 as private_reputation_system.aleo/initialize_reputation.future;

finalize initialize_reputation:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as PublicAnchor.public;
    input r3 as address.public;
    get.or_use issuer_whitelist[r3] false into r4;
    assert.eq r4 true;
    set r1 into latest_commitment_by_owner[r0];
    set r2 into anchor_by_commitment[r1];

function update_reputation:
    input r0 as PrivateReputation.record;
    input r1 as i64.private;
    input r2 as address.private;
    input r3 as signature.private;
    assert.eq self.caller r0.owner;
    hash.psd2 r0.owner into r4 as field;
    sign.verify r3 r2 r4 into r5;
    assert.eq r5 true;
    gt r1 0i64 into r6;
    cast r1 into r7 as u64;
    add r0.score r7 into r8;
    gt r8 1000u64 into r9;
    ternary r9 1000u64 r8 into r10;
    mul r1 -1i64 into r11;
    cast r11 into r12 as u64;
    lt r0.score r12 into r13;
    sub r0.score r12 into r14;
    ternary r13 0u64 r14 into r15;
    ternary r6 r10 r15 into r16;
    add r0.nonce 1u64 into r17;
    hash.psd2 r0.owner into r18 as field;
    cast r0.owner r18 r2 r17 into r19 as PublicAnchor;
    cast r0.owner r16 r17 r18 into r20 as PrivateReputation.record;
    async update_reputation r0.owner r18 r19 r2 into r21;
    output r20 as PrivateReputation.record;
    output r21 as private_reputation_system.aleo/update_reputation.future;

finalize update_reputation:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as PublicAnchor.public;
    input r3 as address.public;
    get.or_use issuer_whitelist[r3] false into r4;
    assert.eq r4 true;
    set r1 into latest_commitment_by_owner[r0];
    set r2 into anchor_by_commitment[r1];

function generate_threshold_proof:
    input r0 as PrivateReputation.record;
    input r1 as u64.private;
    assert.eq self.caller r0.owner;
    gte r0.score r1 into r2;
    assert.eq r2 true;
    cast r0.commitment r1 r0.nonce into r3 as ThresholdProof;
    output r3 as ThresholdProof.private;

function verify_threshold_proof:
    input r0 as ThresholdProof.private;
    input r1 as address.private;
    input r2 as u64.private;
    gte r0.threshold r2 into r3;
    assert.eq r3 true;
    async verify_threshold_proof r0 r1 into r4;
    output r4 as private_reputation_system.aleo/verify_threshold_proof.future;

finalize verify_threshold_proof:
    input r0 as ThresholdProof.public;
    input r1 as address.public;
    get latest_commitment_by_owner[r1] into r2;
    assert.eq r2 r0.commitment;
    get anchor_by_commitment[r0.commitment] into r3;
    assert.eq r3.ownedBy r1;
    assert.eq r3.nonce r0.nonce;

function add_issuer:
    input r0 as address.private;
    async add_issuer r0 into r1;
    output r1 as private_reputation_system.aleo/add_issuer.future;

finalize add_issuer:
    input r0 as address.public;
    set true into issuer_whitelist[r0];
