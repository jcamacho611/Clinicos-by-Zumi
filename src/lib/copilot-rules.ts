import { z } from "zod";
import { EMERGENCY_MESSAGE, MEDICAL_SAFETY_MESSAGE, classifyWorkflow } from "@/lib/workflow-rules";

export const COPILOT_RULES_VERSION = "zumi-copilot-2026-08-10.1";

export const createCopilotRunSchema = z.object({
  inputText: z.string().trim().min(4).max(2000),
  inputMode: z.enum(["typed", "voice"]).default("typed"),
  patientId: z.string().trim().min(1).nullable().optional(),
  demoAcknowledged: z.literal(true),
});

export const reviewCopilotRunSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  notes: z.string().trim().min(8).max(500),
});

export type CopilotInputMode = z.infer<typeof createCopilotRunSchema>["inputMode"];

export interface CopilotDecision {
  intentKey: string;
  category: string;
  riskLevel: "Normal" | "Needs Staff" | "Needs Provider" | "Urgent" | "Do Not Automate";
  assignedTeam: string;
  confidence: number;
  status: "awaiting_review" | "urgent_hold";
  headline: string;
  explanation: string;
  draft: string;
  nextAction: string;
  blockedActions: string[];
  limitations: string[];
}

const includesAny = (value: string, patterns: string[]) => patterns.some((pattern) => value.includes(pattern));

function decision(input: Omit<CopilotDecision, "status" | "limitations">): CopilotDecision {
  return {
    ...input,
    status: input.riskLevel === "Urgent" || input.riskLevel === "Do Not Automate" ? "urgent_hold" : "awaiting_review",
    limitations: [
      "Administrative workflow support only. This is not diagnosis, prescribing, treatment, legal advice, or a final billing decision.",
      "No message, claim, referral, record, payment, or appointment was sent or completed.",
      "Synthetic demonstration data only. An authorized human must review every output.",
    ],
  };
}

export function buildCopilotDecision(inputText: string): CopilotDecision {
  const normalized = inputText.trim().toLowerCase();
  const safety = classifyWorkflow(inputText);

  if (safety.category === "Emergency Symptom") {
    return decision({
      intentKey: "emergency_escalation",
      category: safety.category,
      riskLevel: "Urgent",
      assignedTeam: "Provider / emergency review",
      confidence: 0.99,
      headline: "Routine processing stopped",
      explanation: "Emergency language was detected. ClinicOS created an urgent human-review hold and did not continue an ordinary workflow.",
      draft: `${EMERGENCY_MESSAGE} ${MEDICAL_SAFETY_MESSAGE}`,
      nextAction: "Notify the responsible human team immediately and document the response outside this draft.",
      blockedActions: ["Routine automation", "Clinical interpretation", "Patient message auto-send"],
    });
  }

  if (["BFM Lab Question", "BFM Medication / Refill Question"].includes(safety.category)) {
    return decision({
      intentKey: safety.category === "BFM Lab Question" ? "clinical_result_review" : "medication_review",
      category: safety.category,
      riskLevel: "Needs Provider",
      assignedTeam: "Provider",
      confidence: 0.97,
      headline: "Licensed provider review required",
      explanation: "The request crosses a clinical boundary. Zumi can route and prepare context, but it cannot interpret results, approve refills, prescribe, or recommend treatment.",
      draft: safety.safetyMessage ?? MEDICAL_SAFETY_MESSAGE,
      nextAction: safety.action,
      blockedActions: ["Clinical answer", "Medication approval", "Patient message auto-send"],
    });
  }

  if (safety.category === "Insurance Question") {
    return decision({
      intentKey: "insurance_verification",
      category: safety.category,
      riskLevel: "Needs Staff",
      assignedTeam: "Billing / eligibility staff",
      confidence: 0.96,
      headline: "Benefits verification prepared",
      explanation: "Zumi identified an insurance question and prepared the correct manual verification path without guaranteeing coverage.",
      draft: "We can collect the insurance information and have the office verify benefits, but coverage cannot be guaranteed until verification is completed.",
      nextAction: "Assign a benefits-verification task and record the source used by staff.",
      blockedActions: ["Coverage guarantee", "Eligibility decision", "Patient message auto-send"],
    });
  }

  if (includesAny(normalized, ["release records", "medical records", "patient chart", "send the chart", "share the chart", "download records", "chart to"])) {
    return decision({
      intentKey: "record_release_review",
      category: "Record Release Request",
      riskLevel: "Do Not Automate",
      assignedTeam: "Health information management",
      confidence: 0.96,
      headline: "Record release blocked for authority review",
      explanation: "The request may involve protected records. Zumi will not release, download, or share chart content without authority, consent, scope, and audit review.",
      draft: "A records specialist must verify authority, consent, scope, and delivery controls before any information is released.",
      nextAction: "Route to the authorized records team for a minimum-necessary review.",
      blockedActions: ["Record release", "Chart download", "External sharing"],
    });
  }

  if (includesAny(normalized, ["submit claim", "send claim", "file claim", "final coding", "approve billing"])) {
    return decision({
      intentKey: "claim_readiness_review",
      category: "Claim Readiness",
      riskLevel: "Do Not Automate",
      assignedTeam: "Revenue cycle",
      confidence: 0.95,
      headline: "Claim action held for biller review",
      explanation: "Zumi can identify missing claim-readiness items, but it cannot make final coding decisions or submit claims autonomously.",
      draft: "Prepare the documentation checklist, payer requirements, and missing-item queue for an authorized biller to review.",
      nextAction: "Open Claim Readiness and assign the draft to an authorized billing reviewer.",
      blockedActions: ["Claim submission", "Final code selection", "Payment posting"],
    });
  }

  if (safety.category === "No-Fault / Workers Comp Question") {
    return decision({
      intentKey: "case_coordination",
      category: safety.category,
      riskLevel: "Needs Staff",
      assignedTeam: "Case Management",
      confidence: 0.95,
      headline: "Case coordination path identified",
      explanation: "The request belongs in the governed injury case room with documents, deadlines, handoffs, and billing-readiness items visible to authorized staff.",
      draft: "Create a case-review task and confirm the claim, carrier, adjuster, authorization, and required document context before the next handoff.",
      nextAction: safety.action,
      blockedActions: ["Legal decision", "Coverage decision", "External packet send"],
    });
  }

  if (includesAny(normalized, ["referral", "mri", "x-ray", "xray", "physical therapy", " pt ", "specialist", "orthopedic", "imaging"])) {
    return decision({
      intentKey: "referral_coordination",
      category: "Referral / Network Handoff",
      riskLevel: "Needs Staff",
      assignedTeam: "Referral coordination",
      confidence: 0.93,
      headline: "Closed-loop handoff prepared",
      explanation: "Zumi identified a network coordination request. Patient selection, consent, destination, minimum-necessary categories, and human confirmation remain required.",
      draft: "Prepare a referral or capacity request for human review. Do not send chart content until consent and the sharing path are confirmed.",
      nextAction: "Open Network Command and prepare the appropriate handoff draft.",
      blockedActions: ["Automatic chart sharing", "Referral send", "Appointment confirmation"],
    });
  }

  if (includesAny(normalized, ["follow up", "follow-up", "missed call", "no-show", "no show", "lead", "reactivate", "didn't book", "did not book"])) {
    return decision({
      intentKey: "revenue_recovery",
      category: "Follow-up / Revenue Recovery",
      riskLevel: "Needs Staff",
      assignedTeam: "Front Desk / growth",
      confidence: 0.92,
      headline: "Revenue recovery action drafted",
      explanation: "Zumi identified a follow-up opportunity and prepared a staff-owned next action without contacting anyone automatically.",
      draft: "Review the contact history, consent, service interest, and last response before approving a follow-up task or message.",
      nextAction: "Create a time-bound follow-up task in CRM after staff review.",
      blockedActions: ["Patient or lead message auto-send", "Appointment confirmation", "Payment request"],
    });
  }

  if (includesAny(normalized, ["paperwork", "intake", "form", "consent", "insurance card", "missing document"])) {
    return decision({
      intentKey: "intake_readiness",
      category: "Intake / Document Readiness",
      riskLevel: "Needs Staff",
      assignedTeam: "Front Desk",
      confidence: 0.91,
      headline: "Missing-information workflow prepared",
      explanation: "Zumi can identify and route missing intake items, but a person must verify the document category, consent, and completion state.",
      draft: "Review the synthetic intake checklist and assign the missing item to the correct person. No document was released or accepted automatically.",
      nextAction: "Open Intake Runway or Document Airlock and confirm the missing item.",
      blockedActions: ["Document approval", "Consent acceptance", "Patient message auto-send"],
    });
  }

  if (includesAny(normalized, ["report", "revenue", "owner", "performance", "dashboard", "what is overdue", "what's overdue"])) {
    return decision({
      intentKey: "owner_operations_summary",
      category: "Owner Operations Summary",
      riskLevel: "Needs Staff",
      assignedTeam: "Clinic leadership",
      confidence: 0.88,
      headline: "Owner review path prepared",
      explanation: "Zumi can summarize tenant-scoped operational records and highlight overdue work; financial and clinical conclusions remain human decisions.",
      draft: "Prepare a tenant-scoped summary of open tasks, unresolved handoffs, revenue leakage, and integration failures for owner review.",
      nextAction: "Review the Command Center filters and approve the reporting scope.",
      blockedActions: ["Final financial conclusion", "Staff performance decision", "External report send"],
    });
  }

  if (safety.category === "Appointment Request") {
    return decision({
      intentKey: "appointment_request",
      category: safety.category,
      riskLevel: "Needs Staff",
      assignedTeam: "Front Desk",
      confidence: 0.9,
      headline: "Scheduling request prepared",
      explanation: "Zumi identified a scheduling request. Availability, visit type, location, provider, and patient confirmation still require staff review.",
      draft: "Review schedule availability and contact preferences before offering an appointment. This draft does not confirm a visit.",
      nextAction: "Assign to the front desk scheduling queue.",
      blockedActions: ["Appointment confirmation", "Patient message auto-send", "Deposit collection"],
    });
  }

  return decision({
    intentKey: "administrative_review",
    category: safety.category,
    riskLevel: "Needs Staff",
    assignedTeam: safety.assignedTeam,
    confidence: 0.72,
    headline: "Human routing review required",
    explanation: "Zumi did not find enough specific administrative context to choose a narrower workflow safely.",
    draft: "Review the request, select the correct patient or organization context, and assign a documented next action.",
    nextAction: safety.action,
    blockedActions: ["Automatic execution", "Patient message auto-send", "External data sharing"],
  });
}
