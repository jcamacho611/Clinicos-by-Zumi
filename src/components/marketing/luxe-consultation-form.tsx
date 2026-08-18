"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import {
  boundedAttributionText,
  captureLuxeFirstTouch,
  sanitizeAttributionUrl,
  sourceFromReferrer,
  type LuxeFirstTouchAttribution,
} from "@/lib/luxe-public-attribution";

type PublicLuxeServiceOption = {
  name: string;
  category: string | null;
};

const FIRST_TOUCH_KEY = "klinikos:luxe:first-touch:v1";

function readStoredFirstTouch(): LuxeFirstTouchAttribution | null {
  try {
    const raw = window.localStorage.getItem(FIRST_TOUCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LuxeFirstTouchAttribution;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function storeFirstTouch(value: LuxeFirstTouchAttribution) {
  try {
    window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(value));
  } catch {
    // Attribution persistence is useful but must never block conversion.
  }
}

export function LuxeConsultationForm({ services, bookingAvailable }: { services: PublicLuxeServiceOption[]; bookingAvailable: boolean }) {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [initialService, setInitialService] = useState("");
  const [firstTouch, setFirstTouch] = useState<LuxeFirstTouchAttribution>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInitialService(boundedAttributionText(params.get("service"), 160) ?? "");
    const stored = readStoredFirstTouch();
    if (stored) {
      setFirstTouch(stored);
      return;
    }
    const captured = captureLuxeFirstTouch(params, document.referrer, window.location.href);
    storeFirstTouch(captured);
    setFirstTouch(captured);
  }, []);

  const groupedServices = useMemo(() => {
    const groups = new Map<string, PublicLuxeServiceOption[]>();
    for (const service of services) {
      const key = service.category || "Services";
      groups.set(key, [...(groups.get(key) ?? []), service]);
    }
    return [...groups.entries()];
  }, [services]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (!email && !phone) {
      setBusy(false);
      setMessage("Enter a phone number or email so Luxe Medi can respond.");
      return;
    }

    const currentUrl = new URL(window.location.href);
    const params = currentUrl.searchParams;
    const currentSource = boundedAttributionText(params.get("utm_source") ?? params.get("source"), 120) ?? sourceFromReferrer(document.referrer);
    const currentCampaign = boundedAttributionText(params.get("utm_campaign"), 160);

    const payload = {
      name: form.get("name"),
      email: email || null,
      phone: phone || null,
      serviceInterest: form.get("serviceInterest") || null,
      appointmentInterest: form.get("appointmentInterest") || null,
      preferredContactMethod: form.get("preferredContactMethod") || "either",
      preferredTiming: form.get("preferredTiming") || null,
      message: form.get("message") || null,
      contactConsent: form.get("contactConsent") === "on",
      marketingConsent: form.get("marketingConsent") === "on",
      attribution: {
        firstTouchSource: firstTouch.source || "direct",
        firstTouchMedium: firstTouch.medium,
        firstTouchCampaign: firstTouch.campaign,
        firstTouchTerm: firstTouch.term,
        firstTouchContent: firstTouch.content,
        firstTouchLandingPage: firstTouch.landingPage,
        firstTouchReferrer: firstTouch.referrer,
        lastTouchSource: currentSource,
        lastTouchCampaign: currentCampaign,
        landingPage: sanitizeAttributionUrl(window.location.href),
        referrer: sanitizeAttributionUrl(document.referrer),
        utmSource: boundedAttributionText(params.get("utm_source"), 120),
        utmMedium: boundedAttributionText(params.get("utm_medium"), 120),
        utmCampaign: currentCampaign,
        utmTerm: boundedAttributionText(params.get("utm_term"), 160),
        utmContent: boundedAttributionText(params.get("utm_content"), 160),
        campaignId: boundedAttributionText(params.get("campaign_id"), 160),
        originatingPage: sanitizeAttributionUrl(params.get("originating_page")),
        cta: boundedAttributionText(params.get("cta"), 160) ?? "Luxe consultation request",
        bookingSource: "klinikos_hosted_luxe",
        referralSource: firstTouch.referrer,
        socialSource: ["instagram", "facebook", "tiktok"].includes(currentSource) ? currentSource : undefined,
        qrSource: boundedAttributionText(params.get("qr"), 160),
      },
      website: form.get("website") || "",
    };

    try {
      const response = await fetch("/api/public/luxe-medi/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "We could not submit your request.");
      setSubmitted(true);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not submit your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/[.07] p-7 sm:p-9" role="status">
        <CheckCircle2 className="size-7 text-emerald-300" />
        <h2 className="mt-5 text-2xl font-extrabold tracking-[-.04em] text-white">Your request is in.</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
          Luxe Medi staff still need to review availability and the next appropriate step. This does not confirm an appointment, treatment eligibility, or payment.
        </p>
        {bookingAvailable && (
          <form action="/api/public/luxe-medi/booking/start" method="post">
            <button className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-[#1a0d12] transition hover:bg-rose-50" type="submit">
              Continue to booking <ArrowRight className="size-4" />
            </button>
            <p className="mt-3 max-w-xl text-[11px] leading-5 text-emerald-100/70">Opening booking records intent for staff follow-up, but the external booking provider remains authoritative for appointment and payment status.</p>
          </form>
        )}
      </div>
    );
  }

  return (
    <form className="rounded-[28px] border border-white/12 bg-white/[.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-300">Name<input autoComplete="name" className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-rose-300/50" maxLength={160} name="name" required /></label>
        <label className="text-xs font-bold text-slate-300">Phone<input autoComplete="tel" className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-rose-300/50" inputMode="tel" maxLength={40} name="phone" placeholder="(555) 555-5555" /></label>
        <label className="text-xs font-bold text-slate-300 sm:col-span-2">Email<input autoComplete="email" className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-rose-300/50" maxLength={254} name="email" type="email" /></label>
        <label className="text-xs font-bold text-slate-300 sm:col-span-2">What are you interested in?
          {groupedServices.length ? (
            <select className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-[#160d12] px-4 text-sm text-white outline-none focus:border-rose-300/50" defaultValue={initialService} key={initialService || "service"} name="serviceInterest"><option value="">I’m not sure yet</option>{groupedServices.map(([category, items]) => <optgroup key={category} label={category}>{items.map((service) => <option key={service.name} value={service.name}>{service.name}</option>)}</optgroup>)}</select>
          ) : (
            <input className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-rose-300/50" defaultValue={initialService} maxLength={160} name="serviceInterest" placeholder="Tell us the service you’re considering" />
          )}
        </label>
        <label className="text-xs font-bold text-slate-300">Best way to reach you<select className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-[#160d12] px-4 text-sm text-white outline-none focus:border-rose-300/50" defaultValue="either" name="preferredContactMethod"><option value="either">Phone or text</option><option value="phone">Phone</option><option value="sms">Text</option><option value="email">Email</option></select></label>
        <label className="text-xs font-bold text-slate-300">Preferred timing<input className="mt-2 h-12 w-full rounded-xl border border-white/12 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-rose-300/50" maxLength={160} name="preferredTiming" placeholder="Example: weekday afternoon" /></label>
        <label className="text-xs font-bold text-slate-300 sm:col-span-2">What would you like to know?<textarea className="mt-2 min-h-28 w-full rounded-xl border border-white/12 bg-black/30 p-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-rose-300/50" maxLength={1200} name="message" placeholder="Pricing, availability, consultation questions, or the service you’re considering. Please do not send medical records or sensitive health details here." /></label>
      </div>

      <input aria-hidden="true" autoComplete="off" className="hidden" name="website" tabIndex={-1} />
      <input name="appointmentInterest" type="hidden" value="Consultation requested" />

      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-400"><input className="mt-1 size-4 accent-rose-300" name="contactConsent" required type="checkbox" /><span>I agree that Luxe Medi may contact me about this request using the contact information I provided. This is not consent to treatment.</span></label>
      <label className="mt-3 flex items-start gap-3 text-xs leading-5 text-slate-500"><input className="mt-1 size-4 accent-rose-300" name="marketingConsent" type="checkbox" /><span>Optional: I would also like occasional Luxe Medi updates and offers. I can opt out later.</span></label>

      {message && <p aria-live="polite" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[.06] px-4 py-3 text-xs text-rose-100">{message}</p>}

      <button className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f1d4dc] px-5 text-sm font-extrabold text-[#1a0d12] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60" disabled={busy} type="submit">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}{busy ? "Sending…" : "Request consultation"}</button>

      <div className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" /><p>This form is for general service inquiries. Do not upload or enter medical records, diagnoses, medication lists, insurance cards, IDs, or other sensitive clinical information.</p></div>
    </form>
  );
}
