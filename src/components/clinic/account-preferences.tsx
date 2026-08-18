"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ExternalLink, FileSignature, LockKeyhole, LogOut, Monitor, Moon, Plug, ShieldCheck, Sun } from "lucide-react";
import { KLINIKOS_ATMOSPHERE_STORAGE_KEY } from "@/lib/design/atmosphere";
import { cn } from "@/lib/utils";

type Appearance = "system" | "light" | "dark";

function currentAppearance(): Appearance {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY);
  if (stored === "day") return "light";
  if (stored === "night") return "dark";
  return "system";
}

function applyAppearance(value: Appearance) {
  const preference = value === "system" ? "auto" : value === "light" ? "day" : "night";
  window.localStorage.setItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY, preference);
  const hour = new Date().getHours();
  const automatic = hour >= 5 && hour < 9 ? "dawn" : hour >= 9 && hour < 17 ? "day" : hour >= 17 && hour < 20 ? "golden" : "night";
  const atmosphere = preference === "auto" ? automatic : preference;
  document.documentElement.dataset.klinikosAtmosphere = atmosphere;
  document.documentElement.dataset.klinikosAtmospherePreference = preference;
  document.documentElement.style.colorScheme = atmosphere === "night" ? "dark" : "light";
  window.dispatchEvent(new CustomEvent("klinikos:atmosphere-change", { detail: { preference, atmosphere } }));
}

const options: Array<{ key: Appearance; label: string; description: string; icon: typeof Sun }> = [
  { key: "system", label: "System", description: "Let Klinikos shift with your local time and device context.", icon: Monitor },
  { key: "light", label: "Light", description: "Paper-white surfaces with dark, high-contrast operational typography.", icon: Sun },
  { key: "dark", label: "Dark", description: "Obsidian and black-cherry surfaces with warm-ivory text.", icon: Moon },
];

export function AccountPreferences({ userName, organizationName, role }: { userName: string; organizationName: string; role: string }) {
  const [appearance, setAppearance] = useState<Appearance>("system");

  useEffect(() => setAppearance(currentAppearance()), []);

  function choose(next: Appearance) {
    setAppearance(next);
    applyAppearance(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
      <section className="rounded-[28px] border border-[#e6817b]/12 bg-[#0b0507] p-6 text-[#f8efed] sm:p-8">
        <p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[#e6817b]">Account</p>
        <h1 className="mt-4 text-4xl font-light tracking-[-.055em] text-[#fff8f6]">{userName}</h1>
        <div className="mt-7 border-y border-[#e6817b]/10 py-5">
          <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#725d59]">Current organization</p>
          <p className="mt-2 text-sm font-semibold text-[#e9d8d5]">{organizationName}</p>
          <p className="mt-1 text-xs text-[#8f7773]">{role}</p>
        </div>
        <p className="mt-5 text-xs leading-6 text-[#8f7773]">Organization and role context control what surfaces and data you can open. Appearance never changes permissions, eligibility, safety, or clinical/financial authority.</p>

        <div className="mt-6 space-y-2">
          <Link className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e6817b]/10 bg-[#100708] px-4 text-xs font-semibold text-[#b89f9b] hover:border-[#e6817b]/24 hover:text-[#fff8f6]" href="/access-controls"><LockKeyhole className="size-4 text-[#e6817b]" />Access & sharing<ExternalLink className="ml-auto size-3.5 text-[#655653]" /></Link>
          <Link className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e6817b]/10 bg-[#100708] px-4 text-xs font-semibold text-[#b89f9b] hover:border-[#e6817b]/24 hover:text-[#fff8f6]" href="/integrations"><Plug className="size-4 text-[#e6817b]" />Connections<ExternalLink className="ml-auto size-3.5 text-[#655653]" /></Link>
          <Link className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e6817b]/10 bg-[#100708] px-4 text-xs font-semibold text-[#b89f9b] hover:border-[#e6817b]/24 hover:text-[#fff8f6]" href="/legal/agreements"><FileSignature className="size-4 text-[#e6817b]" />Signed agreements<ExternalLink className="ml-auto size-3.5 text-[#655653]" /></Link>
        </div>

        <form action="/api/auth/logout" className="mt-6" method="post"><button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e6817b]/16 bg-[#e6817b]/[.07] text-xs font-semibold text-[#efaaa1] hover:bg-[#e6817b]/12" type="submit"><LogOut className="size-4" />Sign out</button></form>
      </section>

      <section className="rounded-[28px] border border-[#e6817b]/12 bg-[#0d0608] p-6 text-[#f8efed] sm:p-8">
        <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-full border border-[#e6817b]/14 bg-[#e6817b]/[.06] text-[#e6817b]"><ShieldCheck className="size-4" /></span><div><p className="text-[12px] font-extrabold uppercase tracking-[.2em] text-[#e6817b]">Preferences</p><h2 className="mt-2 text-2xl font-light tracking-[-.045em] text-[#fff8f6]">Appearance</h2></div></div>
        <p className="mt-5 max-w-2xl text-xs leading-6 text-[#9f8985]">Choose a simple system, light, or dark presentation. The more expressive Dawn and Golden atmospheres remain available from the global Appearance control if you want them.</p>

        <div className="mt-7 divide-y divide-[#e6817b]/10 border-y border-[#e6817b]/10">
          {options.map(({ key, label, description, icon: Icon }) => {
            const selected = appearance === key;
            return (
              <button className="flex w-full items-center gap-4 py-5 text-left" key={key} onClick={() => choose(key)} type="button" aria-pressed={selected}>
                <span className={cn("grid size-11 place-items-center rounded-full border", selected ? "border-[#e6817b]/30 bg-[#e6817b]/12 text-[#efaaa1]" : "border-[#e6817b]/10 bg-[#100708] text-[#806965]")}><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#f8efed]">{label}</span><span className="mt-1 block text-[11px] leading-5 text-[#8f7773]">{description}</span></span>
                {selected ? <Check className="size-4 text-[#e6817b]" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-7 rounded-[18px] border border-[#d6b787]/14 bg-[#d6b787]/[.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-[#efd8ad]"><ShieldCheck className="size-4" />Readable by design</p><p className="mt-2 text-[11px] leading-5 text-[#9f8985]">Clinical and operational text stays legible in both light and dark presentations. Theme changes never expose internal system terminology or backend controls.</p></div>
      </section>
    </div>
  );
}
