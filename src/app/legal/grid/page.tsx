import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Network, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Grid Marketplace Terms — Klinikos",
  description: "Additional terms governing use of Klinikos Grid discovery, listings, connections, and marketplace-related activity.",
};

const sections = [
  ["1. Additional Grid terms", "These Grid Marketplace Terms supplement the Klinikos Website Terms of Use and Acceptable Use Policy. They apply when you browse, list, request, offer, connect, communicate, reserve, or otherwise use Klinikos Grid. Provider, clinic, location, seller, education, referral, patient, payment, or other specialized activity may require additional agreements before activation or transaction."],
  ["2. Platform role", "Grid is a technology and coordination platform. Unless a separate written agreement expressly says otherwise, Klinikos is not the employer, staffing agency, medical practice, healthcare provider, payer, insurer, credentialing authority, landlord, product manufacturer, professional-services firm, or agent of a Grid participant merely because that participant or resource appears on Grid."],
  ["3. Listings are not verification", "A profile, listing, document upload, status, badge, search result, map result, or marketplace presence is not by itself proof of identity, licensure, credentialing, malpractice coverage, insurance, ownership, authority, safety, quality, availability, legality, or suitability. Review and eligibility requirements vary by resource, jurisdiction, facility, service, and transaction."],
  ["4. Participant responsibilities", "Participants are responsible for accurate information; maintaining licenses, registrations, certifications, insurance, permits, tax status, facility authority, and other requirements applicable to their activity; performing their own diligence; complying with professional standards and law; and promptly correcting or removing information that becomes inaccurate."],
  ["5. Regulated healthcare activity", "No Grid match, booking, request, message, or payment state authorizes clinical practice or overrides scope-of-practice, supervision, delegation, facility, prescribing, credentialing, malpractice, informed-consent, privacy, or other healthcare requirements. Regulated work may remain blocked until the applicable human review and eligibility gates are satisfied."],
  ["6. Patient information", "Do not place PHI or patient-identifying information into public Grid listings, public search, public descriptions, or other public marketplace fields. Referral or care-coordination workflows involving patient data require the applicable authorization, consent, sharing relationship, minimum-necessary controls, and protected workflow."],
  ["7. Transactions and payments", "Displayed prices, rates, availability, deposits, fees, payouts, or other commercial terms are not guarantees that a transaction has settled or that a participant is entitled to payment. Final commercial obligations depend on the applicable checkout, booking, order, participant agreement, processor evidence, cancellation terms, dispute process, taxes, and other transaction-specific terms."],
  ["8. Independent relationships", "Participants are responsible for determining and documenting the legal relationship appropriate to their transaction. Labels such as contractor, provider, partner, seller, renter, host, or location do not by themselves determine employment, agency, tax, professional, or other legal status."],
  ["9. Prohibited listings and conduct", "You may not list or transact in unlawful, counterfeit, stolen, unsafe, prohibited, unlicensed, misrepresented, prescription-only, controlled, hazardous, or otherwise restricted goods or services through a generic Grid flow. Klinikos may block categories, listings, transactions, accounts, or requests where review, law, safety, payment, credential, or policy requirements are not satisfied."],
  ["10. No guarantee of matches or outcomes", "Klinikos does not guarantee that a listing will be approved, seen, matched, booked, paid, filled, profitable, clinically appropriate, reimbursable, available, or successful. Grid may rank, filter, pause, remove, or refuse content or activity for safety, quality, fraud prevention, legal compliance, marketplace integrity, or product reasons."],
  ["11. Disputes between participants", "Participants should first address ordinary performance, cancellation, property, service-quality, payment, and other transaction disputes with the relevant counterparty using the applicable Grid or payment process. Klinikos may assist with platform records or marketplace administration but does not assume a participant's independent obligations merely by assisting."],
  ["12. Enforcement and safety", "Klinikos may request evidence, place holds, require additional review, restrict visibility, pause transactions, suspend accounts, preserve evidence, or remove content when reasonably necessary to protect users, patients, participants, systems, payments, intellectual property, legal compliance, or platform integrity."],
  ["13. Specialized terms control", "If a provider, clinic, location, seller, educational organization, referral partner, payment, booking, or other specialized agreement applies to a Grid activity, that agreement controls its specific subject matter. The Website Terms, Acceptable Use Policy, Privacy Notice, and these Grid Marketplace Terms continue to apply where they do not conflict with the specialized agreement."],
] as const;

export default function GridMarketplaceTermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center gap-4 px-5 sm:px-8">
          <Link className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950" href="/grid"><ArrowLeft className="size-4" aria-hidden="true" /> Grid</Link>
          <div className="ml-auto flex gap-4 text-xs font-bold"><Link className="text-slate-600 hover:text-slate-950" href="/legal/terms">Website terms</Link><Link className="text-slate-600 hover:text-slate-950" href="/legal/privacy">Privacy</Link></div>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <div className="flex items-center gap-3"><Network className="size-6 text-[#8a5550]" aria-hidden="true" /><p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#8a5550]">Klinikos Grid</p></div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Grid Marketplace Terms</h1>
        <p className="mt-5 text-xs font-semibold text-slate-500">Effective August 18, 2026 · Version 2026-08-18.1</p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#8a5550]" aria-hidden="true" /><p className="text-sm leading-7 text-slate-700">Grid helps people discover and coordinate healthcare capacity. It does not erase the legal, credential, safety, privacy, facility, payment, or professional requirements that apply to the actual person, resource, service, or transaction.</p></div></div>
        <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {sections.map(([title, body]) => <section className="py-8" key={title}><h2 className="text-xl font-extrabold tracking-[-.03em]">{title}</h2><p className="mt-4 text-sm leading-7 text-slate-600">{body}</p></section>)}
        </div>
        <p className="mt-8 text-xs leading-6 text-slate-500">These terms are document-preparation assistance. Marketplace, provider, facility, employment/contractor, payment, healthcare, tax, consumer, and jurisdiction-specific provisions should be reviewed by licensed counsel before broader transactional activation.</p>
      </article>
    </main>
  );
}
