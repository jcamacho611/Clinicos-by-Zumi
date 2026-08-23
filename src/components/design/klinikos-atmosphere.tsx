"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Moon, Palette, Sparkles, Sun, X } from "lucide-react";
import {
  atmosphereForPreference,
  KLINIKOS_ATMOSPHERE_STORAGE_KEY,
  normalizeAtmospherePreference,
  type KlinikosAtmosphere,
  type KlinikosAtmospherePreference,
} from "@/lib/design/atmosphere";

const CHANGE_EVENT = "klinikos:atmosphere-change";

function applyAtmosphere(preference: KlinikosAtmospherePreference, referenceLocked: boolean) {
  const atmosphere = atmosphereForPreference(preference, new Date().getHours(), referenceLocked);
  document.documentElement.dataset.klinikosAtmosphere = atmosphere;
  document.documentElement.dataset.klinikosAtmospherePreference = preference;
  document.documentElement.style.colorScheme = atmosphere === "night" ? "dark" : "light";

  const surface = document.getElementById("klinikos-page-content");
  surface?.classList.toggle("grid-marble-surface", atmosphere !== "night");

  return atmosphere;
}

const options: Array<{
  value: KlinikosAtmospherePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  { value: "auto", label: "Auto", description: "Follow your local time while preserving Klinikos' authored atmosphere", icon: Sparkles },
  { value: "light", label: "Light", description: "Marble surfaces for sustained reading and operational work", icon: Sun },
  { value: "dark", label: "Dark", description: "Obsidian surfaces for the cinematic Klinikos experience", icon: Moon },
];

export function KlinikosAtmosphereController() {
  const pathname = usePathname();
  const referenceLocked = pathname === "/";
  const [preference, setPreference] = useState<KlinikosAtmospherePreference>("auto");
  const [atmosphere, setAtmosphere] = useState<KlinikosAtmosphere>("day");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY);
    const nextPreference = normalizeAtmospherePreference(stored);
    if (stored && stored !== nextPreference) {
      window.localStorage.setItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY, nextPreference);
    }
    setPreference(nextPreference);
    setAtmosphere(applyAtmosphere(nextPreference, referenceLocked));
  }, [referenceLocked]);

  useEffect(() => {
    const refresh = () => setAtmosphere(applyAtmosphere(preference, referenceLocked));
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [preference, referenceLocked]);

  const currentLabel = atmosphere === "night" ? "Dark" : "Light";

  function choose(next: KlinikosAtmospherePreference) {
    setPreference(next);
    window.localStorage.setItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY, next);
    const nextAtmosphere = applyAtmosphere(next, referenceLocked);
    setAtmosphere(nextAtmosphere);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { preference: next, atmosphere: nextAtmosphere } }));
  }

  if (pathname === "/") return null;

  return (
    <div className="k-atmosphere-control" data-open={open ? "true" : "false"}>
      {open ? (
        <div className="k-atmosphere-popover" role="dialog" aria-label="Appearance">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="k-kicker">Appearance</p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-.03em]">Light or dark</h2>
              <p className="k-muted mt-2 max-w-xs text-xs leading-5">
                Auto follows your local time. Light uses Klinikos Marble for sustained work; Dark uses the Obsidian experience.
              </p>
            </div>
            <button type="button" className="k-icon-button" onClick={() => setOpen(false)} aria-label="Close appearance settings">
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-6 divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
            {options.map((option) => {
              const Icon = option.icon;
              const selected = preference === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  className="flex w-full items-center gap-4 py-4 text-left"
                  onClick={() => choose(option.value)}
                  aria-pressed={selected}
                >
                  <span className="k-atmosphere-option-icon"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="k-muted mt-1 block text-[11px]">{option.description}</span>
                  </span>
                  {selected ? <Check className="size-4 text-[var(--k-accent)]" /> : null}
                </button>
              );
            })}
          </div>

          <p className="k-muted mt-5 text-[12px] leading-5">
            Current presentation: <span className="font-semibold text-[var(--k-text)]">{currentLabel}</span>. Appearance never changes permissions, safety rules, entitlements, or product behavior.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        className="k-atmosphere-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Open appearance settings"
        title="Appearance"
      >
        <Palette className="size-4" />
        <span className="hidden sm:inline">{preference === "auto" ? `Auto · ${currentLabel}` : currentLabel}</span>
      </button>
    </div>
  );
}
