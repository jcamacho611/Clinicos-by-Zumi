import Link from "next/link";
import { BrandMark } from "@/components/clinic/brand-mark";
import { ClinicActivationForm } from "@/components/commercial/clinic-activation-form";
import { ClinicProvisioningError, getClinicActivationPreview } from "@/lib/commercial/clinic-provisioning";

export const metadata = {
  title: "Activate Klinikos",
  description: "Complete a paid Klinikos clinic workspace activation.",
};

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  let preview: Awaited<ReturnType<typeof getClinicActivationPreview>> | null = null;
  let error = "";
  if (!token) {
    error = "This page needs a signed Klinikos activation link.";
  } else {
    try {
      preview = await getClinicActivationPreview(token);
    } catch (caught) {
      error = caught instanceof ClinicProvisioningError ? caught.message : "This activation link could not be verified.";
    }
  }

  return (
    <main className="min-h-screen bg-[#eef4f3] px-5 py-10 text-slate-950 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link className="flex items-center gap-3" href="/"><BrandMark /><div><p className="text-sm font-black">Klinikos</p><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#174ea6]">Secure activation</p></div></Link>
        <section className="mt-8 border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#174ea6]">Paid clinic setup</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.055em]">Finish your workspace.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Klinikos already knows the organization, buyer email, paid plan, and commercial state from the signed link. Complete the remaining owner and clinic setup below.</p>
          {error ? <div className="mt-7 border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-800">{error}<p className="mt-3 text-xs font-medium text-rose-700">Ask your Klinikos contact to review payment state and issue a new activation link if needed.</p></div> : preview?.alreadyActivated ? <div className="mt-7 border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-900">This workspace is already activated. <Link className="underline" href="/login">Sign in to Klinikos.</Link></div> : preview ? <ClinicActivationForm token={token} organizationName={preview.organizationName} email={preview.email} productLabel={preview.productLabel} /> : null}
        </section>
      </div>
    </main>
  );
}
