import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HeartPulse, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/clinic/brand-mark";
import { DsSurface } from "@/components/ds";
import { PortalLoginForm } from "@/components/portal/portal-login-form";
import { getPortalSession } from "@/lib/auth/portal-session";

export const metadata: Metadata = { title: "Patient portal sign in" };

export default async function PortalLoginPage({ searchParams }: { searchParams: Promise<{ clinic?: string }> }) {
  if (await getPortalSession()) redirect("/portal");
  const { clinic } = await searchParams;
  const demoCredentials = process.env.NODE_ENV !== "production"
    ? { email: "maya.thompson@example.test", password: process.env.CLINICOS_SEED_PATIENT_PASSWORD ?? process.env.CLINICOS_SEED_ADMIN_PASSWORD ?? "" }
    : undefined;

  return (
    <DsSurface>
      <main className="grid min-h-screen lg:grid-cols-[1.02fr_.98fr]" style={{ background: "var(--surface-paper-2)", color: "var(--text-on-paper)" }}>
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:py-16">
          <div className="w-full max-w-md">
            <Link className="mb-12 flex items-center gap-3" href="/">
              <BrandMark />
              <div>
                <p className="text-sm font-extrabold">Klinikos</p>
                <p className="mt-1 text-[10px] font-extrabold uppercase" style={{ color: "var(--accent-premium)", letterSpacing: "var(--tracking-wide)" }}>
                  Patient portal
                </p>
              </div>
            </Link>

            <p className="text-[10px] font-extrabold uppercase" style={{ color: "var(--accent-signal)", letterSpacing: "var(--tracking-wider)" }}>
              Private care space
            </p>
            <h1 className="mt-4 text-balance font-extrabold" style={{ fontSize: "var(--text-h1)", letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-tight)" }}>
              Your care, without the maze.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7" style={{ color: "var(--text-on-paper-dim)" }}>
              See the appointments, forms, balances, messages, and records your clinic has made available to you, with one clear place to understand what comes next.
            </p>

            <PortalLoginForm clinic={clinic ?? (demoCredentials ? "brooklyn-family-medicine" : "")} demoCredentials={demoCredentials} />

            <p className="mt-6 text-center text-xs" style={{ color: "var(--text-on-paper-dim)" }}>
              Clinic staff?{" "}
              <Link className="font-extrabold underline-offset-4 hover:underline" href="/login" style={{ color: "var(--accent-signal)" }}>
                Use the clinic workspace
              </Link>
            </p>
          </div>
        </section>

        <section
          className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between"
          style={{ background: "var(--obsidian)", color: "var(--text-primary)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(circle at 72% 18%, color-mix(in oklch, var(--cyan-500) 18%, transparent), transparent 30%), radial-gradient(circle at 20% 86%, color-mix(in oklch, var(--gold-500) 14%, transparent), transparent 28%)",
            }}
          />
          <div className="relative flex items-center gap-2 text-xs font-bold" style={{ color: "var(--cyan-400)" }}>
            <LockKeyhole className="size-4" aria-hidden="true" />
            A separate patient identity boundary
          </div>

          <div className="relative max-w-lg">
            <span
              className="grid size-14 place-items-center"
              style={{ background: "var(--gold-300)", color: "var(--obsidian)", borderRadius: "var(--radius-md)" }}
            >
              <HeartPulse className="size-7" aria-hidden="true" />
            </span>
            <h2 className="mt-8 text-balance font-extrabold" style={{ fontSize: "var(--text-h2)", letterSpacing: "var(--tracking-tight)", lineHeight: "var(--leading-snug)" }}>
              Released with care. Accessed with proof.
            </h2>
            <p className="mt-6 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
              Clinical drafts stay private. Approved records carry a release decision and access history. Your patient session cannot become a clinic staff session.
            </p>
            <div className="mt-10 flex items-start gap-3 p-5" style={{ background: "var(--surface-raised)", border: "var(--border-hair-dark)", borderRadius: "var(--radius-md)" }}>
              <ShieldCheck className="mt-0.5 size-5 shrink-0" style={{ color: "var(--gold-300)" }} aria-hidden="true" />
              <p className="text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
                This environment contains synthetic demonstration records only. Do not enter real health information.
              </p>
            </div>
          </div>
        </section>
      </main>
    </DsSurface>
  );
}
