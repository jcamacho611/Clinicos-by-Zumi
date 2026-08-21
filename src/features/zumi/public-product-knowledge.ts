import {
  KLINIKOS_ECOSYSTEM,
  KLINIKOS_HUMAN_AUTHORITY,
  KLINIKOS_ONE_LINE,
  KLINIKOS_SUPPORTING,
} from "@/lib/brand/canonical-messaging";

export type PublicKnowledgeArea = {
  id: string;
  name: string;
  purpose: string;
  capabilities: readonly string[];
  boundaries: readonly string[];
  publicRoutes: readonly string[];
  synonyms: readonly string[];
};

/**
 * Public-safe product facts only.
 *
 * This is deliberately smaller than the private repository canon. It contains only
 * information a normal visitor may learn from public Klinikos surfaces. Proprietary
 * orchestration, ranking, pricing-margin, anti-abuse, provider, security and roadmap
 * details do not belong here.
 */
export const PUBLIC_KLINIKOS_KNOWLEDGE: readonly PublicKnowledgeArea[] = [
  {
    id: "clinic_operations",
    name: "Klinikos",
    purpose: KLINIKOS_ECOSYSTEM[0].sentence,
    capabilities: [
      "scheduling and intake workflow",
      "team tasks and ownership",
      "follow-up and callback continuity",
      "referrals and unresolved handoffs",
      "documents and operational paperwork",
      "billing and claim-readiness work",
      "revenue follow-through and recovery work",
      "operational priorities and quality signals",
    ],
    boundaries: [
      "Klinikos does not replace licensed clinical judgment",
      "public visitors cannot access private clinic records or execute clinic work",
      "external healthcare infrastructure remains governed by its own required systems and integrations",
    ],
    publicRoutes: ["/how-it-works", "/founding-clinic", "/operational-audit", "/pricing", "/trust"],
    synonyms: ["clinic operations", "practice operations", "front desk", "callbacks", "follow-up", "revenue recovery", "workflow"],
  },
  {
    id: "zumi",
    name: "Zumi",
    purpose: KLINIKOS_ECOSYSTEM[1].sentence,
    capabilities: [
      "understand a user's goal in natural language",
      "explain Klinikos and its public capabilities",
      "help identify the next useful product or workflow path",
      "inside an authorized workspace, use permitted context to help coordinate work",
    ],
    boundaries: [
      KLINIKOS_HUMAN_AUTHORITY,
      "public Zumi is not an anonymous clinic session",
      "Zumi does not override authentication, authorization, credential, payment, clinical or safety authority",
    ],
    publicRoutes: ["/", "/how-it-works", "/trust"],
    synonyms: ["assistant", "ai", "intelligence", "help", "what can you do", "what can we do"],
  },
  {
    id: "grid",
    name: "Grid",
    purpose: KLINIKOS_ECOSYSTEM[2].sentence,
    capabilities: [
      "healthcare work and opportunity discovery",
      "staffing and shift capacity",
      "people and professional capacity",
      "rooms, chairs and healthcare space",
      "equipment and services",
      "organizations and other healthcare resources represented in Grid",
    ],
    boundaries: [
      "availability, eligibility, credentials and regulated-work requirements remain governed rather than assumed from conversation",
      "public conversation does not promise a match or completed transaction",
    ],
    publicRoutes: ["/grid", "/grid/browse", "/grid/pricing"],
    synonyms: ["job", "shift", "gig", "per diem", "room", "chair", "space", "equipment", "capacity", "resource"],
  },
  {
    id: "edu",
    name: "Klinikos EDU",
    purpose: KLINIKOS_ECOSYSTEM[3].sentence,
    capabilities: [
      "healthcare-operations learning",
      "synthetic practice scenarios",
      "readiness and skill-development paths represented in EDU",
      "connecting learning goals to relevant public opportunities where supported",
    ],
    boundaries: [
      "EDU does not make an unverified person licensed, credentialed or eligible for regulated work",
      "synthetic learning environments must not expose real patient data",
    ],
    publicRoutes: ["/edu"],
    synonyms: ["student", "training", "learn", "course", "practice", "readiness", "skills"],
  },
  {
    id: "patient_access",
    name: "Patient access",
    purpose: "The patient-facing path for appointments, forms, messages and other supported next steps.",
    capabilities: [
      "reach patient access",
      "continue to supported appointment, form or message workflows after the appropriate sign-in or patient flow",
    ],
    boundaries: [
      "public Zumi cannot look up a patient, chart, lab, prescription or private medical record",
      "clinical guidance remains with appropriate licensed professionals",
    ],
    publicRoutes: ["/portal/login"],
    synonyms: ["patient", "appointment", "forms", "portal", "care", "see a doctor"],
  },
] as const;

export function publicKlinikosKnowledgeForModel() {
  const sections = PUBLIC_KLINIKOS_KNOWLEDGE.map((area) => [
    `${area.name}: ${area.purpose}`,
    `Capabilities: ${area.capabilities.join("; ")}.`,
    `Boundaries: ${area.boundaries.join("; ")}.`,
    `Public routes: ${area.publicRoutes.join(", ")}.`,
  ].join("\n"));

  return [
    `Klinikos: ${KLINIKOS_ONE_LINE}`,
    KLINIKOS_SUPPORTING,
    ...sections,
  ].join("\n\n");
}
