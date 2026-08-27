import { createHash } from "node:crypto";
import type { LegalPublicConfig } from "@/lib/legal/legal-config";
import { AI_SERVICE_PROCESSING_AGREEMENT_KEY } from "@/lib/legal/ai-service-processing-policy";
import {
  ANTI_CIRCUMVENTION_RULE,
  ANTI_FACILITATION_RULE,
  CUMULATIVE_REMEDIES,
  DTSA_IMMUNITY_NOTICE,
  EVIDENCE_PRESERVATION_RULE,
  LIQUIDATED_DAMAGES_POLICY,
  NO_DOUBLE_RECOVERY_RULE,
  SEVERE_PROTECTED_ASSET_TRIGGERS,
} from "@/lib/legal/legal-defense";

export const GLOBAL_TERMS_KEY = "klinikos-global-terms-confidentiality-esign";
export const GLOBAL_TERMS_VERSION = "2026.08.27.1";
export const GLOBAL_TERMS_EFFECTIVE_DATE = "2026-08-27";

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
  | "breach_consequences"
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
    label: "I have reviewed and agree to the applicable Klinikos Terms, including incorporated confidentiality, restricted-use, security, intellectual-property, and remedies obligations.",
  },
  {
    key: "confidentiality",
    label: "I understand that restricted Klinikos areas may contain confidential, proprietary, trade-secret, pre-release, or commercially sensitive information, and I agree to protect and use that information only as authorized.",
  },
  {
    key: "breach_consequences",
    label: "I understand that prohibited misuse may result in immediate access revocation and, where legally available, injunctive relief, damages, remediation and investigation costs, fee-shifting, statutory remedies, and other relief described in this Agreement; no arbitrary punitive fine is created by this acknowledgment.",
  },
  {
    key: "electronic_signature",
    label: "I consent to transact electronically and intend my electronic signature to authenticate my acceptance of this exact Agreement version.",
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
  const severeBreachParagraph = `A Severe Protected-Asset Breach includes, without limiting other material breaches: ${SEVERE_PROTECTED_ASSET_TRIGGERS.join("; ")}.`;
  const remediesParagraph = `Subject to applicable law, available remedies may include: ${CUMULATIVE_REMEDIES.join("; ")}. ${NO_DOUBLE_RECOVERY_RULE}`;

  return {
    documentKey: GLOBAL_TERMS_KEY,
    documentVersion: GLOBAL_TERMS_VERSION,
    title: "Klinikos Global Terms of Use, Confidentiality Covenant, Intellectual Property Protection, and Electronic Signature Agreement",
    effectiveDate: GLOBAL_TERMS_EFFECTIVE_DATE,
    contractingEntity: config.entityName,
    legalContactEmail: config.legalContactEmail,
    sections: [
      {
        heading: "1. Agreement, Scope, and Contracting Party",
        paragraphs: [
          `These Terms of Use, Confidentiality Covenant, Intellectual Property Protection, and Electronic Signature Agreement (the \"Agreement\") govern protected or authenticated access to Klinikos services provided by ${config.entityName} (\"Klinikos,\" \"we,\" \"us,\" or \"our\"). By completing the affirmative acceptance and signature process, you enter this Agreement in the capacity you identify at signing.`,
          "Public marketing pages may remain available without execution of this Agreement. Protected product access, private demonstrations, beta functionality, Grid participation, professional workflows, organization workspaces, data rooms, investor or partner materials, and other restricted capabilities may require this Agreement and additional role-, product-, transaction-, or jurisdiction-specific agreements.",
          "If you sign solely as an individual, you bind only yourself. If you affirmatively sign on behalf of an organization, you represent that you have actual authority to bind that organization to the applicable agreement. An email domain, title, account role, or platform permission does not by itself establish binding authority.",
          "A signed order form, statement of work, MSA, DPA, BAA, professional participation addendum, Grid agreement, NDA, or negotiated amendment may supplement or control over this Agreement for subjects it expressly governs.",
        ],
      },
      {
        heading: "2. Electronic Records, Signature, Version, and Reproduction",
        paragraphs: [
          "You agree that this transaction may be conducted electronically. When you type or otherwise provide an electronic signature and select Agree & Sign, you intend that signature to authenticate your acceptance of the exact agreement version presented to you.",
          "Klinikos may record the agreement key, version, effective date, content hash, timestamps, acknowledgments, signer identity, signature method, organization context, authority representation, protected destination, session/request correlation data, IP address and user-agent where legally appropriate, and other limited execution evidence reasonably designed to preserve an accurate record.",
          "Executed electronic agreements must be retained in a form capable of accurate later reproduction for persons entitled to retain them, subject to applicable law, retention policy, and legal holds. Historical executed versions are not silently rewritten when terms change.",
          "Where law requires additional consumer disclosures, paper-copy rights, hardware/software disclosures, consent withdrawal mechanics, notarization, or another higher-assurance execution method, those requirements remain applicable and are not waived by this Agreement.",
        ],
      },
      {
        heading: "3. Eligibility, Accounts, Authority, and Security",
        paragraphs: [
          "You must provide accurate account and signing information, keep credentials reasonably secure, and use only authority actually granted to you. You may not impersonate another person, sign for another person or organization without authority, share credentials contrary to policy, or attempt to bypass authentication, MFA, role controls, legal gates, tenant boundaries, quotas, rate limits, or other security controls.",
          "Klinikos may suspend sessions, require reauthentication or stronger verification, revoke credentials, limit access, preserve evidence, or investigate suspicious activity when reasonably necessary to protect users, organizations, the platform, confidential information, or legal obligations.",
          "Account access does not establish a professional license, credential, clinical privilege, employment status, marketplace eligibility, payment entitlement, ownership right, or authority to act for an organization.",
        ],
      },
      {
        heading: "4. Limited License; Access Is Not Ownership",
        paragraphs: [
          "Subject to this Agreement and applicable product terms, Klinikos grants you a limited, revocable, non-exclusive, non-transferable, non-sublicensable right to access and use applicable services only for authorized purposes while access remains valid.",
          "Access is not ownership. Viewing is not ownership. Subscription is not ownership. Payment is not an assignment of intellectual property. Marketplace participation is not a license to copy, replicate, commercialize, or appropriate protected Klinikos technology, information, relationships, or methods.",
        ],
      },
      {
        heading: "5. Confidential, Proprietary, and Trade-Secret Information",
        paragraphs: [
          "Restricted Klinikos environments may expose non-public information that is confidential, proprietary, commercially sensitive, pre-release, or eligible for trade-secret protection. Confidential Information means non-public information identified as confidential or that a reasonable person would understand to be confidential from its nature or disclosure circumstances.",
          "Confidential Information may include non-public source or object code; repositories; schemas; migrations; APIs; infrastructure; credentials; algorithms; scoring; heuristics; data models; event models; taxonomies; ontologies; system prompts; hidden instructions; model routing, evaluation, inference, memory, or orchestration methods; Grid composition, eligibility, matching, ranking, verification, trust, anti-fraud, or anti-gaming logic; security controls; internal telemetry; research; product roadmaps; prototypes; unreleased features; designs; workflows; specifications; pricing; margins; unit economics; commissions; costs; financial models; fundraising materials; customer, prospect, provider, clinic, investor, institution, vendor, partnership, referral, or network information; private demonstrations; unpublished contracts; integration maps; configuration systems; training systems; inventions; discoveries; know-how; and non-public communications.",
          "Confidential Information excludes information the recipient proves by contemporaneous evidence was lawfully known without confidentiality duty before disclosure, independently developed without use of Confidential Information, lawfully received from a third party without restriction, or public through no breach. Required disclosures remain permitted subject to Section 31.",
        ],
      },
      {
        heading: "6. Confidentiality, Safeguards, and Restricted Use",
        paragraphs: [
          "You may use Confidential Information only for the authorized purpose for which access was provided, must use safeguards reasonable for the information, and may disclose it only to persons authorized to receive it and bound by obligations at least as protective where appropriate.",
          "Except as expressly authorized or required by non-waivable law, you may not publish, sell, license, redistribute, leak, disclose to a competitor, upload to an unauthorized AI service, create a derivative commercial dataset, train or improve a competing system, or otherwise use Confidential Information for an unauthorized commercial, competitive, security, or extraction purpose.",
          "For information that legally qualifies as a trade secret, these duties continue for as long as that information remains a trade secret. Other confidentiality periods may be established by a more specific signed agreement.",
        ],
      },
      {
        heading: "7. Anti-Copying, Reverse Engineering, Extraction, and AI Misuse",
        paragraphs: [
          "To the maximum extent permitted by applicable law, and except for expressly authorized conduct, you may not copy, reproduce, mirror, frame, resell, sublicense, white-label, record, archive, scrape restricted areas, crawl protected resources, bulk-extract data, harvest databases, systematically benchmark for replication, decompile, disassemble, reverse engineer, extract source code, extract prompts, extract models, reconstruct private protocols, enumerate protected endpoints, defeat feature gates, or use confidential access to reconstruct protected Klinikos workflows or systems.",
          "You may not use prompt injection, adversarial extraction, automated agents, synthetic identities, credential sharing, distributed scraping, proxies, contractors, affiliates, or other indirect methods to accomplish conduct that would be prohibited if performed directly.",
          "Nothing in this section prohibits conduct that applicable law expressly makes non-waivable, including legally protected interoperability or authorized good-faith security research performed within an applicable written safe-harbor program. Unauthorized access, destructive testing, credential theft, privacy violations, and malicious exploitation remain prohibited.",
        ],
      },
      {
        heading: "8. Attempt, Facilitation, Direction, Financing, and Knowing Benefit",
        paragraphs: [
          ANTI_FACILITATION_RULE,
          "Using an employee, contractor, consultant, affiliate, agent, automated system, third-party account, or other intermediary does not convert prohibited conduct into permitted conduct when the person bound by this Agreement directs, facilitates, assists, enables, finances, conspires in, or knowingly benefits from that prohibited conduct under an applicable legal intent standard.",
        ],
      },
      {
        heading: "9. Anti-Circumvention of Protected Introductions and Opportunities",
        paragraphs: [
          ANTI_CIRCUMVENTION_RULE,
          "This section is intended to protect identifiable non-public relationships and opportunities actually introduced or materially developed through protected Klinikos access, not to prohibit ordinary lawful competition or relationships independently developed without protected information.",
        ],
      },
      {
        heading: "10. Intellectual Property and No Implied Rights",
        paragraphs: [
          "Klinikos and its licensors retain their rights in protectable software, documentation, interfaces, workflows, compilations, databases, graphics, designs, marks, logos, trade dress, domains, original content, inventions, methods, know-how, and other intellectual property. Third-party materials remain subject to their respective rights and licenses.",
          "No provision transfers ownership of your pre-existing content to Klinikos. Custom implementation or professional-services ownership may be addressed in a signed SOW or order form. Pre-existing Klinikos technology and general platform improvements remain governed by applicable Klinikos intellectual-property terms unless a signed agreement expressly states otherwise.",
          "You may not seek, file, prosecute, acquire, or assist another person in obtaining intellectual-property rights derived from Confidential Information in a manner that misappropriates or falsely claims ownership of protected Klinikos subject matter.",
        ],
      },
      {
        heading: "11. User Content, Feedback, Data, and AI Service Processing",
        paragraphs: [
          "You retain appropriate rights in content you lawfully provide. You grant Klinikos only the rights reasonably necessary to provide, secure, support, administer, and lawfully operate the contracted services, subject to applicable agreements and law.",
          "Voluntary general product feedback may be used to improve Klinikos, but customer confidential information, PHI, and pre-existing intellectual property do not become unrestricted feedback merely because they are communicated to Klinikos.",
          `When you use a Zumi-powered feature governed by ${AI_SERVICE_PROCESSING_AGREEMENT_KEY}, Klinikos may process the minimum information reasonably necessary for that feature through approved providers and subprocessors for the disclosed or reasonably expected service purpose. That permission is purpose-limited and does not create an unrestricted right to use all user, customer, organization, clinical, or confidential data for general-purpose model training, unrelated advertising, or unrelated commercial targeting.`,
        ],
      },
      {
        heading: "12. Klinikos Intelligence / Zumi",
        paragraphs: [
          "Klinikos Intelligence, including Zumi, may assist with navigation, summarization, preparation, research, workflow support, and other permitted tasks. AI-generated material can be incomplete, inaccurate, outdated, or inappropriate and requires review when consequences matter.",
          "Zumi does not independently establish medical, legal, financial, credentialing, security, payment, employment, or regulatory truth. Deterministic controls and authorized humans remain authoritative for permissions, tenant access, credentials, payment and settlement state, clinical sign-off, safety holds, and other governed decisions.",
          "You may not use malicious inputs or extraction techniques to obtain credentials, hidden system instructions, private policies, protected data, or unauthorized access.",
        ],
      },
      {
        heading: "13. Healthcare Technology Limitations",
        paragraphs: [
          "Unless a separately executed agreement and applicable law establish otherwise, Klinikos is a technology platform and is not itself your physician, nurse, medical director, insurer, pharmacy, laboratory, clearinghouse, emergency service, or employer. Healthcare professionals remain responsible for professional judgment and applicable licensure, supervision, prescribing, facility, documentation, consent, and scope requirements.",
          "Klinikos is not an emergency service. A software status, badge, match, recommendation, workflow completion, document upload, or user representation does not by itself establish legal or clinical eligibility.",
        ],
      },
      {
        heading: "14. HIPAA and Other Health-Data Obligations",
        paragraphs: [
          "Acceptance of this Agreement does not create HIPAA compliance and is not a substitute for a BAA when one is legally required. The applicable written BAA and service agreements control PHI obligations for covered relationships.",
          "You must not place PHI or specially regulated data into a feature, AI rail, communications channel, beta service, or integration that has not been approved for that data class and purpose.",
          "Mandatory privacy, health-data, breach-notification, consumer-health, biometric, genetic, minor, reproductive-health, substance-use, mental-health, insurance, or other sensitive-data rights are not waived by this Agreement.",
        ],
      },
      {
        heading: "15. Grid Marketplace and Network Truth",
        paragraphs: [
          "Grid may connect people, organizations, opportunities, services, facilities, capacity, education, or other resources. Unless a separate agreement states otherwise, Klinikos acts as a technology platform rather than the employer, medical provider, guarantor, principal, or insurer of independent Grid participants.",
          "Discovery is not eligibility. A match is not a guarantee. An offer is not a booking. Acceptance is not a reservation. Reservation is not payment. Booking is not fulfillment. A payable is not paid. A payout is not settled without appropriate evidence.",
          "Payment, popularity, sponsorship, AI output, or a user claim may not override a failed hard eligibility, credential, safety, legal, or authorization requirement.",
        ],
      },
      {
        heading: "16. Professional Representations",
        paragraphs: [
          "If you provide professional information, you must provide it truthfully and keep material information reasonably current. Where applicable, this includes identity, education, licenses, credentials, certifications, NPI information, malpractice coverage, training, experience, jurisdiction, restrictions, sanctions, availability, facility privileges, and supervision requirements.",
          "Acceptance does not constitute verification, credentialing, privileging, or a determination of scope of practice.",
        ],
      },
      {
        heading: "17. Acceptable Use and Prohibited Conduct",
        paragraphs: [
          "You may not use Klinikos to facilitate unlawful conduct, unauthorized healthcare activity, fraudulent billing, false claims, bribes, kickbacks, unlawful referral payments, money laundering, sanctions violations, credential fraud, identity fraud, payment fraud, falsified documentation, fake fulfillment, fake settlement, malware, ransomware, denial-of-service attacks, credential theft, impersonation, harassment, or unlawful discrimination.",
          "You may not interfere with platform integrity, exploit systems outside authorized security research, access another tenant without authorization, expose patient or confidential information, or circumvent technical or contractual restrictions designed to protect users and the platform.",
        ],
      },
      {
        heading: "18. Payments, Subscriptions, and Financial Truth",
        paragraphs: [
          "Prices, fees, billing periods, usage limits, overages, taxes, deposits, marketplace fees, renewal terms, refunds, and cancellation rights are governed by the applicable checkout, order, or signed agreement. Mandatory rights remain unaffected where non-waivable.",
          "A browser success screen is not payment evidence. Klinikos may require processor, webhook, ledger, reconciliation, or other authoritative evidence before granting payment-dependent entitlements, recognizing settlement, or releasing payouts.",
        ],
      },
      {
        heading: "19. Third-Party Services and Integrations",
        paragraphs: [
          "Klinikos may interoperate with third-party hosting, database, AI, communications, payment, mapping, identity, e-signature, laboratory, clearinghouse, insurance, storage, telemedicine, or other services. Software visibility does not prove a third party approved a particular use or that a contract, BAA, credential, certification, or production configuration exists.",
          "Third-party services are governed by their own terms and may change or fail independently. Klinikos does not disclaim obligations directly imposed on Klinikos merely because a third party is involved.",
        ],
      },
      {
        heading: "20. Privacy and Separate Consents",
        paragraphs: [
          "The Privacy Policy describes relevant data practices. Contract acceptance is distinct from optional marketing, tracking, treatment, research, HIPAA authorization, recording, transcription, and other consents that law or product design requires separately.",
          "Ordinary acceptance does not authorize unrestricted general-purpose AI model training. A materially different AI training or research program requires the applicable lawful disclosure and opt-in mechanics.",
        ],
      },
      {
        heading: "21. Beta, Preview, Demo, and Pre-Release Access",
        paragraphs: [
          "Beta, preview, sandbox, research, prototype, invitation-only, and pre-release features may change, contain errors, be incomplete, or be discontinued. They must not be represented as production-certified unless independently established.",
          "High-sensitivity access may require an enhanced Confidential Access Agreement or standalone NDA. No beta or NDA acceptance independently authorizes PHI, production credentials, unrestricted source-code access, or administrative/database access.",
        ],
      },
      {
        heading: "22. Breach Classification",
        paragraphs: [
          "A Material Breach may include credential sharing, unauthorized recording or export, prohibited automation, violation of use restrictions, failure to return or destroy protected material when lawfully required, or other material noncompliance with this Agreement.",
          "A Serious Confidentiality / IP Breach may include disclosure of non-public architecture, systematic extraction, unauthorized AI ingestion or training, competitive use of Confidential Information, protected-opportunity circumvention, unauthorized derivative exploitation, or facilitation of another party's prohibited use.",
          severeBreachParagraph,
          "Breach classification does not waive any legal element, defense, burden of proof, scienter requirement, causation requirement, or statutory prerequisite that applicable law requires.",
        ],
      },
      {
        heading: "23. Immediate Protective Measures",
        paragraphs: [
          "Upon suspected material breach, security compromise, fraud, unlawful conduct, confidentiality misuse, intellectual-property misuse, credential compromise, or material risk to users or systems, Klinikos may take proportionate protective action, including session suspension, credential or token revocation, access restriction, preservation of evidence, or temporary blocking while facts are investigated.",
          "Where appropriate, notice or an opportunity to cure may be provided. Serious safety, security, fraud, confidentiality, trade-secret, or legal risks may require immediate action without a cure period.",
        ],
      },
      {
        heading: "24. Evidence Preservation and Non-Spoliation",
        paragraphs: [
          EVIDENCE_PRESERVATION_RULE,
          "Nothing in this section requires unlawful retention, overrides applicable privacy or employment law, or creates an obligation broader than a valid preservation duty. When Klinikos issues a lawful preservation request, relevant executed agreements, access evidence, logs, communications, files, exports, screenshots, recordings, credentials, and transaction records may be preserved in accordance with law and policy.",
        ],
      },
      {
        heading: "25. Remedies for Confidentiality, IP, Security, and Severe Breach",
        paragraphs: [
          "Unauthorized disclosure, misuse, theft, extraction, circumvention, or commercial exploitation of Confidential Information, intellectual property, credentials, systems, or protected relationships may cause harm that cannot be fully remedied by money alone. To the extent permitted by law, an affected party may seek appropriate temporary, preliminary, permanent, injunctive, specific-performance, or other equitable relief without limiting other available remedies.",
          remediesParagraph,
          "Nothing in this Agreement creates a private remedy that applicable law does not recognize, waives a defense, or guarantees that a requested remedy will be awarded.",
        ],
      },
      {
        heading: "26. Liquidated Damages; No Arbitrary Penalty",
        paragraphs: [
          LIQUIDATED_DAMAGES_POLICY.rule,
          "Accordingly, this Agreement does not activate a preset $25,000, $50,000, $75,000, or other automatic charge merely because a breach is alleged. A transaction-specific liquidated-damages clause, if any, must appear in the applicable signed agreement and satisfy the final counsel-approved facts, jurisdiction, trigger, amount, and no-double-recovery framework.",
        ],
      },
      {
        heading: "27. Business-User Indemnity",
        paragraphs: [
          "If you use Klinikos for a business, professional, or marketplace purpose, then to the maximum extent permitted by law you will defend, indemnify, and hold harmless Klinikos and its applicable affiliates, officers, directors, employees, and agents from third-party claims to the extent caused by your unlawful use, false credential representations, infringing content, unauthorized professional services, intentional misuse of protected Klinikos assets, or material breach of this Agreement, except to the extent caused by Klinikos conduct for which indemnification may not lawfully be shifted.",
          "This section is not intended to impose enterprise-style indemnification on consumers where doing so would be unlawful or unfair.",
        ],
      },
      {
        heading: "28. Klinikos Liability Limits",
        paragraphs: [
          "For business users, to the maximum extent permitted by applicable law and except as a signed negotiated agreement provides otherwise, neither party is liable to the other for indirect, incidental, special, exemplary, punitive, or consequential damages, or lost profits, revenues, goodwill, or opportunities, when such damages may lawfully be excluded.",
          "For business users, Klinikos's aggregate contractual liability arising from affected services under these Terms will not exceed the greater of one hundred U.S. dollars or fees actually paid to Klinikos for the affected services during the twelve months before the event giving rise to the claim, except where applicable law or a signed agreement requires a different result. This limitation does not limit payment obligations and does not apply where liability cannot lawfully be limited.",
          "Consumer users retain mandatory rights and remedies that cannot lawfully be limited or waived.",
        ],
      },
      {
        heading: "29. Suspension, Termination, Return, and Destruction",
        paragraphs: [
          "Klinikos may suspend or terminate access when reasonably necessary for material breach, nonpayment, credential or safety concerns, fraud, unlawful conduct, sanctions risk, confidentiality or intellectual-property misuse, platform abuse, security compromise, or protection of users and systems.",
          "Upon termination or valid demand, a recipient must stop unauthorized use and, subject to law, retention duties, backup architecture, and legal holds, return, delete, or destroy protected materials as required by the applicable agreement. Klinikos may request reasonable certification of destruction in a high-risk confidential-access relationship.",
        ],
      },
      {
        heading: "30. Survival",
        paragraphs: [
          "Termination does not erase accrued payment obligations, executed agreement evidence, intellectual-property ownership, confidentiality duties, trade-secret duties, non-circumvention duties for their applicable agreed period, evidence-preservation obligations, dispute provisions, or remedies that by their nature or express terms survive termination.",
          "Trade-secret obligations survive for so long as the information legally remains a trade secret. Other confidentiality periods are governed by the applicable agreement and mandatory law.",
        ],
      },
      {
        heading: "31. Mandatory Legal Disclosures, Whistleblowing, and DTSA Immunity",
        paragraphs: [
          "Nothing in this Agreement prohibits a lawful report to a government agency, regulator, law-enforcement authority, or attorney, or another disclosure protected by non-waivable law. A person compelled by valid legal process may disclose only what the process lawfully requires and, where legally permitted, should provide reasonable notice so protective measures may be considered.",
          DTSA_IMMUNITY_NOTICE,
          "This Agreement does not prohibit lawful protected activity or authorize unlawful acquisition of material. Mandatory statutory rights control to the extent they cannot be waived.",
        ],
      },
      {
        heading: "32. Warranties and Disclaimers",
        paragraphs: [
          "To the maximum extent permitted by law, and subject to express warranties in a signed service agreement, Klinikos services are provided on an as-available basis without a guarantee that they will be uninterrupted, error-free, suitable for every workflow, produce a particular outcome, or make third-party information or AI output accurate.",
          "Nothing excludes warranties, duties, or remedies that applicable law does not permit to be excluded.",
        ],
      },
      {
        heading: "33. Disputes, Governing Law, and Mandatory Local Rights",
        paragraphs: [
          `Business users should first provide reasonable written notice of a material dispute and allow a good-faith opportunity for business resolution. Except where mandatory law or a different signed agreement applies, business disputes under this Agreement are governed by ${config.governingLaw} and may be brought in ${config.forum}.`,
          "This version does not impose a universal arbitration clause or class-action waiver across every user and jurisdiction. Any such mechanism must be supplied by an applicable reviewed addendum or negotiated agreement where enforceable.",
          "Consumers retain non-waivable rights to courts, forums, remedies, and local law where applicable.",
        ],
      },
      {
        heading: "34. Assignment, Corporate Succession, and No Implied Transfer",
        paragraphs: [
          "Subject to applicable law, Klinikos may assign this Agreement in connection with a legitimate incorporation, reorganization, merger, acquisition, financing, sale of substantially all relevant assets, or transfer of the applicable business or intellectual property.",
          "You may not assign this Agreement in a way that transfers protected access, credentials, or confidential rights to an unauthorized party without consent, except where law provides otherwise.",
        ],
      },
      {
        heading: "35. Changes, Reacceptance, and Historical Versions",
        paragraphs: [
          "Klinikos may publish updated terms prospectively. Material changes may require renewed affirmative acceptance before protected access continues. Historical executed versions remain preserved and are not silently overwritten by later text.",
          "Acceptance of an earlier materially superseded version does not satisfy a current-version gate where reacceptance is required.",
        ],
      },
      {
        heading: "36. Entire Agreement, Precedence, Severability, and Waiver",
        paragraphs: [
          "This Agreement and incorporated policies form baseline terms for the access they govern. A signed negotiated amendment, order form, SOW, MSA, DPA, BAA, NDA, role-specific addendum, or product-specific agreement may control for an expressly conflicting subject according to stated precedence.",
          "If a provision is held unenforceable, it should be enforced to the maximum lawful extent or severed as applicable without invalidating the remainder. Failure to enforce a provision once does not automatically waive later enforcement.",
        ],
      },
      {
        heading: "37. Contact and Legal-Review Status",
        paragraphs: [
          `Questions about these Terms may be directed to ${config.legalContactEmail}.`,
          "Klinikos describes this contract infrastructure as enforceability-conscious, not as automatically enforceable in every jurisdiction. Jurisdiction-specific healthcare, consumer, employment, marketplace, privacy, restrictive-covenant, liquidated-damages, or enterprise provisions may require additional counsel review before production reliance.",
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
