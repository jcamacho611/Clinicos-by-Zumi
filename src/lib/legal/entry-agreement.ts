import type { AgreementAcknowledgment, AgreementPresentation } from "@/lib/legal/global-agreement";
import type { LegalPublicConfig } from "@/lib/legal/legal-config";

export const ENTRY_TERMS_KEY = "klinikos-protected-entry-confidentiality-esign";
export const ENTRY_TERMS_VERSION = "2026.08.23.1";
export const ENTRY_TERMS_EFFECTIVE_DATE = "2026-08-23";

export const ENTRY_ACKNOWLEDGMENTS: AgreementAcknowledgment[] = [
  {
    key: "terms",
    label: "I have reviewed and agree to the Klinikos Protected Entry Terms governing my access to non-public interactive product experiences.",
  },
  {
    key: "confidentiality",
    label: "I understand that protected Klinikos experiences may expose confidential, proprietary, pre-release, or commercially sensitive information and I agree to use it only as authorized.",
  },
  {
    key: "electronic_signature",
    label: "I consent to transact electronically and intend my click on Agree & Enter Klinikos to authenticate my acceptance of this exact agreement version.",
  },
  {
    key: "ai_authority",
    label: "I understand that Zumi may assist with information and workflow but does not override authoritative permission, credential, clinical, eligibility, payment, safety, or security controls.",
  },
];

export function buildEntryAgreement(config: LegalPublicConfig): AgreementPresentation {
  return {
    documentKey: ENTRY_TERMS_KEY,
    documentVersion: ENTRY_TERMS_VERSION,
    title: "Klinikos Protected Entry Terms, Confidentiality Covenant, and Electronic Acceptance Agreement",
    effectiveDate: ENTRY_TERMS_EFFECTIVE_DATE,
    contractingEntity: config.entityName,
    legalContactEmail: config.legalContactEmail,
    sections: [
      {
        heading: "1. Protected Entry and Electronic Acceptance",
        paragraphs: [
          `These Protected Entry Terms govern access to non-public interactive Klinikos experiences provided by ${config.entityName} ("Klinikos," "we," "us," or "our"). Public marketing, educational, trust, pricing, and other intentionally public pages may remain available without accepting these Terms.`,
          "By affirmatively selecting every required acknowledgment and clicking Agree & Enter Klinikos, you intend that action to authenticate your electronic acceptance of this exact agreement version. Your acceptance may initially be recorded before authentication and then bound to the account you successfully authenticate or create through the same governed entry flow.",
          "Acceptance permits only the protected access Klinikos actually grants. It does not create a professional license, clinical privilege, employment relationship, healthcare authorization, payment entitlement, marketplace eligibility, or authority to bind an organization.",
        ],
      },
      {
        heading: "2. Limited Access License",
        paragraphs: [
          "Subject to these Terms and any additional applicable agreement, Klinikos grants a limited, revocable, non-exclusive, non-transferable, non-sublicensable right to access the protected experience for legitimate evaluation, participation, learning, implementation planning, collaboration, or authorized use.",
          "Access is not ownership. Viewing, testing, subscription, payment, or marketplace participation does not assign Klinikos intellectual property or grant source-code, model, prompt, algorithm, database, or competitive-use rights except where applicable law makes a restriction non-waivable.",
        ],
      },
      {
        heading: "3. Confidential and Proprietary Information",
        paragraphs: [
          "Protected Klinikos environments may expose non-public information that is confidential, proprietary, commercially sensitive, pre-release, or eligible for trade-secret protection. This can include non-public architecture, workflows, designs, specifications, data models, internal APIs, system prompts, routing or orchestration methods, matching/ranking methods, trust and anti-gaming methods, security design, internal telemetry, prototypes, roadmaps, pricing strategy, margins, implementation methods, customer or prospect information, and other non-public know-how.",
          "You may use protected information only for the authorized purpose for which access was provided and must use reasonable safeguards appropriate to the information. You may not publish, sell, redistribute, disclose to a competitor, or use protected information to build or improve a competing product except where a restriction is prohibited by non-waivable law.",
          "Information intentionally made public by Klinikos is not converted into a trade secret merely because these Terms exist. Contractual confidentiality supplements technical secrecy; it does not replace server-side disclosure controls.",
        ],
      },
      {
        heading: "4. Anti-Copying, Extraction, Scraping, and Circumvention",
        paragraphs: [
          "To the maximum extent permitted by applicable law, you may not copy, mirror, scrape protected areas, bulk-extract protected data, reconstruct private interfaces or protocols, decompile, disassemble, reverse engineer, extract hidden prompts or models, bypass access controls, defeat quotas or feature gates, or use confidential access to reproduce proprietary Klinikos workflows without authorization.",
          "Nothing in this section prohibits conduct that applicable law expressly makes non-waivable, including legally protected interoperability or authorized good-faith security research. Unauthorized access, credential theft, destructive testing, privacy violations, and malicious exploitation remain prohibited.",
        ],
      },
      {
        heading: "5. Accounts, Identity, and Security",
        paragraphs: [
          "If you continue into authentication, you must use accurate account information and keep credentials reasonably secure. You may not impersonate another person, use another person's credentials without authorization, or bypass authentication, multi-factor authentication, role controls, legal gates, or other security controls.",
          "An account, email domain, profile statement, uploaded document, badge, match, or platform role does not by itself establish identity assurance, licensure, credential verification, scope of practice, organizational authority, professional privilege, or eligibility for a particular action.",
        ],
      },
      {
        heading: "6. Klinikos Intelligence / Zumi",
        paragraphs: [
          "Klinikos Intelligence, including Zumi, may assist with navigation, summarization, preparation, discovery, workflow support, and other permitted tasks. AI-generated material can be incomplete, inaccurate, outdated, or inappropriate for a particular situation and must be reviewed when consequences matter.",
          "AI output does not independently establish medical, legal, financial, credentialing, security, payment, employment, or regulatory truth. Deterministic Klinikos controls and authorized humans remain authoritative for permissions, tenant access, credential and professional eligibility, payment and settlement state, clinical sign-off, safety holds, and other governed decisions.",
          "You may not use prompt injection, malicious extraction techniques, or other methods to obtain credentials, hidden system instructions, private policies, protected data, or unauthorized access.",
        ],
      },
      {
        heading: "7. Healthcare and Sensitive-Data Boundaries",
        paragraphs: [
          "Unless a separately executed agreement and applicable law establish otherwise, Klinikos is a technology platform and is not itself your physician, nurse, medical director, insurer, pharmacy, laboratory, clearinghouse, emergency service, or employer. Healthcare professionals remain responsible for professional judgment and requirements applicable to their work.",
          "Do not enter protected health information, production credentials, or other specially regulated data into a demo, evaluation, public, beta, AI, communications, or integration environment unless Klinikos has expressly approved that environment and the required contractual, security, vendor, and regulatory conditions are satisfied.",
          "Acceptance of these Terms is not a Business Associate Agreement, data processing agreement, patient consent, HIPAA authorization, medical consent, or substitute for another legally required document.",
        ],
      },
      {
        heading: "8. Grid, Marketplace, and Transaction Truth",
        paragraphs: [
          "Grid may connect people, organizations, work, services, facilities, capacity, education, or other resources. Discovery is not eligibility. A match is not authorization. An offer is not a booking. A booking is not fulfillment. A payable is not paid. A payout is not settled without appropriate evidence.",
          "Eligibility may depend on identity, credentials, licensure, jurisdiction, insurance, training, scope, supervision, facility requirements, availability, organizational authority, payment conditions, and other rules. AI, sponsorship, popularity, or payment may not override a failed hard eligibility requirement.",
        ],
      },
      {
        heading: "9. Acceptable Use and Integrity",
        paragraphs: [
          "You may not use Klinikos to facilitate fraud, false claims, credential fraud, identity fraud, payment fraud, falsified licenses or documentation, unlawful healthcare activity, unlawful referral payments, bribes or kickbacks, sanctions violations, harassment, malware, ransomware, credential theft, denial-of-service attacks, or other unlawful or abusive conduct.",
          "Klinikos may suspend or limit protected access, require reauthentication, investigate suspicious activity, preserve evidence, or apply other proportionate safeguards when reasonably necessary to protect users, organizations, the platform, confidential information, or legal obligations.",
        ],
      },
      {
        heading: "10. Additional Agreements, Governing Law, and Changes",
        paragraphs: [
          "These Terms establish the baseline conditions for protected entry. Clinic implementations, production healthcare use, Grid participation, professional participation, education programs, seller relationships, enterprise deployments, paid services, data processing, and business-associate relationships may require additional signed agreements that supplement or control for their subject matter.",
          `These Terms are governed by ${config.governingLaw}, subject to mandatory law that cannot be displaced. The configured forum is ${config.forum}, subject to any mandatory jurisdictional rule or later signed agreement that lawfully controls.`,
          "Klinikos may publish a new agreement version when material terms change. A new version does not silently rewrite historical acceptance evidence. Continued protected access may require affirmative reacceptance of the then-applicable version.",
        ],
      },
    ],
  };
}
