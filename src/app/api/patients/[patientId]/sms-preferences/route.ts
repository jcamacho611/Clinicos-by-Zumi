import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import {
  getPatientSmsState,
  recordPatientSmsPermission,
} from "@/lib/communications/patient-sms-service";

const evidenceReferenceSchema = z.string().trim().regex(
  /^(consent|form|document|portal|call|audit):[A-Za-z0-9._/-]{1,140}$/,
  "Evidence references must be opaque internal references such as consent:abc123 or document:def456.",
);

const updateSchema = z.object({
  messageClass: z.enum(["transactional", "operational", "marketing"]),
  status: z.enum(["granted", "denied", "revoked"]),
  source: z.enum(["patient_verbal", "patient_written", "staff_documented"]),
  policyVersion: z.string().trim().min(1).max(80).optional(),
  evidenceReference: evidenceReferenceSchema.optional(),
}).superRefine((value, context) => {
  if (value.source === "patient_written" && !value.evidenceReference) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidenceReference"], message: "Written consent requires an opaque evidence reference." });
  }
  if (value.status === "granted" && value.source === "staff_documented") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["source"], message: "Staff documentation cannot create SMS permission. Record the patient's verbal or written authorization instead." });
  }
  if (value.messageClass === "marketing" && value.status === "granted") {
    if (value.source !== "patient_written") {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["source"], message: "Marketing SMS permission requires patient-written authorization." });
    }
    if (!value.evidenceReference) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["evidenceReference"], message: "Marketing SMS permission requires a written-consent evidence reference." });
    }
  }
});

export async function GET(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { patientId } = await params;
  const denied = await enforceApiPermission(session, "consents", "read", { request, resourceId: patientId });
  if (denied) return denied;

  const state = await getPatientSmsState({ organizationId: session.organizationId, patientId });
  if (!state) return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  return NextResponse.json({ data: state }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { patientId } = await params;
  const denied = await enforceApiPermission(session, "consents", "update", { request, resourceId: patientId });
  if (denied) return denied;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid SMS preference update." }, { status: 400 });
  }

  const result = await recordPatientSmsPermission({
    organizationId: session.organizationId,
    patientId,
    actorId: session.userId,
    messageClass: parsed.data.messageClass,
    status: parsed.data.status,
    source: parsed.data.source,
    policyVersion: parsed.data.policyVersion,
    evidenceReference: parsed.data.evidenceReference,
  });
  if (!result.ok) {
    if (result.reason === "invalid_evidence") {
      return NextResponse.json({ error: "SMS permission evidence does not satisfy the server policy." }, { status: 400 });
    }
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json({ data: result.sms }, { headers: { "Cache-Control": "private, no-store" } });
}
