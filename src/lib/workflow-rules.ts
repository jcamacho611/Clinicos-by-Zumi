import type { WorkflowDecision } from "@/lib/types";

export const EMERGENCY_MESSAGE =
  "If this is a medical emergency, please call 911 or go to the nearest emergency room.";

export const MEDICAL_SAFETY_MESSAGE =
  "I can help with scheduling and office information, but I cannot provide medical advice, diagnose symptoms, interpret results, or make treatment decisions. I can route your message to the office.";

const includesAny = (value: string, patterns: string[]) => patterns.some((pattern) => value.includes(pattern));

export function classifyWorkflow(input: string): WorkflowDecision {
  const normalized = input.trim().toLowerCase();

  if (includesAny(normalized, ["chest pain", "can't breathe", "cannot breathe", "suicidal", "stroke", "severe bleeding", "unconscious"])) {
    return {
      category: "Emergency Symptom",
      riskLevel: "Urgent",
      requiresHumanReview: true,
      assignedTeam: "Provider",
      action: "Create urgent escalation and notify on-call staff",
      blockedFromAutoSend: true,
      emergencyMessage: EMERGENCY_MESSAGE,
      safetyMessage: MEDICAL_SAFETY_MESSAGE,
    };
  }

  if (includesAny(normalized, ["lab result", "blood test", "test result", "what does my result", "abnormal result"])) {
    return {
      category: "BFM Lab Question",
      riskLevel: "Needs Provider",
      requiresHumanReview: true,
      assignedTeam: "Provider",
      action: "Route to provider result-review queue",
      blockedFromAutoSend: true,
      safetyMessage: MEDICAL_SAFETY_MESSAGE,
    };
  }

  if (includesAny(normalized, ["refill", "prescription", "medication", "dose", "pharmacy"])) {
    return {
      category: "BFM Medication / Refill Question",
      riskLevel: "Needs Provider",
      requiresHumanReview: true,
      assignedTeam: "Provider",
      action: "Create medication request for provider review",
      blockedFromAutoSend: true,
      safetyMessage: MEDICAL_SAFETY_MESSAGE,
    };
  }

  if (includesAny(normalized, ["guarantee", "covered", "coverage", "deductible", "insurance", "copay"])) {
    return {
      category: "Insurance Question",
      riskLevel: "Needs Staff",
      requiresHumanReview: true,
      assignedTeam: "Billing",
      action: "Verify benefits and route to billing staff",
      blockedFromAutoSend: true,
    };
  }

  if (includesAny(normalized, ["no-fault", "no fault", "workers comp", "worker's comp", "adjuster", "claim dispute"])) {
    return {
      category: "No-Fault / Workers Comp Question",
      riskLevel: "Needs Staff",
      requiresHumanReview: true,
      assignedTeam: "Case Management",
      action: "Attach to case and create review task",
      blockedFromAutoSend: true,
    };
  }

  if (includesAny(normalized, ["angry", "complaint", "never called", "terrible", "upset"])) {
    return {
      category: "Angry Caller",
      riskLevel: "Urgent",
      requiresHumanReview: true,
      assignedTeam: "Front Desk",
      action: "Create priority callback for office manager",
      blockedFromAutoSend: true,
    };
  }

  return {
    category: includesAny(normalized, ["appointment", "book", "schedule", "available"])
      ? "Appointment Request"
      : "Unknown / Needs Review",
    riskLevel: normalized ? "Needs Staff" : "Normal",
    requiresHumanReview: Boolean(normalized),
    assignedTeam: "Front Desk",
    action: normalized ? "Add to front desk review queue" : "No action",
    blockedFromAutoSend: false,
  };
}
