# KLINIKOS — ADVERSARIAL BUYER / ACCESSIBILITY / ENGINEERING AUDIT

Date: 2026-08-18 America/New_York  
Audit posture: skeptical buyer, procurement evaluator, accessibility auditor, senior engineer, security reviewer, and competitor.  
Baseline at branch creation: `main@c6763f8836bf338e22b4c4fcacbd7eb99a04c65c`.

## Purpose

This audit asks the opposite of a sales question: **what would a rigorous buyer use to reject Klinikos today?**

The objective is not to make every objection disappear through copy. The objective is to remove defects Klinikos controls, expose unresolved external conditions honestly, and prevent marketing language from outrunning runtime evidence.

## Kill case before remediation

A skeptical evaluator could reasonably reject the product for the following reasons:

1. The public Living Home presented deterministic intent routing behind timed `Listening → Understanding → Connecting → Preparing → Ready` states and called the surface an AI operating partner. A competitor could characterize the experience as simulated reasoning rather than a truthful preview.
2. Public routing could resolve to Grid, EDU, or the patient portal and then wrap the destination in clinic-staff authentication. Correct inference could therefore produce the wrong doorway.
3. The first fold was visually distinctive but did not explain the product category or operating value with enough specificity for a new buyer.
4. The public experience lacked a global skip link, a universal visible keyboard focus baseline, an equivalent mobile primary navigation, and an explicit accessible label for the main composer.
5. Several 9–10px muted colors on the public dark surface were below the 4.5:1 normal-text contrast target. Muted styling was taking precedence over readability.
6. The legal registry described many governed documents and routes while the application implemented only the privacy and access-terms pages. A buyer following a registry route could hit a missing surface, while the privacy notice itself correctly states that final counsel review is still required.
7. Internal security/readiness truth existed in repository documentation, but there was no public buyer-facing Trust & Readiness surface separating built, connected, externally unverified, blocked, and counsel-review states.
8. Public credibility leaned on academic honors and GPA. Those are legitimate personal accomplishments, but they are weak enterprise procurement evidence compared with healthcare operations exposure, security discipline, product proof, contracting-party diligence, insurance, and deployment evidence.
9. The Render build script applied production database migrations before compiling the application. A failed application build could therefore leave the production schema advanced while the prior application release remained active.
10. Recent exact-head GitHub Actions runs were refused before step 1 because of an external account-level runner/billing condition. That does not prove code failure, but it also does not provide exact-head CI evidence to a buyer.
11. Counsel approval, production PHI posture, externally verified integrations, controlled recurring-payment lifecycle evidence, controlled messaging evidence, certifications, uptime history, and customer reference/ROI proof remain incomplete or independently unverified.

## Code remediations in this branch

### Public truth instead of AI theater

The public Living Home is now explicitly a **deterministic routing preview**. It:

- resolves the user's outcome immediately with the existing deterministic routing engine;
- does not manufacture timed reasoning stages;
- explicitly says it is not a model conversation;
- explicitly says it does not open records or execute work;
- explicitly warns against entering patient names, records, diagnoses, or PHI;
- reserves authenticated operational intelligence and real work for governed product surfaces.

### Correct destination boundaries

Public destination routing now distinguishes:

- Grid / EDU / pricing / trust / ecosystem / how-it-works / founding-clinic / sales → public routes;
- patient portal → `/portal/login` and the separate patient-session boundary;
- clinic operational surfaces → clinic login with a same-origin continuation target.

### Buyer clarity

The public first fold now defines Klinikos as healthcare operating infrastructure spanning clinic workflow, follow-up, revenue, capacity, learning, and care navigation around accountable next actions.

### Accessibility baseline

The root application now includes:

- a keyboard-visible skip link targeting the application content wrapper;
- a high-contrast `:focus-visible` baseline;
- forced-colors focus support;
- a global reduced-motion fallback;
- an explicit main-composer label and description;
- mobile primary navigation;
- raised small-text contrast on the public Living Home and conversion bridge.

Regression tests calculate the key rose-surface color contrast and prohibit the specific low-contrast values removed by this remediation.

### Public Trust & Readiness

`/trust` now provides a non-certification public readiness register. It distinguishes:

- built;
- connected with bounded proof;
- pending runtime proof;
- blocked until independently approved;
- counsel / diligence review.

It explicitly states that paid software entitlement is not production PHI approval, compliance certification, a BAA, clinical authorization, or integration proof.

### Legal route truth

The dynamic `/legal/[document]` status route now resolves governed legal-registry routes without inventing final legal language. It exposes:

- document title;
- version;
- draft effective date;
- counsel-review requirement;
- production-approval status;
- registry notes;
- an explicit warning that the page is not final contractual language or legal advice.

Existing substantive privacy and access-terms pages retain precedence over the dynamic status route.

### Product-led public credibility

The public company story now emphasizes:

- healthcare operations exposure;
- security-focused technical training;
- systems/workflow building;
- cross-functional operating discipline;
- qualified leadership and contracting-party diligence before production agreement.

Academic awards, honor-society membership, and GPA are no longer used as enterprise product proof on the public company page.

### Safer deployment sequencing

The Render build script now compiles the exact application candidate **before** applying production migrations. If the app does not compile, the script exits without mutating the production schema.

This is not a substitute for backward-compatible migrations, release testing, backups, or a formal pre-deploy/release phase. It removes one avoidable partial-release failure mode.

## External blockers that code must not pretend to solve

The following remain external launch/diligence conditions unless later evidence proves otherwise:

- **GitHub Actions account condition — RESOLVED 2026-09-05.** Runners are allocated and jobs execute
  to completion (verified 2026-09-05: 401 `main` runs and 2,464 total; the eight most recent `main` runs all succeeded, and PR runs 2394-2433 executed to real conclusions including genuine test failures). This is no longer an external blocker. The standard it set survives:
  `steps:null` is not CI-green, and exact-head run evidence is still required.
- **Counsel:** finalize and approve public terms, privacy language, clinic agreements, BAA, security/data-processing terms, AI terms, Grid terms, communications terms, and jurisdiction-specific requirements for the launch scope.
- **Production PHI:** approve the exact database/hosting/storage/AI/communications/integration stack, BAAs, access controls, retention/deletion, logging, incident response, backups/restore, vendor register, and workload before PHI is allowed.
- **Deployment identity:** independently verify the production release SHA after each critical merge. A repo merge is not deployment proof.
- **Recurring Stripe:** keep the explicit recurring feature gate off until the deployed app contains the recurring code and a controlled live lifecycle proves paid activation, renewal, failure, cancellation, reconciliation, and expected entitlement behavior.
- **Twilio:** controlled live sending/inbound proofs, sender/A2P readiness where applicable, and PHI-specific approval remain separate from merged code.
- **Grid regulated fulfillment:** provider/license/malpractice/eligibility, healthcare fee-splitting/referral analysis, payout/settlement, disputes, tax/accounting, and class-specific policy require the applicable external proof and legal/commercial review.
- **Enterprise proof:** customer references, measured before/after operating results, production reliability history, formal certifications/attestations where pursued, support commitments, and security questionnaires must be earned rather than invented.

## Buyer verdict after this branch

This remediation does **not** turn Klinikos into a fully diligence-cleared enterprise healthcare platform by copy change.

It does materially improve the proposal because the public product now behaves like the architecture claims it behaves: deterministic where deterministic, authenticated where private, separate patient identity where patient-owned, explicit about production gates, accessible by keyboard, clearer about value, and willing to expose unresolved readiness work.

The remaining rejection reasons are increasingly external proof and operational maturity problems rather than avoidable product theater or obvious public-surface defects. Those remaining proofs should be treated as the next commercial roadmap, not hidden as marketing fine print.
