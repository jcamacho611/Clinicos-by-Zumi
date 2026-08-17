import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { createGoDaddyCommercialCheckout } from "@/lib/commercial/checkout-service";
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
    if (input.status !== "QUALIFIED" || input.score < 70) {
      return NextResponse.json({ error: "The prospect is not qualified for audit checkout yet." }, { status: 422 });
    }

    const result = await db.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          organizationId: session.organizationId,
          name: input.clinic,
          email: input.email,
          source: "other",
          campaignSource: "Klinikos Revenue Desk",
          serviceInterest: "Klinikos Clinic Operating Analysis",
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
          details: `lead:${lead.id} Confirm GoDaddy payment externally, then reconcile it into the Klinikos commercial ledger before beginning the audit. Do not infer payment from checkout launch.`,
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
          metadata: { score: input.score, auditPrice: input.auditPrice, buyerEmail: input.email, taskId: task.id },
        },
      });
      return { leadId: lead.id, taskId: task.id };
    });

    const checkout = await createGoDaddyCommercialCheckout({
      organizationId: session.organizationId,
      email: input.email,
      productKey: "operational_audit",
      expectedAmountCents: input.auditPrice * 100,
      returnUrl: new URL("/payments/success", request.url).toString(),
    });

    await db.leadEvent.create({
      data: {
        organizationId: session.organizationId,
        leadId: result.leadId,
        actorId: session.userId,
        eventType: "audit_checkout_intent_created",
        note: "Klinikos created a server-owned commercial checkout intent before opening the GoDaddy payment rail.",
        metadata: {
          checkoutIntentId: checkout.intentId,
          provider: checkout.provider,
          productKey: checkout.productKey,
          expectedAmountCents: checkout.expectedAmountCents,
          processorVerificationAvailable: checkout.processorVerificationAvailable,
        },
      },
    });

    return NextResponse.json(
      { data: { ...result, qualification: { score: input.score, status: input.status, auditPrice: input.auditPrice }, checkout } },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
