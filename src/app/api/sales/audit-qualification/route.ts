import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { buildSalesAuditNotes, evaluateSalesAuditQualification, salesAuditQualificationSchema } from "@/lib/sales-audit-rules";

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "sales", "create", { request });
  if (denied) return denied;

  try {
    const prospect = salesAuditQualificationSchema.parse(await request.json());
    const input = evaluateSalesAuditQualification(prospect);
    if (!input.firstValueEligible) {
      return NextResponse.json(
        {
          error: input.status === "MORE INFORMATION REQUIRED"
            ? "More operating context is required before Klinikos can produce a useful first result."
            : "This account should remain in nurture until there is a clearer unfinished-work or economic signal.",
          data: { score: input.score, status: input.status, nextAction: input.recommendedNextAction },
        },
        { status: 422 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          organizationId: session.organizationId,
          name: input.clinic,
          email: input.email,
          source: "other",
          campaignSource: "Klinikos Commercial Fabric",
          serviceInterest: "Unfinished-work operating improvement",
          appointmentInterest: "No meeting committed — founder approval required before scheduling",
          estimatedValueCents: 0,
          assignedTo: session.userId,
          followUpDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          notes: buildSalesAuditNotes(input),
          pipelineStage: "first_value_ready",
          status: "contacted",
          bookingStatus: "not_scheduled",
          paymentStatus: "not_requested",
        },
      });
      const task = await tx.task.create({
        data: {
          organizationId: session.organizationId,
          category: "lead_follow_up",
          title: `Produce first useful result · ${input.clinic}`,
          details: `lead:${lead.id} Use the saved unfinished-work evidence to produce one concrete, bounded result or operating insight. Do not create checkout, accept a meeting, or disclose restricted implementation details. Escalate to a paid commercial capability only when additional economic value is demonstrated and the governed offer fits.`,
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
          eventType: "first_value_ready",
          toStatus: lead.status,
          note: "Account qualified for a first useful result; no paid product or meeting was committed.",
          metadata: { score: input.score, economicSignal: input.economicSignal, nextAction: input.recommendedNextAction, taskId: task.id },
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: session.organizationId,
          actorId: session.userId,
          actorType: "user",
          action: "sales.first_value_ready",
          resourceType: "lead",
          resourceId: lead.id,
          metadata: { score: input.score, economicSignal: input.economicSignal, buyerEmail: input.email, taskId: task.id },
        },
      });
      return { leadId: lead.id, taskId: task.id };
    });

    return NextResponse.json(
      {
        data: {
          ...result,
          qualification: {
            score: input.score,
            status: input.status,
            economicSignal: input.economicSignal,
            nextAction: input.recommendedNextAction,
          },
        },
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
