import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  HeartHandshake,
  MapPinned,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { ContractorEnrollmentForm } from "@/components/clinic/grid/contractor-enrollment-form";
import { Badge } from "@/components/ui/badge";
import { getAuthenticationSession } from "@/lib/auth/session";

export const metadata = {
  title: "Join Klinikos Grid",
  description: "Join the Klinikos Grid as a professional, space owner, organization, seller, equipment owner, service provider, education partner, or referral partner.",
};

const enrollmentPaths = [
  { icon: BriefcaseBusiness, title: "Professional / contractor", body: "Nurses, providers, clinicians, and other professionals seeking eligible work or service opportunities.", href: "#professional" },
  { icon: Building2, title: "Space owner", body: "Rooms, chairs, offices, procedure space, training space, lab or imaging capacity.", href: "/grid/join/location" },
  { icon: Stethoscope, title: "Healthcare organization", body: "Clinics, facilities, labs, imaging, specialty partners, and organization-level capacity.", href: "/grid/join/location?type=organization" },
  { icon: PackageSearch, title: "Products & supplies", body: "Permitted non-prescription supplies and operational inventory.", href: "/grid/join/seller?type=product" },
  { icon: Wrench, title: "Equipment owner", body: "Rentable or bookable equipment and operational capacity.", href: "/grid/join/seller?type=equipment" },
  { icon: Sparkles, title: "Business service", body: "Billing, credentialing, recruiting, consulting, cybersecurity, IT, and other healthcare support.", href: "/grid/join/seller?type=service" },
  { icon: GraduationCap, title: "Education partner", body: "Preceptorships, placements, training seats, simulation, and learning capacity.", href: "/grid/join/seller?type=education" },
  { icon: HeartHandshake, title: "Referral partner", body: "Governed consultation, specialty, diagnostic, and partner capacity.", href: "/grid/join/seller?type=referral" },
] as const;

export default async function GridContractorJoinPage() {
  const session = await getAuthenticationSession();
  const account = session && !session.demo ? { email: session.email, name: session.name } : null;
  const returnTo = "/grid/join#professional";

  return (
    <main className="min-h-screen bg-[#f5f7f5]">
      <header className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
        <Link className="flex items-center gap-3" href="/grid">
          <BrandMark />
          <div><p className="text-sm font-extrabold text-slate-950">Klinikos Grid</p><p className="text-[11px] font-bold uppercase tracking-[.18em] text-amber-600">Healthcare opportunity network</p></div>
        </Link>
        <div className="ml-auto flex items-center gap-4"><Link className="hidden text-xs font-bold text-slate-600 hover:text-slate-950 sm:block" href="/grid/browse">Browse Grid</Link><Link className="flex items-center gap-2 text-xs font-bold text-slate-600" href="/grid"><ArrowLeft className="size-4" /> Grid</Link></div>
      </header>

      <section className="border-y border-slate-200 bg-[#081923] text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
          <Badge className="bg-white/10 text-teal-200 ring-white/15"><MapPinned className="mr-1.5 size-3" /> I have something</Badge>
          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[.96] tracking-[-.065em] sm:text-7xl">What are you bringing to Grid?</h1>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300">Choose the participant type that matches what you actually have. Each path writes into the same Grid exchange, while policy and review change by resource class.</p>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {enrollmentPaths.map(({ icon: Icon, title, body, href }) => <Link className="group bg-white/[.055] p-5 transition hover:bg-white/[.09]" href={href} key={title}><div className="flex items-start justify-between gap-3"><Icon className="size-5 text-teal-300"/><ArrowRight className="size-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-teal-300"/></div><p className="mt-5 text-sm font-extrabold">{title}</p><p className="mt-2 text-xs leading-5 text-slate-300">{body}</p></Link>)}
          </div>
        </div>
      </section>

      <section className="grid-marble-surface mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[.62fr_1.38fr]" id="professional">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-[12px] font-extrabold uppercase tracking-[.18em] text-teal-700">Professional enrollment</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.05em] text-slate-950">For people whose work depends on professional eligibility.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">Clinical and regulated professional work stays on the existing credential-aware enrollment path. The account is not proof that the person is eligible for every opportunity.</p>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-600">{["Identity and professional profile", "License, certification, and malpractice evidence where applicable", "Mobile, clinic-chair, and partner-location preferences", "Recurring availability and travel radius", "Human verification before regulated activation", "Opportunity, booking, and payout state after eligibility"].map((item) => <li className="flex gap-3" key={item}><span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500" />{item}</li>)}</ul>
          {account ? (
            <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-[11px] leading-6 text-teal-950">
              <strong>Signed in as {account.email}.</strong> This application will reuse that identity only. Your current organization, role, password, and session authority stay unchanged.
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-[11px] leading-6 text-slate-700">
              <strong>Already have a Klinikos account?</strong> Sign in before submitting so Grid can attach the application to the proven identity instead of creating a duplicate account.
              <Link className="mt-3 flex items-center gap-2 font-extrabold text-teal-700" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in and return here <ArrowRight className="size-3.5" /></Link>
            </div>
          )}
          <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-[11px] leading-6 text-amber-900"><ShieldCheck className="mb-2 size-4"/>Do not enter patient information. Professional enrollment and resource publication are different things, and neither one bypasses opportunity-specific eligibility.</p>
        </aside>
        <ContractorEnrollmentForm account={account} />
      </section>
    </main>
  );
}
