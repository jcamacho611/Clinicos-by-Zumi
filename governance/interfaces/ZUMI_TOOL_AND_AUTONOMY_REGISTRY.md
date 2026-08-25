# ZUMI Tool & Autonomy Registry

Status: GOVERNING CROSS-DOMAIN CONTRACT
Date: 2026-08-25

## Purpose

Define which real domain actions Zumi may observe, recommend, prepare or execute, and the hard ceilings on AI authority.

## Tool registration fields

Every tool must declare:

- toolId
- owningDomain
- purpose
- input schema
- output schema
- required identity/context
- authorization predicate
- PHI/PII class
- autonomy ceiling L0-L5
- human approval requirement
- idempotency/retry behavior
- audit/evidence requirement
- timeout/failure state
- cost class
- allowed environments

No generic unrestricted database-write tool is permitted.

## Autonomy levels

- **L0 Observe**: read/explain authorized state
- **L1 Recommend**: suggest evidence-backed next action
- **L2 Prepare**: create draft/structured proposed action
- **L3 Execute after approval**: authorized human confirms
- **L4 Pre-authorized autopilot**: explicit organization policy for low-risk deterministic operation
- **L5 Prohibited autonomy**: AI may not become final authority

## L5 prohibited classes

- diagnosis
- treatment selection
- prescription authority
- clinical signature
- professional licensure/credential verification without authoritative evidence
- patient consent
- high-risk clinical decision
- legal attestation
- unauthorized payment/settlement
- final professional eligibility based only on model opinion

## Platform / Living Home tools

- `living_home.list_actions` — L0
- `living_home.explain_action` — L0/L1
- `navigation.route_to_authorized_surface` — L1/L2
- `notification.acknowledge` — L3/L4 where configured

## Care tools

- `care.prepare_previsit_summary` — L2
- `care.explain_clinical_change` — L1/L2, evidence only
- `care.prepare_note_draft` — L2
- `care.prepare_order` — L2
- `care.prepare_referral` — L2
- `care.record_staff_handoff_draft` — L2/L3 depending actor
- `care.sign_note` — L5 AI prohibited; human/professional command only
- `care.diagnose` — no Zumi tool
- `care.prescribe` — no autonomous Zumi tool

## Insurance / Revenue tools

- `coverage.check_eligibility` — up to L4 when organization explicitly authorizes automated checks
- `authorization.detect_requirement` — L1/L2
- `authorization.prepare_request` — L2
- `authorization.submit_request` — L3; L4 only if policy/legal/workflow explicitly permits deterministic submission
- `coding.suggest_candidates` — L1/L2
- `coding.explain_evidence` — L1
- `coding.finalize_decision` — human/coder/provider authority, not autonomous AI
- `claim.prepare` — L2
- `claim.submit` — L3/L4 only when deterministic readiness/organization policy allows
- `denial.explain` — L1
- `appeal.prepare` — L2
- `appeal.submit` — L3
- `revenue.list_exceptions` — L0/L1

## Financial tools

- `offer.explain_active_offer` — L0/L1
- `checkout.prepare` — L2
- `payment.read_status` — L0
- `invoice.prepare` — L2
- `refund.prepare` — L2
- `refund.execute` — L3 and policy/financial authorization
- `discount.create_unapproved` — prohibited
- `payment.mark_success_without_evidence` — prohibited

## Grid tools

- `grid.prepare_demand` — L2
- `grid.prepare_resource` — L2
- `grid.evaluate_eligibility` — deterministic domain engine; Zumi may invoke, up to L3/L4
- `grid.explain_eligibility` — L1
- `grid.show_candidates` — L0/L1
- `grid.prepare_offer` — L2
- `grid.accept_offer` — L3
- `grid.publish_detected_capacity` — L3 unless explicit pre-authorization exists
- `grid.override_credential_failure` — prohibited

## Network tools

- `network.suggest_relationship` — L1
- `network.prepare_invitation` — L2
- `network.accept_relationship` — L3
- `network.grant_patient_record_access` — prohibited as a Network action

## EDU tools

- `edu.explain_curriculum` — L0/L1
- `edu.coach` — L1/L2 within learning boundaries
- `edu.prepare_instructor_summary` — L2
- `edu.score_deterministic_item` — up to L4 if configured answer key
- `edu.assign_human_rubric_score` — prohibited autonomous finality where human review is required
- `edu.issue_completion` — deterministic/human governed; Zumi may invoke only after CompletionEngine proves requirements
- `edu.create_license` — prohibited

## Identity / Trust tools

- `credential.explain_missing` — L1
- `credential.prepare_verification` — L2
- `credential.poll_authoritative_source` — up to L4
- `credential.mark_verified_from_model` — prohibited
- `access.prepare_review` — L2

## Digital business tools

- `operating_map.build` — L2/L4 from non-PHI user input
- `qualification.evaluate` — L1/L2 using approved rules
- `offer.recommend_active` — L1/L2
- `proposal.prepare` — L2
- `crm.create_or_update_from_evidence` — L3/L4
- `followup.send_approved` — L3/L4 under consent/frequency policy
- `onboarding.prepare_next_steps` — L2
- `pricing.invent_discount` — prohibited
- `contract.accept_nonstandard_terms` — prohibited

## Support / Webmaster tools

- `support.triage` — L1/L2
- `support.prepare_diagnostic_summary` — L2 with minimum data
- `webmaster.check_routes` — L4
- `webmaster.prepare_low_risk_fix` — L2
- `webmaster.deploy_production_without_release_gate` — prohibited

## Tool execution rules

1. Tool authorization is evaluated server-side before execution.
2. Model output is validated against a strict schema.
3. Consequential tools use idempotency/reconciliation where required.
4. Tool calls capture evidence/audit.
5. Tool failure returns explicit state; no fabricated success.
6. Tool access respects tenant, purpose, entitlement and professional authority.
7. Public Zumi cannot use authenticated/private tools.
