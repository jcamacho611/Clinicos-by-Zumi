import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";

export const metadata: Metadata = {
  title: "Privacy Notice — Klinikos",
  description: "How Klinikos handles personal information on its public website, evaluation, qualification, access, and purchase surfaces.",
};

const sections = [
  {
    title: "1. Scope",
    body: [
      "This Privacy Notice describes how Klinikos handles personal information when you visit klinikos.io or use public marketing, qualification, evaluation, public Zumi, access-request, sales-intake, and purchase-related surfaces that link to this notice. A separately approved production healthcare deployment, patient portal, clinic agreement, Business Associate Agreement, marketplace relationship, employment relationship, or other specialized service may be governed by additional privacy notices and contracts.",
      "The public Site is not an approved channel for submitting protected health information unless a specific production workflow expressly tells you otherwise. Do not enter patient names, medical records, diagnoses, treatment details, insurance identifiers, or other patient information into public, marketing, demo, or unauthenticated fields.",
    ],
  },
  {
    title: "2. Information you provide",
    body: [
      "Depending on how you interact with Klinikos, you may provide your name, work email, phone number, organization or clinic name, role, clinic type, provider and location counts, business-system information, operational pain points, purchasing or evaluation selections, feedback, communications, and other information you choose to submit.",
      "Protected evaluation access may also require affirmative agreement acceptance and work-email verification. We may retain the applicable agreement key and version, acceptance time, email, request metadata, and verification state so that access is not granted without the required record.",
    ],
  },
  {
    title: "3. Information collected automatically",
    body: [
      "When you use the Site, our hosting, security, and application systems may receive technical information such as IP address, user agent, browser and device information, requested URL, timestamps, referral information, language or timezone signals supplied by the browser, security events, rate-limit events, authentication events, and similar operational metadata.",
      "The Site may use cookies, browser storage, session identifiers, or comparable technologies that are necessary for authentication, security, fraud prevention, preferences, continuity, or requested functionality. Optional analytics or advertising technologies, if introduced, must be governed by the applicable notice and consent requirements before being relied upon in jurisdictions that require them.",
    ],
  },
  {
    title: "4. Payments",
    body: [
      "When you proceed to a third-party payment provider, that provider may collect payment-card, billing, identity, fraud-prevention, or transaction information under its own privacy terms. Klinikos should receive only the transaction identifiers, status, amount, currency, customer references, and other payment evidence needed to administer the purchase, rather than raw card credentials that the payment provider is responsible for collecting.",
      "A browser return or success page is not treated as independent proof of payment. Klinikos relies on the applicable processor evidence or authorized reconciliation before changing paid-access state.",
    ],
  },
  {
    title: "5. How we use information",
    body: [
      "Klinikos may use personal information to provide the Site and requested services; respond to questions; operate public Zumi and qualification flows; prepare synthetic demonstrations; evaluate clinic fit; create and administer reservations or purchases; verify identity or access; maintain agreement records; provide support; secure accounts and systems; detect fraud or abuse; enforce terms; troubleshoot; maintain auditability; improve product workflows; comply with law; and protect Klinikos, users, clinics, providers, patients, and others.",
      "We may also use contact information to communicate about a request, purchase, security event, access process, account, or service you initiated. Promotional or regulated communications are subject to the consent, opt-out, and other requirements that apply to that communication channel and relationship.",
    ],
  },
  {
    title: "6. Artificial intelligence",
    body: [
      "Public Zumi interactions may be processed to provide a response, route you to an appropriate public experience, protect the service, and improve the interaction. Public users are instructed not to submit patient information. Authenticated or production intelligence features may be subject to additional authorization, redaction, provider, contractual, and data-use controls that are not created by this public notice alone.",
    ],
  },
  {
    title: "7. How information may be disclosed",
    body: [
      "Klinikos may disclose information to hosting, infrastructure, communications, payment, security, professional, analytics, support, and other service providers to the extent reasonably necessary for them to perform services for Klinikos and subject to applicable contractual and legal restrictions.",
      "We may also disclose information when reasonably necessary to comply with law or valid legal process; investigate or prevent fraud, abuse, security incidents, or harm; enforce agreements; protect rights, safety, and platform integrity; complete a financing, merger, reorganization, acquisition, sale, or transfer of all or part of the business subject to applicable law; or when you direct or authorize the disclosure.",
      "This public notice does not authorize a vendor to receive PHI. Any vendor that may process PHI in a production healthcare workflow requires the separate contractual, security, and regulatory posture applicable to that workflow before such use is approved.",
    ],
  },
  {
    title: "8. Data retention",
    body: [
      "We retain information for as long as reasonably necessary for the purposes described in this notice, including service delivery, security, fraud prevention, auditability, dispute resolution, contract administration, legal obligations, and enforcement. Different categories may have different retention periods. We may delete or de-identify information when it is no longer reasonably needed, subject to legal holds, backup cycles, security evidence, and contractual requirements.",
    ],
  },
  {
    title: "9. Security",
    body: [
      "Klinikos uses technical and organizational safeguards intended to reduce unauthorized access, disclosure, alteration, and loss. No website, transmission method, storage system, or security control can guarantee absolute security. You are responsible for protecting credentials assigned to you and for notifying Klinikos through a published security or support channel if you believe your access has been compromised.",
    ],
  },
  {
    title: "10. Your choices and privacy rights",
    body: [
      "You may choose not to provide optional information, although some information is necessary to respond to a request, process a transaction, verify access, or provide a protected service. You may also stop using the public Site at any time.",
      "Depending on where you live and the nature of the information, applicable law may provide rights to request access, correction, deletion, portability, restriction, objection, or information about certain disclosures or processing. Those rights can differ and may have exceptions. Use the privacy or contact method published on klinikos.io to make a privacy request. We may need to verify your identity and authority before acting on a request.",
    ],
  },
  {
    title: "11. Children",
    body: [
      "The ordinary public business Site is not directed to children under 13. Commercial, clinic, provider, professional, protected-evaluation, and purchasing surfaces are intended for adults or authorized organizational users. Any future patient-facing service involving minors must use the consent, authority, privacy, and healthcare rules applicable to that service.",
    ],
  },
  {
    title: "12. Third-party sites and services",
    body: [
      "The Site may link to third-party payment providers, maps, communications services, healthcare organizations, educational resources, or other external services. Their privacy practices are governed by their own notices and agreements. A link or integration does not make Klinikos responsible for a third party’s independent privacy practices except to the extent applicable law or a separate written agreement provides otherwise.",
    ],
  },
  {
    title: "13. U.S. operation and cross-border use",
    body: [
      "Klinikos is being developed and operated for U.S.-based use. If you access the Site from another jurisdiction, your information may be processed in the United States or other locations used by applicable service providers, subject to the legal requirements that apply to the relevant transfer and service.",
    ],
  },
  {
    title: "14. Changes to this notice",
    body: [
      "We may update this Privacy Notice as the Site, vendors, data practices, laws, or business structure change. The version and effective date identify the current public notice. Where applicable law or contract requires additional notice or consent for a material change, Klinikos will use the required process rather than relying solely on silent continued use.",
    ],
  },
  {
    title: "15. Contact",
    body: [
      "Use the privacy, legal, security, or general contact method published on klinikos.io for questions or privacy requests. Do not send patient records, PHI, passwords, payment-card data, or other highly sensitive information through a general contact channel unless Klinikos specifically provides an approved secure method for that purpose.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-extrabold">Klinikos</p><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#9a7a1f]">Privacy</p></div></Link>
          <Link className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950" href="/legal/terms"><ArrowLeft className="size-4" aria-hidden="true" /> Website terms</Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#9a7a1f]">Effective August 18, 2026 · Version 2026-08-18.1</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Klinikos Privacy Notice</h1>
        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#8a5550]" aria-hidden="true" /><p className="text-sm leading-7 text-slate-700"><strong>Public-site rule:</strong> do not submit patient information or PHI through public, marketing, demo, qualification, or unauthenticated surfaces. Production healthcare data use requires a separately approved environment and the agreements and controls applicable to that relationship.</p></div>
        </div>

        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {sections.map((section) => (
            <section className="py-8" key={section.title}>
              <h2 className="text-xl font-extrabold tracking-[-.03em]">{section.title}</h2>
              <div className="mt-4 space-y-4">{section.body.map((paragraph) => <p className="text-sm leading-7 text-slate-600" key={paragraph}>{paragraph}</p>)}</div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 text-xs font-bold">
          <Link className="text-slate-700 underline underline-offset-4 hover:text-slate-950" href="/legal/terms">Website Terms of Use</Link>
          <Link className="text-slate-700 underline underline-offset-4 hover:text-slate-950" href="/legal/acceptable-use">Acceptable Use Policy</Link>
        </div>
        <p className="mt-8 text-xs leading-6 text-slate-500">This notice is document-preparation assistance and should be reviewed by licensed privacy and healthcare counsel as Klinikos expands jurisdictions, subprocessors, regulated data processing, consumer features, and production healthcare deployments.</p>
      </article>
    </main>
  );
}
