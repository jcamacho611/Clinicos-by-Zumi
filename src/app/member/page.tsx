import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, Network, Sparkles } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";
import { ZumiOrb } from "@/components/ds";
import { requireAccountSession } from "@/lib/auth/account-session";

const startingPoints = [
  { label: "I work in healthcare", hint: "Build your professional context over time", icon: Network },
  { label: "I am learning or training", hint: "Explore EDU, skills, simulation, and future placements", icon: GraduationCap },
  { label: "I own or operate something", hint: "Connect a real organization only when you are ready", icon: Building2 },
] as const;

export default async function MemberHomePage() {
  const session = await requireAccountSession();

  return (
    <main className="rose-home relative min-h-screen overflow-hidden bg-[#050303] text-[#f8f0ee]" data-klinikos-ds>
      <div className="rose-vignette pointer-events-none fixed inset-0 z-0" />
      <div className="rose-atmosphere pointer-events-none fixed inset-0 z-0 opacity-45" />

      <header className="relative z-20 flex min-h-[96px] items-center justify-between px-5 sm:px-9 lg:px-[38px]">
        <KlinikosWordmark
          className="gap-[18px]"
          frameClassName="size-[58px]"
          href="/member"
          framed
          inverse
          markClassName="h-full w-full"
          textClassName="h-[32px] w-[230px]"
        />
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-[#d9837f]/16 bg-[#140a0c]/70 px-4 py-2 text-[10px] font-semibold text-[#bda5a1] sm:inline-flex">{session.email}</span>
          {session.kind === "clinic" ? (
            <Link className="rounded-full bg-[#e6817b] px-5 py-3 text-[11px] font-semibold text-[#1a090a]" href="/dashboard">Continue to Clinic OS</Link>
          ) : null}
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-[1040px] items-center px-5 pb-16 pt-8 sm:px-9">
        <div className="w-full">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="mb-5"><ZumiOrb state="observing" size={58} /></div>
            <p className="text-[10px] font-semibold uppercase tracking-[.26em] text-[#e6817b]">Welcome, {session.name}</p>
            <h1 className="mt-5 text-balance text-[clamp(2.7rem,6vw,5.4rem)] font-extralight leading-[.98] tracking-[-.06em] text-[#fff7f5]">What brings you to Klinikos?</h1>
            <p className="mt-6 max-w-2xl text-[14px] leading-7 text-[#c7afab]">You do not need to understand every Klinikos product or choose one permanent role. Tell Zumi what you are trying to accomplish and Klinikos will reveal the smallest useful path.</p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-3 md:grid-cols-3">
            {startingPoints.map(({ label, hint, icon: Icon }) => (
              <Link
                className="group rounded-[24px] border border-[#e6817b]/12 bg-[#100709]/60 p-5 text-left backdrop-blur-xl transition hover:border-[#efaaa1]/35 hover:bg-[#15090c]"
                href={`/member/activate?seed=${encodeURIComponent(label)}`}
                key={label}
              >
                <Icon className="size-5 text-[#e99089]" />
                <p className="mt-5 text-[13px] font-semibold text-[#f2dfdc]">{label}</p>
                <p className="mt-2 text-[11px] leading-5 text-[#8f7773]">{hint}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#d59791]">Start with Zumi <ArrowRight className="size-3" /></span>
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-[26px] border border-[#e6817b]/14 bg-[#0b0507]/85 p-4 shadow-[0_24px_90px_rgba(0,0,0,.38)] backdrop-blur-2xl sm:p-5">
            <Link className="flex min-h-16 items-center gap-4 rounded-[20px] border border-[#d9918a]/24 bg-[#170a0d]/70 px-5 transition hover:border-[#efaaa1]/45" href="/member/activate">
              <Sparkles className="size-5 shrink-0 text-[#e99089]" />
              <span className="min-w-0 flex-1 text-left text-[13px] text-[#e7d2cf]">Tell Zumi what you need in your own words...</span>
              <ArrowRight className="size-4 shrink-0 text-[#e99089]" />
            </Link>
            <p className="mt-3 px-2 text-center text-[10px] leading-5 text-[#806a66]">Your account is identity, not authority. Klinikos will ask for confirmation or evidence only when your next action actually requires it.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
