program private_reputation_system.aleo {

    // ------------------------------------------------------------
    // CONSTANTS
    // ------------------------------------------------------------
    const MAX_SCORE: u64 = 1000u64;
    const MIN_SCORE: u64 = 0u64;

    record PrivateReputation {
        owner: address,
        score: u64,
        nonce: u64,
        commitment: field
    }

    struct PublicAnchor {
        ownedBy: address,
        commitment: field,
        issuer: address,
        nonce: u64
    }

    struct ThresholdProof {
        commitment: field,
        threshold: u64,
        nonce: u64
    }

    mapping latest_commitment_by_owner: address => field;
    mapping anchor_by_commitment: field => PublicAnchor;
    mapping issuer_whitelist: address => bool;

    // ============================================================
    // INITIALIZE REPUTATION
    // ============================================================
    async transition initialize_reputation(
        owner: address,
        initial_score: u64,
        issuer: address,
        issuer_signature: signature
    ) -> (PrivateReputation, Future) {

        // Verify issuer signature
        let message: field = Poseidon2::hash_to_field(owner); 
        let is_valid: bool = signature::verify(issuer_signature, issuer, message);
        assert(is_valid);

        let commitment: field = Poseidon2::hash_to_field(owner);

        let private_record: PrivateReputation = PrivateReputation {
            owner: owner,
            score: initial_score,
            nonce: 0u64,
            commitment: commitment
        };

        let anchor: PublicAnchor = PublicAnchor {
            ownedBy: owner,
            commitment: commitment,
            issuer: issuer,
            nonce: 0u64
        };

        return (private_record, finalize_initialize(owner, commitment, anchor, issuer));
    }

    async function finalize_initialize(owner: address, commitment: field, anchor: PublicAnchor, issuer: address) {
        let is_whitelisted: bool = Mapping::get_or_use(issuer_whitelist, issuer, false);
        assert(is_whitelisted);

        Mapping::set(latest_commitment_by_owner, owner, commitment);
        Mapping::set(anchor_by_commitment, commitment, anchor);
    }

    // ============================================================
    // UPDATE REPUTATION 
    // ============================================================
    async transition update_reputation(
        current: PrivateReputation,
        score_delta: i64,
        issuer: address,
        issuer_signature: signature
    ) -> (PrivateReputation, Future) {

        assert_eq(self.caller, current.owner);

        // Verify issuer signature 
        let message: field = Poseidon2::hash_to_field(current.owner);
        let is_valid: bool = signature::verify(issuer_signature, issuer, message);
        assert(is_valid);

        // Apply bounded score update
        let new_score: u64 = current.score;
        if (score_delta > 0i64) {
            let increase: u64 = score_delta as u64;
            let sum: u64 = current.score + increase;
            new_score = sum > MAX_SCORE ? MAX_SCORE : sum;
        } else {
            let decrease: u64 = (score_delta * -1i64) as u64;
            new_score = current.score < decrease ? MIN_SCORE : current.score - decrease;
        }

        let new_nonce: u64 = current.nonce + 1u64;
        let new_commitment: field = Poseidon2::hash_to_field(current.owner);

        let anchor: PublicAnchor = PublicAnchor {
            ownedBy: current.owner,
            commitment: new_commitment,
            issuer: issuer,
            nonce: new_nonce
        };

        let next_rec: PrivateReputation = PrivateReputation {
            owner: current.owner,
            score: new_score,
            nonce: new_nonce,
            commitment: new_commitment
        };

        return (next_rec, finalize_update(current.owner, new_commitment, anchor, issuer));
    }

    async function finalize_update(owner: address, commitment: field, anchor: PublicAnchor, issuer: address) {
        let is_whitelisted: bool = Mapping::get_or_use(issuer_whitelist, issuer, false);
        assert(is_whitelisted);

        Mapping::set(latest_commitment_by_owner, owner, commitment);
        Mapping::set(anchor_by_commitment, commitment, anchor);
    }

    // ============================================================
    // GENERATE THRESHOLD PROOF
    // ============================================================
    transition generate_threshold_proof(
        records: PrivateReputation,
        threshold: u64
    ) -> ThresholdProof {
        assert_eq(self.caller, records.owner);
        assert(records.score >= threshold);

        return ThresholdProof {
            commitment: records.commitment,
            threshold: threshold,
            nonce: records.nonce
        };
    }

    // ============================================================
    // VERIFY THRESHOLD PROOF
    // ============================================================
    async transition verify_threshold_proof(
        proof: ThresholdProof,
        owner: address,
        required_threshold: u64
    ) -> Future {
        assert(proof.threshold >= required_threshold);
        return finalize_verify_proof(proof, owner);
    }

    async function finalize_verify_proof(proof: ThresholdProof, owner: address) {
        let latest: field = Mapping::get(latest_commitment_by_owner, owner);
        assert_eq(latest, proof.commitment);

        let anchor: PublicAnchor = Mapping::get(anchor_by_commitment, proof.commitment);
        assert_eq(anchor.ownedBy, owner);
        assert_eq(anchor.nonce, proof.nonce);
    }

    // ============================================================
    // ADMIN: ADD ISSUER
    // ============================================================
    async transition add_issuer(issuer: address) -> Future {
        return finalize_add_issuer(issuer);
    }

    async function finalize_add_issuer(issuer: address) {
        Mapping::set(issuer_whitelist, issuer, true);
    }
}