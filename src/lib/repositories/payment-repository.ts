import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  canManagePayments,
  createMembershipSchema,
  createPackagePurchaseSchema,
  createPaymentLinkSchema,
  createPaymentSchema,
  paymentTransition,
  transitionPaymentSchema,
} from "@/lib/payment-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type Transaction = Prisma.TransactionClient;

function iso(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function patientName(patient?: { firstName: string; lastName: string } | null) {
  return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient";
}

function requireBillingRole(session: ClinicSession) {
  if (!can(session.role, "billing", "create") || !canManagePayments(session.role)) {
    throw new NetworkAccessError("Billing payment permission is required for this action.", 403);
  }
}

async function requirePatient(tx: Transaction, organizationId: string, patientId: string) {
  const patient = await tx.patient.findFirst({ where: { id: patientId, organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true } });
  if (!patient) throw new NetworkAccessError("Patient not found for this organization.", 404);
  return patient;
}

async function snapshotBalance(tx: Transaction, organizationId: string, patientId: string, deltaCents: number) {
  const latest = await tx.patientBalance.findFirst({ where: { organizationId, patientId }, orderBy: { asOf: "desc" } });
  return tx.patientBalance.create({ data: { organizationId, patientId, balanceCents: Math.max(0, (latest?.balanceCents ?? 0) + deltaCents), asOf: new Date() } });
}

export async function listPaymentWorkspace(organizationId: string) {
  const [patients, payments, links, invoices, balances, plans, memberships, packagePlans, purchases, events, integrations] = await Promise.all([
    db.patient.findMany({ where: { organizationId, status: "active" }, select: { id: true, firstName: true, lastName: true, mrn: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    db.payment.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.paymentLink.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.invoice.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.patientBalance.findMany({ where: { organizationId }, orderBy: { asOf: "desc" }, take: 250 }),
    db.membershipPlan.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } }),
    db.patientMembership.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.packagePlan.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } }),
    db.packagePurchase.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.paymentEvent.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 150 }),
    db.integration.findMany({ where: { organizationId, type: { in: ["payment_processing", "payments"] } }, orderBy: { vendor: "asc" } }),
  ]);
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const planMap = new Map(plans.map((plan) => [plan.id, plan]));
  const packagePlanMap = new Map(packagePlans.map((plan) => [plan.id, plan]));
  const latestBalances = new Map<string, (typeof balances)[number]>();
  for (const balance of balances) if (!latestBalances.has(balance.patientId)) latestBalances.set(balance.patientId, balance);

  return {
    patients: patients.map((patient) => ({ ...patient, name: patientName(patient) })),
    payments: payments.map((payment) => ({ ...payment, patientName: patientName(patientMap.get(payment.patientId)), postedAt: iso(payment.postedAt), createdAt: payment.createdAt.toISOString(), updatedAt: payment.updatedAt.toISOString() })),
    paymentLinks: links.map((link) => ({ ...link, patientName: patientName(patientMap.get(link.patientId)), expiresAt: iso(link.expiresAt), paidAt: iso(link.paidAt), createdAt: link.createdAt.toISOString(), updatedAt: link.updatedAt.toISOString() })),
    invoices: invoices.map((invoice) => ({ ...invoice, patientName: patientName(patientMap.get(invoice.patientId)), dueAt: iso(invoice.dueAt), createdAt: invoice.createdAt.toISOString(), updatedAt: invoice.updatedAt.toISOString() })),
    balances: [...latestBalances.values()].map((balance) => ({ ...balance, patientName: patientName(patientMap.get(balance.patientId)), mrn: patientMap.get(balance.patientId)?.mrn ?? "Unknown MRN", asOf: balance.asOf.toISOString(), createdAt: balance.createdAt.toISOString(), updatedAt: balance.updatedAt.toISOString() })),
    plans: plans.map((plan) => ({ ...plan, createdAt: plan.createdAt.toISOString(), updatedAt: plan.updatedAt.toISOString() })),
    memberships: memberships.map((membership) => ({ ...membership, patientName: patientName(patientMap.get(membership.patientId)), planName: planMap.get(membership.planId)?.name ?? "Unknown plan", startedAt: membership.startedAt.toISOString(), renewsAt: iso(membership.renewsAt), expiresAt: iso(membership.expiresAt), createdAt: membership.createdAt.toISOString(), updatedAt: membership.updatedAt.toISOString() })),
    packagePlans: packagePlans.map((plan) => ({ ...plan, createdAt: plan.createdAt.toISOString(), updatedAt: plan.updatedAt.toISOString() })),
    packagePurchases: purchases.map((purchase) => ({ ...purchase, patientName: patientName(patientMap.get(purchase.patientId)), packageName: packagePlanMap.get(purchase.packagePlanId)?.name ?? "Unknown package", purchasedAt: purchase.purchasedAt.toISOString(), expiresAt: iso(purchase.expiresAt), createdAt: purchase.createdAt.toISOString(), updatedAt: purchase.updatedAt.toISOString() })),
    events: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    integrations: integrations.map((integration) => ({ id: integration.id, vendor: integration.vendor, status: integration.status, phase: integration.phase, lastSyncAt: iso(integration.lastSyncAt) })),
  };
}

export type PaymentWorkspace = Awaited<ReturnType<typeof listPaymentWorkspace>>;

export async function recordPayment(session: ClinicSession, rawInput: unknown) {
  requireBillingRole(session);
  const input = createPaymentSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const patient = await requirePatient(tx, session.organizationId, input.patientId);
    let invoice = null;
    if (input.invoiceId) {
      invoice = await tx.invoice.findFirst({ where: { id: input.invoiceId, organizationId: session.organizationId, patientId: patient.id } });
      if (!invoice) throw new NetworkAccessError("Invoice not found for this patient and organization.", 404);
      if (invoice.balanceCents < input.amountCents) throw new NetworkAccessError("Payment cannot exceed the invoice balance.", 400);
    }
    const payment = await tx.payment.create({ data: { organizationId: session.organizationId, patientId: patient.id, amountCents: input.amountCents, source: input.source, status: "posted", postedAt: new Date() } });
    await snapshotBalance(tx, session.organizationId, patient.id, -input.amountCents);
    if (invoice) {
      const balanceCents = invoice.balanceCents - input.amountCents;
      await tx.invoice.update({ where: { id: invoice.id }, data: { balanceCents, status: balanceCents === 0 ? "paid" : "partially_paid" } });
    }
    await tx.paymentEvent.create({ data: { organizationId: session.organizationId, paymentId: payment.id, patientId: patient.id, actorId: session.userId, eventType: "payment_posted", fromStatus: "pending", toStatus: "posted", amountCents: payment.amountCents, metadata: { source: input.source, invoiceId: input.invoiceId, note: input.note, syntheticDemo: session.demo } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "payment.posted", resourceType: "payment", resourceId: payment.id, patientId: patient.id, metadata: { amountCents: payment.amountCents, source: input.source, invoiceId: input.invoiceId } } });
    return payment;
  });
}

export async function createPaymentLink(session: ClinicSession, rawInput: unknown) {
  requireBillingRole(session);
  const input = createPaymentLinkSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const token = randomBytes(24).toString("base64url");
    const link = await tx.paymentLink.create({ data: { organizationId: session.organizationId, patientId: input.patientId, amountCents: input.amountCents, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + input.expiresInDays * 86_400_000) } });
    await tx.paymentEvent.create({ data: { organizationId: session.organizationId, patientId: input.patientId, actorId: session.userId, eventType: "payment_link_created", amountCents: input.amountCents, metadata: { paymentLinkId: link.id, expiresAt: link.expiresAt?.toISOString() } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "payment_link.created", resourceType: "payment_link", resourceId: link.id, patientId: input.patientId, metadata: { amountCents: input.amountCents, expiresAt: link.expiresAt?.toISOString() } } });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000";
    return { link, checkoutUrl: `${appUrl}/pay/${link.id}?token=${token}` };
  });
}

export async function transitionPayment(session: ClinicSession, paymentId: string, rawInput: unknown) {
  requireBillingRole(session);
  const input = transitionPaymentSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({ where: { id: paymentId, organizationId: session.organizationId } });
    if (!payment) throw new NetworkAccessError("Payment not found for this organization.", 404);
    const nextStatus = paymentTransition(payment.status, input.action);
    if (!nextStatus) throw new NetworkAccessError(`Cannot ${input.action} a ${payment.status} payment.`, 409);
    const updated = await tx.payment.update({ where: { id: payment.id }, data: { status: nextStatus, postedAt: nextStatus === "refunded" ? null : payment.postedAt } });
    if (nextStatus === "refunded") await snapshotBalance(tx, session.organizationId, payment.patientId, payment.amountCents);
    await tx.paymentEvent.create({ data: { organizationId: session.organizationId, paymentId: payment.id, patientId: payment.patientId, actorId: session.userId, eventType: `payment_${input.action}ed`, fromStatus: payment.status, toStatus: nextStatus, amountCents: payment.amountCents, metadata: { reason: input.reason } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: `payment.${input.action}ed`, resourceType: "payment", resourceId: payment.id, patientId: payment.patientId, metadata: { reason: input.reason, fromStatus: payment.status, toStatus: nextStatus } } });
    return updated;
  });
}

export async function createMembership(session: ClinicSession, rawInput: unknown) {
  requireBillingRole(session);
  const input = createMembershipSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const plan = await tx.membershipPlan.findFirst({ where: { id: input.planId, organizationId: session.organizationId, status: "active" } });
    if (!plan) throw new NetworkAccessError("Membership plan not found for this organization.", 404);
    const payment = await tx.payment.create({ data: { organizationId: session.organizationId, patientId: input.patientId, source: input.source, amountCents: plan.priceCents, status: "posted", postedAt: new Date() } });
    const renewsAt = new Date(); renewsAt.setMonth(renewsAt.getMonth() + 1);
    const membership = await tx.patientMembership.create({ data: { organizationId: session.organizationId, patientId: input.patientId, planId: plan.id, status: "active", renewsAt, remainingSessions: plan.includedSessions } });
    await snapshotBalance(tx, session.organizationId, input.patientId, -plan.priceCents);
    await tx.paymentEvent.create({ data: { organizationId: session.organizationId, paymentId: payment.id, patientId: input.patientId, actorId: session.userId, eventType: "membership_started", toStatus: "active", amountCents: payment.amountCents, metadata: { membershipId: membership.id, planId: plan.id } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "membership.started", resourceType: "patient_membership", resourceId: membership.id, patientId: input.patientId, metadata: { planId: plan.id, paymentId: payment.id } } });
    return membership;
  });
}

export async function createPackagePurchase(session: ClinicSession, rawInput: unknown) {
  requireBillingRole(session);
  const input = createPackagePurchaseSchema.parse(rawInput);
  return db.$transaction(async (tx) => {
    await requirePatient(tx, session.organizationId, input.patientId);
    const plan = await tx.packagePlan.findFirst({ where: { id: input.packagePlanId, organizationId: session.organizationId, status: "active" } });
    if (!plan) throw new NetworkAccessError("Package plan not found for this organization.", 404);
    const payment = await tx.payment.create({ data: { organizationId: session.organizationId, patientId: input.patientId, source: input.source, amountCents: plan.priceCents, status: "posted", postedAt: new Date() } });
    const expiresAt = plan.expirationDays ? new Date(Date.now() + plan.expirationDays * 86_400_000) : null;
    const purchase = await tx.packagePurchase.create({ data: { organizationId: session.organizationId, patientId: input.patientId, packagePlanId: plan.id, paymentId: payment.id, remainingSessions: plan.includedSessions, expiresAt } });
    await snapshotBalance(tx, session.organizationId, input.patientId, -plan.priceCents);
    await tx.paymentEvent.create({ data: { organizationId: session.organizationId, paymentId: payment.id, patientId: input.patientId, actorId: session.userId, eventType: "package_purchased", toStatus: "active", amountCents: payment.amountCents, metadata: { packagePurchaseId: purchase.id, packagePlanId: plan.id } } });
    await tx.auditLog.create({ data: { organizationId: session.organizationId, actorId: session.userId, actorType: "user", action: "package.purchased", resourceType: "package_purchase", resourceId: purchase.id, patientId: input.patientId, metadata: { packagePlanId: plan.id, paymentId: payment.id } } });
    return purchase;
  });
}
