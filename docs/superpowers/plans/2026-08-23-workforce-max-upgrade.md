# Klinikos Workforce Max Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the merged SCWDB/Kentucky EDU stack into a canonical, reusable Workforce configuration with evaluator-proof product evidence, DOL AI-literacy mapping, deterministic evidence projection, governed Zumi demo orchestration, and truthful public buyer routing without duplicating existing EDU authority.

**Architecture:** Treat PR #260 / merged `main` Workforce code as source-of-truth. Add pure typed configuration/projection modules first, then surface them through existing EDU routes and public Living Home routing. No Kentucky fork, no new schema, no second completion engine, and no new authorization domain.

**Tech Stack:** Next.js, TypeScript, Vitest, existing Klinikos EDU repositories and shell, existing Living Home/Zumi routing, Prisma/PostgreSQL only as already used by merged EDU code.

**Spec:** `docs/superpowers/specs/2026-08-23-workforce-max-upgrade-design.md`

## Global Constraints

- PR #260 / merged `main` Workforce code is authoritative for curriculum, pathways, Career Readiness, sessions, attendance, assessment, completion, reporting, and representative materials.
- Exact Industry Accelerator pathway keys are `manufacturing`, `construction`, `logistics`, `healthcare`, `business_operations`.
- Career Readiness is a separate service family, not a sixth Industry Accelerator pathway.
- No Kentucky-specific product fork.
- No new database migration in this tranche.
- No duplicate attendance, completion, certificate, or pricing authority.
- Instructor/admin authority remains final for attendance verification and completion.
- Zumi cannot approve completion, create licensure/credential/employment authority, or widen authorization.
- Public/evaluator copy may say the platform foundation already exists, but may not claim SCWDB award/deployment, participant outcomes, certification, accreditation, or unbuilt integrations.
- Existing Black Label EDU shell/theme remains authoritative; do not create a second theme.
- GitHub Actions currently fails before checkout with `steps:null`; never call that CI-green evidence.
- TDD: write the behavior test first, verify RED in an executable lane, then implement minimal production code and verify GREEN.

---

### Task 1: Canonical Workforce Configuration Contract

**Files:**
- Create: `src/lib/edu/workforce/workforce-configuration.ts`
- Create: `src/lib/edu/workforce/workforce-configuration.test.ts`

**Interfaces:**
- Consumes: `workforceAiReadinessProgram`, `industryAcceleratorPathways`, `careerReadinessWorkshop` from `@/lib/edu/workforce-ai-program`.
- Produces: `WorkforceConfiguration`, `SCWDB_WORKFORCE_CONFIGURATION`, `getWorkforcePathwayKeys()`.

- [ ] **Step 1: Write the failing configuration tests**

```ts
import { describe, expect, it } from "vitest";
import {
  SCWDB_WORKFORCE_CONFIGURATION,
  getWorkforcePathwayKeys,
} from "./workforce-configuration";

describe("SCWDB Workforce configuration", () => {
  it("is an EDU Workforce configuration, not a forked product", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.product).toBe("edu");
    expect(SCWDB_WORKFORCE_CONFIGURATION.configuration).toBe("workforce");
  });

  it("derives the exact merged Industry Accelerator pathways", () => {
    expect(getWorkforcePathwayKeys()).toEqual([
      "manufacturing",
      "construction",
      "logistics",
      "healthcare",
      "business_operations",
    ]);
  });

  it("keeps Career Readiness separate from Industry Accelerator pathways", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceFamilies).toEqual([
      "industry_accelerator",
      "career_readiness",
    ]);
    expect(getWorkforcePathwayKeys()).not.toContain("career_readiness");
  });

  it("locks human completion authority and SCWDB reporting SLAs", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.authority.completion).toBe("human");
    expect(SCWDB_WORKFORCE_CONFIGURATION.authority.aiMayApproveCompletion).toBe(false);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.attendanceCompletionBusinessDays).toBe(2);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.surveyBusinessDays).toBe(5);
    expect(SCWDB_WORKFORCE_CONFIGURATION.serviceLevels.launchCalendarDays).toBe(30);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- src/lib/edu/workforce/workforce-configuration.test.ts
```

Expected: FAIL because `workforce-configuration.ts` does not exist.

- [ ] **Step 3: Implement the minimal typed configuration**

```ts
import {
  careerReadinessWorkshop,
  industryAcceleratorPathways,
  workforceAiReadinessProgram,
} from "@/lib/edu/workforce-ai-program";

export type WorkforceConfiguration = {
  product: "edu";
  configuration: "workforce";
  customer: {
    key: string;
    label: string;
  };
  serviceFamilies: readonly ["industry_accelerator", "career_readiness"];
  pathwayKeys: readonly (typeof industryAcceleratorPathways)[number]["key"][];
  deliveryModes: typeof workforceAiReadinessProgram.deliveryModes;
  serviceLevels: {
    implementationPlanBusinessDays: 15;
    launchCalendarDays: 30;
    attendanceCompletionBusinessDays: 2;
    surveyBusinessDays: 5;
    monthlyPerformanceReport: true;
    quarterlyCurriculumReview: true;
  };
  authority: {
    completion: "human";
    attendanceVerification: "human_or_authoritative_system";
    aiMayApproveCompletion: false;
  };
  participantAccess: {
    personalPaidAiSubscriptionRequired: false;
    standardAccessibleMaterialsIncluded: true;
    ordinaryCaptioningIncluded: true;
  };
};

export const SCWDB_WORKFORCE_CONFIGURATION: WorkforceConfiguration = {
  product: "edu",
  configuration: "workforce",
  customer: {
    key: "scwdb-kentucky-ai-workforce-readiness",
    label: "South Central Workforce Development Board",
  },
  serviceFamilies: ["industry_accelerator", "career_readiness"],
  pathwayKeys: industryAcceleratorPathways.map((pathway) => pathway.key),
  deliveryModes: workforceAiReadinessProgram.deliveryModes,
  serviceLevels: {
    implementationPlanBusinessDays: 15,
    launchCalendarDays: 30,
    attendanceCompletionBusinessDays: 2,
    surveyBusinessDays: 5,
    monthlyPerformanceReport: true,
    quarterlyCurriculumReview: true,
  },
  authority: {
    completion: "human",
    attendanceVerification: "human_or_authoritative_system",
    aiMayApproveCompletion: false,
  },
  participantAccess: {
    personalPaidAiSubscriptionRequired: false,
    standardAccessibleMaterialsIncluded: true,
    ordinaryCaptioningIncluded: true,
  },
};

export function getWorkforcePathwayKeys() {
  return [...SCWDB_WORKFORCE_CONFIGURATION.pathwayKeys];
}

void careerReadinessWorkshop;
```

- [ ] **Step 4: Run focused tests and TypeScript verification**

Run:

```bash
npm test -- src/lib/edu/workforce/workforce-configuration.test.ts
npm run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/edu/workforce/workforce-configuration.ts src/lib/edu/workforce/workforce-configuration.test.ts
git commit -m "feat(edu): add canonical Workforce configuration"
```

---

### Task 2: DOL AI Literacy + Klinikos Applied-Learning Projection

**Files:**
- Create: `src/lib/edu/workforce/workforce-learning-framework.ts`
- Create: `src/lib/edu/workforce/workforce-learning-framework.test.ts`

**Interfaces:**
- Consumes: `workforceAiLiteracyModules` from `@/lib/edu/workforce-ai-literacy`.
- Produces: `WORKFORCE_APPLIED_LEARNING_LOOP`, `getDolAiLiteracyAlignment()`.

- [ ] **Step 1: Write failing framework tests**

```ts
import { describe, expect, it } from "vitest";
import {
  WORKFORCE_APPLIED_LEARNING_LOOP,
  getDolAiLiteracyAlignment,
} from "./workforce-learning-framework";

describe("Workforce learning framework", () => {
  it("maps exactly five existing AI-literacy modules without creating a second curriculum", () => {
    const mapping = getDolAiLiteracyAlignment();
    expect(mapping).toHaveLength(5);
    expect(mapping.map((item) => item.moduleKey)).toEqual([
      "understand_ai",
      "explore_uses",
      "direct_ai_effectively",
      "evaluate_outputs",
      "use_ai_responsibly",
    ]);
  });

  it("uses the approved applied-learning loop", () => {
    expect(WORKFORCE_APPLIED_LEARNING_LOOP.map((stage) => stage.key)).toEqual([
      "frame",
      "protect",
      "direct",
      "inspect",
      "verify",
      "correct_or_escalate",
      "explain_and_evidence",
    ]);
  });
});
```

- [ ] **Step 2: Run and verify RED**

```bash
npm test -- src/lib/edu/workforce/workforce-learning-framework.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement projection-only framework**

```ts
import { workforceAiLiteracyModules } from "@/lib/edu/workforce-ai-literacy";

export const WORKFORCE_APPLIED_LEARNING_LOOP = [
  { key: "frame", label: "Frame", purpose: "Define the work objective, role, source records, and decision boundary." },
  { key: "protect", label: "Protect", purpose: "Remove unnecessary restricted, confidential, personal, or proprietary information." },
  { key: "direct", label: "Direct", purpose: "Give AI bounded context, constraints, and a clear task." },
  { key: "inspect", label: "Inspect", purpose: "Look for unsupported facts, overconfidence, missing context, bias, or unsafe assumptions." },
  { key: "verify", label: "Verify", purpose: "Check consequential claims against an authoritative source or accountable human." },
  { key: "correct_or_escalate", label: "Correct / escalate", purpose: "Correct supported work and escalate decisions outside the learner's authority." },
  { key: "explain_and_evidence", label: "Explain / evidence", purpose: "Explain what changed, why, what source was used, and who remained accountable." },
] as const;

export function getDolAiLiteracyAlignment() {
  return workforceAiLiteracyModules.map((module) => ({
    moduleKey: module.key,
    title: module.title,
    learningObjectives: module.learningObjectives,
    exercise: module.instructorLedExercise,
    evidence: module.assessmentEvidence,
  }));
}
```

- [ ] **Step 4: Verify GREEN**

```bash
npm test -- src/lib/edu/workforce/workforce-learning-framework.test.ts
npm run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/edu/workforce/workforce-learning-framework.ts src/lib/edu/workforce/workforce-learning-framework.test.ts
git commit -m "feat(edu): expose Workforce AI literacy framework"
```

---

### Task 3: Deterministic Workforce Evidence Projection

**Files:**
- Create: `src/lib/edu/workforce/workforce-evidence-chain.ts`
- Create: `src/lib/edu/workforce/workforce-evidence-chain.test.ts`
- Consume: existing `src/lib/edu/workforce-delivery-evidence.ts`; do not modify persistence in this task.

**Interfaces:**
- Produces: `WorkforceEvidenceStage`, `projectWorkforceEvidenceChain(input)`.
- Consumes: booleans/known persisted states derived by caller; does not write state.

- [ ] **Step 1: Write failing evidence tests**

```ts
import { describe, expect, it } from "vitest";
import { projectWorkforceEvidenceChain } from "./workforce-evidence-chain";

describe("Workforce evidence chain", () => {
  it("does not make registration or attendance equal completion", () => {
    const result = projectWorkforceEvidenceChain({
      enrolled: true,
      sessionScheduled: true,
      attendanceVerified: true,
      appliedEvidenceSatisfied: false,
      knowledgeSatisfied: false,
      instructorReviewed: false,
      completionApproved: false,
      credentialIssued: false,
    });
    expect(result.find((stage) => stage.key === "attendance")?.status).toBe("satisfied");
    expect(result.find((stage) => stage.key === "completion_approval")?.status).toBe("blocked");
  });

  it("requires explicit human completion approval before credential eligibility", () => {
    const result = projectWorkforceEvidenceChain({
      enrolled: true,
      sessionScheduled: true,
      attendanceVerified: true,
      appliedEvidenceSatisfied: true,
      knowledgeSatisfied: true,
      instructorReviewed: true,
      completionApproved: false,
      credentialIssued: false,
    });
    expect(result.find((stage) => stage.key === "completion_approval")?.status).toBe("action_required");
    expect(result.find((stage) => stage.key === "credential")?.status).toBe("blocked");
  });
});
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/lib/edu/workforce/workforce-evidence-chain.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure projection**

```ts
export type WorkforceEvidenceInput = {
  enrolled: boolean;
  sessionScheduled: boolean;
  attendanceVerified: boolean;
  appliedEvidenceSatisfied: boolean;
  knowledgeSatisfied: boolean;
  instructorReviewed: boolean;
  completionApproved: boolean;
  credentialIssued: boolean;
};

export type WorkforceEvidenceStageStatus = "satisfied" | "action_required" | "blocked";

export function projectWorkforceEvidenceChain(input: WorkforceEvidenceInput) {
  const prerequisites = {
    enrollment: input.enrolled,
    session: input.enrolled && input.sessionScheduled,
    attendance: input.enrolled && input.sessionScheduled && input.attendanceVerified,
    applied_evidence: input.attendanceVerified && input.appliedEvidenceSatisfied,
    knowledge: input.attendanceVerified && input.knowledgeSatisfied,
    instructor_review: input.appliedEvidenceSatisfied && input.knowledgeSatisfied && input.instructorReviewed,
    completion_approval: input.instructorReviewed && input.completionApproved,
    credential: input.completionApproved && input.credentialIssued,
    reporting: input.completionApproved,
  } as const;

  const order = [
    "enrollment",
    "session",
    "attendance",
    "applied_evidence",
    "knowledge",
    "instructor_review",
    "completion_approval",
    "credential",
    "reporting",
  ] as const;

  return order.map((key) => {
    const satisfied = prerequisites[key];
    const priorKey = order[Math.max(0, order.indexOf(key) - 1)];
    const priorSatisfied = key === "enrollment" ? true : prerequisites[priorKey];
    const humanAction = key === "completion_approval" && priorSatisfied && !satisfied;
    return {
      key,
      status: satisfied ? "satisfied" : humanAction ? "action_required" : "blocked",
    } as const;
  });
}
```

- [ ] **Step 4: Verify GREEN**

```bash
npm test -- src/lib/edu/workforce/workforce-evidence-chain.test.ts
npm run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/edu/workforce/workforce-evidence-chain.ts src/lib/edu/workforce/workforce-evidence-chain.test.ts
git commit -m "feat(edu): project Workforce evidence chain"
```

---

### Task 4: Evaluator-Safe Healthcare Demo Contract

**Files:**
- Create: `src/lib/edu/workforce/workforce-demo.ts`
- Create: `src/lib/edu/workforce/workforce-demo.test.ts`

**Interfaces:**
- Consumes: `industryAcceleratorPathways` and `WORKFORCE_APPLIED_LEARNING_LOOP`.
- Produces: `SCWDB_HEALTHCARE_EVALUATOR_DEMO` as static, synthetic, non-authoritative demonstration metadata.

- [ ] **Step 1: Write failing demo-contract tests**

```ts
import { describe, expect, it } from "vitest";
import { SCWDB_HEALTHCARE_EVALUATOR_DEMO } from "./workforce-demo";

describe("SCWDB healthcare evaluator demo", () => {
  it("is explicitly synthetic and uses the merged healthcare pathway", () => {
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.syntheticOnly).toBe(true);
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.pathwayKey).toBe("healthcare");
  });

  it("contains the submitted-versus-approved failure and clinical-boundary escalation", () => {
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.hiddenFailure.authoritativeStatus).toBe("submitted");
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.hiddenFailure.aiClaim).toBe("approved");
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.clinicalBoundary.requiredAction).toBe("stop_and_escalate");
  });

  it("does not give Zumi completion authority", () => {
    expect(SCWDB_HEALTHCARE_EVALUATOR_DEMO.authority.aiMayApproveCompletion).toBe(false);
  });
});
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/lib/edu/workforce/workforce-demo.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement synthetic demo metadata**

```ts
import { industryAcceleratorPathways } from "@/lib/edu/workforce-ai-program";

const healthcare = industryAcceleratorPathways.find((pathway) => pathway.key === "healthcare");
if (!healthcare) throw new Error("Healthcare Workforce pathway is required");

export const SCWDB_HEALTHCARE_EVALUATOR_DEMO = {
  key: "scwdb-healthcare-review-before-action",
  pathwayKey: healthcare.key,
  title: "Review before action",
  syntheticOnly: true,
  learnerSeat: "medical_assistant_patient_access",
  hiddenFailure: {
    authoritativeStatus: "submitted",
    aiClaim: "approved",
    learnerMust: ["identify_unsupported_claim", "verify_source", "correct_message"],
  },
  privacyChallenge: {
    publicUnapprovedAiMayReceiveRealPatientChart: false,
  },
  clinicalBoundary: {
    aiSuggestion: "medication_change",
    requiredAction: "stop_and_escalate",
  },
  authority: {
    instructorOwnsRubric: true,
    aiMayApproveCompletion: false,
  },
} as const;
```

- [ ] **Step 4: Verify GREEN**

```bash
npm test -- src/lib/edu/workforce/workforce-demo.test.ts
npm run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/edu/workforce/workforce-demo.ts src/lib/edu/workforce/workforce-demo.test.ts
git commit -m "feat(edu): add evaluator-safe Workforce demo contract"
```

---

### Task 5: Workforce Program Evidence Surface in Existing EDU

**Files:**
- Modify: `src/app/edu/(lab)/programs/page.tsx`
- Create: `src/components/edu/workforce-program-proof.tsx`
- Create: `tests/edu-workforce-program-proof.test.tsx` or the repository-standard adjacent source-contract test if route tests are non-DOM.

**Interfaces:**
- Consumes: `SCWDB_WORKFORCE_CONFIGURATION`, `getDolAiLiteracyAlignment`, `WORKFORCE_APPLIED_LEARNING_LOOP`, `SCWDB_HEALTHCARE_EVALUATOR_DEMO`.
- Produces: one existing-EDU proof section; no new route authority and no new data writes.

- [ ] **Step 1: Write a failing UI/source contract**

The test must prove all of the following appear from imported configuration rather than hardcoded duplicate pathway arrays:

```ts
expect(source).toContain("SCWDB_WORKFORCE_CONFIGURATION");
expect(source).toContain("WORKFORCE_APPLIED_LEARNING_LOOP");
expect(source).toContain("SCWDB_HEALTHCARE_EVALUATOR_DEMO");
expect(source).toContain("Already-built platform foundation");
expect(source).toContain("Instructor-controlled completion");
expect(source).not.toContain("professional-services");
expect(source).not.toContain("transportation-logistics");
```

- [ ] **Step 2: Verify RED**

Run the exact focused test.

Expected: FAIL because the proof component does not exist and the Programs page does not consume it.

- [ ] **Step 3: Implement `WorkforceProgramProof`**

The component should render compact sections for:

- existing-platform foundation;
- two service families;
- exact five pathway labels from the merged program;
- applied-learning loop;
- reporting/service-level commitments from configuration;
- Zumi/human-authority statement;
- evaluator-safe healthcare demo synopsis;
- 30-day configure/validate/rehearse/launch posture.

Do not add a separate theme. Use existing EDU shell/material classes or existing shared Black Label tokens.

- [ ] **Step 4: Mount the component from the existing Programs page**

Place it after the current Workforce program hero and before the pathway cards so evaluator proof is visible without replacing existing institutional navigation.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- <focused-workforce-proof-test>
npm run type-check
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/edu/'(lab)'/programs/page.tsx src/components/edu/workforce-program-proof.tsx <focused-test>
git commit -m "feat(edu): surface existing Workforce delivery proof"
```

---

### Task 6: Public Living Home / Zumi Workforce Buyer Intent

**Files:**
- Discover and modify: the existing public intent/copy source used by current Living Home/Zumi routing.
- Modify: the existing public intent regression test that already covers `sign up`, page context, and access routing; do not create a second public router.

**Interfaces:**
- Consumes: canonical Klinikos ecosystem message and `/edu` public destination.
- Produces: truthful answer + route for workforce-board/institutional-training intent.

- [ ] **Step 1: Locate the authoritative public intent source**

Run:

```bash
git grep -n "sign up\|join Klinikos\|what does Klinikos do\|page context" -- src tests
```

Use the same source repaired by PR #286.

- [ ] **Step 2: Add failing public-intent cases**

Add cases equivalent to:

```ts
expect(resolvePublicIntent("what can you do for a workforce board")).toMatchObject({
  destination: "/edu",
});
expect(resolvePublicIntent("AI workforce training")).toMatchObject({
  destination: "/edu",
});
```

The response copy must communicate:

`existing institutional EDU foundation + live instructor-led Workforce configuration + five occupational pathways + Career Readiness + governed Zumi practice + verified attendance/completion/reporting`.

It must not claim SCWDB is a customer or that Kentucky is deployed.

- [ ] **Step 3: Verify RED**

Run the focused public-intent test.

- [ ] **Step 4: Implement the smallest routing/copy change in the existing router**

Do not create a second intent resolver. Route qualified workforce-board/training-provider/institutional-AI-training questions to `/edu` with truthful buyer-facing copy.

- [ ] **Step 5: Verify**

Run the focused test, existing Living Home/public-intent suite, type-check, and lint.

- [ ] **Step 6: Commit**

```bash
git add <existing-public-intent-source> <existing-public-intent-test>
git commit -m "feat(site): route Workforce buyers into Klinikos EDU"
```

---

### Task 7: Read-Only EDU → Grid Discovery Bridge

**Files:**
- Create: `src/lib/edu/grid/edu-grid-discovery-context.ts`
- Create: `src/lib/edu/grid/edu-grid-discovery-context.test.ts`

**Interfaces:**
- Produces: `buildEduGridDiscoveryContext(input)`.
- Consumes: explicitly released training evidence supplied by caller plus explicit learner opt-in.
- Does not write Grid state or create eligibility/application authority.

- [ ] **Step 1: Write failing privacy/authority tests**

```ts
import { describe, expect, it } from "vitest";
import { buildEduGridDiscoveryContext } from "./edu-grid-discovery-context";

describe("EDU to Grid discovery context", () => {
  it("returns nothing without explicit learner opt-in", () => {
    expect(buildEduGridDiscoveryContext({
      optedIn: false,
      pathway: "healthcare",
      completionDate: "2026-08-23",
      releasedCompetencies: ["evaluate_ai_outputs"],
      opportunityIntents: ["work"],
    })).toBeNull();
  });

  it("labels training evidence as training, not licensure or employment eligibility", () => {
    const result = buildEduGridDiscoveryContext({
      optedIn: true,
      pathway: "healthcare",
      completionDate: "2026-08-23",
      releasedCompetencies: ["evaluate_ai_outputs"],
      opportunityIntents: ["work"],
    });
    expect(result?.evidenceKind).toBe("training_completion");
    expect(result?.establishesLicensure).toBe(false);
    expect(result?.establishesEmploymentEligibility).toBe(false);
    expect(result?.autoApply).toBe(false);
  });
});
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- src/lib/edu/grid/edu-grid-discovery-context.test.ts
```

- [ ] **Step 3: Implement minimal read-only context**

```ts
export type EduGridDiscoveryInput = {
  optedIn: boolean;
  pathway: string;
  completionDate: string;
  releasedCompetencies: readonly string[];
  opportunityIntents: readonly string[];
};

export function buildEduGridDiscoveryContext(input: EduGridDiscoveryInput) {
  if (!input.optedIn) return null;
  return {
    evidenceKind: "training_completion" as const,
    pathway: input.pathway,
    completionDate: input.completionDate,
    releasedCompetencies: [...input.releasedCompetencies],
    opportunityIntents: [...input.opportunityIntents],
    establishesLicensure: false as const,
    establishesEmploymentEligibility: false as const,
    autoApply: false as const,
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run focused test, relevant Grid/EDU tests, type-check, and lint.

- [ ] **Step 5: Commit**

```bash
git add src/lib/edu/grid/edu-grid-discovery-context.ts src/lib/edu/grid/edu-grid-discovery-context.test.ts
git commit -m "feat(network): add opt-in EDU to Grid discovery context"
```

---

### Task 8: Repository Truth + Release Verification

**Files:**
- Modify: `docs/FEATURE_STATUS.md` only for capabilities proven by merged/verified source.
- Modify: `docs/edu/kentucky-ai-workforce/RFP_COMPLIANCE_MATRIX.md` only where new evaluator-proof implementation is actually present.
- Modify: `docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md` to identify Workforce as an EDU configuration, not a product fork.

**Interfaces:**
- Consumes: all prior tasks and current repository verification state.
- Produces: repository truth alignment; no runtime behavior.

- [ ] **Step 1: Run exact focused suites**

Run all new focused tests from Tasks 1–7.

Expected: PASS.

- [ ] **Step 2: Run repository gates**

Run:

```bash
npx prisma validate
npm run type-check
npm test -- --run
npm run lint
npm run build
```

If the repository's canonical verification command differs, use the current documented release command in addition to the commands above.

- [ ] **Step 3: Do not hide baseline failures**

If failures reproduce known `main` problems from PR #292, record them as baseline/reconciliation blockers. Do not weaken tests or change unrelated product behavior solely to make this branch green.

- [ ] **Step 4: Update truth documents only for proven implementation**

Record:

- Workforce configuration contract;
- DOL framework projection;
- evaluator proof surface;
- deterministic evidence projection;
- public Workforce buyer routing;
- read-only opt-in EDU→Grid discovery context.

Keep future employer integrations, SSO, external credential verification, automatic Grid applications, and SCWDB deployment as unbuilt/not-awarded unless separately proven.

- [ ] **Step 5: Final security/authority review**

Confirm source contains no code path that allows:

- Zumi completion approval;
- AI attendance verification;
- training evidence to become licensure;
- training evidence to become employment eligibility;
- automatic Grid application;
- patient/clinical data to cross into Workforce demo data;
- Kentucky configuration to create a second product/tenant authority domain.

- [ ] **Step 6: Commit documentation convergence**

```bash
git add docs/FEATURE_STATUS.md docs/edu/kentucky-ai-workforce/RFP_COMPLIANCE_MATRIX.md docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md
git commit -m "docs: converge Workforce implementation truth"
```

- [ ] **Step 7: PR completion gate**

Do not call the branch merge-ready unless exact-head verification actually executes. If GitHub Actions still produces `steps:null`, state that runner allocation is unavailable and preserve local/external executable evidence separately.
