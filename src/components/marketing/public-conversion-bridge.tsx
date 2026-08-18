import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, Network, Route, Sparkles } from "lucide-react";

const entries = [
  { eyebrow: "Run a clinic", title: "Find the operating problem before buying more software.", body: "Start with the workflow, revenue, staffing, follow-up, or capacity issue you actually want to fix. The clinic entry path can lead into a paid operating analysis or the right Clinic OS activation after the value is clear.", action: "Start with my clinic", href: "/founding-clinic", icon: Building2 },
  { eyebrow: "Work or advance", title: "Move from where you are to what becomes eligible next.", body: "Klinikos Routes connect learning, readiness, credentials, availability, Grid opportunity, and practice growth without pretending those states are interchangeable.", action: "Explore my routes", href: "/login?next=%2Fpaths", icon: Route },
  { eyebrow: "Need or have capacity", title: "Use Grid when there is something real to find, fill, or offer.", body: "People, rooms, equipment, services, education capacity, organizations, referrals, and other legitimate healthcare resources enter through the same I NEED / I HAVE exchange model.", action: "Open Grid", href: "/grid", icon: Network },
  { eyebrow: "Learn", title: "Education should open a path, not end at a course completion screen.", body: "EDU connects learning and competency evidence to readiness and governed opportunity while keeping institutional and professional requirements explicit.", action: "Explore EDU", href: "/edu", icon: GraduationCap },
] as const;

export function PublicConversionBridge() {
  return (
    <section className="relative overflow-hidden border-t border-[#e6817b]/10 bg-[#080304] text-[#f8efed]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(145,40,49,.14),transparent_34%)]" />
      <div className="relative mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.23em] text-[#efaaa1]">One ecosystem, different entry points</p><h2 className="mt-4 text-4xl font-light leading-tight tracking-[-.055em] sm:text-6xl">You should not have to understand Klinikos before Klinikos can understand what you need.</h2></div>
          <div className="lg:pl-12"><p className="max-w-2xl text-sm leading-7 text-[#b39a95]">Start with the outcome. Experience the route. See the real unlock. Pay only when a paid capability solves the next concrete problem. No fake scarcity, no hidden implementation vocabulary, and no decorative demo that never connects to a real working surface.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e6817b] px-5 text-xs font-semibold text-[#19090b] hover:bg-[#efaaa1]" href="/ecosystem"><Sparkles className="size-4" aria-hidden="true" />See how it connects</Link><Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e6817b]/20 px-5 text-xs font-semibold text-[#e2ccc8] hover:border-[#e6817b]/40 hover:text-[#fff8f6]" href="/pricing">View current pricing <ArrowRight className="size-3.5" aria-hidden="true" /></Link></div></div>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {entries.map(({ eyebrow, title, body, action, href, icon: Icon }) => <Link className="group flex min-h-[300px] flex-col rounded-[22px] border border-[#e6817b]/14 bg-[#100708]/72 p-6 transition hover:border-[#e6817b]/30 hover:bg-[#14090b]" href={href} key={eyebrow}><div className="flex items-center justify-between"><Icon className="size-5 text-[#efaaa1]" aria-hidden="true" /><ArrowRight className="size-4 text-[#9a817c] transition group-hover:translate-x-1 group-hover:text-[#efaaa1]" aria-hidden="true" /></div><p className="mt-8 text-[10px] font-extrabold uppercase tracking-[.15em] text-[#9a817c]">{eyebrow}</p><h3 className="mt-3 text-xl font-semibold leading-snug tracking-[-.035em] text-[#fff8f6]">{title}</h3><p className="mt-4 flex-1 text-xs leading-6 text-[#b39a95]">{body}</p><span className="mt-5 text-xs font-semibold text-[#efaaa1]">{action}</span></Link>)}
        </div>
      </div>
    </section>
  );
}
