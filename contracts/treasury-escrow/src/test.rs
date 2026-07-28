use super::*;
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    Address, BytesN, Env, IntoVal, String as SorobanString,
};

fn setup_contract(env: &Env) -> (Address, Address, TreasuryEscrowContractClient<'_>) {
    let admin = Address::generate(env);
    let contract_id = env.register(TreasuryEscrowContract, ());
    let client = TreasuryEscrowContractClient::new(env, &contract_id);
    client.initialize(&admin);
    (admin, contract_id, client)
}

fn status_to_u32(s: MilestoneStatus) -> u32 {
    s as u32
}

#[test]
fn happy_path_milestone_lifecycle_through_release() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, _contract_id, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "Milestone 1: deliverable A");
    let id: u32 = client.create_milestone(&1u32, &title, &1_000_000i128);
    let ms = client.read_milestone(&id);
    assert_eq!(ms.id, 1);
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::Draft));
    assert_eq!(ms.amount, 1_000_000);

    client.assign_amount(&id, &5_000_000i128);
    let ms = client.read_milestone(&id);
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::Active));
    assert_eq!(ms.amount, 5_000_000);

    let ev: [u8; 32] = [0xABu8; 32];
    client.submit_evidence(&id, &BytesN::from_array(&env, &ev));
    let ms = client.read_milestone(&id);
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::EvidenceSubmitted));
    assert!(ms.evidence_hash.is_some());

    client.approve_milestone(&id);
    let ms = client.read_milestone(&id);
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::Approved));
    assert!(ms.approved_at.is_some());

    client.mark_ready_for_release(&id);
    assert_eq!(
        client.read_milestone(&id).status,
        status_to_u32(MilestoneStatus::ReadyForRelease)
    );

    client.release_milestone(&id);
    let ms = client.read_milestone(&id);
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::Released));
    assert!(ms.released_at.is_some());

    let summary = client.read_summary();
    assert_eq!(summary.admin, admin);
    assert_eq!(summary.total_milestones, 1);
    assert_eq!(summary.total_amount, 5_000_000);
    assert_eq!(summary.released_amount, 5_000_000);
    assert_eq!(summary.pending_amount, 0);
    assert_eq!(summary.completed_count, 1);
}

#[test]
fn duplicate_release_is_rejected_with_duplicate_release_error() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _contract_id, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "Duplicate release check");
    let id: u32 = client.create_milestone(&1u32, &title, &100i128);
    client.assign_amount(&id, &100i128);
    let ev: [u8; 32] = [0x01u8; 32];
    client.submit_evidence(&id, &BytesN::from_array(&env, &ev));
    client.approve_milestone(&id);
    client.mark_ready_for_release(&id);
    client.release_milestone(&id);

    let res = client.try_release_milestone(&id);
    assert_eq!(
        res.err().unwrap().unwrap(),
        EscrowError::DuplicateRelease
    );
}

#[test]
fn release_before_ready_is_blocked_with_release_before_approval_error() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _contract_id, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "Premature release");
    let id: u32 = client.create_milestone(&1u32, &title, &100i128);
    client.assign_amount(&id, &100i128);
    let ev: [u8; 32] = [0x02u8; 32];
    client.submit_evidence(&id, &BytesN::from_array(&env, &ev));

    let res = client.try_release_milestone(&id);
    assert_eq!(
        res.err().unwrap().unwrap(),
        EscrowError::ReleaseBeforeApproval
    );
}

#[test]
fn non_admin_cannot_call_admin_only_functions() {
    let env = Env::default();
    let (_, contract_id, client) = setup_contract(&env);
    let title = SorobanString::from_str(&env, "guarded");

    // Create a milestone as the real admin first, so the rejections below are
    // provably about authorisation and not about a missing milestone.
    env.mock_all_auths();
    client.create_milestone(&1u32, &title, &100i128);

    let intruder = Address::generate(&env);

    env.mock_auths(&[MockAuth {
        address: &intruder,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "create_milestone",
            args: (2u32, title.clone(), 100i128).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    assert!(client
        .try_create_milestone(&2u32, &title, &100i128)
        .is_err());

    env.mock_auths(&[MockAuth {
        address: &intruder,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "assign_amount",
            args: (1u32, 200i128).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    assert!(client.try_assign_amount(&1u32, &200i128).is_err());

    env.mock_auths(&[MockAuth {
        address: &intruder,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "release_milestone",
            args: (1u32,).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    assert!(client.try_release_milestone(&1u32).is_err());

    // The milestone is untouched: no intruder call mutated state.
    let ms = client.read_milestone(&1u32);
    assert_eq!(ms.amount, 100);
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::Draft));
}

#[test]
fn dispute_blocks_approval_until_explicitly_resolved() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _contract_id, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "Disputed milestone");
    let id: u32 = client.create_milestone(&1u32, &title, &100i128);
    client.assign_amount(&id, &100i128);
    let ev: [u8; 32] = [0x03u8; 32];
    client.submit_evidence(&id, &BytesN::from_array(&env, &ev));

    let reason = SorobanString::from_str(&env, "Evidence is insufficient");
    client.dispute_milestone(&id, &reason);
    assert_eq!(
        client.read_milestone(&id).status,
        status_to_u32(MilestoneStatus::Disputed)
    );

    let res = client.try_approve_milestone(&id);
    assert_eq!(
        res.err().unwrap().unwrap(),
        EscrowError::ApprovalAfterDispute
    );

    let summary = client.read_summary();
    assert_eq!(summary.disputed_count, 1);
}

#[test]
fn evidence_is_required_before_approval() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _contract_id, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "No evidence");
    let id: u32 = client.create_milestone(&1u32, &title, &100i128);
    client.assign_amount(&id, &100i128);

    let res = client.try_approve_milestone(&id);
    assert_eq!(
        res.err().unwrap().unwrap(),
        EscrowError::EvidenceRequired
    );
}

#[test]
fn invalid_milestone_ids_are_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _contract_id, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "bad id");
    let res = client.try_create_milestone(&0u32, &title, &100i128);
    assert_eq!(
        res.err().unwrap().unwrap(),
        EscrowError::InvalidMilestoneId
    );

    let res_read = client.try_read_milestone(&999u32);
    assert_eq!(
        res_read.err().unwrap().unwrap(),
        EscrowError::MilestoneNotFound
    );

    let res_release = client.try_release_milestone(&999u32);
    assert_eq!(
        res_release.err().unwrap().unwrap(),
        EscrowError::MilestoneNotFound
    );
}

#[test]
fn escrow_summary_tallies_multiple_milestones() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _contract_id, client) = setup_contract(&env);

    let t1 = SorobanString::from_str(&env, "MS1");
    let t2 = SorobanString::from_str(&env, "MS2");
    let t3 = SorobanString::from_str(&env, "MS3");
    client.create_milestone(&1u32, &t1, &100i128);
    client.create_milestone(&2u32, &t2, &200i128);
    client.create_milestone(&3u32, &t3, &400i128);

    client.assign_amount(&1u32, &100i128);
    client.assign_amount(&2u32, &200i128);
    client.assign_amount(&3u32, &400i128);

    let ev: [u8; 32] = [0x11u8; 32];
    client.submit_evidence(&1u32, &BytesN::from_array(&env, &ev));
    client.approve_milestone(&1u32);
    client.mark_ready_for_release(&1u32);
    client.release_milestone(&1u32);

    let ev2: [u8; 32] = [0x22u8; 32];
    client.submit_evidence(&2u32, &BytesN::from_array(&env, &ev2));
    let reason = SorobanString::from_str(&env, "rework needed");
    client.dispute_milestone(&2u32, &reason);

    let s = client.read_summary();
    assert_eq!(s.total_milestones, 3);
    assert_eq!(s.total_amount, 700);
    assert_eq!(s.released_amount, 100);
    assert_eq!(s.pending_amount, 600);
    assert_eq!(s.disputed_count, 1);
    assert_eq!(s.completed_count, 1);
}

#[test]
fn storage_version_returns_current_version_after_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _contract_id, client) = setup_contract(&env);

    let version = client.storage_version();
    assert_eq!(version, CURRENT_STORAGE_VERSION);
    assert_eq!(version, 1);
}

#[test]
fn storage_version_returns_zero_before_initialization() {
    let env = Env::default();
    let contract_id = env.register(TreasuryEscrowContract, ());
    let client = TreasuryEscrowContractClient::new(&env, &contract_id);

    let version = client.storage_version();
    assert_eq!(version, 0);
}

#[test]
fn initialize_event_includes_storage_version() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryEscrowContract, ());
    let client = TreasuryEscrowContractClient::new(&env, &contract_id);

    let res = client.try_initialize(&admin);
    assert!(res.is_ok());
    assert_eq!(client.storage_version(), CURRENT_STORAGE_VERSION);
}

#[test]
fn storage_version_is_persistent_across_reads() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, _contract_id, client) = setup_contract(&env);

    assert_eq!(client.storage_version(), 1);

    let title = SorobanString::from_str(&env, "Test milestone");
    client.create_milestone(&1u32, &title, &100i128);
    assert_eq!(client.storage_version(), 1);

    client.assign_amount(&1u32, &200i128);
    assert_eq!(client.storage_version(), 1);
}

// --- Admin misuse (issue #9) -------------------------------------------------
//
// These tests deliberately avoid `env.mock_all_auths()`. Blanket mocking makes
// every `require_auth()` succeed, which is structurally unable to detect a
// missing authorisation check — the reason the `submit_evidence` gap survived.

fn evidence(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

/// Sets up a contract with one Active milestone, returning scoped-auth handles.
fn setup_with_milestone(env: &Env) -> (Address, Address, TreasuryEscrowContractClient<'_>) {
    let (admin, contract_id, client) = setup_contract(env);
    env.mock_all_auths();
    let title = SorobanString::from_str(env, "deliverable");
    client.create_milestone(&1u32, &title, &100i128);
    client.assign_amount(&1u32, &100i128);
    (admin, contract_id, client)
}

#[test]
fn unauthenticated_submit_evidence_is_rejected() {
    let env = Env::default();
    let (_, contract_id, client) = setup_with_milestone(&env);

    let intruder = Address::generate(&env);
    let ev = evidence(&env, 0x99);

    env.mock_auths(&[MockAuth {
        address: &intruder,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "submit_evidence",
            args: (1u32, ev.clone()).into_val(&env),
            sub_invokes: &[],
        },
    }]);

    assert!(client.try_submit_evidence(&1u32, &ev).is_err());

    // The milestone was not advanced and no evidence was recorded.
    let ms = client.read_milestone(&1u32);
    assert!(ms.evidence_hash.is_none());
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::Active));
}

#[test]
fn intruder_cannot_unlock_the_approval_gate() {
    // Before the fix, an unauthenticated submit_evidence satisfied the
    // `evidence_hash.is_some()` precondition that approve_milestone requires.
    let env = Env::default();
    let (_, contract_id, client) = setup_with_milestone(&env);

    let intruder = Address::generate(&env);
    let ev = evidence(&env, 0x01);
    env.mock_auths(&[MockAuth {
        address: &intruder,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "submit_evidence",
            args: (1u32, ev.clone()).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    let _ = client.try_submit_evidence(&1u32, &ev);

    // The approval gate is still shut, for the right reason.
    env.mock_all_auths();
    assert_eq!(
        client.try_approve_milestone(&1u32).err().unwrap().unwrap(),
        EscrowError::EvidenceRequired
    );
}

#[test]
fn evidence_cannot_be_overwritten_once_recorded() {
    let env = Env::default();
    let (_, _contract_id, client) = setup_with_milestone(&env);

    let first = evidence(&env, 0xAA);
    client.submit_evidence(&1u32, &first);

    let second = evidence(&env, 0xBB);
    assert_eq!(
        client
            .try_submit_evidence(&1u32, &second)
            .err()
            .unwrap()
            .unwrap(),
        EscrowError::EvidenceAlreadySubmitted
    );

    // The original hash still stands.
    let ms = client.read_milestone(&1u32);
    assert_eq!(ms.evidence_hash, Some(first));
}

#[test]
fn evidence_cannot_be_swapped_after_approval() {
    // The dangerous ordering: admin reviews evidence, approves, and only then
    // is the evidence replaced — the approval would attest to something else.
    let env = Env::default();
    let (_, _contract_id, client) = setup_with_milestone(&env);

    let reviewed = evidence(&env, 0x10);
    client.submit_evidence(&1u32, &reviewed);
    client.approve_milestone(&1u32);

    assert_eq!(
        client
            .try_submit_evidence(&1u32, &evidence(&env, 0x20))
            .err()
            .unwrap()
            .unwrap(),
        EscrowError::EvidenceAlreadySubmitted
    );

    let ms = client.read_milestone(&1u32);
    assert_eq!(ms.evidence_hash, Some(reviewed));
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::Approved));
}

#[test]
fn admin_can_still_submit_evidence() {
    // Guards against a false positive: the gate must not block the admin.
    let env = Env::default();
    let (admin, contract_id, client) = setup_with_milestone(&env);

    let ev = evidence(&env, 0x77);
    env.mock_auths(&[MockAuth {
        address: &admin,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "submit_evidence",
            args: (1u32, ev.clone()).into_val(&env),
            sub_invokes: &[],
        },
    }]);

    client.submit_evidence(&1u32, &ev);
    let ms = client.read_milestone(&1u32);
    assert_eq!(ms.evidence_hash, Some(ev));
    assert_eq!(ms.status, status_to_u32(MilestoneStatus::EvidenceSubmitted));
}

#[test]
fn duplicate_release_is_impossible_under_scoped_auth() {
    // AC #1 re-verified without blanket auth mocking.
    let env = Env::default();
    let (admin, contract_id, client) = setup_with_milestone(&env);

    client.submit_evidence(&1u32, &evidence(&env, 0x33));
    client.approve_milestone(&1u32);
    client.mark_ready_for_release(&1u32);
    client.release_milestone(&1u32);

    env.mock_auths(&[MockAuth {
        address: &admin,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "release_milestone",
            args: (1u32,).into_val(&env),
            sub_invokes: &[],
        },
    }]);

    assert_eq!(
        client.try_release_milestone(&1u32).err().unwrap().unwrap(),
        EscrowError::DuplicateRelease
    );
    assert_eq!(client.read_summary().released_amount, 100);
}
