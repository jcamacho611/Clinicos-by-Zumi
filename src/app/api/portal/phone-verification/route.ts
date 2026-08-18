import { NextResponse } from "next/server";
import { z } from "zod";
import { getPortalSession } from "@/lib/auth/portal-session";
import { db } from "@/lib/db";
import { getPatientSmsState, recordPatientPhoneVerification } from "@/lib/communications/patient-sms-service";
import { checkTwilioPhoneVerification, startTwilioPhoneVerification } from "@/lib/communications/twilio";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkSchema = z.object({ code: z.string().trim().regex(/^\d{4,10}$/, "Enter the verification code sent to your phone.") });
const START_WINDOW_MS = 60 * 60 * 1000;
const START_LIMIT = 5;
const CHECK_WINDOW_MS = 15 * 60 * 1000;
const CHECK_LIMIT = 8;

function maskPhone(value: string | null) {
  if (!value) return null;
  return `••• ••• ${value.slice(-4)}`;
}

async function currentState(organizationId: string, patientId: string) {
  const state = await getPatientSmsState({ organizationId, patientId });
  if (!state) return null;
  const endpoint = state.sms.endpoint;
  const verified = Boolean(
    state.normalizedPhone &&
    endpoint?.verifiedAt &&
    endpoint.normalizedPhone === state.normalizedPhone,
  );
  return {
    hasPhone: Boolean(state.normalizedPhone),
    maskedPhone: maskPhone(state.normalizedPhone),
    verified,
    verifiedAt: verified ? endpoint?.verifiedAt ?? null : null,
    verificationSource: verified ? endpoint?.verificationSource ?? null : null,
  };
}

async function recentAttempts(input: { organizationId: string; patientId: string; action: string; windowMs: number }) {
  return db.auditLog.count({
    where: {
      organizationId: input.organizationId,
      resourceType: "patient",
      resourceId: input.patientId,
      action: input.action,
      createdAt: { gte: new Date(Date.now() - input.windowMs) },
    },
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
      metadata: input.metadata ?? {},
    },
  });
}

function originBlocked(request: Request) {
  const decision = evaluateSameOriginMutation(request);
  return decision.allowed
    ? null
    : NextResponse.json({ error: "Cross-origin mutation blocked." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const state = await currentState(session.organizationId, session.patientId);
  if (!state) return NextResponse.json({ error: "Patient record not found." }, { status: 404 });
  return NextResponse.json({ data: state }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const blocked = originBlocked(request);
  if (blocked) return blocked;

  const smsState = await getPatientSmsState({ organizationId: session.organizationId, patientId: session.patientId });
  if (!smsState?.normalizedPhone) return NextResponse.json({ error: "Your clinic does not have a valid phone number on file." }, { status: 400 });

  const attempts = await recentAttempts({ organizationId: session.organizationId, patientId: session.patientId, action: "communications.sms.phone.verification.start_requested", windowMs: START_WINDOW_MS });
  if (attempts >= START_LIMIT) {
    return NextResponse.json({ error: "Too many verification codes were requested. Try again later." }, { status: 429, headers: { "Cache-Control": "private, no-store", "Retry-After": "3600" } });
  }

  await portalAudit({
    organizationId: session.organizationId,
    patientId: session.patientId,
    accountId: session.accountId,
    action: "communications.sms.phone.verification.start_requested",
    metadata: { channel: "sms", phoneLast4: smsState.normalizedPhone.slice(-4), consentGranted: false },
  });

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
    return NextResponse.json({ error: result.detail }, { status, headers: { "Cache-Control": "private, no-store" } });
  }

  return NextResponse.json({ data: { sent: true, maskedPhone: maskPhone(smsState.normalizedPhone) } }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const blocked = originBlocked(request);
  if (blocked) return blocked;

  const parsed = checkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid verification code." }, { status: 400 });

  const smsState = await getPatientSmsState({ organizationId: session.organizationId, patientId: session.patientId });
  if (!smsState?.normalizedPhone) return NextResponse.json({ error: "Your clinic does not have a valid phone number on file." }, { status: 400 });

  const attempts = await recentAttempts({ organizationId: session.organizationId, patientId: session.patientId, action: "communications.sms.phone.verification.check_requested", windowMs: CHECK_WINDOW_MS });
  if (attempts >= CHECK_LIMIT) {
    return NextResponse.json({ error: "Too many verification attempts. Request a new code later." }, { status: 429, headers: { "Cache-Control": "private, no-store", "Retry-After": "900" } });
  }

  await portalAudit({
    organizationId: session.organizationId,
    patientId: session.patientId,
    accountId: session.accountId,
    action: "communications.sms.phone.verification.check_requested",
    metadata: { channel: "sms", consentGranted: false, codeStored: false },
  });

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
    const status = !result.ok && result.reason === "not_configured" ? 503 : !result.ok && result.reason === "provider_error" ? 502 : 400;
    return NextResponse.json({ error: result.ok ? "That code was not approved. Check the code and try again." : result.detail }, { status, headers: { "Cache-Control": "private, no-store" } });
  }

  const recorded = await recordPatientPhoneVerification({
    organizationId: session.organizationId,
    patientId: session.patientId,
    source: "twilio_verify",
  });
  if (!recorded.ok) return NextResponse.json({ error: "Phone verification could not be recorded." }, { status: 409 });

  await portalAudit({
    organizationId: session.organizationId,
    patientId: session.patientId,
    accountId: session.accountId,
    action: "communications.sms.phone.verification.patient_completed",
    metadata: { provider: "twilio_verify", providerReference: result.sid, consentGranted: false, codeStored: false },
  });

  const state = await currentState(session.organizationId, session.patientId);
  return NextResponse.json({ data: state }, { headers: { "Cache-Control": "private, no-store" } });
}
