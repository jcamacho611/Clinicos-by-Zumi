import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { LuxeConsultationForm } from "@/components/marketing/luxe-consultation-form";
import { luxeAcquisitionJourneyEnabled } from "@/lib/luxe-acquisition-journey-token";
import { configuredLuxeBookingUrl } from "@/lib/luxe-booking-config";
import { listPublicLuxeServiceOptions } from "@/lib/repositories/luxe-public-conversion-repository";

export const metadata: Metadata = {
  title: "Request a Luxe Medi consultation",
  description: "Tell Luxe Medi what you are interested in and request a staff follow-up.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LuxeConsultPage() {
  const services = await listPublicLuxeServiceOptions().catch(() => []);
  const bookingAvailable = Boolean(configuredLuxeBookingUrl() && luxeAcquisitionJourneyEnabled());

  return (
    <main className="min-h-screen bg-[#090608] text-white">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-16rem] size-[44rem] -translate-x-1/2 rounded-full bg-[#6f233c]/20 blur-[140px]" />
        <div className="absolute bottom-[-18rem] right-[-10rem] size-[38rem] rounded-full bg-[#4a162a]/15 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-7">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.24em] text-rose-200/70">Luxe Medi</p>
            <p className="mt-2 text-xl font-extrabold tracking-[-.04em]">Consultation request</p>
          </div>
          <Link className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-white" href="https://luxe-medi.com">
            <ArrowLeft className="size-3.5" /> Back to Luxe Medi
          </Link>
        </header>

        <section className="grid gap-12 py-12 lg:grid-cols-[.85fr_1.15fr] lg:items-start lg:gap-20 lg:py-20">
          <div className="lg:sticky lg:top-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/15 bg-rose-200/[.06] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.16em] text-rose-100">
              <Sparkles className="size-3" /> Start with five useful details
            </div>
            <h1 className="mt-7 max-w-xl text-balance text-4xl font-extrabold leading-[.98] tracking-[-.06em] sm:text-5xl lg:text-6xl">
              Tell us what you’re considering. We’ll take it from there.
            </h1>
            <p className="mt-7 max-w-lg text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">
              This is a short service inquiry, not a medical intake. Luxe Medi staff can use it to understand your interest, contact preference, and timing before discussing next steps with you.
            </p>

            <div className="mt-10 space-y-5 border-t border-white/10 pt-7 text-sm text-slate-400">
              <div>
                <p className="font-extrabold text-white">1. Request</p>
                <p className="mt-1 leading-6">Your inquiry enters Luxe Medi’s Klinikos follow-up queue with the service and source attached.</p>
              </div>
              <div>
                <p className="font-extrabold text-white">2. Human follow-up</p>
                <p className="mt-1 leading-6">A staff member reviews the request and contacts you. Nothing here independently determines treatment eligibility.</p>
              </div>
              <div>
                <p className="font-extrabold text-white">3. Booking comes later</p>
                <p className="mt-1 leading-6">If online booking is configured, you can continue to the approved booking rail after sending the inquiry. Opening that rail still does not confirm an appointment or payment.</p>
              </div>
            </div>
          </div>

          <LuxeConsultationForm bookingAvailable={bookingAvailable} services={services} />
        </section>

        <footer className="border-t border-white/10 py-8 text-[11px] leading-5 text-slate-600">
          Luxe Medi uses Klinikos to organize this inquiry and staff follow-up. Marketing inquiry data remains separate from controlled clinical records.
        </footer>
      </div>
    </main>
  );
}
