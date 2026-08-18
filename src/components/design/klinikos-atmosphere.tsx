"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Moon, Palette, Sparkles, Sun, Sunrise, Sunset, X } from "lucide-react";
import {
  atmosphereForLocalHour,
  KLINIKOS_ATMOSPHERE_STORAGE_KEY,
  klinikosAtmospherePreferences,
  type KlinikosAtmosphere,
  type KlinikosAtmospherePreference,
} from "@/lib/design/atmosphere";

const CHANGE_EVENT = "klinikos:atmosphere-change";

function isPreference(value: string | null): value is KlinikosAtmospherePreference {
  return Boolean(value && klinikosAtmospherePreferences.includes(value as KlinikosAtmospherePreference));
}

function resolvedAtmosphere(preference: KlinikosAtmospherePreference) {
  return preference === "auto" ? atmosphereForLocalHour(new Date().getHours()) : preference;
}

function applyAtmosphere(preference: KlinikosAtmospherePreference) {
  const atmosphere = resolvedAtmosphere(preference);
  document.documentElement.dataset.klinikosAtmosphere = atmosphere;
  document.documentElement.dataset.klinikosAtmospherePreference = preference;
  document.documentElement.style.colorScheme = atmosphere === "night" ? "dark" : "light";
  return atmosphere;
}

const options: Array<{
  value: KlinikosAtmospherePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  { value: "auto", label: "Auto", description: "Shift with your local time", icon: Sparkles },
  { value: "dawn", label: "Dawn", description: "Soft sky + limestone", icon: Sunrise },
  { value: "day", label: "Day", description: "Bright Aegean daylight", icon: Sun },
  { value: "golden", label: "Golden hour", description: "Warm stone + late sun", icon: Sunset },
  { value: "night", label: "Night", description: "Deep Aegean + moonlight", icon: Moon },
];

export function KlinikosAtmosphereController() {
  const pathname = usePathname();
  const [preference, setPreference] = useState<KlinikosAtmospherePreference>("auto");
  const [atmosphere, setAtmosphere] = useState<KlinikosAtmosphere>("day");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY);
    const nextPreference = isPreference(stored) ? stored : "auto";
    setPreference(nextPreference);
    setAtmosphere(applyAtmosphere(nextPreference));
  }, []);

  useEffect(() => {
    const refresh = () => setAtmosphere(applyAtmosphere(preference));
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [preference]);

  const currentLabel = useMemo(() => options.find((item) => item.value === atmosphere)?.label ?? atmosphere, [atmosphere]);

  function choose(next: KlinikosAtmospherePreference) {
    setPreference(next);
    window.localStorage.setItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY, next);
    const nextAtmosphere = applyAtmosphere(next);
    setAtmosphere(nextAtmosphere);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { preference: next, atmosphere: nextAtmosphere } }));
  }

  if (pathname === "/") return null;

  return (
    <div className="k-atmosphere-control" data-open={open ? "true" : "false"}>
      {open ? (
        <div className="k-atmosphere-popover" role="dialog" aria-label="Appearance and atmosphere">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="k-kicker">Appearance</p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-.03em]">Atmosphere</h2>
              <p className="k-muted mt-2 max-w-xs text-xs leading-5">Auto follows your device local time. Lock any atmosphere whenever you want.</p>
            </div>
            <button type="button" className="k-icon-button" onClick={() => setOpen(false)} aria-label="Close appearance settings"><X className="size-4" /></button>
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

          <p className="k-muted mt-5 text-[12px] leading-5">Current atmosphere: <span className="font-semibold text-[var(--k-text)]">{currentLabel}</span>. This changes presentation only. Permissions, safety rules, and product behavior do not change.</p>
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
