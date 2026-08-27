import "server-only";

/**
 * Server-authoritative legal-defense policy.
 *
 * This module is an engineering and drafting control, not a substitute for
 * licensed legal review. Consumer, worker, healthcare, privacy, marketplace,
 * and jurisdiction-specific agreements may require additional terms.
 */
export const LEGAL_DEFENSE_VERSION = "2026-08-27.1";

export const BREACH_CLASSES = {
  MATERIAL_BREACH: "MATERIAL_BREACH",
  SERIOUS_CONFIDENTIALITY_IP_BREACH: "SERIOUS_CONFIDENTIALITY_IP_BREACH",
  SEVERE_PROTECTED_ASSET_BREACH: "SEVERE_PROTECTED_ASSET_BREACH",
} as const;

export type BreachClass = (typeof BREACH_CLASSES)[keyof typeof BREACH_CLASSES];

export const SEVERE_PROTECTED_ASSET_TRIGGERS = [
  "intentional or reckless theft, misappropriation, or commercial exploitation of a trade secret",
  "unauthorized acquisition, copying, possession, disclosure, or exploitation of source code, repositories, internal schemas, credentials, or protected system material",
  "deliberate authentication, authorization, legal-gate, rate-limit, security-control, or tenant-boundary circumvention",
  "mass extraction, bulk scraping, exfiltration, mirroring, archiving, or systematic harvesting of restricted Klinikos material",
  "extraction or commercial exploitation of hidden instructions, system prompts, orchestration, model-routing, evaluation, Grid ranking, matching, eligibility, anti-abuse, security, or other protected logic",
  "deliberate credential, token, invitation, session, key, or account compromise, trafficking, or unauthorized sharing",
  "malicious concealment, destruction, alteration, falsification, or spoliation of evidence relating to suspected breach",
  "organized, financed, directed, induced, facilitated, enabled, assisted, or coordinated breach involving multiple actors",
  "deliberate use of Confidential Information to build, finance, advise, validate, market, procure, accelerate, or materially benefit a competing or substitutive product or service",
  "conduct causing a material compromise of protected Klinikos systems, confidential information, user data, or trade-secret secrecy",
] as const;

export const ANTI_FACILITATION_RULE =
  "A prohibited act includes, to the extent applicable law permits and subject to any required intent standard, directly or indirectly attempting, requesting, directing, inducing, financing, facilitating, assisting, enabling, conspiring in, or knowingly benefiting from conduct that would constitute a prohibited act if performed directly by the person bound by the agreement.";

export const ANTI_CIRCUMVENTION_RULE =
  "A person receiving a non-public introduction, transaction opportunity, negotiation, relationship, or commercially sensitive lead through protected Klinikos access may not intentionally bypass Klinikos for the purpose of appropriating that protected opportunity in violation of an applicable signed agreement. This restriction does not apply to a relationship demonstrably existing before the Klinikos introduction, an opportunity independently sourced without use of protected information, or a public-market relationship not introduced through Klinikos. Any duration or transaction-specific restriction remains subject to the applicable signed agreement and counsel review.";

export const EVIDENCE_PRESERVATION_RULE =
  "Once a person knows or reasonably should know of a suspected material breach, security incident, legal hold, or preservation request, that person may not knowingly destroy, conceal, falsify, materially alter, or cause the destruction of relevant evidence in violation of applicable law or a valid preservation obligation.";

export const CUMULATIVE_REMEDIES = [
  "immediate suspension or termination of access",
  "revocation of credentials, sessions, tokens, invitations, and protected-resource grants",
  "return, deletion, destruction, or certification of destruction of protected materials",
  "preservation of relevant evidence",
  "temporary, preliminary, and permanent injunctive or other equitable relief where available",
  "specific performance where available",
  "actual damages proven by admissible evidence",
  "unjust enrichment, restitution, and disgorgement where legally available",
  "reasonable forensic, investigation, containment, restoration, credential-rotation, remediation, notification, and incident-response costs caused by breach where legally recoverable",
  "reasonable attorneys' fees, expert fees, court costs, and enforcement expenses where the contract and applicable law permit recovery",
  "applicable copyright, trademark, patent, computer-misuse, trade-secret, contract, and other statutory remedies",
  "termination of licenses, evaluation rights, confidential-access rights, Grid participation, partner access, or data-room access",
  "referral to appropriate authorities when legally required or appropriate",
] as const;

export const NO_DOUBLE_RECOVERY_RULE =
  "Remedies are cumulative only to the extent legally permitted. Klinikos may not obtain double recovery for the same injury, and any award must be credited as required to prevent duplicative recovery.";

export const LIQUIDATED_DAMAGES_POLICY = {
  productionApproved: false,
  counselReviewRequired: true,
  presetAmountEnabled: false,
  rule:
    "No arbitrary fine is activated. Any liquidated-damages clause must address a specifically defined breach for which anticipated loss was difficult to estimate when contracting, reflect a reasonable estimate of anticipated harm, be documented as compensatory and not a penalty, prevent double recovery, and receive counsel approval for the applicable facts and jurisdiction before production use.",
} as const;

/**
 * Defend Trade Secrets Act notice. 18 U.S.C. § 1833(b) requires covered
 * employers to provide this immunity notice in agreements with employees;
 * the statute defines employee for this purpose to include contractors and
 * consultants. Keep the operative notice available for worker agreements.
 */
export const DTSA_IMMUNITY_NOTICE =
  "NOTICE UNDER 18 U.S.C. § 1833(b): An individual will not be held criminally or civilly liable under Federal or State trade secret law for disclosing a trade secret in confidence to a Federal, State, or local government official, directly or indirectly, or to an attorney, solely for the purpose of reporting or investigating a suspected violation of law; or for disclosing a trade secret in a complaint or other document filed in a lawsuit or other proceeding if the filing is made under seal. An individual who files a retaliation lawsuit for reporting a suspected violation of law may disclose the trade secret to that individual's attorney and use the trade secret information in the proceeding if documents containing the trade secret are filed under seal and the trade secret is not otherwise disclosed except pursuant to court order.";

export const ELECTRONIC_RECORD_RETENTION_RULE =
  "Executed electronic agreements and acceptance evidence must be retained in a form capable of being accurately reproduced for later reference by persons entitled to retain the record, subject to applicable law, retention policy, and legal holds.";

export const LEGAL_DEFENSE_MAPPING_RULE =
  "Every prohibited act must map to a defined contractual consequence, evidence path, survival rule, and remedy.";
