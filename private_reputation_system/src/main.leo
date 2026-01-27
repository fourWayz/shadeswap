// The 'private_reputation_system' program.
program private_reputation_system.aleo {
   
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
    // ZK PROOF OUTPUT 
    // ------------------------------------------------------------
    struct ThresholdProof {
        commitment: field,
        threshold: u64,
        nonce: u64
    }


    @noupgrade
    async constructor() {}

    transition main(public a: u32, b: u32) -> u32 {
        let c: u32 = a + b;
        return c;
    }
}
