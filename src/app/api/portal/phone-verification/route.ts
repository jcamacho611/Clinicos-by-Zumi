import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPortalSession } from "@/lib/auth/portal-session";
import { getPatientSmsState, recordPatientPhoneVerification } from "@/lib/communications/patient-sms-service";
import { checkTwilioPhoneVerification, startTwilioPhoneVerification } from "@/lib/communications/twilio";
import {
  tenantVariableSpendFundingReady,
  variableCostRailPolicy,
  variableEconomicPolicyResolved,
} from "@/lib/commercial/variable-cost-rail-registry";
import { db } from "@/lib/db";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;
const checkSchema = z.object({ code: z.string().trim().regex(/^\d{4,10}$/, "Enter the verification code sent to your phone.") });
const START_WINDOW_MS = 60 * 60 * 1000;
const START_LIMIT = 5;
const CHECK_WINDOW_MS = 15 * 60 * 1000;
const CHECK_LIMIT = 8;

function maskPhone(value: string | null) {
  return value ? `••• ••• ${value.slice(-4)}` : null;
}

function phoneVerificationSpendReady() {
  const policy = variableCostRailPolicy("phone_verification");
  if (!policy) return false;
  if (policy.costOwner === "tenant") return tenantVariableSpendFundingReady(policy);
  return policy.costOwner === "platform"
    && policy.fundingMode === "platform_budget"
    && variableEconomicPolicyResolved(policy);
}

async function currentState(organizationId: string, patientId: string) {
  const state = await getPatientSmsState({ organizationId, patientId });
  if (!state) return null;
  const endpoint = state.sms.endpoint;
  const verified = Boolean(
    state.normalizedPhone
    && endpoint?.verifiedAt
    && endpoint.normalizedPhone === state.normalizedPhone
    && endpoint.verificationSource === "twilio_verify"
    && endpoint.verificationProviderReference
    && /^VE[0-9a-fA-F]{32}$/.test(endpoint.verificationProviderReference),
  );
  return {
    hasPhone: Boolean(state.normalizedPhone),
    maskedPhone: maskPhone(state.normalizedPhone),
    verified,
    verifiedAt: verified ? endpoint?.verifiedAt ?? null : null,
    verificationSource: verified ? endpoint?.verificationSource ?? null : null,
    fundingReady: phoneVerificationSpendReady(),
  };
}

async function reserveVerificationAttempt(input: {
  organizationId: string;
  patientId: string;
  accountId: string;
  action: string;
  windowMs: number;
  limit: number;
  metadata: Record<string, unknown>;
}) {
  return db.$transaction(async (tx) => {
    const lockKey = `${input.patientId}:${input.action}`;
    await tx.$queryRaw<Array<{ pg_advisory_xact_lock: unknown }>>(Prisma.sql`
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
    `);

    const attempts = await tx.auditLog.count({
      where: {
        organizationId: input.organizationId,
        resourceType: "patient",
        resourceId: input.patientId,
        action: input.action,
        createdAt: { gte: new Date(Date.now() - input.windowMs) },
      },
    });
    if (attempts >= input.limit) return false;

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.accountId,
        actorType: "patient",
        action: input.action,
        resourceType: "patient",
        resourceId: input.patientId,
        patientId: input.patientId,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
    return true;
  });
}

async function portalAudit(input: {
  organizationId: string;
  patientId: string;
  accountId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.accountId,
      actorType: "patient",
      action: input.action,
      resourceType: "patient",
      resourceId: input.patientId,
      patientId: input.patientId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

function originBlocked(request: Request) {
  const decision = evaluateSameOriginMutation(request);
  return decision.allowed
    ? null
    : NextResponse.json({ error: "Cross-origin mutation blocked." }, { status: 403, headers: NO_STORE });
}

async function fundingBlockedResponse(input: { organizationId: string; patientId: string; accountId: string }) {
  await portalAudit({
    ...input,
    action: "communications.sms.phone.verification.blocked",
    metadata: { reason: "verification_funding_not_ready", providerCalled: false, consentGranted: false },
  });
  return NextResponse.json(
    { error: "Phone verification is not available until its funding policy is activated." },
    { status: 503, headers: NO_STORE },
  );
}

export async function GET() {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const state = await currentState(session.organizationId, session.patientId);
  if (!state) return NextResponse.json({ error: "Patient record not found." }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ data: state }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const blocked = originBlocked(request);
  if (blocked) return blocked;

  const smsState = await getPatientSmsState({ organizationId: session.organizationId, patientId: session.patientId });
  if (!smsState?.normalizedPhone) return NextResponse.json({ error: "Your clinic does not have a valid phone number on file." }, { status: 400, headers: NO_STORE });
  if (!phoneVerificationSpendReady()) {
    return fundingBlockedResponse({ organizationId: session.organizationId, patientId: session.patientId, accountId: session.accountId });
  }

  const reserved = await reserveVerificationAttempt({
    organizationId: session.organizationId,
    patientId: session.patientId,
    accountId: session.accountId,
    action: "communications.sms.phone.verification.start_requested",
    windowMs: START_WINDOW_MS,
    limit: START_LIMIT,
    metadata: { channel: "sms", phoneLast4: smsState.normalizedPhone.slice(-4), consentGranted: false },
  });
  if (!reserved) {
    return NextResponse.json(
      { error: "Too many verification codes were requested. Try again later." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "3600" } },
    );
  }

  const result = await startTwilioPhoneVerification({ to: smsState.normalizedPhone });
  await portalAudit({
    organizationId: session.organizationId,
    patientId: session.patientId,
    accountId: session.accountId,
    action: result.ok ? "communications.sms.phone.verification.code_sent" : "communications.sms.phone.verification.start_failed",
    metadata: result.ok
      ? { provider: "twilio_verify", providerReference: result.sid, providerStatus: result.status, consentGranted: false }
      : { provider: "twilio_verify", reason: result.reason, consentGranted: false },
  });

  if (!result.ok) {
    const status = result.reason === "not_configured" ? 503 : result.reason === "invalid_recipient" ? 400 : 502;
    return NextResponse.json({ error: result.detail }, { status, headers: NO_STORE });
  }

  return NextResponse.json({ data: { sent: true, maskedPhone: maskPhone(smsState.normalizedPhone) } }, { headers: NO_STORE });
}

export async function PATCH(request: Request) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  const blocked = originBlocked(request);
  if (blocked) return blocked;

  const parsed = checkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid verification code." }, { status: 400, headers: NO_STORE });

  const smsState = await getPatientSmsState({ organizationId: session.organizationId, patientId: session.patientId });
  if (!smsState?.normalizedPhone) return NextResponse.json({ error: "Your clinic does not have a valid phone number on file." }, { status: 400, headers: NO_STORE });
  if (!phoneVerificationSpendReady()) {
    return fundingBlockedResponse({ organizationId: session.organizationId, patientId: session.patientId, accountId: session.accountId });
  }

  const reserved = await reserveVerificationAttempt({
    organizationId: session.organizationId,
    patientId: session.patientId,
    accountId: session.accountId,
    action: "communications.sms.phone.verification.check_requested",
    windowMs: CHECK_WINDOW_MS,
    limit: CHECK_LIMIT,
    metadata: { channel: "sms", consentGranted: false, codeStored: false },
  });
  if (!reserved) {
    return NextResponse.json(
      { error: "Too many verification attempts. Request a new code later." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "900" } },
    );
  }

  const result = await checkTwilioPhoneVerification({ to: smsState.normalizedPhone, code: parsed.data.code });
  if (!result.ok || result.status !== "approved") {
    await portalAudit({
      organizationId: session.organizationId,
      patientId: session.patientId,
      accountId: session.accountId,
      action: "communications.sms.phone.verification.check_failed",
      metadata: result.ok
        ? { provider: "twilio_verify", providerReference: result.sid, providerStatus: result.status, consentGranted: false, codeStored: false }
        : { provider: "twilio_verify", reason: result.reason, consentGranted: false, codeStored: false },
    });
    const status = !result.ok && result.reason === "not_configured"
      ? 503
      : !result.ok && result.reason === "provider_error"
        ? 502
        : 400;
    return NextResponse.json({ error: result.ok ? "That code was not approved. Check the code and try again." : result.detail }, { status, headers: NO_STORE });
  }

  const recorded = await recordPatientPhoneVerification({
    organizationId: session.organizationId,
    patientId: session.patientId,
    actorId: session.accountId,
    actorType: "patient",
    source: "twilio_verify",
    providerReference: result.sid,
  });
  if (!recorded.ok) return NextResponse.json({ error: "Phone verification could not be recorded." }, { status: 409, headers: NO_STORE });

  await portalAudit({
    organizationId: session.organizationId,
    patientId: session.patientId,
    accountId: session.accountId,
    action: "communications.sms.phone.verification.patient_completed",
    metadata: { provider: "twilio_verify", providerReference: result.sid, consentGranted: false, codeStored: false },
  });

  const state = await currentState(session.organizationId, session.patientId);
  return NextResponse.json({ data: state }, { headers: NO_STORE });
}
