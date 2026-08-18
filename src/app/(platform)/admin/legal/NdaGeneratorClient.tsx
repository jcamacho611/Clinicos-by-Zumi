"use client";

import { useMemo, useState } from "react";
import { buildNdaPackage, type DisclosureLevel, type NdaRelationshipType } from "@/lib/legal/nda-generator";

const relationshipOptions: Array<{ value: NdaRelationshipType; label: string }> = [
  ["strategic_partner", "Strategic partner"],
  ["advisor", "Advisor"],
  ["consultant", "Consultant"],
  ["contractor", "Contractor"],
  ["developer", "Developer / engineer"],
  ["clinic", "Clinic"],
  ["clinic_network", "Clinic network"],
  ["investor", "Investor / due diligence"],
  ["vendor", "Vendor / technology provider"],
  ["education", "Education / institution"],
  ["referral", "Referral / business development"],
  ["other", "Other"],
].map(([value, label]) => ({ value: value as NdaRelationshipType, label }));

export default function NdaGeneratorClient() {
  const [recipientName, setRecipientName] = useState("Melissa");
  const [recipientEntity, setRecipientEntity] = useState("");
  const [recipientState, setRecipientState] = useState("Florida");
  const [relationshipType, setRelationshipType] = useState<NdaRelationshipType>("strategic_partner");
  const [permittedPurpose, setPermittedPurpose] = useState("Evaluate a potential strategic, business-development, clinic-network, advisory, referral, or commercial relationship involving Klinikos.");
  const [disclosureLevel, setDisclosureLevel] = useState<DisclosureLevel>(2);

  const result = useMemo(
    () => buildNdaPackage({ recipientName, recipientEntity, recipientState, relationshipType, permittedPurpose, disclosureLevel }),
    [recipientName, recipientEntity, recipientState, relationshipType, permittedPurpose, disclosureLevel],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-[#071018] p-7 text-white shadow-[0_28px_80px_rgba(15,23,42,.16)] sm:p-9">
        <p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-200">Legal document generator</p>
        <h1 className="mt-4 text-4xl font-black tracking-[-.055em]">Generate the right NDA package.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">Choose who the recipient is, where they are, their role, and how deeply they need access. The generator selects legal modules, companion agreements, disclosure gates, and review warnings. It does not label drafts attorney-approved.</p>
      </section>

      <section className="grid gap-5 border border-slate-200 bg-white p-6 lg:grid-cols-2">
        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Recipient</span><input className="w-full border border-slate-200 px-4 py-3 text-sm" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} /></label>
        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Recipient entity, optional</span><input className="w-full border border-slate-200 px-4 py-3 text-sm" value={recipientEntity} onChange={(event) => setRecipientEntity(event.target.value)} placeholder="Company / LLC / corporation" /></label>
        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">State</span><input className="w-full border border-slate-200 px-4 py-3 text-sm" value={recipientState} onChange={(event) => setRecipientState(event.target.value)} /></label>
        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Relationship</span><select className="w-full border border-slate-200 px-4 py-3 text-sm" value={relationshipType} onChange={(event) => setRelationshipType(event.target.value as NdaRelationshipType)}>{relationshipOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <label className="space-y-2 lg:col-span-2"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Permitted purpose</span><textarea className="min-h-28 w-full border border-slate-200 px-4 py-3 text-sm leading-6" value={permittedPurpose} onChange={(event) => setPermittedPurpose(event.target.value)} /></label>
        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-[.12em] text-slate-500">Disclosure level</span><select className="w-full border border-slate-200 px-4 py-3 text-sm" value={disclosureLevel} onChange={(event) => setDisclosureLevel(Number(event.target.value) as DisclosureLevel)}><option value={1}>Level 1 — General</option><option value={2}>Level 2 — Confidential strategic</option><option value={3}>Level 3 — Restricted / separately authorized</option></select></label>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Confidentiality</p><p className="mt-3 text-3xl font-black">{result.confidentialityYears} years</p><p className="mt-2 text-xs leading-6 text-slate-500">Trade secrets remain protected while legally qualifying as trade secrets.</p></article>
        <article className="border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Non-circumvention</p><p className="mt-3 text-3xl font-black">{result.nonCircumventionMonths} months</p><p className="mt-2 text-xs leading-6 text-slate-500">Only for specifically introduced, protected opportunities. Not a general non-compete.</p></article>
        <article className="border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">Disclosure</p><p className="mt-3 text-3xl font-black">{result.disclosurePlan.level}</p><p className="mt-2 text-xs leading-6 text-slate-500">Crown-jewel access remains separately gated.</p></article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Modules selected</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">{result.modules.map((item) => <li key={item}>• {item}</li>)}</ul></article>
        <article className="border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Companion agreements</h2>{result.companionAgreements.length ? <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">{result.companionAgreements.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No automatic companion agreement selected.</p>}</article>
      </section>

      <section className="border border-amber-200 bg-amber-50 p-6"><h2 className="text-lg font-black text-amber-950">Jurisdiction and enforceability gate</h2><p className="mt-3 text-sm leading-7 text-amber-900">{result.governingLawRecommendation}</p><p className="mt-2 text-sm leading-7 text-amber-900">{result.venueInstruction}</p><ul className="mt-4 space-y-2 text-xs leading-6 text-amber-900">{result.warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Liquidated-damages drafting targets</h2><div className="mt-4 space-y-3 text-sm text-slate-600"><p>Category I — ${result.damages.categoryI.toLocaleString()}</p><p>Category II — ${result.damages.categoryII.toLocaleString()}</p><p>Category III — ${result.damages.categoryIII.toLocaleString()}</p><p>Security credentials — documented remediation costs</p></div><p className="mt-4 text-xs leading-6 text-slate-500">Targets require state-specific validation and are not represented as guaranteed recoveries.</p></article>
        <article className="border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Before signature</h2><ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">{result.signatureChecklist.map((item) => <li key={item}>• {item}</li>)}</ul></article>
      </section>

      <section className="border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">Disclosure gate</h2><div className="mt-5 grid gap-6 md:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-[.12em] text-emerald-700">Allowed at this level</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{result.disclosurePlan.allowed.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><p className="text-xs font-black uppercase tracking-[.12em] text-rose-700">Still prohibited / separately gated</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{result.disclosurePlan.prohibited.map((item) => <li key={item}>• {item}</li>)}</ul></div></div></section>
    </div>
  );
}
