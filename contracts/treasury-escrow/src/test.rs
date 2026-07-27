use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String as SorobanString};

fn setup_contract(env: &Env) -> (Address, TreasuryEscrowContractClient<'_>) {
    let admin = Address::generate(env);
    let contract_id = env.register(TreasuryEscrowContract, ());
    let client = TreasuryEscrowContractClient::new(env, &contract_id);
    client.initialize(&admin);
    (admin, client)
}

fn status_to_u32(s: MilestoneStatus) -> u32 {
    s as u32
}

#[test]
fn happy_path_milestone_lifecycle_through_release() {
    let env = Env::default();
    env.mock_all_auths();
    let (admin, client) = setup_contract(&env);

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
    client.submit_evidence(&id, &ev.into());
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
    let (_, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "Duplicate release check");
    let id: u32 = client.create_milestone(&1u32, &title, &100i128);
    client.assign_amount(&id, &100i128);
    let ev: [u8; 32] = [0x01u8; 32];
    client.submit_evidence(&id, &ev.into());
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
    let (_, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "Premature release");
    let id: u32 = client.create_milestone(&1u32, &title, &100i128);
    client.assign_amount(&id, &100i128);
    let ev: [u8; 32] = [0x02u8; 32];
    client.submit_evidence(&id, &ev.into());

    let res = client.try_release_milestone(&id);
    assert_eq!(
        res.err().unwrap().unwrap(),
        EscrowError::ReleaseBeforeApproval
    );
}

#[test]
fn non_admin_cannot_call_admin_only_functions() {
    let env = Env::default();
    let (_, client) = setup_contract(&env);

    let admin2 = Address::generate(&env);
    env.set_auths(&[(admin2.clone(), Vec::new(&env))]);

    let title = SorobanString::from_str(&env, "unauth create");
    let res = client.try_create_milestone(&1u32, &title, &100i128);
    assert!(res.is_err());

    let admin3 = Address::generate(&env);
    env.set_auths(&[(admin3, Vec::new(&env))]);
    let res_assign = client.try_assign_amount(&1u32, &200i128);
    assert!(res_assign.is_err());

    let admin4 = Address::generate(&env);
    env.set_auths(&[(admin4, Vec::new(&env))]);
    let res_release = client.try_release_milestone(&1u32);
    assert!(res_release.is_err());
}

#[test]
fn dispute_blocks_approval_until_explicitly_resolved() {
    let env = Env::default();
    env.mock_all_auths();
    let (_, client) = setup_contract(&env);

    let title = SorobanString::from_str(&env, "Disputed milestone");
    let id: u32 = client.create_milestone(&1u32, &title, &100i128);
    client.assign_amount(&id, &100i128);
    let ev: [u8; 32] = [0x03u8; 32];
    client.submit_evidence(&id, &ev.into());

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
    let (_, client) = setup_contract(&env);

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
    let (_, client) = setup_contract(&env);

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
    let (_, client) = setup_contract(&env);

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
    client.submit_evidence(&1u32, &ev.into());
    client.approve_milestone(&1u32);
    client.mark_ready_for_release(&1u32);
    client.release_milestone(&1u32);

    let ev2: [u8; 32] = [0x22u8; 32];
    client.submit_evidence(&2u32, &ev2.into());
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
