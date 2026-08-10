import { describe, expect, it } from "vitest";
import { allCompetencyAreas, curriculumPackages, getCurriculumPackage } from "@/lib/edu/edu-curriculum";
import { canAccessEduRoute, eduNavigationForRole } from "@/lib/edu/edu-navigation";
import {
  canEdu,
  canFinalizeCompetency,
  eduSimulationRoleCatalog,
  eduSimulationRoles,
  isEduInstructorRole,
  simulationRoleGrantsClinicalAuthority,
} from "@/lib/edu/edu-roles";
import {
  canTransitionScenario,
  eduScenarioPayloadSchema,
  projectScenarioForStudent,
  scenarioIsAssignable,
  scenarioReadyToPublish,
  validateScenarioSafety,
} from "@/lib/edu/edu-scenario-rules";
import {
  CREDENTIAL_DISCLAIMER,
  EDU_AI_PROHIBITED_CAPABILITIES,
  NOT_A_CREDENTIAL_CLAIMS,
  SYNTHETIC_DATA_LABELS,
  evaluateEduAiRequest,
  eduAiGatewayStatus,
  scenarioTextIsSafe,
} from "@/lib/edu/edu-safety";

describe("EDU safety boundaries", () => {
  it("refuses every prohibited AI capability even when the gateway is available", () => {
    for (const capability of EDU_AI_PROHIBITED_CAPABILITIES) {
      const decision = evaluateEduAiRequest({ capability, gatewayAvailable: true });
      expect(decision.allowed).toBe(false);
      expect(decision).toMatchObject({ reason: "prohibited" });
    }
  });

  it("reports prohibition rather than unavailability when both apply", () => {
    // "The gateway is down" would wrongly imply diagnosis becomes allowed later.
    const decision = evaluateEduAiRequest({ capability: "diagnose", gatewayAvailable: false });
    expect(decision).toMatchObject({ allowed: false, reason: "prohibited" });
  });

  it("refuses an unrecognised capability instead of passing it through", () => {
    expect(evaluateEduAiRequest({ capability: "invent_something", gatewayAvailable: true }))
      .toMatchObject({ allowed: false, reason: "unknown_capability" });
  });

  it("fails closed while the AI gateway does not exist", () => {
    expect(eduAiGatewayStatus().available).toBe(false);
    expect(evaluateEduAiRequest({ capability: "draft_scenario", gatewayAvailable: eduAiGatewayStatus().available }))
      .toMatchObject({ allowed: false, reason: "gateway_unavailable" });
  });

  it("marks every permitted capability as requiring human review", () => {
    const decision = evaluateEduAiRequest({ capability: "educational_feedback", gatewayAvailable: true });
    expect(decision).toMatchObject({ allowed: true, requiresHumanReview: true });
  });

  it("states the three synthetic data labels", () => {
    expect(SYNTHETIC_DATA_LABELS).toEqual(["SYNTHETIC TRAINING DATA", "EDUCATIONAL SIMULATION", "NOT FOR REAL PATIENT CARE"]);
  });

  it("disclaims every credential claim the product must never make", () => {
    for (const claim of NOT_A_CREDENTIAL_CLAIMS) {
      expect(CREDENTIAL_DISCLAIMER.toLowerCase()).toContain(claim.toLowerCase());
    }
  });

  it("detects scenario language that presents the simulation as real care", () => {
    expect(scenarioTextIsSafe("Room the synthetic patient and verify intake.")).toBe(true);
    expect(scenarioTextIsSafe("Submit this claim to the payer immediately.")).toBe(false);
    expect(scenarioTextIsSafe("This is a real patient with chest pain.")).toBe(false);
  });
});

describe("EDU role model", () => {
  it("keeps grading away from students and observers", () => {
    expect(canEdu("edu_student", "grade", "grade")).toBe(false);
    expect(canEdu("edu_observer", "grade", "grade")).toBe(false);
    expect(canEdu("edu_instructor", "grade", "grade")).toBe(true);
    expect(canEdu("edu_assistant", "grade", "grade")).toBe(true);
  });

  it("lets an assistant assess work but not restructure a course or finalise competency", () => {
    expect(canEdu("edu_assistant", "grade", "grade")).toBe(true);
    expect(canEdu("edu_assistant", "course", "update")).toBe(false);
    expect(canFinalizeCompetency("edu_assistant")).toBe(false);
    expect(canFinalizeCompetency("edu_instructor")).toBe(true);
  });

  it("never lets a student read another student's instructor notes", () => {
    expect(canEdu("edu_student", "instructor_note", "read")).toBe(false);
  });

  it("gives an observer read-only reach and no submission access", () => {
    expect(canEdu("edu_observer", "course", "read")).toBe(true);
    expect(canEdu("edu_observer", "submission", "read")).toBe(false);
    expect(canEdu("edu_observer", "course", "update")).toBe(false);
  });

  it("treats a simulation seat as conferring no clinical authority", () => {
    for (const role of eduSimulationRoles) {
      expect(simulationRoleGrantsClinicalAuthority(role)).toBe(false);
    }
  });

  it("defines all eight clinic seats with queues and competency areas", () => {
    expect(eduSimulationRoleCatalog).toHaveLength(8);
    for (const role of eduSimulationRoleCatalog) {
      expect(role.queues.length).toBeGreaterThan(0);
      expect(role.competencyAreas.length).toBeGreaterThan(0);
    }
  });

  it("classifies instructor-side roles", () => {
    expect(isEduInstructorRole("edu_instructor")).toBe(true);
    expect(isEduInstructorRole("edu_student")).toBe(false);
  });
});

describe("EDU route architecture", () => {
  it("keeps grading off student navigation", () => {
    const studentHrefs = eduNavigationForRole("edu_student").flatMap((group) => group.items.map((item) => item.href));
    expect(studentHrefs).not.toContain("/edu/grading");
    expect(studentHrefs).toContain("/edu/dashboard");
  });

  it("denies students the grading and settings routes", () => {
    expect(canAccessEduRoute("edu_student", "/edu/grading")).toBe(false);
    expect(canAccessEduRoute("edu_student", "/edu/settings")).toBe(false);
    expect(canAccessEduRoute("edu_instructor", "/edu/grading")).toBe(true);
  });

  it("resolves a dynamic lab route by its longest matching prefix", () => {
    expect(canAccessEduRoute("edu_student", "/edu/lab/assignment_123")).toBe(true);
    expect(canAccessEduRoute("edu_observer", "/edu/lab/assignment_123")).toBe(false);
  });

  it("denies an unknown route rather than defaulting open", () => {
    expect(canAccessEduRoute("edu_admin", "/edu/not-a-route")).toBe(false);
  });
});

describe("EDU curriculum", () => {
  it("ships the eight launch packages", () => {
    expect(curriculumPackages).toHaveLength(8);
  });

  it("gives every package objectives, lessons, and competency areas", () => {
    for (const entry of curriculumPackages) {
      expect(entry.learningObjectives.length).toBeGreaterThan(0);
      expect(entry.lessons.length).toBeGreaterThan(0);
      expect(entry.competencyAreas.length).toBeGreaterThan(0);
      expect(entry.estimatedHours).toBeGreaterThan(0);
    }
  });

  it("resolves a package by key and reports unknown keys as undefined", () => {
    expect(getCurriculumPackage("medical_billing_claims")?.title).toBe("Medical Billing and Claims Workflow");
    expect(getCurriculumPackage("nope")).toBeUndefined();
  });

  it("exposes a de-duplicated competency vocabulary", () => {
    const areas = allCompetencyAreas();
    expect(areas.length).toBe(new Set(areas).size);
  });
});

describe("EDU scenario engine", () => {
  const payload = eduScenarioPayloadSchema.parse({
    openingBrief: "A synthetic primary-care morning with an overdue follow-up and an eligibility problem to resolve.",
    syntheticPatient: { displayName: "Synthetic Patient A", ageYears: 57, chiefConcern: "Diabetes follow-up", conditions: ["Type 2 diabetes"] },
    tasks: [
      { key: "verify_elig", queue: "eligibility", title: "Verify coverage before the visit", assignedSimulationRole: "front_desk", requiresEscalation: false },
      { key: "review_a1c", queue: "result_review", title: "Review the abnormal A1C result", assignedSimulationRole: "provider", requiresEscalation: true },
    ],
    events: [{ key: "a1c", type: "lab_result", label: "A1C returned above range", isProblem: true }],
    aiFeedbackPrompts: ["Explain which step the learner missed and why sequence matters."],
  });

  const answerKey = {
    expectedWorkflowSequence: [{ step: 1, simulationRole: "front_desk" as const, expectedAction: "Verify eligibility before rooming" }],
    criticalMisses: ["Failed to escalate the abnormal result"],
  };

  it("only allows a published scenario to be assigned", () => {
    expect(scenarioIsAssignable("published")).toBe(true);
    for (const status of ["draft", "in_review", "archived"]) {
      expect(scenarioIsAssignable(status)).toBe(false);
    }
  });

  it("enforces the scenario lifecycle", () => {
    expect(canTransitionScenario("draft", "in_review")).toBe(true);
    expect(canTransitionScenario("in_review", "published")).toBe(true);
    expect(canTransitionScenario("draft", "published")).toBe(false);
    expect(canTransitionScenario("archived", "published")).toBe(false);
  });

  it("never leaks the answer key or the assessment flags to a student", () => {
    const view = projectScenarioForStudent({
      title: "Diabetes follow-up", summary: "Synthetic scenario", setting: "primary_care",
      difficulty: "intermediate", estimatedMinutes: 45, payload, simulationRole: "front_desk",
    });

    const serialized = JSON.stringify(view);
    expect(serialized).not.toContain("expectedWorkflowSequence");
    expect(serialized).not.toContain("criticalMisses");
    expect(serialized).not.toContain("requiresEscalation");
    expect(serialized).not.toContain("isProblem");
    expect(serialized).not.toContain("aiFeedbackPrompts");
  });

  it("routes only the student's own seat tasks into their queue", () => {
    const view = projectScenarioForStudent({
      title: "T", summary: "S", setting: "primary_care", difficulty: "intermediate",
      estimatedMinutes: 45, payload, simulationRole: "front_desk",
    });
    expect(view.tasks.map((task) => task.key)).toEqual(["verify_elig"]);
  });

  it("carries the synthetic labels into every student view", () => {
    const view = projectScenarioForStudent({
      title: "T", summary: "S", setting: "primary_care", difficulty: "intermediate",
      estimatedMinutes: 45, payload, simulationRole: "provider",
    });
    expect(view.syntheticLabels).toEqual(SYNTHETIC_DATA_LABELS);
  });

  it("blocks publication of a scenario containing unsafe language", () => {
    const unsafe = { ...payload, openingBrief: "This is a real patient presenting to your clinic." };
    const issues = validateScenarioSafety({ title: "T", summary: "S", payload: unsafe });
    expect(issues.length).toBeGreaterThan(0);
    expect(scenarioReadyToPublish({ title: "T", summary: "S", payload: unsafe, answerKey }).ready).toBe(false);
  });

  it("allows publication once the scenario is safe and has an answer key", () => {
    expect(scenarioReadyToPublish({ title: "Diabetes follow-up", summary: "Synthetic scenario", payload, answerKey }).ready).toBe(true);
  });

  it("rejects a synthetic patient payload carrying a real-identifier field", () => {
    // The schema has no home for an MRN or SSN, so such a field cannot round-trip.
    const parsed = eduScenarioPayloadSchema.parse({
      ...payload,
      syntheticPatient: { ...payload.syntheticPatient, mrn: "REAL-123", ssn: "000-00-0000" },
    } as Record<string, unknown>);
    expect(parsed.syntheticPatient).not.toHaveProperty("mrn");
    expect(parsed.syntheticPatient).not.toHaveProperty("ssn");
  });
});
