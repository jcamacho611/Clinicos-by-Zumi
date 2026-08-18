import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  ACCEPTABLE_USE_ROUTE,
  PRIVACY_POLICY_ROUTE,
  WEBSITE_TERMS_EFFECTIVE_DATE,
  WEBSITE_TERMS_VERSION,
} from "@/lib/legal/public-terms";

export const metadata: Metadata = {
  title: "Website Terms of Use — Klinikos",
  description: "Terms governing access to and use of Klinikos public websites, public product experiences, and related materials.",
};

const sections = [
  {
    title: "1. Agreement to these Terms",
    body: [
      "These Website Terms of Use (the “Terms”) govern your access to and use of klinikos.io, public Klinikos pages, public demonstrations, public-facing product experiences, content, interfaces, documentation, communications, and other services that link to these Terms (collectively, the “Site”). By accessing or using the Site, you agree to these Terms and acknowledge the Privacy Notice. If you do not agree, do not use the Site.",
      "If you use the Site for a company, clinic, organization, or other entity, you represent that you have authority to bind that entity, and “you” includes both you and that entity. Separate terms, order forms, business associate agreements, marketplace agreements, access terms, or other contracts may apply to protected, paid, clinical, marketplace, or authenticated services. If a signed agreement expressly conflicts with these Terms, the signed agreement controls for its subject matter.",
    ],
  },
  {
    title: "2. Who operates Klinikos",
    body: [
      "For these Terms, “Klinikos,” “we,” “us,” and “our” mean the Klinikos service and the person or legal entity that owns or operates the applicable service from time to time, together with its permitted successors, assigns, affiliates, founders, officers, employees, contractors, and agents where the context permits. Corporate ownership or operating entities may be reorganized or assigned as the business develops, and these Terms may be assigned with the Site or related business assets to the extent permitted by law.",
    ],
  },
  {
    title: "3. Public Site only; no clinical relationship",
    body: [
      "The public Site is an informational, qualification, demonstration, navigation, and business-development environment. Unless Klinikos expressly confirms otherwise in a separate written agreement and approved production environment, the public Site is not an electronic health record, medical device, emergency service, telehealth provider, payer, pharmacy, laboratory, clinical decision maker, or substitute for licensed professional judgment.",
      "Nothing on the public Site creates a clinician-patient relationship, attorney-client relationship, fiduciary relationship, employment relationship, agency relationship, partnership, joint venture, or other professional relationship merely because you visit or interact with the Site.",
    ],
  },
  {
    title: "4. Do not submit patient information on public surfaces",
    body: [
      "Do not submit patient names, medical records, diagnoses, treatment information, insurance identifiers, protected health information, or other sensitive clinical data into public, demo, qualification, marketing, or unauthenticated Klinikos surfaces. Public forms and public Zumi interactions are not approved PHI intake channels unless the Site explicitly states otherwise for a specific production workflow.",
      "If you submit sensitive information contrary to these instructions, you are responsible for having lawful authority to do so, and Klinikos may delete, quarantine, restrict, or decline to process that information where permitted by law and necessary for security or compliance.",
    ],
  },
  {
    title: "5. Zumi and artificial-intelligence features",
    body: [
      "Zumi and other intelligence features may generate, summarize, classify, route, draft, estimate, recommend, or organize information. AI output can be incomplete, inaccurate, outdated, or inappropriate for a particular circumstance. Public AI interactions are not medical advice, diagnosis, treatment, legal advice, coding certification, payer authorization, credential verification, or a guarantee of any outcome.",
      "You are responsible for reviewing outputs before relying on them. Consequential clinical, financial, credentialing, privacy, legal, safety, or operational decisions must remain subject to the appropriate authorized human review and applicable professional, contractual, and legal requirements.",
    ],
  },
  {
    title: "6. Ownership and intellectual property",
    body: [
      "The Site and its non-user content, including software, source and object code, visual design, interface structures, workflows, product architecture, documentation, text, graphics, logos, names, marks, databases, taxonomies, compilations, commercial methods, business logic, product concepts, prompts, models, audiovisual material, and other materials are owned by or licensed to Klinikos and are protected by intellectual-property and other laws.",
      "Except for the limited right to use the Site under these Terms, no license, assignment, transfer, source-code right, ownership interest, competitive-use right, patent right, trademark right, copyright right, trade-secret right, or other intellectual-property right is granted by implication, estoppel, or otherwise.",
    ],
  },
  {
    title: "7. Limited permission to use the Site",
    body: [
      "Subject to these Terms, Klinikos grants you a limited, revocable, non-exclusive, non-transferable, non-sublicensable right to access and use the public Site for lawful personal, professional, procurement, evaluation, or business purposes. This permission ends when these Terms end or Klinikos suspends or terminates your access.",
    ],
  },
  {
    title: "8. Prohibited conduct",
    body: [
      "You may not use the Site to violate law, infringe rights, impersonate others, distribute malware, interfere with service availability, bypass authentication or authorization, probe accounts you do not own, obtain data without authorization, abuse payment systems, submit fraudulent information, harass others, or facilitate unlawful discrimination or regulated activity without required authority.",
      "Without Klinikos’s prior written authorization, you may not scrape, spider, crawl, harvest, bulk-download, mirror, frame, index beyond ordinary search-engine activity, systematically capture screenshots, record protected demonstrations, extract datasets, enumerate endpoints, conduct vulnerability scanning or penetration testing, reverse engineer, decompile, disassemble, decode, defeat technical controls, bypass rate limits, automate account creation, or use bots to access the Site in a manner that is abusive or inconsistent with normal use.",
      "You may not copy, reproduce, adapt, translate, create derivative works from, or use non-public Klinikos interfaces, workflows, architecture, product logic, documentation, confidential materials, or access-controlled demonstrations to build, train, benchmark, improve, market, or operate a competing or substantially similar product or service except to the extent a restriction is prohibited by applicable law.",
    ],
  },
  {
    title: "9. Security research and vulnerability reporting",
    body: [
      "No permission to perform security testing is granted by these Terms. If you believe you found a vulnerability, stop testing once you can reasonably describe the issue, do not access or retain data that is not yours, do not disrupt service, and contact Klinikos through the security or contact method published on the Site. Any authorized security research must be governed by separate written authorization or a published safe-harbor policy.",
    ],
  },
  {
    title: "10. Accounts, credentials, and protected access",
    body: [
      "Protected or authenticated areas may require identity verification, work-email verification, role-based authorization, separate access terms, or other controls. You must provide accurate information, protect credentials, use only accounts assigned to you, and promptly report suspected unauthorized access. Sharing credentials or bypassing role, tenant, organization, patient, payment, credential, or safety boundaries is prohibited.",
      "Klinikos may deny, suspend, condition, or revoke access when reasonably necessary to protect users, systems, intellectual property, data, contractual rights, security, safety, legal compliance, or platform integrity.",
    ],
  },
  {
    title: "11. Evaluation and confidential materials",
    body: [
      "Some product demonstrations, previews, roadmaps, technical materials, pricing details, implementation materials, or other protected evaluation content may be confidential or proprietary and subject to separate Access, Confidentiality & Intellectual Property Terms, an NDA, or another written agreement. Public availability of a marketing statement does not make non-public protected material public.",
    ],
  },
  {
    title: "12. User submissions and feedback",
    body: [
      "You retain ownership of content you lawfully submit, subject to the rights needed to operate the Site. You grant Klinikos a worldwide, non-exclusive, royalty-free license to host, store, reproduce, transmit, display, format, and process your submission only as reasonably necessary to provide, secure, support, improve, or respond through the Site, subject to the Privacy Notice and any applicable separate agreement.",
      "If you voluntarily provide ideas, suggestions, feature requests, recommendations, or other feedback that is not confidential information or PHI, you grant Klinikos a perpetual, irrevocable, worldwide, royalty-free right to use, modify, commercialize, and incorporate that feedback without obligation or compensation to you. Do not submit third-party confidential information as feedback.",
    ],
  },
  {
    title: "13. Marketplace, providers, locations, and third parties",
    body: [
      "Public references to Grid, providers, clinics, locations, services, education, integrations, payment providers, maps, communications providers, laboratories, payers, or other third parties do not mean Klinikos employs, supervises, licenses, credentials, endorses, guarantees, or assumes responsibility for those parties. Separate marketplace, provider, location, payment, credential, and transaction terms may apply before any transaction or professional service occurs.",
      "Third-party services have their own terms, privacy practices, availability, pricing, eligibility rules, and regulatory obligations. Klinikos is not responsible for a third party’s independent acts or omissions except to the extent required by applicable law or a separate written agreement.",
    ],
  },
  {
    title: "14. Pricing, payments, subscriptions, and commercial offers",
    body: [
      "Public pricing, discounts, credits, founding offers, implementation descriptions, and product packaging are offers or informational statements only to the extent expressly stated. Final scope, taxes, third-party fees, implementation dependencies, subscription terms, renewal terms, cancellation rights, refunds, and payment obligations are governed by the checkout disclosures and any applicable order form or agreement.",
      "Where an automatic renewal or continuous service is offered to a consumer, Klinikos will present applicable material renewal terms and obtain any affirmative consent required by law before charging. A browser redirect or success page is not independent proof that a payment settled; payment state is determined by the applicable payment provider and server-side records.",
    ],
  },
  {
    title: "15. No guaranteed outcomes",
    body: [
      "Klinikos does not guarantee revenue, reimbursement, collections, savings, appointment volume, staffing availability, provider availability, patient outcomes, payer acceptance, coding correctness, credential approval, licensure, job placement, marketplace demand, integration availability, uptime, or any other business, clinical, financial, or regulatory result unless an authorized written agreement expressly states a specific guarantee.",
    ],
  },
  {
    title: "16. Beta, demo, synthetic, and pre-release material",
    body: [
      "The Site may display beta, demo, synthetic, sample, simulated, planned, manually operated, pending-connection, or pre-release functionality. Such material may change, be removed, contain errors, or never become generally available. Do not rely on a demo, mock data, roadmap, screenshot, preview, status label, or pre-release feature as a contractual commitment unless it is expressly included in a signed agreement.",
    ],
  },
  {
    title: "17. Privacy and communications",
    body: [
      "Our Privacy Notice explains how we handle personal information on the Site. By providing contact information, you authorize service-related communications reasonably necessary to respond to your request, verify access, secure the service, administer a transaction, or provide a service you requested, subject to applicable law. Marketing consent, healthcare communications, and other regulated communications may require separate consent and opt-out mechanisms.",
    ],
  },
  {
    title: "18. Availability and changes",
    body: [
      "We may modify, suspend, restrict, discontinue, or change public Site features, content, pricing displays, interfaces, access requirements, or availability at any time. We do not promise uninterrupted, error-free, secure, or universally compatible operation. Maintenance, security incidents, provider outages, legal restrictions, capacity, or other conditions may affect availability.",
    ],
  },
  {
    title: "19. Disclaimer of warranties",
    body: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PUBLIC SITE AND ALL PUBLIC CONTENT ARE PROVIDED “AS IS” AND “AS AVAILABLE.” KLINIKOS DISCLAIMS ALL EXPRESS, IMPLIED, AND STATUTORY WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, QUIET ENJOYMENT, AND WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. SOME JURISDICTIONS DO NOT ALLOW CERTAIN DISCLAIMERS, SO SOME OF THESE DISCLAIMERS MAY NOT APPLY TO YOU.",
    ],
  },
  {
    title: "20. Limitation of liability",
    body: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, KLINIKOS AND ITS AFFILIATES, FOUNDERS, OFFICERS, EMPLOYEES, CONTRACTORS, LICENSORS, AND AGENTS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, BUSINESS OPPORTUNITY, OR USE, ARISING FROM OR RELATED TO THE PUBLIC SITE, EVEN IF ADVISED THAT SUCH DAMAGES MAY OCCUR.",
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE AGGREGATE LIABILITY OF KLINIKOS FOR CLAIMS ARISING FROM OR RELATING TO YOUR USE OF THE PUBLIC SITE WILL NOT EXCEED THE GREATER OF ONE HUNDRED U.S. DOLLARS ($100) OR THE AMOUNT YOU PAID DIRECTLY TO KLINIKOS FOR THE SPECIFIC PUBLIC-SITE SERVICE GIVING RISE TO THE CLAIM DURING THE TWELVE MONTHS BEFORE THE EVENT GIVING RISE TO LIABILITY. THESE LIMITATIONS DO NOT APPLY WHERE APPLICABLE LAW PROHIBITS THEM.",
    ],
  },
  {
    title: "21. Indemnification",
    body: [
      "To the extent permitted by law, you will defend, indemnify, and hold harmless Klinikos and its affiliates, founders, officers, employees, contractors, licensors, and agents from third-party claims, losses, liabilities, damages, judgments, penalties, costs, and reasonable attorneys’ fees arising from your unlawful use of the Site, your violation of these Terms, your infringement or misappropriation of third-party rights, information you submit without authority, or your circumvention of Site security or access controls. Klinikos may control the defense of a matter subject to indemnification, and you will reasonably cooperate.",
    ],
  },
  {
    title: "22. Equitable relief",
    body: [
      "Unauthorized access, security abuse, disclosure of confidential information, or infringement or misappropriation of intellectual property may cause harm that is difficult to measure. To the extent permitted by law, Klinikos may seek injunctive, equitable, or other non-monetary relief in addition to other available remedies, without limiting any defenses or rights you may have under applicable law.",
    ],
  },
  {
    title: "23. Governing law and disputes",
    body: [
      "Except where applicable law requires otherwise, these Terms and disputes arising from the public Site are governed by the laws of the State of New York, without regard to conflict-of-law principles. Subject to any mandatory consumer rights or other non-waivable law, the state and federal courts located in New York, New York will have exclusive jurisdiction over disputes arising from these Terms or the public Site, and each party consents to personal jurisdiction there.",
      "Before filing a non-urgent claim, the parties should make a good-faith effort to resolve the dispute informally. Nothing in this section prevents either party from seeking urgent equitable relief, using an eligible small-claims procedure, reporting a matter to a regulator, or exercising a right that applicable law does not permit to be waived.",
    ],
  },
  {
    title: "24. Time to bring claims",
    body: [
      "To the extent permitted by law, any claim arising from the public Site or these Terms must be filed within one year after the claim accrued, or it is permanently barred. This provision does not shorten any limitations period that applicable law does not permit the parties to shorten.",
    ],
  },
  {
    title: "25. Suspension and termination",
    body: [
      "You may stop using the Site at any time. Klinikos may suspend or terminate public or protected access immediately when reasonably necessary for security, abuse prevention, legal compliance, nonpayment, intellectual-property protection, platform integrity, safety, or material breach. Provisions that by their nature should survive termination, including intellectual-property, confidentiality, disclaimer, liability, indemnity, dispute, and enforcement provisions, survive to the extent permitted by law.",
    ],
  },
  {
    title: "26. Export, sanctions, and restricted use",
    body: [
      "You may not use or export the Site in violation of applicable export-control, sanctions, anti-boycott, or trade laws. You represent that you are not prohibited from receiving the Site under applicable law.",
    ],
  },
  {
    title: "27. Minors",
    body: [
      "The general public Site is not directed to children under 13. Commercial, professional, clinic, provider, employment, and protected evaluation features are intended for adults or authorized organizational users. Patient-facing services involving minors, if offered, require the separate consent, authority, privacy, and healthcare rules applicable to that service.",
    ],
  },
  {
    title: "28. Changes to these Terms",
    body: [
      "We may update these Terms from time to time. The version and effective date appear at the top of this page. If a change materially affects an existing paid or protected relationship, additional notice or affirmative acceptance may be required by applicable law or contract. Continued use of ordinary public Site features after an updated version becomes effective constitutes acceptance to the extent permitted by law.",
    ],
  },
  {
    title: "29. General provisions",
    body: [
      "These Terms, together with documents expressly incorporated into them, are the entire agreement concerning ordinary public use of the Site. If a provision is unenforceable, it will be enforced to the maximum lawful extent and the remaining provisions remain in effect. A waiver must be explicit and does not waive future enforcement. Headings are for convenience only. You may not assign these Terms without Klinikos’s consent; Klinikos may assign them in connection with a merger, financing, reorganization, sale, transfer of the Site or business, or to an affiliate or successor, subject to applicable law.",
    ],
  },
  {
    title: "30. Contact",
    body: [
      "Questions about these Terms, copyright concerns, security reports, or legal notices should be sent using the legal, security, or general contact method published on klinikos.io. Do not send patient records or PHI through a general legal or security contact channel unless Klinikos expressly provides an approved secure method for that purpose.",
    ],
  },
] as const;

export default function WebsiteTermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center gap-4 px-5 sm:px-8">
          <Link className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950" href="/">
            <ArrowLeft className="size-4" aria-hidden="true" /> Klinikos
          </Link>
          <div className="ml-auto flex gap-4 text-xs font-bold">
            <Link className="text-slate-600 hover:text-slate-950" href={PRIVACY_POLICY_ROUTE}>Privacy</Link>
            <Link className="text-slate-600 hover:text-slate-950" href={ACCEPTABLE_USE_ROUTE}>Acceptable use</Link>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#8a5550]">Website Terms of Use</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Terms governing public use of Klinikos.</h1>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
          <span>Effective: {WEBSITE_TERMS_EFFECTIVE_DATE}</span>
          <span>Version: {WEBSITE_TERMS_VERSION}</span>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#8a5550]" aria-hidden="true" />
            <p className="text-sm leading-7 text-slate-700">
              These Terms are intended to create a binding agreement for use of the public Site. Protected evaluation access, accounts, purchases, Grid transactions, clinic services, patient services, and production healthcare use may require additional affirmative agreements. Nothing here waives rights that applicable law does not permit to be waived.
            </p>
          </div>
        </div>

        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {sections.map((section) => (
            <section className="py-8" key={section.title}>
              <h2 className="text-xl font-extrabold tracking-[-.03em]">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p className="text-sm leading-7 text-slate-650 text-slate-600" key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-xs leading-6 text-slate-500">
          These Terms were prepared as document-drafting assistance and should be reviewed by licensed counsel, particularly before relying on dispute, liability, marketplace, healthcare, consumer-subscription, or jurisdiction-specific provisions.
        </p>
      </article>
    </main>
  );
}
