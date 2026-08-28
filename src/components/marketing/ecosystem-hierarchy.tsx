import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KLINIKOS_ECOSYSTEM } from "@/lib/brand/canonical-messaging";

/**
 * Four names, in order, with one sentence each.
 *
 * Klinikos, Zumi, Grid and EDU are individually easy to explain and collectively easy to
 * misread — a visitor who meets them all at once starts asking whether this is an EHR, a
 * staffing marketplace, an AI chatbot or a school. The breadth is a strength only if the
 * hierarchy is obvious, so the order here is commercial rather than alphabetical: the
 * operating system a clinic buys comes first, the network second, and the learning system
 * last.
 *
 * This sits below the fold deliberately. The first viewport answers "what is this"; this
 * answers "what else is there", which is a question only someone still reading has.
 */

const DESTINATIONS: Record<string, string | null> = {
  Klinikos: "/how-it-works",
  Zumi: null,
  Grid: "/grid",
  "Klinikos EDU": "/edu",
};

export function EcosystemHierarchy() {
  return (
    <section
      aria-labelledby="klinikos-ecosystem-heading"
      className="border-t px-5 py-20 sm:px-9"
      style={{ borderColor: "rgba(226,139,133,.14)", backgroundColor: "#070304" }}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] font-semibold uppercase tracking-[.28em]" style={{ color: "#e88f88" }}>
          One system, three extensions
        </p>
        <h2
          className="mt-4 max-w-3xl text-3xl font-light tracking-[-.04em] sm:text-4xl"
          id="klinikos-ecosystem-heading"
          style={{ color: "#f5edeb" }}
        >
          Klinikos is the operating system. The rest extends it.
        </h2>

        <ol className="mt-10 space-y-px overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(226,139,133,.16)" }}>
          {KLINIKOS_ECOSYSTEM.map((entry, index) => {
            const href = DESTINATIONS[entry.name] ?? null;
            const body = (
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 px-6 py-6" style={{ background: "#0d0708" }}>
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#8d7572" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="text-lg font-medium tracking-[-.02em]" style={{ color: "#f8efed" }}>{entry.name}</h3>
                    <span className="text-[12px] font-semibold uppercase tracking-[.14em]" style={{ color: "#e6817b" }}>
                      {entry.role}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-[14px] leading-7" style={{ color: "#c9b0ac" }}>{entry.sentence}</p>
                </div>
                {href ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "#efaaa1" }}>
                    Open <ArrowRight aria-hidden="true" className="size-3.5" />
                  </span>
                ) : null}
              </div>
            );
            return (
              <li key={entry.name}>
                {href ? <Link className="block transition hover:brightness-125" href={href}>{body}</Link> : body}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
