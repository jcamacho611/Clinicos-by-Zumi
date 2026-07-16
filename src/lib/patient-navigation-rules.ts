import { z } from "zod";
import type { WorkflowDecision } from "@/lib/types";

export const createNavigationDraftSchema = z.object({
  patientId: z.string().min(1),
  request: z.string().trim().min(4).max(1000),
});

export const reviewNavigationDraftSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  notes: z.string().trim().min(8).max(500),
});

export function navigationDraftContent(patientName: string, decision: WorkflowDecision) {
  if (decision.emergencyMessage) return `${decision.emergencyMessage} ${decision.action}. A human team member must review this request immediately.`;
  if (decision.category === "Appointment Request") return `We can help ${patientName} request an appointment. The front desk will review availability and follow up; this message does not confirm a visit.`;
  if (decision.category === "Insurance Question") return "We can collect insurance information and have the office verify benefits. Coverage cannot be guaranteed until verification is completed.";
  if (decision.category === "BFM Lab Question") return "This question has been routed to the provider review queue. ClinicOS will not interpret or explain a laboratory result automatically.";
  if (decision.category === "BFM Medication / Refill Question") return "This request has been routed to the provider review queue. ClinicOS cannot approve, prescribe, or change medication automatically.";
  return `Your request has been routed to the ${decision.assignedTeam} team for review. A staff member will follow up with the next administrative step.`;
}
