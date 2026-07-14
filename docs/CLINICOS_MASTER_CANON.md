# ClinicOS Master Canon

Version: `2026-07-14.1`

ClinicOS is a full multi-clinic EMR, healthcare operating system, interoperability network, longitudinal patient record, patient portal, revenue-cycle platform, quality-management system, connected-care system, and AI-assisted administrative platform.

## Product law

- Every feature stated in the project briefs is Priority Zero.
- Priority Zero means permanent product scope. It does not mean a capability is already connected.
- A feature may be marked `CONNECTED`, `DEMO`, `FOUNDATION`, `PLANNED`, `VENDOR_DEPENDENT`, or `GOVERNED`.
- Vendor-dependent capabilities remain visible through an adapter contract and a safe manual fallback.
- Features cannot be silently removed, downgraded, or relabeled as optional.
- No screen, route, seed, or table counts as complete unless it is connected to the correct workflow and verified.

The machine-readable source of truth is [`src/lib/feature-registry-canon.ts`](../src/lib/feature-registry-canon.ts). PostgreSQL mirrors the canon in `feature_registry_sections` and `feature_registry_capabilities`. Database constraints and triggers prevent ordinary deletion or Priority Zero downgrade.

## Combined vision

The canon combines every supplied ClinicOS brief into one product:

- Complete clinic EMR and operating system
- Verified connected-clinic network and master patient identity
- LifeChart Timeline and longitudinal record
- Care Constellation and virtual Care Team Rooms
- ClosedLoop Referrals, secure record exchange, and explicit consent
- Diagnostic Capacity Exchange and cross-clinic scheduling
- Injury Episode Room for no-fault and workers compensation
- Claim Readiness, coding assistance, billing, and revenue operations
- Health Passport, Consent Wallet, and Universal Intake Passport
- Patient portal, telemedicine, remote monitoring, and navigation
- Governed AI, medical knowledge, and approved-feedback learning
- Med-spa services, memberships, rewards adapters, and inventory
- Provider, pharmacy, laboratory, imaging, and credentialing networks
- Medical, Luxe, and Network interface modes
- Voice-first ClinicOS Copilot with typing fallback

## Voice-first contract

Voice is a first-class input method, not a separate product. Users can push to talk, see partial and final transcription, edit it, and confirm before an action runs on the same screen. Typing always remains available. Ambient recording is off by default.

The current browser speech implementation is a synthetic-data demonstration adapter. Production PHI transcription requires an approved vendor, consent and disclosure controls, a BAA assessment, retention rules, provenance, security review, failure recovery, and full audit logging.

## Completion gates

Every capability must evidence all 14 gates before it can be marked complete:

1. Defined user and purpose
2. Visible interface
3. Database architecture
4. Access and permission rules
5. Audit logging
6. Validation
7. Error and recovery behavior
8. Manual fallback
9. Integration contract where needed
10. Automated or documented testing
11. Synthetic demo data
12. Documentation
13. Security review
14. Acceptance criteria

## Design identity

ClinicOS is a luxury-grade healthcare command center for connected clinics: Apple-level calm, hospital command-center clarity, and luxury med-spa polish. Every screen must answer:

1. What is happening?
2. Who needs to act?
3. What is the next action?

Medical Mode uses pearl gray, navy, and clinical blue. Luxe Mode uses white, black, champagne, and restrained warm accents. Network Mode uses a dark mission-control surface for care graphs, exchanges, and journeys. Accessibility, responsive quick actions, keyboard support, loading states, errors, audit history, and safe fallbacks are part of the design, not afterthoughts.

## Claim safety

ClinicOS does not claim live connectivity merely because an integration is listed. It does not claim HIPAA certification. It does not allow AI to diagnose, prescribe, make final lab interpretations, approve refills, guarantee insurance, release records without authority, or make final legal or billing decisions. Clinical and high-risk outputs require human review, and emergency content stops routine automation.
