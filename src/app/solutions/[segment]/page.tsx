import Link from "next/link";
import { notFound } from "next/navigation";
import { commandSurfaces } from "@/lib/design/command-system";
import { MarketingShell, MarketingSection } from "@/components/growth/marketing-shell";
import { IntentBeacon } from "@/components/growth/intent-beacon";
import { LeadCaptureForm } from "@/components/growth/lead-capture-form";
import { getSegment, segmentKeys, segments } from "@/lib/growth/segments";

/**
 * One page per clinic type.
 *
 * Statically generated from the segment catalog, so adding a segment is a data change
 * rather than a new page nobody remembers to hold to design law.
 */

export function generateStaticParams() {
  return segmentKeys.map((segment) => ({ segment }));
}

export async function generateMetadata({ params }: { params: Promise<{ segment: string }> }) {
  const { segment } = await params;
  const found = getSegment(segment);
  if (!found) return { title: "Klinikos by Zumi" };
  return { title: `${found.name} — Klinikos by Zumi`, description: found.lead };
}

export default async function SolutionPage({ params }: { params: Promise<{ segment: string }> }) {
  const { segment } = await params;
  const found = getSegment(segment);
  if (!found) notFound();

  return (
    <MarketingShell>
      <IntentBeacon event="solution_viewed" path={`/solutions/${found.key}`} subject={found.key} />

      <section aria-labelledby="segment-heading" className="border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
          <p className={commandSurfaces.eyebrow}>{found.eyebrow}</p>
          <h1 className={`${commandSurfaces.headline} mt-4 max-w-4xl text-balance text-5xl leading-[.96] sm:text-6xl`} id="segment-heading">
            {found.headline}
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300">{found.lead}</p>
        </div>
      </section>

      <MarketingSection eyebrow="Where it goes" id="segment-losses" title="Four places the work disappears.">
        <ol className="mt-10 grid gap-px bg-white/10 sm:grid-cols-2">
          {found.losses.map((loss) => (
            <li className="bg-[#05090f] p-6 sm:p-8" key={loss.title}>
              <h3 className="text-base font-extrabold tracking-[-.02em] text-white">{loss.title}</h3>
              <p className="mt-3 text-[13px] leading-7 text-slate-400">{loss.body}</p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection eyebrow="What you get" id="segment-surfaces" title="The Klinikos surfaces that hold it.">
        <ul className="mt-8 flex flex-wrap gap-2">
          {found.surfaces.map((surface) => (
            <li className="border border-white/15 bg-white/[.04] px-3.5 py-2 text-[12px] font-semibold text-slate-200" key={surface}>
              {surface}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-[#e6c55b]/40 bg-[#e6c55b]/[.09] px-5 text-sm font-extrabold text-[#f0dda0]`} href="/pricing">
            See pricing
          </Link>
          <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-5 text-sm font-extrabold text-slate-200`} href="/demo">
            Walk through it
          </Link>
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Other clinic types"
        id="segment-others"
        title="Klinikos runs the same way elsewhere."
      >
        <ul className="mt-8 flex flex-wrap gap-3">
          {segmentKeys.filter((key) => key !== found.key).map((key) => (
            <li key={key}>
              <Link className={`${commandSurfaces.interactive} inline-flex items-center border border-white/15 bg-white/[.04] px-4 text-[13px] font-extrabold text-slate-200`} href={`/solutions/${key}`}>
                {segments[key].name}
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection
        eyebrow="Get the overview"
        id="segment-capture"
        lead="Tell us how your clinic runs and we will send the Klinikos overview. A person reads every request."
        title="Send me the Klinikos overview."
      >
        <div className="mt-8 max-w-xl">
          <LeadCaptureForm interest="overview" />
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
