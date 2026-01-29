# Private Reputation System - Aleo

## 🌟 Overview

A zero-knowledge reputation and credit scoring system built on Aleo that enables users to privately accumulate reputation scores and prove eligibility for services without revealing their actual scores or historical data.

**Core Innovation**: Users can generate cryptographic proofs demonstrating they meet minimum reputation thresholds (e.g., "score ≥ 700") while keeping their exact scores, history, and identity private.

---

## 📋 Contract Address

```
private_reputation_system.aleo
```

**Deployed on Aleo Testnet**: ✅ Yes  
**Status**: Active  

---

## 🎯 Core Features

### 1. **Private Reputation Records**
- Each user maintains a private record containing their score and nonce
- Only the record owner can access their actual reputation data
- Public commitments stored on-chain for verification

### 2. **Private Reputation Updates**
- Reputation scores can be updated by whitelisted issuers
- All updates happen privately off-chain
- On-chain storage only contains cryptographic commitments

### 3. **ZK Threshold Proofs** 
- Generate proofs that a reputation score meets or exceeds a threshold
- No revelation of actual score or historical data
- Verifiable by any third party or smart contract

### 4. **Issuer Management**
- Only approved issuers can update reputation scores
- Flexible issuer whitelisting via admin functions

---

##  System Architecture

### On-Chain Components (Aleo)
- **Public Anchors**: Cryptographic commitments linked to user addresses
- **Issuer Whitelist**: Authorized reputation issuers
- **Latest Commitments**: Mapping of user addresses to their most recent commitment

### Off-Chain Components
- **Private Reputation Records**: Stored locally by users
- **Proof Generation**: Computed client-side using Leo
- **External Database**: For enhanced UX (see below)

### External Database Schema
```sql
-- Optional: For frontend UX optimization
CREATE TABLE reputation_users (
    aleo_address VARCHAR(64) PRIMARY KEY,
    latest_commitment VARCHAR(128),
    proof_count INT DEFAULT 0,
    last_activity TIMESTAMP
);

CREATE TABLE verified_proofs (
    proof_id VARCHAR(128) PRIMARY KEY,
    user_address VARCHAR(64),
    threshold_proven INT,
    verification_time TIMESTAMP,
    verifier_address VARCHAR(64)
);
```

---

##  Workflow

### 1. **Initialization**
```
User → Request reputation initialization
Issuer → Signs initialization request
Contract → Creates private record + public anchor
```

### 2. **Reputation Update**
```
User → Presents current private record to issuer
Issuer → Computes new score, signs update
User → Submits update transaction
Contract → Stores new commitment
```

### 3. **Proof Generation & Verification**
```
User → Generates threshold proof locally
User → Presents proof to verifier (dApp/contract)
Verifier → Checks proof validity on-chain
Result → Boolean (proof valid/invalid)
```

---

## Data Structures

### Private Record (User-Held)
```leo
record PrivateReputation {
    owner: address,     // User's address
    score: u64,         // Current reputation score (0-1000)
    nonce: u64,         // Update counter
    commitment: field   // Cryptographic commitment
}
```

### Public Anchor (On-Chain)
```leo
struct PublicAnchor {
    ownedBy: address,   // User address
    commitment: field,  // Hash commitment
    issuer: address,    // Issuer who authorized
    nonce: u64          // Latest nonce
}
```

### Threshold Proof
```leo
struct ThresholdProof {
    commitment: field,  // Points to latest anchor
    threshold: u64,     // Proven lower bound
    nonce: u64          // Nonce at proof generation
}
```

---

##  Integration Guide

### For dApps/Verifiers
1. **Request Proof**: Ask users to generate a threshold proof
2. **Verify On-Chain**: Call `verify_threshold_proof`
3. **Grant Access**: Provide service if proof is valid

### For Issuers
1. **Get Whitelisted**: Contact system admin
2. **Issue Updates**: Sign reputation updates for users
3. **Maintain Integrity**: Follow reputation guidelines

### For Users
1. **Initialize**: Get your first reputation record
2. **Accumulate**: Complete actions to increase score
3. **Prove**: Generate proofs when needed

---

## 🔐 Security Considerations

### Privacy Guarantees
- ✅ Scores never revealed on-chain
- ✅ Update history remains private
- ✅ Proofs reveal only threshold information
- ✅ User identity protected (pseudonymous)

### Trust Assumptions
- **Issuer Trust**: Reputation accuracy depends on issuers
- **Key Management**: Users must secure private records
- **Nonce Management**: Prevents replay attacks

### Audit Status
- Code reviewed for ZK correctness
- Aleo VM compatibility verified
- Economic security analysis complete

---


## 📈 Use Cases

### **Lending Protocols**
- Prove creditworthiness without revealing score
- Private loan eligibility checks
- Risk-adjusted interest rates

### **Job Platforms**
- Verify minimum reputation for premium jobs
- Private freelancer ratings
- Trustless hiring decisions

### **DAO Governance**
- Reputation-based voting power
- Proposal submission thresholds
- Committee eligibility

### **Social Platforms**
- Private moderation privileges
- Content visibility thresholds
- Community standing proof

---


## 📄 License

Apache 2.0 License - See LICENSE file for details

---
