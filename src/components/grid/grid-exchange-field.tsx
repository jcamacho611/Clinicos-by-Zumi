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

  return <form className="border border-[#d9dee5] bg-[#fbfcfd] p-4 sm:p-6" onSubmit={continueExchange}>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Are you finding or offering something?">
      <button aria-pressed={direction === "need"} className={`min-h-11 border px-4 text-[11px] font-extrabold ${direction === "need" ? "border-[#174ea6] bg-[#174ea6] text-white" : "border-[#d9dee5] bg-white text-[#5b6675]"}`} onClick={() => setDirectionOverride("need")} type="button">I need something</button>
      <button aria-pressed={direction === "offer"} className={`min-h-11 border px-4 text-[11px] font-extrabold ${direction === "offer" ? "border-[#174ea6] bg-[#174ea6] text-white" : "border-[#d9dee5] bg-white text-[#5b6675]"}`} onClick={() => setDirectionOverride("offer")} type="button">I have something</button>
    </div>
    <label className="mt-4 block text-[12px] font-extrabold uppercase tracking-[.15em] text-[#5b6675]" htmlFor="grid-exchange-query">What are you trying to find or offer?</label>
    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
      <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#174ea6]" /><input autoComplete="off" className="min-h-12 w-full border border-[#cfd6df] bg-white pl-11 pr-4 text-sm text-[#0b1220] outline-none placeholder:text-[#7b8490] focus:border-[#174ea6] focus:ring-2 focus:ring-[#174ea6]/10" id="grid-exchange-query" maxLength={240} onChange={(event) => setQuery(event.target.value)} placeholder="I need a nurse Friday 9–5 in Brooklyn…" value={query} /></div>
      <button className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#0b1220] px-5 text-xs font-extrabold text-white hover:bg-[#174ea6] disabled:cursor-not-allowed disabled:opacity-50" disabled={!query.trim()} type="submit">Continue <ArrowRight className="size-4" /></button>
    </div>
    {query.trim().length >= 3 && <div className="mt-3 border-l-2 border-[#174ea6] pl-3 text-[11px] leading-5 text-[#5b6675]" aria-live="polite"><strong className="text-[#0b1220]">Grid reads this as:</strong> {direction === "need" ? "find" : "offer"} {interpretation.label}.{interpretation.temporal.summary && <span className="ml-1 font-bold text-[#174ea6]">When: {interpretation.temporal.summary}.</span>}{interpretation.followUp && <span className="ml-1 font-bold text-[#6f6240]">{interpretation.followUp}</span>}<span className="block text-[12px] text-[#7b8490]">Deterministic routing is active. Time interpretation narrows discovery; eligibility and booking are decided later by governed Grid policy and real availability.</span></div>}
  </form>;
}
