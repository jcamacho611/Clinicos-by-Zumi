"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { gridOfferEnrollmentHref, inferGridIntent, type GridExchangeDirection, type GridIntentKind } from "@/lib/grid/intent-rules";

export function GridExchangeField({ initialIntent = "all", initialQuery = "" }: { initialIntent?: GridIntentKind; initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [directionOverride, setDirectionOverride] = useState<GridExchangeDirection | null>(null);
  const interpretation = useMemo(() => inferGridIntent(query, initialIntent), [initialIntent, query]);
  const direction = directionOverride ?? interpretation.direction;

  function continueExchange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (direction === "offer") {
      router.push(gridOfferEnrollmentHref(interpretation.intent));
      return;
    }
    const params = new URLSearchParams({ intent: interpretation.intent, q: trimmed });
    router.push(`/grid/browse?${params.toString()}`);
  }

  return <form className="rounded-[24px] border border-[#e28b85]/16 bg-[#12090b]/72 p-4 shadow-[0_24px_70px_rgba(0,0,0,.22)] sm:p-6" onSubmit={continueExchange}>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Are you finding or offering something?">
      <button aria-pressed={direction === "need"} className={`min-h-11 rounded-full border px-4 text-[11px] font-semibold transition ${direction === "need" ? "border-[#efaaa1]/55 bg-[#e6817b] text-[#19090b]" : "border-[#e28b85]/18 bg-[#0d0708]/76 text-[#d8c1bd] hover:border-[#efaaa1]/35 hover:text-[#fff8f6]"}`} onClick={() => setDirectionOverride("need")} type="button">I need something</button>
      <button aria-pressed={direction === "offer"} className={`min-h-11 rounded-full border px-4 text-[11px] font-semibold transition ${direction === "offer" ? "border-[#efaaa1]/55 bg-[#e6817b] text-[#19090b]" : "border-[#e28b85]/18 bg-[#0d0708]/76 text-[#d8c1bd] hover:border-[#efaaa1]/35 hover:text-[#fff8f6]"}`} onClick={() => setDirectionOverride("offer")} type="button">I have something</button>
    </div>
    <label className="mt-5 block text-[12px] font-semibold tracking-[-.01em] text-[#e9aaa4]" htmlFor="grid-exchange-query">What are you trying to find or offer?</label>
    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
      <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#e6817b]" /><input autoComplete="off" className="min-h-12 w-full rounded-[16px] border border-[#e28b85]/18 bg-[#090506]/90 pl-11 pr-4 text-sm text-[#fff8f6] outline-none placeholder:text-[#9f8985] focus:border-[#efaaa1]/55 focus:ring-2 focus:ring-[#e6817b]/12" id="grid-exchange-query" maxLength={240} onChange={(event) => setQuery(event.target.value)} placeholder="I need a nurse Friday 9–5 in Brooklyn…" value={query} /></div>
      <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[16px] bg-[#e6817b] px-5 text-xs font-semibold text-[#19090b] transition hover:bg-[#efaaa1] disabled:cursor-not-allowed disabled:opacity-45" disabled={!query.trim()} type="submit">Continue <ArrowRight className="size-4" /></button>
    </div>
    {query.trim().length >= 3 && <div className="mt-4 border-l-2 border-[#e6817b] pl-3 text-[11px] leading-5 text-[#bca5a1]" aria-live="polite"><strong className="text-[#fff8f6]">Grid reads this as:</strong> {direction === "need" ? "find" : "offer"} {interpretation.label}.{interpretation.temporal.summary && <span className="ml-1 font-semibold text-[#e9aaa4]">When: {interpretation.temporal.summary}.</span>}{interpretation.followUp && <span className="ml-1 font-semibold text-[#d7b0aa]">{interpretation.followUp}</span>}<span className="block text-[12px] text-[#9f8985]">Deterministic routing is active. Time interpretation narrows discovery; eligibility and booking are decided later by governed Grid policy and real availability.</span></div>}
  </form>;
}
