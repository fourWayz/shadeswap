// ============================================================
// Private Reputation / Credit System
// ============================================================

program private_reputation_system.aleo {

    // ------------------------------------------------------------
    // CONSTANTS
    // ------------------------------------------------------------
    const MAX_SCORE: u64 = 1000u64;
    const MIN_SCORE: u64 = 0u64;

    // ------------------------------------------------------------
    // PRIVATE RECORD
    // ------------------------------------------------------------
    record PrivateReputation {
        owner: address,
        score: u64,
        nonce: u64,          // increments on every update (replay protection)
        commitment: field
    }

    // ------------------------------------------------------------
    // PUBLIC ANCHOR
    // ------------------------------------------------------------
    struct PublicAnchor {
        owner: address,
        commitment: field,
        issuer: address,
        nonce: u64
    }

    // ------------------------------------------------------------
    // ZK PROOF OUTPUT (MINIMAL)
    // ------------------------------------------------------------
    struct ThresholdProof {
        commitment: field,
        threshold: u64,
        nonce: u64
    }

    // ------------------------------------------------------------
    // PUBLIC MAPPINGS 
    // ------------------------------------------------------------
    mapping latest_commitment_by_owner: address => field;
    mapping anchor_by_commitment: field => PublicAnchor;
    mapping issuer_whitelist: address => bool;

    // ============================================================
    // INITIALIZE REPUTATION
    // ============================================================
    transition initialize_reputation(
        owner: address,
        initial_score: u64,
        issuer: address,
        issuer_signature: signature
    ) -> (PrivateReputation, PublicAnchor) {

        // Verify issuer is authorized
        assert(issuer_whitelist[issuer]);

        // Verify issuer signature over initialization
        let message: field = hash(owner, initial_score);
        assert(verify(issuer, message, issuer_signature));

        // Generate initial commitment
        let commitment: field = hash(owner, initial_score, 0u64);

        let private_record: PrivateReputation = PrivateReputation {
            owner: owner,
            score: initial_score,
            nonce: 0u64,
            commitment: commitment
        };

        let anchor: PublicAnchor = PublicAnchor {
            owner: owner,
            commitment: commitment,
            issuer: issuer,
            nonce: 0u64
        };

        // Publish commitment
        latest_commitment_by_owner[owner] = commitment;
        anchor_by_commitment[commitment] = anchor;

        return (private_record, anchor);
    }

    // ============================================================
    // UPDATE REPUTATION (PRIVATE, REPLAY-SAFE)
    // ============================================================
    transition update_reputation(
        current: PrivateReputation,
        score_delta: i64,
        issuer: address,
        issuer_signature: signature
    ) -> PrivateReputation {

        // Ownership check
        assert(caller == current.owner);

        // Issuer authorization
        assert(issuer_whitelist[issuer]);

        // Verify issuer signature for THIS update
        let message: field = hash(current.owner, score_delta, current.nonce);
        assert(verify(issuer, message, issuer_signature));

        // Apply bounded score update
        let new_score: u64 = current.score;
        if score_delta > 0 {
            new_score = min(current.score + score_delta as u64, MAX_SCORE);
        } else {
            let decrease: u64 = abs(score_delta);
            new_score = max(current.score - decrease, MIN_SCORE);
        }

        // Increment nonce for replay protection
        let new_nonce: u64 = current.nonce + 1u64;

        // Generate new commitment
        let new_commitment: field = hash(current.owner, new_score, new_nonce);

        // Update public anchor
        latest_commitment_by_owner[current.owner] = new_commitment;
        anchor_by_commitment[new_commitment] = PublicAnchor {
            owner: current.owner,
            commitment: new_commitment,
            issuer: issuer,
            nonce: new_nonce
        };

        return PrivateReputation {
            owner: current.owner,
            score: new_score,
            nonce: new_nonce,
            commitment: new_commitment
        };
    }

    // ============================================================
    // GENERATE THRESHOLD PROOF (ZK)
    // ============================================================
    transition generate_threshold_proof(
        record: PrivateReputation,
        threshold: u64
    ) -> ThresholdProof {

        // Ensure caller owns the record
        assert(caller == record.owner);

        // Private score check
        assert(record.score >= threshold);

        return ThresholdProof {
            commitment: record.commitment,
            threshold: threshold,
            nonce: record.nonce
        };
    }

    // ============================================================
    // VERIFY THRESHOLD PROOF
    // ============================================================
    transition verify_threshold_proof(
        proof: ThresholdProof,
        owner: address,
        required_threshold: u64
    ) -> bool {

        // Threshold meets requirement
        assert(proof.threshold >= required_threshold);

        // Commitment is latest (replay safe)
        let latest: field = latest_commitment_by_owner[owner];
        assert(latest == proof.commitment);

        // Anchor exists and matches nonce
        let anchor: PublicAnchor = anchor_by_commitment[proof.commitment];
        assert(anchor.owner == owner);
        assert(anchor.nonce == proof.nonce);

        return true;
    }

    // ============================================================
    // ADMIN: ADD ISSUER
    // ============================================================
    transition add_issuer(admin: address, issuer: address) {
        assert(caller == admin);
        issuer_whitelist[issuer] = true;
    }

    // ============================================================
    // HELPER: MIN / MAX (optional, Leo-native)
    // ============================================================
    function min(a: u64, b: u64) -> u64 {
        if a <= b {
            return a;
        } else {
            return b;
        }
    }

    function max(a: u64, b: u64) -> u64 {
        if a >= b {
            return a;
        } else {
            return b;
        }
    }

    function abs(x: i64) -> u64 {
        if x >= 0 {
            return x as u64;
        } else {
            return (-x) as u64;
        }
    }
}
