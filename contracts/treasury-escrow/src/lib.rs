#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short,
    Address, BytesN, Env, String as SorobanString, Symbol, Vec,
};

#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum MilestoneStatus {
    Draft = 0,
    Active = 1,
    EvidenceSubmitted = 2,
    Approved = 3,
    Disputed = 4,
    ReadyForRelease = 5,
    Released = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneKey {
    pub id: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub id: u32,
    pub title: SorobanString,
    pub amount: i128,
    pub status: u32,
    pub evidence_hash: Option<BytesN<32>>,
    pub created_at: u64,
    pub updated_at: u64,
    pub approved_at: Option<u64>,
    pub released_at: Option<u64>,
    pub disputed_at: Option<u64>,
    pub dispute_reason: Option<SorobanString>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowSummary {
    pub admin: Address,
    pub total_milestones: u32,
    pub total_amount: i128,
    pub released_amount: i128,
    pub pending_amount: i128,
    pub disputed_count: u32,
    pub completed_count: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EscrowError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    UnauthorizedAdmin = 3,
    InvalidMilestoneId = 4,
    MilestoneNotFound = 5,
    InvalidMilestoneStatus = 6,
    DuplicateRelease = 7,
    ReleaseBeforeApproval = 8,
    ApprovalAfterDispute = 9,
    InvalidAmount = 10,
    EvidenceRequired = 11,
    DisputeResolutionRequired = 12,
    MilestoneAlreadyExists = 13,
    DisputeWithoutEvidence = 14,
    /// Evidence is write-once. Replacing a hash that is already recorded would
    /// let a later submission silently redefine what an approval attested to.
    EvidenceAlreadySubmitted = 15,
}

const ADMIN_KEY: Symbol = symbol_short!("admin");
const MILESTONE_COUNT: Symbol = symbol_short!("ms_cnt");
const MILESTONE_PREFIX: Symbol = symbol_short!("ms");
const VERSION_KEY: Symbol = symbol_short!("ver");

/// Current storage layout version. Increment when the on-chain struct layout
/// changes (new fields, renamed fields, reordered enums, etc.). Read helpers
/// and migration code branch on this value.
pub const CURRENT_STORAGE_VERSION: u32 = 1;

#[contract]
pub struct TreasuryEscrowContract;

#[contractimpl]
impl TreasuryEscrowContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), EscrowError> {
        if env.storage().instance().has(&ADMIN_KEY) {
            return Err(EscrowError::AlreadyInitialized);
        }
        env.storage().instance().set(&ADMIN_KEY, &admin);
        env.storage().instance().set(&MILESTONE_COUNT, &0u32);
        env.storage()
            .instance()
            .set(&VERSION_KEY, &CURRENT_STORAGE_VERSION);
        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("init")),
            (admin.clone(), CURRENT_STORAGE_VERSION),
        );
        Ok(())
    }

    fn require_admin(env: &Env) -> Result<Address, EscrowError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .ok_or(EscrowError::NotInitialized)?;
        admin.require_auth();
        Ok(admin)
    }

    /// Returns the storage layout version that was set at initialization time.
    /// If the contract has not been initialized, returns 0.
    pub fn storage_version(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&VERSION_KEY)
            .unwrap_or(0)
    }

    fn milestone_storage_key(id: u32) -> (Symbol, MilestoneKey) {
        (MILESTONE_PREFIX, MilestoneKey { id })
    }

    pub fn create_milestone(
        env: Env,
        id: u32,
        title: SorobanString,
        amount: i128,
    ) -> Result<u32, EscrowError> {
        Self::require_admin(&env)?;
        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }
        if id == 0 {
            return Err(EscrowError::InvalidMilestoneId);
        }
        let key = Self::milestone_storage_key(id);
        if env.storage().persistent().has(&key) {
            return Err(EscrowError::MilestoneAlreadyExists);
        }

        let now = env.ledger().timestamp();
        let milestone = Milestone {
            id,
            title: title.clone(),
            amount,
            status: MilestoneStatus::Draft as u32,
            evidence_hash: Option::None,
            created_at: now,
            updated_at: now,
            approved_at: Option::None,
            released_at: Option::None,
            disputed_at: Option::None,
            dispute_reason: Option::None,
        };
        env.storage().persistent().set(&key, &milestone);

        let mut count: u32 = env.storage().instance().get(&MILESTONE_COUNT).unwrap_or(0);
        count = count.saturating_add(1);
        env.storage().instance().set(&MILESTONE_COUNT, &count);

        env.events().publish(
            (symbol_short!("milestone"), symbol_short!("created")),
            (id, title, amount),
        );
        Ok(id)
    }

    pub fn assign_amount(env: Env, id: u32, amount: i128) -> Result<(), EscrowError> {
        Self::require_admin(&env)?;
        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }
        let key = Self::milestone_storage_key(id);
        let mut ms: Milestone = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(EscrowError::MilestoneNotFound)?;
        if ms.status > MilestoneStatus::Active as u32 {
            return Err(EscrowError::InvalidMilestoneStatus);
        }
        ms.amount = amount;
        ms.updated_at = env.ledger().timestamp();
        ms.status = MilestoneStatus::Active as u32;
        env.storage().persistent().set(&key, &ms);
        Ok(())
    }

    /// Records the evidence hash backing a milestone.
    ///
    /// Authorised: admin only. This is the entry point that unlocks both
    /// `approve_milestone` (which requires evidence to exist) and
    /// `dispute_milestone` (which requires status >= EvidenceSubmitted), so an
    /// unauthenticated caller here could drive another account's milestone
    /// through the approval gate.
    ///
    /// Evidence is write-once: once a hash is recorded it cannot be replaced,
    /// only disputed. Otherwise evidence could be swapped after the admin
    /// reviewed it but before release.
    pub fn submit_evidence(
        env: Env,
        id: u32,
        evidence_hash: BytesN<32>,
    ) -> Result<(), EscrowError> {
        Self::require_admin(&env)?;
        let key = Self::milestone_storage_key(id);
        let mut ms: Milestone = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(EscrowError::MilestoneNotFound)?;
        if ms.status >= MilestoneStatus::Released as u32 {
            return Err(EscrowError::InvalidMilestoneStatus);
        }
        if ms.evidence_hash.is_some() {
            return Err(EscrowError::EvidenceAlreadySubmitted);
        }
        ms.evidence_hash = Option::Some(evidence_hash.clone());
        ms.updated_at = env.ledger().timestamp();
        if ms.status < MilestoneStatus::EvidenceSubmitted as u32 {
            ms.status = MilestoneStatus::EvidenceSubmitted as u32;
        }
        env.storage().persistent().set(&key, &ms);

        env.events().publish(
            (symbol_short!("milestone"), symbol_short!("evidence")),
            (id, evidence_hash),
        );
        Ok(())
    }

    pub fn approve_milestone(env: Env, id: u32) -> Result<(), EscrowError> {
        Self::require_admin(&env)?;
        let key = Self::milestone_storage_key(id);
        let mut ms: Milestone = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(EscrowError::MilestoneNotFound)?;
        if ms.status == MilestoneStatus::Disputed as u32 {
            return Err(EscrowError::ApprovalAfterDispute);
        }
        if ms.evidence_hash.is_none() {
            return Err(EscrowError::EvidenceRequired);
        }
        if ms.status >= MilestoneStatus::Released as u32 {
            return Err(EscrowError::InvalidMilestoneStatus);
        }
        ms.status = MilestoneStatus::Approved as u32;
        ms.approved_at = Option::Some(env.ledger().timestamp());
        ms.updated_at = ms.approved_at.unwrap();
        env.storage().persistent().set(&key, &ms);

        env.events().publish(
            (symbol_short!("milestone"), symbol_short!("approved")),
            id,
        );
        Ok(())
    }

    pub fn dispute_milestone(
        env: Env,
        id: u32,
        reason: SorobanString,
    ) -> Result<(), EscrowError> {
        Self::require_admin(&env)?;
        let key = Self::milestone_storage_key(id);
        let mut ms: Milestone = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(EscrowError::MilestoneNotFound)?;
        if ms.status >= MilestoneStatus::Released as u32 {
            return Err(EscrowError::InvalidMilestoneStatus);
        }
        if ms.status < MilestoneStatus::EvidenceSubmitted as u32 {
            return Err(EscrowError::DisputeWithoutEvidence);
        }
        ms.status = MilestoneStatus::Disputed as u32;
        ms.disputed_at = Option::Some(env.ledger().timestamp());
        ms.dispute_reason = Option::Some(reason.clone());
        ms.updated_at = ms.disputed_at.unwrap();
        env.storage().persistent().set(&key, &ms);

        env.events().publish(
            (symbol_short!("milestone"), symbol_short!("disputed")),
            (id, reason),
        );
        Ok(())
    }

    pub fn mark_ready_for_release(env: Env, id: u32) -> Result<(), EscrowError> {
        Self::require_admin(&env)?;
        let key = Self::milestone_storage_key(id);
        let mut ms: Milestone = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(EscrowError::MilestoneNotFound)?;
        if ms.status != MilestoneStatus::Approved as u32 {
            return Err(EscrowError::ReleaseBeforeApproval);
        }
        ms.status = MilestoneStatus::ReadyForRelease as u32;
        ms.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &ms);

        env.events().publish(
            (symbol_short!("milestone"), symbol_short!("ready")),
            id,
        );
        Ok(())
    }

    pub fn release_milestone(env: Env, id: u32) -> Result<(), EscrowError> {
        Self::require_admin(&env)?;
        let key = Self::milestone_storage_key(id);
        let mut ms: Milestone = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(EscrowError::MilestoneNotFound)?;
        if ms.status == MilestoneStatus::Released as u32 {
            return Err(EscrowError::DuplicateRelease);
        }
        if ms.status != MilestoneStatus::ReadyForRelease as u32 {
            return Err(EscrowError::ReleaseBeforeApproval);
        }
        ms.status = MilestoneStatus::Released as u32;
        ms.released_at = Option::Some(env.ledger().timestamp());
        ms.updated_at = ms.released_at.unwrap();
        env.storage().persistent().set(&key, &ms);

        env.events().publish(
            (symbol_short!("milestone"), symbol_short!("released")),
            (id, ms.amount),
        );
        Ok(())
    }

    pub fn read_milestone(env: Env, id: u32) -> Result<Milestone, EscrowError> {
        let key = Self::milestone_storage_key(id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(EscrowError::MilestoneNotFound)
    }

    pub fn read_summary(env: Env) -> Result<EscrowSummary, EscrowError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .ok_or(EscrowError::NotInitialized)?;
        let count: u32 = env.storage().instance().get(&MILESTONE_COUNT).unwrap_or(0);
        let mut total_amount: i128 = 0;
        let mut released_amount: i128 = 0;
        let mut disputed_count: u32 = 0;
        let mut completed_count: u32 = 0;

        let mut ids: Vec<u32> = Vec::new(&env);
        for candidate in 1..=count {
            let key = Self::milestone_storage_key(candidate);
            if env.storage().persistent().has(&key) {
                ids.push_back(candidate);
            }
        }

        for id in ids.iter() {
            let key = Self::milestone_storage_key(id);
            let ms: Milestone = env
                .storage()
                .persistent()
                .get(&key)
                .ok_or(EscrowError::MilestoneNotFound)?;
            total_amount = total_amount.saturating_add(ms.amount);
            if ms.status == MilestoneStatus::Released as u32 {
                released_amount = released_amount.saturating_add(ms.amount);
                completed_count = completed_count.saturating_add(1);
            }
            if ms.status == MilestoneStatus::Disputed as u32 {
                disputed_count = disputed_count.saturating_add(1);
            }
        }

        let pending_amount = total_amount.saturating_sub(released_amount);
        Ok(EscrowSummary {
            admin,
            total_milestones: count,
            total_amount,
            released_amount,
            pending_amount,
            disputed_count,
            completed_count,
        })
    }
}

#[cfg(test)]
mod test;
