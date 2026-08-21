import Link from "next/link";
import { ArrowRight } from "lucide-react";

const productLayers = [
  ["Klinikos", "clinic operating system"],
  ["Zumi", "intelligence layer"],
  ["Grid", "healthcare network"],
  ["EDU", "learning and advancement"],
] as const;

export function PublicProductDefinition() {
  return (
    <section
      aria-labelledby="klinikos-product-definition"
      className="relative isolate overflow-hidden border-b border-[#d9837f]/15 bg-[#050303] text-[#f8f0ee]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(176,52,60,.18),transparent_46%),linear-gradient(180deg,#080405_0%,#050303_100%)]"
      />

      <div className="mx-auto flex min-h-[78svh] max-w-6xl flex-col justify-center px-5 py-20 sm:px-9 lg:px-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e88f88]">
          AI-native clinic operating system
        </p>

        <h1
          id="klinikos-product-definition"
          className="mt-6 max-w-5xl text-balance text-[clamp(2.9rem,7vw,6.7rem)] font-extralight leading-[0.92] tracking-[-0.065em] text-[#fff7f5]"
        >
          Run your clinic from one intelligent operating system.
        </h1>

        <p className="mt-7 max-w-3xl text-pretty text-base leading-8 text-[#d9c4c0] sm:text-lg">
          Klinikos brings scheduling, follow-up, referrals, team workflows, documents, revenue work, and owner visibility into one governed workspace, with Zumi helping your team understand what needs attention and what should happen next.
        </p>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#bfa7a2]">
          Built to reduce fragmented clinic software and manual handoffs while keeping the external healthcare connections that still need to remain.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e6817b] px-6 text-sm font-semibold text-[#1a090a] transition hover:bg-[#efaaa1]"
            href="/klinikos"
          >
            See Klinikos for clinics
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#d9837f]/30 bg-[#140a0c]/75 px-6 text-sm font-semibold text-[#f6dfdc] transition hover:border-[#eaa09a]/55 hover:bg-[#1b0d10]"
            href="/how-it-works"
          >
            See how the system works
          </Link>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-[#d9837f]/15 bg-[#d9837f]/15 sm:grid-cols-2 lg:grid-cols-4">
          {productLayers.map(([name, role]) => (
            <div className="bg-[#0d0708]/95 px-5 py-5" key={name}>
              <p className="text-sm font-semibold text-[#fff7f5]">{name}</p>
              <p className="mt-1 text-xs leading-5 text-[#bfa7a2]">{role}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-6 text-[#9f8580]">
          Next: use public Zumi to tell Klinikos what you need. The public guide can route you, but it cannot access private clinic records or make changes.
        </p>
      </div>
    </section>
  );
}
