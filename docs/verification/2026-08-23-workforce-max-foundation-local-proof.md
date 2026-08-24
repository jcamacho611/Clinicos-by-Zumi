# Workforce Max Foundation — Focused Local Verification Evidence

Date: 2026-08-23
Branch: `feat/workforce-max-foundation-20260823`
Base: stacked on `design/klinikos-operating-network-20260823`

## Scope of this evidence

This document records focused executable proof for pure Workforce foundation modules created in the max-upgrade tranche.

It is **not** a full repository release verdict. GitHub Actions is still failing before checkout with `steps:null`, so no claim of CI-green, production deployment, browser QA, or full-repository build verification is made.

The local proof used TypeScript 5.8.3 and Node.js 22.16.0 in isolated throwaway fixtures that preserve the relevant module interfaces and exact pathway keys. Repository Vitest tests are committed separately and remain subject to an executable repository lane.

## Task 1 — Workforce configuration contract

### RED

A test imported `./workforce-configuration` and asserted:

- product = `edu`;
- configuration = `workforce`;
- exact pathways = `manufacturing`, `construction`, `logistics`, `healthcare`, `business_operations`;
- Career Readiness remains separate;
- human completion authority;
- 2-business-day attendance/completion reporting;
- 5-business-day survey reporting;
- 30-calendar-day launch.

TypeScript failed with:

```text
error TS2307: Cannot find module './workforce-configuration'
```

### GREEN

After the minimal configuration module was added, the focused TypeScript compile and executable assertion harness passed.

### Expanded RED/GREEN

Additional tests were then added for:

- Career Readiness class sizes 6 / 18 / 24 / 40 with second facilitator;
- Accelerator class sizes 6 / 15 / 20 / 30 with second facilitator;
- in-person recommended 12–20;
- no participant-paid AI subscription;
- SCWDB-approved/human-reviewed language access;
- routine live-remote and strategic in-person delivery;
- certificate does not convey licensure;
- training does not establish employment eligibility;
- approved-tool disclosure is required;
- public/unapproved AI may not receive restricted data.

The existing minimal module failed to compile because those fields did not exist. The expanded implementation then compiled and the focused harness passed.

## Task 2 — DOL AI-literacy / applied-learning projection

### RED

The test required:

```text
understand_ai
explore_uses
direct_ai_effectively
evaluate_outputs
use_ai_responsibly
```

plus the Klinikos loop:

```text
frame
protect
direct
inspect
verify
correct_or_escalate
explain_and_evidence
```

TypeScript failed because `workforce-learning-framework.ts` did not exist.

### GREEN

The projection was implemented over the existing `workforceAiLiteracyModules` source rather than a second curriculum registry. Focused compile/execution passed.

## Task 3 — Workforce evidence-chain projection

### Initial RED/GREEN

Tests proved:

- verified attendance does not equal completion;
- missing required applied/knowledge evidence blocks completion;
- completed evidence still requires explicit human completion approval before credential eligibility.

The module was absent in RED and passed after the first projection implementation.

### Adversarial failure discovered

A stronger test then supplied deliberately inconsistent downstream flags:

```text
enrolled=true
sessionScheduled=true
attendanceVerified=false
appliedEvidenceSatisfied=true
knowledgeSatisfied=true
instructorReviewed=true
completionApproved=true
credentialIssued=true
```

The first implementation incorrectly reported `completion_approval = satisfied` even though verified attendance was missing.

Observed failure:

```text
Error: downstream cannot bypass attendance: expected "blocked" got "satisfied"
```

### Corrected GREEN

The projection was rewritten as cumulative fail-closed truth:

```text
enrollment
→ session
→ verified attendance
→ applied evidence + knowledge
→ instructor review
→ explicit completion approval
→ credential
→ reporting
```

Downstream caller flags can no longer bypass a missing earlier gate. The adversarial harness then passed.

## Task 4 — Evaluator-safe Healthcare demo contract

### RED

The test required a synthetic Healthcare demo with:

- pathway = `healthcare`;
- authoritative referral status = `submitted`;
- flawed AI claim = `approved`;
- clinical-boundary action = `stop_and_escalate`;
- AI may not approve completion.

TypeScript failed because `workforce-demo.ts` did not exist.

### GREEN

The demo contract was derived from the merged Healthcare pathway and the focused harness passed.

## Task 7 — EDU → Grid discovery context

### RED

The test required:

- no context without explicit opt-in;
- released training evidence only;
- evidence kind = `training_completion`;
- no licensure authority;
- no employment-eligibility authority;
- no automatic application.

TypeScript failed because the bridge module did not exist.

### GREEN

A minimal read-only context was implemented and the focused harness passed.

## Public EDU / Living Home work

Repository source-contract tests were committed **before** the corresponding public page/router changes.

The public EDU page now imports the canonical merged Workforce program plus the new configuration/framework/demo modules and presents:

- the already-built institutional platform foundation;
- both service families;
- all five exact pathways;
- the applied-learning loop;
- the synthetic `submitted` vs `approved` evaluator scenario;
- Zumi/human-authority boundaries;
- launch/reporting/access assumptions from configuration.

The public Zumi product-question layer now routes workforce-board / AI-workforce-training intent to `/edu` with truthful existing-platform language and no SCWDB-customer, Kentucky-deployed, award, or participant-outcome claim.

These public changes still require repository type/lint/test/build and browser/mobile/accessibility verification before merge.

## Remaining verification gates

When an executable exact-head repository lane is available:

```bash
npx prisma validate
npm run type-check
npm test -- --run
npm run lint
npm run build
```

Also run repository-specific release/security/MVP/startup gates and browser QA for `/edu` at desktop/tablet/mobile widths.

Do not merge solely because GitHub reports the branch mergeable while Actions jobs remain unallocated.
