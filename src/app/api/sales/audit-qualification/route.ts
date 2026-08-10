import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { buildSalesAuditNotes, salesAuditQualificationSchema } from "@/lib/sales-audit-rules";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "sales", "create", { request });
  if (denied) return denied;

  try {
    const input = salesAuditQualificationSchema.parse(await request.json());
    if (input.status !== "QUALIFIED" || input.score < 70) {
      return NextResponse.json({ error: "The prospect is not qualified for audit checkout yet." }, { status: 422 });
    }

    const result = await db.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          organizationId: session.organizationId,
          name: input.clinic,
          source: "other",
          campaignSource: "Klinikos Revenue Desk",
          serviceInterest: "Klinikos Operational Audit",
          appointmentInterest: "Founding Clinic discovery",
          estimatedValueCents: input.auditPrice * 100,
          assignedTo: session.userId,
          followUpDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          notes: buildSalesAuditNotes(input),
          pipelineStage: "audit_checkout",
          status: "contacted",
          bookingStatus: "audit_checkout_opened",
          paymentStatus: "pending_external_confirmation",
        },
      });
      const task = await tx.task.create({
        data: {
          organizationId: session.organizationId,
          category: "lead_follow_up",
          title: `Confirm audit payment · ${input.clinic}`,
          details: `lead:${lead.id} Confirm GoDaddy payment externally, then continue the audit workflow. Do not infer payment from checkout launch.`,
          ownerId: session.userId,
          priority: "high",
          riskLevel: "NEEDS_STAFF",
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "open",
          createdBy: session.userId,
        },
      });
      await tx.leadEvent.create({
        data: {
          organizationId: session.organizationId,
          leadId: lead.id,
          actorId: session.userId,
          eventType: "audit_checkout_started",
          toStatus: lead.status,
          note: "Qualified prospect saved before external GoDaddy checkout.",
          metadata: { score: input.score, auditPrice: input.auditPrice, paymentStatus: "pending_external_confirmation", taskId: task.id },
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "sales.audit_checkout_started",
          resourceType: "lead",
          resourceId: lead.id,
          metadata: { score: input.score, auditPrice: input.auditPrice, taskId: task.id },
        },
      });
      return { leadId: lead.id, taskId: task.id };
    });

    return NextResponse.json({ data: result }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
