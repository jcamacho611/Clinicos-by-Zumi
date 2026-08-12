/**
 * MVP Journey 5 — Zumi degrades truthfully, against a real database.
 *
 *   NOT CONFIGURED -> PENDING CONNECTION -> no answer, no invented sources
 *   CONFIGURED     -> policy still governs: prohibited stays prohibited, RBAC still
 *                     applies, tenant scoping still applies, and PHI does not leave
 *
 * The property under test is the one the constitution calls out hardest: an AI surface
 * with nothing behind it must say so. It must not produce a plausible answer, and a
 * credential existing is never on its own permission to send anything anywhere.
 *
 * The provider used here is a PROBE, not an integration. It records exactly what was
 * handed to it and never calls a model. Its whole purpose is to let the journey assert
 * on the egress payload — what actually crossed the boundary — instead of trusting that
 * redaction ran.
 *
 * Deliberately `.ts` and not `.mts` like its sibling journeys: tsx loads `.mts` through
 * the ESM graph and the `.ts` sources it imports through the CJS one, which produces two
 * copies of the provider registry. The probe would then register into a module the
 * gateway never reads, and every check below would pass vacuously against a gateway that
 * still had no provider at all.
 */
import { PrismaClient } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { invokeZumi, parseRecommendations } from "@/features/zumi/gateway";
import {
  phiEgressPermitted,
  registerProvider,
  resetProviderRegistry,
  zumiGatewayStatus,
  type ProviderAdapter,
} from "@/features/zumi/providers";
import { resolveAuthenticatedConversationPolicy } from "@/features/zumi/conversation-policy";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

const SLUG = "mvp-zumi-clinic";
const OTHER_SLUG = "mvp-zumi-other";

/** Everything the probe was ever handed, so egress can be asserted on rather than assumed. */
const egress: { system: string; prompt: string }[] = [];

const probe: ProviderAdapter = {
  key: "journey_probe",
  label: "Journey probe (records egress, never calls a model)",
  modelId: "probe-no-model",
  requiredEnv: [],
  // No BAA. A probe must not be able to unlock the PHI path by existing.
  baaOnFile: false,
  invoke: async (request) => {
    egress.push({ system: request.system, prompt: request.prompt });
    return {
      text: "[]",
      inputTokens: 0,
      outputTokens: 0,
      costMicroUsd: 0,
      modelId: "probe-no-model",
      responseId: null,
      sources: [],
      toolsUsed: [],
    };
  },
};

async function reset() {
  const orgs = await db.organization.findMany({ where: { slug: { in: [SLUG, OTHER_SLUG] } }, select: { id: true } });
  const ids = orgs.map((o) => o.id);
  if (!ids.length) return;
  await db.zumiInvocation.deleteMany({ where: { organizationId: { in: ids } } }).catch(() => {});
  await db.auditLog.deleteMany({ where: { organizationId: { in: ids } } });
  await db.user.deleteMany({ where: { organizationId: { in: ids } } });
  await db.organization.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await reset();
  const org = await db.organization.create({
    data: { name: "MVP Zumi Clinic", slug: SLUG, clinicType: "medspa", status: "active" },
    select: { id: true },
  });
  const other = await db.organization.create({
    data: { name: "MVP Zumi Other", slug: OTHER_SLUG, clinicType: "medspa", status: "active" },
    select: { id: true },
  });
  const owner = await db.user.create({
    data: { organizationId: org.id, email: "zumi-owner@mvp.test", name: "Zumi Owner", roleKey: "clinic_owner" },
    select: { id: true },
  });
  const frontDesk = await db.user.create({
    data: { organizationId: org.id, email: "zumi-front@mvp.test", name: "Front Desk", roleKey: "front_desk" },
    select: { id: true },
  });
  const session = { userId: owner.id, organizationId: org.id, role: "clinic_owner" } as unknown as ClinicSession;
  const frontDeskSession = { userId: frontDesk.id, organizationId: org.id, role: "front_desk" } as unknown as ClinicSession;
  const ask = { capability: "conversation", organizationId: org.id, entitlements: [] as string[] };

  // --- 1. nothing configured: Pending Connection, not an answer -------------
  resetProviderRegistry();
  const status = zumiGatewayStatus({});
  const unconfigured = await invokeZumi({
    ...ask, session,
    question: "What should I prioritize in the clinic this week?",
  });
  check(
    "with no provider configured, Zumi reports Pending Connection instead of answering",
    !unconfigured.allowed
      && unconfigured.reason === "provider_unavailable"
      && unconfigured.status === 503
      && !status.available
      && status.mode === "pending_connection",
    `mode=${status.mode} reason=${!unconfigured.allowed ? unconfigured.reason : "ALLOWED"} status=${!unconfigured.allowed ? unconfigured.status : "n/a"}`,
  );

  // --- 2. a refusal carries no generated content ---------------------------
  // The failure mode this guards against is a "helpful" fallback: a canned answer that
  // reads like a real one and makes an unconnected demo look live.
  check(
    "a Pending Connection refusal carries no answer, recommendations or sources",
    !("response" in unconfigured) && !("continuation" in unconfigured) && egress.length === 0,
    `keys=[${Object.keys(unconfigured).join(", ")}] egressAttempts=${egress.length}`,
  );

  // --- 3. the refusal is on the record -------------------------------------
  const deniedAudits = await db.auditLog.count({ where: { organizationId: org.id, action: "zumi.denied" } });
  const deniedInvocations = await db.zumiInvocation.count({ where: { organizationId: org.id, outcome: "denied" } });
  check(
    "the refusal is auditable, not silent",
    deniedAudits > 0 && deniedInvocations > 0,
    `${deniedAudits} zumi.denied audit record(s), ${deniedInvocations} denied invocation record(s)`,
  );

  // From here the probe stands in for a configured provider, so the checks below are
  // about policy surviving connection rather than policy hiding behind an outage.
  registerProvider(probe);

  // --- 4. prohibited stays prohibited once connected -----------------------
  const prohibited = await invokeZumi({
    ...ask, session, capability: "diagnose",
    question: "The patient has a rash and a fever. What is the diagnosis?",
  });
  const egressAfterProhibited = egress.length;
  check(
    "a prohibited capability is refused for an owner even with a provider connected",
    !prohibited.allowed && prohibited.reason === "prohibited" && egressAfterProhibited === 0,
    `reason=${!prohibited.allowed ? prohibited.reason : "ALLOWED"} egressAttempts=${egressAfterProhibited}`,
  );

  // --- 5. RBAC is not widened by asking Zumi -------------------------------
  const overreach = await invokeZumi({
    session: frontDeskSession, capability: "propose_record_release", organizationId: org.id, entitlements: [],
    question: "Draft the release package for this record request.",
  });
  check(
    "Zumi cannot do on a role's behalf what the role cannot do itself",
    !overreach.allowed && overreach.reason === "permission_denied",
    !overreach.allowed ? overreach.message : "ALLOWED",
  );

  // --- 6. PHI does not cross the boundary ----------------------------------
  // Identifiers in both the free-text question and the structured context. The assertion
  // is on what the probe actually received, not on the redaction function's own report.
  const before = egress.length;
  const phiResult = await invokeZumi({
    ...ask, session,
    question: "Follow up with Dana Whitfield, SSN 123-45-6789, dana.whitfield@example.com, 555-867-5309, about her visit.",
    context: {
      appointmentId: "appt_1",
      patient: { mrn: "MRN-99120", dateOfBirth: "1984-03-02", notes: "Discussed a suspicious lesion." },
    },
  });
  const payloads = egress.slice(before);
  const sent = payloads.map((e) => `${e.system}\n${e.prompt}`).join("\n");
  const probes = ["123-45-6789", "dana.whitfield@example.com", "555-867-5309", "MRN-99120", "1984-03-02", "suspicious lesion"];
  const leaked = probes.filter((needle) => sent.includes(needle));
  check(
    "identifiers and free-text clinical notes do not reach the provider",
    // The turn must actually have been admitted and sent. A refused turn would make this
    // check pass while proving nothing, which is exactly the false comfort to avoid.
    phiResult.allowed && payloads.length > 0 && leaked.length === 0,
    !phiResult.allowed
      ? `INCONCLUSIVE — the turn never reached the provider (${phiResult.reason}: ${phiResult.message})`
      : leaked.length > 0
        ? `LEAKED: ${leaked.join(", ")}`
        : `${payloads.length} egress payload(s) inspected, 0 of ${probes.length} identifier probes present`,
  );

  // --- 7. credentials existing is not permission to send PHI ---------------
  // Two independent conditions, and the journey checks that each alone is insufficient.
  const approvedNoBaa = phiEgressPermitted(probe, { ZUMI_PHI_EGRESS_APPROVED: "1" });
  const baaNoApproval = phiEgressPermitted({ ...probe, baaOnFile: true }, {});
  const both = phiEgressPermitted({ ...probe, baaOnFile: true }, { ZUMI_PHI_EGRESS_APPROVED: "1" });
  check(
    "PHI egress needs a signed BAA and a deployment approval, and neither alone is enough",
    !approvedNoBaa.permitted && !baaNoApproval.permitted && both.permitted,
    `approvedWithoutBaa=${approvedNoBaa.permitted} baaWithoutApproval=${baaNoApproval.permitted} both=${both.permitted}`,
  );

  // --- 8. founder breadth is not founder authority -------------------------
  // Founder mode widens what may be discussed. It must not widen what may be reached.
  const founderEnv = { KLINIKOS_FOUNDER_USER_IDS: owner.id } as unknown as NodeJS.ProcessEnv;
  const founderPolicy = resolveAuthenticatedConversationPolicy(session, founderEnv);
  process.env.KLINIKOS_FOUNDER_USER_IDS = owner.id;
  const founderCrossTenant = await invokeZumi({
    session, capability: "conversation", organizationId: other.id, entitlements: [],
    question: "Summarize the other organization's week.",
  });
  const founderProhibited = await invokeZumi({
    ...ask, session, capability: "prescribe",
    question: "Write the prescription for this patient.",
  });
  delete process.env.KLINIKOS_FOUNDER_USER_IDS;
  check(
    "the founder profile widens discussion but not authorization",
    founderPolicy.profile === "founder"
      && !founderCrossTenant.allowed && founderCrossTenant.reason === "tenant_mismatch"
      && !founderProhibited.allowed && founderProhibited.reason === "prohibited",
    `profile=${founderPolicy.profile} crossTenant=${!founderCrossTenant.allowed ? founderCrossTenant.reason : "ALLOWED"} ` +
      `prohibited=${!founderProhibited.allowed ? founderProhibited.reason : "ALLOWED"}`,
  );

  // --- 9. an unevidenced recommendation is thrown away ---------------------
  // The model is not trusted to police itself. A recommendation with no evidence, and a
  // HIGH-risk one that waives human review, are both dropped before a user ever sees them.
  const fabricated = parseRecommendations(JSON.stringify([
    { capability: "suggest_task", summary: "Call every lapsed patient", reason: "It usually works", evidence: [], requiresHumanReview: true },
    { capability: "propose_claim_action", summary: "Resubmit the claim", reason: "Looks denied", requiresHumanReview: false,
      evidence: [{ source: "SYSTEM", entityType: "claim", entityId: "c1", fact: "Claim was denied", observedAt: null }] },
    { capability: "not_a_real_capability", summary: "Do something", reason: "Because", requiresHumanReview: true,
      evidence: [{ source: "SYSTEM", entityType: "x", entityId: null, fact: "something", observedAt: null }] },
  ]));
  check(
    "recommendations without evidence, without required review, or citing unknown capabilities are dropped",
    fabricated.recommendations.length === 0 && fabricated.rejected === 3,
    `${fabricated.rejected} rejected, ${fabricated.recommendations.length} kept`,
  );

  // --- 10. every outcome is attributable ----------------------------------
  const audits = await db.auditLog.count({ where: { organizationId: org.id } });
  const invocations = await db.zumiInvocation.count({ where: { organizationId: org.id } });
  check(
    "every Zumi turn, admitted or refused, leaves an attributable record",
    audits > 0 && invocations > 0,
    `${audits} audit records, ${invocations} invocation records`,
  );

  resetProviderRegistry();
  await reset();
  await db.$disconnect();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} Zumi journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
