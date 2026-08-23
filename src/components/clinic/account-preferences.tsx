"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ExternalLink, FileSignature, LockKeyhole, LogOut, Monitor, Moon, Plug, ShieldCheck, Sun } from "lucide-react";
import {
  atmosphereForAppearance,
  KLINIKOS_ATMOSPHERE_STORAGE_KEY,
  normalizeAppearancePreference,
  type KlinikosAppearancePreference,
} from "@/lib/design/atmosphere";
import { cn } from "@/lib/utils";

const SYSTEM_QUERY = "(prefers-color-scheme: dark)";
type Appearance = KlinikosAppearancePreference;

function currentAppearance(): Appearance {
  if (typeof window === "undefined") return "system";
  return normalizeAppearancePreference(window.localStorage.getItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY));
}

function applyAppearance(value: Appearance) {
  window.localStorage.setItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY, value);
  const prefersDark = window.matchMedia(SYSTEM_QUERY).matches;
  const atmosphere = atmosphereForAppearance(value, prefersDark, false);
  document.documentElement.dataset.klinikosAtmosphere = atmosphere;
  document.documentElement.dataset.klinikosAtmospherePreference = value;
  document.documentElement.style.colorScheme = atmosphere === "night" ? "dark" : "light";
  document.getElementById("klinikos-page-content")?.classList.toggle("grid-marble-surface", atmosphere !== "night");
  window.dispatchEvent(new CustomEvent("klinikos:atmosphere-change", { detail: { preference: value, atmosphere } }));
}

const options: Array<{ key: Appearance; label: string; description: string; icon: typeof Sun }> = [
  { key: "system", label: "System", description: "Follow your device light or dark preference.", icon: Monitor },
  { key: "light", label: "Light", description: "Warm Marble surfaces for sustained reading and operational work.", icon: Sun },
  { key: "dark", label: "Dark", description: "Obsidian and black-cherry surfaces with warm-ivory text.", icon: Moon },
];

export function AccountPreferences({ userName, organizationName, role }: { userName: string; organizationName: string; role: string }) {
  const [appearance, setAppearance] = useState<Appearance>("system");

  useEffect(() => {
    const media = window.matchMedia(SYSTEM_QUERY);
    const sync = () => setAppearance(currentAppearance());
    sync();
    media.addEventListener("change", sync);
    window.addEventListener("klinikos:atmosphere-change", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("klinikos:atmosphere-change", sync);
    };
  }, []);

  function choose(next: Appearance) {
    setAppearance(next);
    applyAppearance(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
      <section className="rounded-[28px] border border-[var(--k-line)] bg-[var(--k-public-surface)] p-6 text-[var(--k-text)] shadow-[var(--k-shadow)] sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[var(--k-accent)]">Account</p>
        <h1 className="mt-4 text-4xl font-light tracking-[-.055em] text-[var(--k-text)]">{userName}</h1>
        <div className="mt-7 border-y border-[var(--k-line)] py-5">
          <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[var(--k-muted)]">Current organization</p>
          <p className="mt-2 text-sm font-semibold text-[var(--k-text)]">{organizationName}</p>
          <p className="mt-1 text-xs text-[var(--k-muted)]">{role}</p>
        </div>
        <p className="mt-5 text-xs leading-6 text-[var(--k-muted)]">Organization and role context control what surfaces and data you can open. Appearance never changes permissions, eligibility, safety, or clinical/financial authority.</p>

        <div className="mt-6 space-y-2">
          <Link className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-public-raised)] px-4 text-xs font-semibold text-[var(--k-muted)] transition hover:text-[var(--k-text)]" href="/access-controls"><LockKeyhole className="size-4 text-[var(--k-accent)]" />Access & sharing<ExternalLink className="ml-auto size-3.5" /></Link>
          <Link className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-public-raised)] px-4 text-xs font-semibold text-[var(--k-muted)] transition hover:text-[var(--k-text)]" href="/integrations"><Plug className="size-4 text-[var(--k-accent)]" />Connections<ExternalLink className="ml-auto size-3.5" /></Link>
          <Link className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-public-raised)] px-4 text-xs font-semibold text-[var(--k-muted)] transition hover:text-[var(--k-text)]" href="/legal/agreements"><FileSignature className="size-4 text-[var(--k-accent)]" />Signed agreements<ExternalLink className="ml-auto size-3.5" /></Link>
        </div>

        <form action="/api/auth/logout" className="mt-6" method="post"><button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--k-line)] bg-[color-mix(in_srgb,var(--k-accent)_8%,transparent)] text-xs font-semibold text-[var(--k-accent)] transition hover:bg-[color-mix(in_srgb,var(--k-accent)_13%,transparent)]" type="submit"><LogOut className="size-4" />Sign out</button></form>
      </section>

      <section className="rounded-[28px] border border-[var(--k-line)] bg-[var(--k-public-surface)] p-6 text-[var(--k-text)] shadow-[var(--k-shadow)] sm:p-8">
        <div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-full border border-[var(--k-line)] bg-[var(--k-public-raised)] text-[var(--k-accent)]"><ShieldCheck className="size-4" /></span><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-[var(--k-accent)]">Preferences</p><h2 className="mt-2 text-2xl font-light tracking-[-.045em] text-[var(--k-text)]">Appearance</h2></div></div>
        <p className="mt-5 max-w-2xl text-xs leading-6 text-[var(--k-muted)]">Choose System, Light, or Dark. System follows your device preference; Light is Klinikos Marble and Dark is Klinikos Obsidian.</p>

        <div className="mt-7 divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
          {options.map(({ key, label, description, icon: Icon }) => {
            const selected = appearance === key;
            return (
              <button className="flex min-h-11 w-full items-center gap-4 py-5 text-left" key={key} onClick={() => choose(key)} type="button" aria-pressed={selected}>
                <span className={cn("grid size-11 place-items-center rounded-full border", selected ? "border-[var(--k-accent)] bg-[color-mix(in_srgb,var(--k-accent)_12%,transparent)] text-[var(--k-accent)]" : "border-[var(--k-line)] bg-[var(--k-public-raised)] text-[var(--k-muted)]")}><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--k-text)]">{label}</span><span className="mt-1 block text-xs leading-5 text-[var(--k-muted)]">{description}</span></span>
                {selected ? <Check className="size-4 text-[var(--k-accent)]" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-7 rounded-[18px] border border-[var(--k-line)] bg-[var(--k-public-raised)] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-[var(--k-premium)]"><ShieldCheck className="size-4" />Readable by design</p><p className="mt-2 text-xs leading-5 text-[var(--k-muted)]">Clinical and operational text stays legible in both Marble and Obsidian. Theme changes never expose internal system terminology or backend controls.</p></div>
      </section>
    </div>
  );
}
