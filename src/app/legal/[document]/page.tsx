import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileWarning, Scale } from "lucide-react";
import { legalDocumentRegistry } from "@/lib/legal/document-registry";

function documentForSlug(slug: string) {
  return legalDocumentRegistry.find((document) => document.route === `/legal/${slug}`) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ document: string }> }): Promise<Metadata> {
  const { document } = await params;
  const definition = documentForSlug(document);
  if (!definition) return { title: "Legal document not found — Klinikos" };
  return {
    title: `${definition.title} Status — Klinikos`,
    description: `Governance and approval status for the Klinikos ${definition.title}.`,
  };
}

export default async function LegalDocumentStatusPage({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  const definition = documentForSlug(document);
  if (!definition) notFound();

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center gap-4 px-5 sm:px-8">
          <Link className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950" href="/trust">
            <ArrowLeft className="size-4" aria-hidden="true" /> Trust & readiness
          </Link>
          <Link className="ml-auto text-sm font-extrabold tracking-tight" href="/">Klinikos</Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-[#795d16]">Governed legal-document status</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">{definition.title}</h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600">
          This page reports the document&apos;s current governance status. It is not final contractual language, legal advice, a signed agreement, or evidence that counsel has approved the document for production reliance.
        </p>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          <StatusCell label="Version" value={definition.version} />
          <StatusCell label="Draft effective date" value={definition.effectiveDate} />
          <StatusCell label="Counsel review required" value={definition.counselReviewRequired ? "Yes" : "No"} />
          <StatusCell label="Production approved" value={definition.productionApproved ? "Yes" : "No"} />
        </dl>

        <section className="mt-8 rounded-2xl border border-amber-300/50 bg-amber-50 p-6" aria-labelledby="document-boundary-heading">
          <FileWarning className="size-5 text-amber-800" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-extrabold" id="document-boundary-heading">Current boundary</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">{definition.notes}</p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Governance checks">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Scale className="size-5 text-slate-700" aria-hidden="true" />
            <h2 className="mt-4 text-base font-extrabold">Approval state is explicit</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              A route existing in the application does not upgrade this document to counsel-approved or production-approved status.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <CheckCircle2 className="size-5 text-slate-700" aria-hidden="true" />
            <h2 className="mt-4 text-base font-extrabold">Contracting happens separately</h2>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              Any agreement that governs a real customer relationship must use the reviewed, applicable version executed through the appropriate commercial process.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 text-xs font-extrabold text-white hover:bg-slate-800" href="/trust">Review readiness</Link>
          <Link className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 text-xs font-extrabold text-slate-700 hover:border-slate-500" href="/legal/privacy">Read privacy notice</Link>
        </div>
      </article>
    </main>
  );
}

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-5">
      <dt className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-bold text-slate-950">{value}</dd>
    </div>
  );
}
