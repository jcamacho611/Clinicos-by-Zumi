import { createHash } from "node:crypto";
import type { LegalPublicConfig } from "@/lib/legal/legal-config";
import { AI_SERVICE_PROCESSING_AGREEMENT_KEY } from "@/lib/legal/ai-service-processing-policy";

export const GLOBAL_TERMS_KEY = "klinikos-global-terms-confidentiality-esign";
export const GLOBAL_TERMS_VERSION = "2026.08.26.1";
export const GLOBAL_TERMS_EFFECTIVE_DATE = "2026-08-26";

export interface AgreementSection {
  heading: string;
  paragraphs: string[];
}

export interface AgreementPresentation {
  documentKey: string;
  documentVersion: string;
  title: string;
  effectiveDate: string;
  contractingEntity: string;
  legalContactEmail: string;
  sections: AgreementSection[];
}

export type AgreementAcknowledgmentKey =
  | "terms"
  | "confidentiality"
  | "electronic_signature"
  | "ai_authority"
  | "ai_service_processing"
  | "professional_truth"
  | "grid_truth";

export interface AgreementAcknowledgment {
  key: AgreementAcknowledgmentKey;
  label: string;
}

const baseAcknowledgments: AgreementAcknowledgment[] = [
  {
    key: "terms",
    label: "I have reviewed and agree to the applicable Klinikos Terms, including the incorporated confidentiality and restricted-use obligations.",
  },
  {
    key: "confidentiality",
    label: "I understand that restricted Klinikos areas may contain confidential, proprietary, trade-secret, pre-release, or commercially sensitive information, and I agree to protect and use that information only as authorized.",
  },
  {
    key: "electronic_signature",
    label: "I consent to transact electronically and intend my electronic signature to authenticate my acceptance of this Agreement.",
  },
  {
    key: "ai_authority",
    label: "I understand that Klinikos Intelligence may assist with information, navigation, preparation, and workflow, but it does not override professional judgment or authoritative permission, credential, eligibility, payment, safety, or security controls.",
  },
  {
    key: "ai_service_processing",
    label: "I understand that when I use a Zumi-powered feature, Klinikos may process the minimum information reasonably necessary for that requested service through approved AI providers or other approved subprocessors under the applicable policies and agreements. This is not unrestricted permission to use all of my data for general-purpose model training or unrelated commercial targeting, and protected health information may be processed by AI only in approved healthcare workflows with the required safeguards.",
  },
];

export function requiredAcknowledgmentsForRole(role: string): AgreementAcknowledgment[] {
  const required = [...baseAcknowledgments];
  if (["provider", "clinical_staff", "contractor"].includes(role)) {
    required.push({
      key: "professional_truth",
      label: "I understand that accepting this Agreement does not verify my license, credentials, malpractice coverage, scope of practice, supervision, jurisdictional eligibility, or legal authority to perform any professional service.",
    });
  }
  if (role === "contractor") {
    required.push({
      key: "grid_truth",
      label: "I understand that a Grid discovery result, match, offer, acceptance, or reservation is not by itself proof of professional eligibility, payment, fulfillment, payout, or settlement.",
    });
  }
  return required;
}

export function buildGlobalAgreement(config: LegalPublicConfig): AgreementPresentation {
  return {
    documentKey: GLOBAL_TERMS_KEY,
    documentVersion: GLOBAL_TERMS_VERSION,
    title: "Klinikos Global Terms of Use, Confidentiality Covenant, and Electronic Signature Agreement",
    effectiveDate: GLOBAL_TERMS_EFFECTIVE_DATE,
    contractingEntity: config.entityName,
    legalContactEmail: config.legalContactEmail,
    sections: [
      {
        heading: "1. Agreement, Scope, and Contracting Party",
        paragraphs: [
          `These Terms of Use, Confidentiality Covenant, and Electronic Signature Agreement (the \"Agreement\") govern access to protected or authenticated Klinikos services provided by ${config.entityName} (\"Klinikos,\" \"we,\" \"us,\" or \"our\"). By completing the affirmative acceptance and signature process, you enter this Agreement in the capacity you identify at signing.`,
          "Public marketing pages may be available without execution of this Agreement. Protected product access, private demonstrations, beta functionality, Grid participation, professional workflows, organization workspaces, and other restricted capabilities may require this Agreement and additional role-, product-, transaction-, or jurisdiction-specific agreements.",
          "If you sign solely as an individual, you bind only yourself. If you affirmatively sign on behalf of an organization, you represent that you have authority to bind that organization to the applicable agreement. An email domain, job title, account role, or platform permission does not by itself establish authority to bind an organization.",
          "Additional signed documents, including an order form, statement of work, master services agreement, data processing addendum, business associate agreement, professional participation addendum, Grid participant agreement, or negotiated amendment, may supplement or control over these Terms for the subjects they expressly govern.",
        ],
      },
      {
        heading: "2. Electronic Records and Electronic Signatures",
        paragraphs: [
          "You agree that this transaction may be conducted electronically. When you type or otherwise provide an electronic signature and select Agree & Sign, you intend that signature to authenticate your acceptance of the exact agreement version presented to you.",
          "Klinikos records agreement version, document hash, timestamps, acknowledgments, signer information, signature method, session evidence, and other limited execution evidence reasonably designed to preserve an accurate record of the transaction. A typed signature is an electronic signature; it is not represented as notarization, a qualified electronic signature, advanced identity proofing, or another higher-assurance signature unless the actual signing method satisfies those requirements.",
          "You may obtain a reproducible copy of an executed agreement through the Klinikos agreement center or another provided delivery method. Where law requires additional consumer electronic-record disclosures, consent procedures, paper-copy rights, hardware/software disclosures, or withdrawal rights, those requirements remain applicable and are not waived by this Agreement.",
        ],
      },
      {
        heading: "3. Eligibility, Accounts, and Security",
        paragraphs: [
          "You must provide accurate account and signing information and keep credentials reasonably secure. You may not impersonate another person, sign for another person or organization without authority, share credentials in violation of applicable policy, or attempt to bypass authentication, multi-factor authentication, role controls, legal gates, or other security controls.",
          "Klinikos may suspend sessions, require reauthentication or multi-factor authentication, revoke credentials, limit access, or investigate suspicious activity when reasonably necessary to protect users, organizations, the platform, confidential information, or legal obligations.",
          "Account access does not establish a professional license, credential, clinical privilege, employment status, marketplace eligibility, payment entitlement, or authority to act for any organization.",
        ],
      },
      {
        heading: "4. Limited License; Access Is Not Ownership",
        paragraphs: [
          "Subject to this Agreement and applicable product terms, Klinikos grants you a limited, revocable, non-exclusive, non-transferable, non-sublicensable right to access and use the applicable services for authorized purposes during the period you are permitted to use them.",
          "Access is not ownership. Viewing is not ownership. Subscription is not ownership. Payment is not an assignment of intellectual property. Marketplace participation is not a license to copy the platform. No rights are granted by implication except rights that applicable law makes non-waivable.",
        ],
      },
      {
        heading: "5. Confidential, Proprietary, and Trade-Secret Information",
        paragraphs: [
          "Restricted Klinikos environments may expose non-public information that is confidential, proprietary, commercially sensitive, pre-release, or eligible for trade-secret protection. Confidential Information includes non-public information that is identified as confidential or that a reasonable person would understand to be confidential considering its nature and the circumstances of disclosure.",
          "Subject to that standard, Confidential Information may include non-public source and object code; algorithms; software architecture; internal or unpublished APIs; schemas and data models; system prompts and agent instructions; model routing, evaluation, inference, or orchestration methods; proprietary Grid composition, matching, ranking, eligibility, trust, anti-fraud, or anti-gaming methods; security design and heuristics; internal telemetry and analytics; product roadmaps and prototypes; unreleased or beta features; pricing strategy, margins, unit economics, commission structures, and commercial methods; customer, prospect, provider, clinic-network, vendor, partnership, fundraising, and financial information; internal research; designs; specifications; inventions; discoveries; know-how; private demonstrations; unpublished contracts; and non-public communications.",
          "Information is not Confidential Information to the extent the receiving party can demonstrate that it became public without breach of an obligation, was lawfully known without restriction before disclosure, was independently developed without use of the protected information, was lawfully received from a third party without confidentiality restriction, or must be disclosed by law. If legally permitted, a recipient required to disclose protected information must provide reasonable advance notice so protective measures may be considered.",
        ],
      },
      {
        heading: "6. Confidentiality and Restricted Use Duties",
        paragraphs: [
          "You may use Confidential Information only for the authorized purpose for which access was provided. You must use reasonable safeguards appropriate to the information and may disclose it only to persons who are authorized to receive it and are bound by applicable confidentiality obligations.",
          "Except as expressly authorized or required by non-waivable law, you may not publish, sell, license, redistribute, leak, provide to a competitor, or use Confidential Information to build or improve a competing product. You may not upload protected Klinikos materials into an unauthorized third-party AI service, train a competing system on restricted Klinikos material, or create derivative commercial datasets from confidential access.",
          "For information that legally qualifies as a trade secret, these duties continue for as long as the information remains a trade secret under applicable law. For other Confidential Information, applicable confidentiality duration may be supplied by a more specific agreement. This Agreement does not attempt to convert information that Klinikos intentionally made public without restriction into a trade secret after the fact.",
        ],
      },
      {
        heading: "7. Anti-Copying, Reverse Engineering, Scraping, and Circumvention",
        paragraphs: [
          "To the maximum extent permitted by applicable law, you may not, without authorization, copy, reproduce, mirror, frame, resell, sublicense, white-label, scrape restricted areas, bulk-extract data, harvest databases, decompile, disassemble, reverse engineer, extract source code, extract prompts, extract models, reconstruct private protocols, circumvent access controls, bypass quotas or rate limits, defeat feature gates, or use confidential access to reconstruct proprietary Klinikos workflows.",
          "Nothing in this section prohibits conduct that applicable law expressly makes non-waivable, including legally protected interoperability or good-faith security research that complies with an authorized vulnerability disclosure program. Malicious exploitation, credential theft, destructive testing, privacy violations, and unauthorized access remain prohibited.",
        ],
      },
      {
        heading: "8. Intellectual Property",
        paragraphs: [
          "Klinikos and its licensors retain their rights in the platform and protectable software, documentation, interfaces, workflows, compilations, databases, graphics, designs, trademarks, service marks, logos, trade dress, domain names, original content, inventions, methods, know-how, and other intellectual property. Third-party materials remain subject to their respective rights and licenses.",
          "No provision transfers ownership of your pre-existing content to Klinikos. Any custom implementation, professional-services deliverable, or separately commissioned work may be governed by an order form or statement of work that identifies ownership and license rights. Pre-existing Klinikos technology and general platform improvements remain subject to the applicable Klinikos intellectual-property terms unless a signed agreement expressly states otherwise.",
        ],
      },
      {
        heading: "9. User Content, Feedback, Data, and AI Service Processing",
        paragraphs: [
          "You retain appropriate rights in content you lawfully provide. You grant Klinikos the limited rights reasonably necessary to host, store, process, transmit, display, secure, back up, and otherwise handle that content to provide, protect, support, and administer the contracted services and comply with law.",
          "You represent that you have authority to provide content and instructions you submit. Voluntary general product feedback may be used to improve Klinikos, but confidential customer information, protected health information, and your pre-existing intellectual property do not become unrestricted feedback merely because they were communicated to us.",
          `When you use a Zumi-powered feature governed by ${AI_SERVICE_PROCESSING_AGREEMENT_KEY}, Klinikos may process the minimum information reasonably necessary for the requested feature through approved AI model providers and other approved subprocessors for the disclosed or reasonably expected service purpose. That permission is purpose-limited and does not create an unrestricted right to reuse all user, customer, organization, clinical, or confidential data for general-purpose model training, unrelated advertising, or unrelated commercial purposes.`,
          "Klinikos does not obtain an unrestricted right to train AI models on all customer content. Treatment of customer content, confidential information, protected health information, de-identified data, aggregated data, feedback, synthetic data, AI inputs, and AI outputs must follow the applicable privacy, data-processing, healthcare, product, and screen-level data-governance policies.",
        ],
      },
      {
        heading: "10. Klinikos Intelligence / Zumi",
        paragraphs: [
          "Klinikos Intelligence, including Zumi, may assist with navigation, summarization, preparation, research, workflow support, and other permitted tasks. AI-generated material can be incomplete, inaccurate, outdated, or inappropriate for a particular situation and must be reviewed when consequences matter.",
          "Zumi's accessible context is intended to be bounded by the active user experience, authorized organization and resource context, applicable screen-level data policy, and minimum-necessary rules. The existence of information elsewhere in Klinikos does not by itself make that information available to Zumi in the current interaction.",
          "AI output does not independently establish medical, legal, financial, credentialing, security, payment, employment, or regulatory truth. Deterministic Klinikos controls and authorized humans remain authoritative for permissions, tenant access, credential and professional eligibility, payment and settlement state, clinical sign-off, safety holds, and other governed decisions.",
          "Operational personalization is distinct from generic commercial targeting. Clinical information and protected health information used for an authorized care or healthcare-operations purpose are not, by that fact alone, authorized as advertising, generic upsell, or unrelated commercial-targeting data.",
          "You may not use prompt injection, malicious inputs, extraction techniques, or other methods to obtain credentials, hidden system instructions, private policies, protected data, or unauthorized access. Klinikos may use technical and policy controls to resist abuse.",
        ],
      },
      {
        heading: "11. Healthcare Technology Limitations",
        paragraphs: [
          "Unless a separately executed agreement and applicable law establish otherwise, Klinikos is a technology platform and is not itself your physician, nurse, medical director, insurer, pharmacy, laboratory, clearinghouse, emergency service, or employer. Healthcare professionals remain responsible for professional judgment and compliance with scope-of-practice, licensure, supervision, prescribing, facility, documentation, consent, and other requirements applicable to them.",
          "Klinikos is not an emergency service. Do not rely on the platform for emergency response. Users facing a medical emergency should use the emergency services appropriate to their location.",
          "A software status, badge, match, recommendation, workflow completion, document upload, or user representation does not by itself establish legal or clinical eligibility.",
        ],
      },
      {
        heading: "12. HIPAA and Other Health-Data Obligations",
        paragraphs: [
          "Ordinary acceptance of these Terms does not create HIPAA compliance and is not a substitute for a Business Associate Agreement when one is legally required. If Klinikos acts as a business associate for a covered entity or another business associate, the applicable written BAA and related service agreements govern protected health information as specified in those documents.",
          "You must not place protected health information or other specially regulated data into a feature, environment, AI rail, communications channel, beta service, or integration that has not been approved for that data. The presence of a technical capability does not establish contractual, regulatory, vendor, or production approval.",
          "Protected health information may be sent to an AI model provider or other AI subprocessor only through a Klinikos workflow specifically approved for that data class and purpose, with minimum-necessary controls and the contracts, vendor terms, BAA, authorization, consent, or other safeguards required for the actual relationship and jurisdiction. Public Zumi is not an approved PHI entry point.",
          "Other health, privacy, breach-notification, consumer-health, biometric, genetic, minor, reproductive-health, substance-use, mental-health, insurance, or sensitive-data laws may apply depending on the data, user, service, and jurisdiction. Mandatory rights and obligations are not waived by this Agreement.",
        ],
      },
      {
        heading: "13. Grid Marketplace and Network Truth",
        paragraphs: [
          "Grid may connect people, organizations, opportunities, services, facilities, capacity, education, or other resources. Unless a separate agreement states otherwise, Klinikos acts as a technology platform rather than the employer, medical provider, guarantor, principal, or insurer of independent Grid participants.",
          "Discovery is not eligibility. A match is not a guarantee. An offer is not a booking. Acceptance is not a reservation. Reservation is not payment. Booking is not fulfillment. A payable is not paid. A payout is not settled without appropriate evidence.",
          "Eligibility may depend on identity, credentials, licensure, jurisdiction, malpractice coverage, training, scope, supervision, facility requirements, availability, payment conditions, organizational authorization, and other policy rules. AI, popularity, sponsorship, or payment may not override a failed hard eligibility requirement.",
          "Additional Grid Participant, Professional Participation, Organization, facility, service, or transaction terms may be required before a user can publish regulated supply, receive or accept regulated opportunities, access sensitive information, or complete a transaction.",
        ],
      },
      {
        heading: "14. Professional Representations",
        paragraphs: [
          "If you provide professional information, you must provide it truthfully and keep material information reasonably current. Where applicable, this may include identity, education, licenses, credentials, certifications, NPI information, malpractice coverage, training, experience, jurisdiction, restrictions, sanctions, availability, facility privileges, and supervision requirements.",
          "You must not knowingly use Klinikos to hold yourself out as qualified for an activity you are not legally permitted to perform. Acceptance of these Terms does not constitute verification, credentialing, privileging, or a determination of scope of practice.",
        ],
      },
      {
        heading: "15. Acceptable Use and Prohibited Conduct",
        paragraphs: [
          "You may not use Klinikos to facilitate unlawful conduct, unauthorized healthcare activity, fraudulent billing, false claims, bribes, kickbacks, unlawful referral payments, money laundering, sanctions violations, credential fraud, identity fraud, payment fraud, falsified licenses, falsified insurance, falsified documentation, fake fulfillment, fake settlement, malware, ransomware, denial-of-service attacks, credential theft, impersonation, harassment, or unlawful discrimination.",
          "You may not interfere with platform integrity, probe or exploit systems outside authorized security research, access another tenant without authorization, expose patient or confidential information, or circumvent technical or contractual restrictions designed to protect users and the platform.",
        ],
      },
      {
        heading: "16. Payments, Subscriptions, and Financial Truth",
        paragraphs: [
          "Prices, billing periods, setup fees, implementation fees, usage limits, overages, taxes, deposits, marketplace fees, renewal terms, and cancellation rights are governed by the applicable checkout, order form, product terms, or signed agreement. Mandatory consumer renewal or cancellation rights remain unaffected where they cannot be waived.",
          "A checkout redirect or browser success screen is not payment evidence. Processor authorization is not necessarily final settlement. Klinikos may rely on processor evidence, verified webhook events, ledger evidence, or approved reconciliation processes before granting payment-dependent entitlements, recognizing settlement, or releasing payouts.",
          "Payment processors and financial institutions are independent third parties. Klinikos does not guarantee their availability, payout timing, or decisions. Refunds, chargebacks, reversals, reserves, failed payments, and marketplace payouts are subject to the applicable product terms, processor rules, and law.",
        ],
      },
      {
        heading: "17. Third-Party Services and Integrations",
        paragraphs: [
          "Klinikos may interoperate with hosting, database, AI, communications, payment, mapping, identity, e-signature, laboratory, clearinghouse, insurance, storage, telemedicine, or other third-party services. Availability of an integration in software does not prove that the third party has approved a particular use, that a contract or BAA is in place, or that the integration is configured for production.",
          "Third-party services are governed by their own terms and may change, suspend, or fail independently. Klinikos remains responsible for obligations that applicable law places directly on Klinikos and does not disclaim such obligations merely because a third party is involved.",
        ],
      },
      {
        heading: "18. Privacy and Separate Consents",
        paragraphs: [
          "The Klinikos Privacy Policy describes relevant data practices. Contract acceptance is distinct from optional marketing consent, cookie/tracking consent, treatment consent, research consent, HIPAA authorization, recording or transcription consent, and other permissions that law or product design requires to be separately obtained.",
          "Ordinary acceptance of Klinikos service terms or AI service-processing terms does not constitute consent to unrestricted general-purpose AI model training. If Klinikos ever offers an optional program that uses data for a materially different AI training or research purpose, that program must use a separate, specific, lawful opt-in and disclose the applicable data categories, purpose, retention, provider, and withdrawal or preference mechanics as required.",
          "Where applicable, individuals may have rights relating to access, correction, deletion, restriction, objection, portability, withdrawal of consent, appeals, or marketing and data-sharing preferences. Those rights depend on law and are not eliminated by this Agreement.",
        ],
      },
      {
        heading: "19. Beta, Preview, Demo, and Pre-Release Access",
        paragraphs: [
          "Beta, preview, sandbox, research, prototype, invitation-only, and pre-release features may change, contain errors, be incomplete, or be discontinued. They must not be represented as production-certified capabilities unless that status is independently established.",
          "Private demonstrations and other high-sensitivity access may require an enhanced Confidential Access Agreement or standalone NDA in addition to these Terms. No beta or NDA acceptance independently authorizes protected health information, production credentials, unrestricted source-code access, or administrative/database access.",
        ],
      },
      {
        heading: "20. Suspension and Termination",
        paragraphs: [
          "Klinikos may suspend or terminate access when reasonably necessary for material breach, nonpayment, credential or safety concerns, fraud, unlawful conduct, sanctions risk, confidentiality or intellectual-property misuse, platform abuse, security compromise, or protection of users and systems. Where appropriate, notice or an opportunity to cure may be provided; serious safety, security, fraud, or legal risks may require immediate action.",
          "Termination does not erase accrued payment obligations, executed agreement evidence, intellectual-property ownership, confidentiality duties, trade-secret duties, dispute provisions, or other obligations that by their nature or express terms survive termination.",
        ],
      },
      {
        heading: "21. Warranties and Disclaimers",
        paragraphs: [
          "To the maximum extent permitted by law, and subject to any express warranties in a signed order or service agreement, Klinikos services are provided on an as-available basis without a guarantee that they will be uninterrupted, error-free, suitable for every workflow, produce a particular business outcome, or make third-party information or AI output accurate.",
          "Nothing in this Agreement excludes warranties, duties, or remedies that applicable law does not permit to be excluded, including non-waivable consumer protections.",
        ],
      },
      {
        heading: "22. Limitation of Liability",
        paragraphs: [
          "For business users, to the maximum extent permitted by applicable law and except as a signed negotiated agreement provides otherwise, neither party is liable to the other for indirect, incidental, special, exemplary, punitive, or consequential damages, or lost profits, revenues, goodwill, or opportunities, arising from this Agreement when such damages may lawfully be excluded.",
          "For business users, Klinikos's aggregate contractual liability arising from the services under these Terms will not exceed the greater of one hundred U.S. dollars or the fees actually paid to Klinikos for the affected services during the twelve months before the event giving rise to the claim, except to the extent applicable law or a signed agreement requires a different result. This limitation does not limit payment obligations and does not apply where liability cannot lawfully be limited, including applicable rules concerning fraud, willful misconduct, or other non-waivable liability.",
          "Consumer users retain mandatory rights and remedies that cannot lawfully be limited or waived. Jurisdiction-specific addenda or signed agreements may replace this section for a particular relationship.",
        ],
      },
      {
        heading: "23. Business-User Indemnity",
        paragraphs: [
          "If you use Klinikos on behalf of a business or as a professional or marketplace participant, then to the maximum extent permitted by law you will defend, indemnify, and hold harmless Klinikos and its applicable affiliates, officers, directors, employees, and agents from third-party claims to the extent caused by your unlawful use, fraudulent or false credential representations, content that infringes third-party rights, unauthorized professional services, or material breach of this Agreement, except to the extent the claim was caused by Klinikos's own conduct for which indemnification may not lawfully be shifted.",
          "This business-user indemnity is not intended to impose enterprise-style indemnification on consumers where doing so would be unlawful or unfair under applicable consumer law.",
        ],
      },
      {
        heading: "24. Confidentiality and IP Remedies",
        paragraphs: [
          "Unauthorized disclosure or misuse of Confidential Information or intellectual property may cause harm that is difficult to fully remedy with money alone. To the extent permitted by law, an affected party may seek appropriate injunctive or equitable relief in addition to actual damages, statutory remedies, unjust-enrichment remedies, and other relief available by contract or law.",
          "This Agreement does not impose an arbitrary punitive 'fine' or automatic liquidated-damages amount. Any liquidated-damages provision for a specific high-risk business relationship must be expressly included in the applicable signed agreement and reviewed for the relevant facts and jurisdiction.",
        ],
      },
      {
        heading: "25. Disputes, Governing Law, and Mandatory Local Rights",
        paragraphs: [
          `Business users should first provide reasonable written notice of a material dispute and allow a good-faith opportunity for business resolution. Except where mandatory law or a different signed agreement applies, business disputes under this Agreement are governed by ${config.governingLaw} and may be brought in ${config.forum}.`,
          "This version does not attempt to impose a universal arbitration clause or class-action waiver across every user and jurisdiction. Any arbitration, jury waiver, class waiver, or specialized dispute mechanism must be supplied by an applicable reviewed addendum or negotiated agreement where enforceable.",
          "Consumers retain non-waivable rights to courts, forums, remedies, and local law where applicable. If a provision conflicts with mandatory law, the mandatory law controls to the extent of the conflict and the remaining provisions continue to the maximum extent permitted.",
        ],
      },
      {
        heading: "26. Assignment, Corporate Succession, and No Implied Transfer",
        paragraphs: [
          "Subject to applicable law, Klinikos may assign this Agreement in connection with a legitimate incorporation, reorganization, merger, acquisition, financing, sale of substantially all relevant assets, or transfer of the applicable business or intellectual property. An assignment is effective only when legally accomplished; this clause does not falsely state that a future entity already owns rights that have not been assigned.",
          "You may not assign this Agreement in a way that transfers protected access, credentials, or confidential rights to an unauthorized party without consent, except where applicable law provides otherwise.",
        ],
      },
      {
        heading: "27. Changes, Reacceptance, and Historical Versions",
        paragraphs: [
          "Klinikos may publish updated terms prospectively. Material changes may require renewed affirmative acceptance before protected access continues. Historical executed versions remain preserved and are not silently overwritten by later text.",
          "A non-material clarification does not retroactively rewrite an already executed agreement. Where law requires notice, consent, or a particular effective date for changes, those requirements remain applicable.",
        ],
      },
      {
        heading: "28. Entire Agreement, Precedence, Severability, and Waiver",
        paragraphs: [
          "This Agreement and incorporated policies form the baseline terms for the access they govern. A signed negotiated amendment, order form, statement of work, MSA, DPA, BAA, role-specific addendum, or product-specific agreement may control over these Terms for an expressly conflicting subject according to its stated precedence.",
          "If a provision is held unenforceable, it should be enforced to the maximum lawful extent or severed as applicable without invalidating the remainder. Failure to enforce a provision on one occasion does not automatically waive future enforcement.",
        ],
      },
      {
        heading: "29. Contact and Legal-Review Status",
        paragraphs: [
          `Questions about these Terms may be directed to ${config.legalContactEmail}.`,
          "Klinikos describes this contract infrastructure as global-ready and enforceability-conscious, not as automatically enforceable in every country or compliant with every law. Jurisdiction-specific, healthcare-specific, consumer, employment, marketplace, privacy, or enterprise provisions may require additional review and addenda before launch or transaction execution.",
        ],
      },
    ],
  };
}

export function agreementPlainText(agreement: AgreementPresentation) {
  const header = [
    agreement.title,
    `Document key: ${agreement.documentKey}`,
    `Version: ${agreement.documentVersion}`,
    `Effective date: ${agreement.effectiveDate}`,
    `Contracting entity: ${agreement.contractingEntity}`,
    "",
  ];
  const body = agreement.sections.flatMap((section) => [section.heading, ...section.paragraphs, ""]);
  return [...header, ...body].join("\n").trim();
}

export function agreementSha256(agreement: AgreementPresentation) {
  return createHash("sha256").update(agreementPlainText(agreement), "utf8").digest("hex");
}

export function validateRequiredAcknowledgments(
  required: AgreementAcknowledgment[],
  provided: Record<string, boolean>,
) {
  return required.every(({ key }) => provided[key] === true);
}

export function normalizeSignatureText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}
