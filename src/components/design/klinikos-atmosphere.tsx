"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Monitor, Moon, Palette, Sun, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  appearancePolicyForPath,
  atmosphereForPresentation,
  KLINIKOS_ATMOSPHERE_STORAGE_KEY,
  normalizeAppearancePreference,
  type KlinikosAppearancePreference,
  type KlinikosAtmosphere,
} from "@/lib/design/atmosphere";
import { resolvePublicRoutePresentation } from "@/lib/screen-experience-route-presentation";

const CHANGE_EVENT = "klinikos:atmosphere-change";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

function applyAtmosphere(preference: KlinikosAppearancePreference, pathname: string) {
  const prefersDark = window.matchMedia(SYSTEM_QUERY).matches;
  const appearanceMode = resolvePublicRoutePresentation(pathname)?.appearanceMode;
  const atmosphere = atmosphereForPresentation(appearanceMode, preference, prefersDark);
  document.documentElement.dataset.klinikosAtmosphere = atmosphere;
  document.documentElement.dataset.klinikosAtmospherePreference = preference;
  document.documentElement.style.colorScheme = atmosphere === "night" ? "dark" : "light";

  const surface = document.getElementById("klinikos-page-content");
  surface?.classList.toggle("grid-marble-surface", atmosphere !== "night");

  return atmosphere;
}

const options: Array<{
  value: KlinikosAppearancePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  { value: "system", label: "System", description: "Follow your device light or dark preference", icon: Monitor },
  { value: "light", label: "Light", description: "Klinikos Marble for sustained reading and operational work", icon: Sun },
  { value: "dark", label: "Dark", description: "Klinikos Obsidian for the cinematic operating environment", icon: Moon },
];

/**
 * Keeps the document material aligned with the mounted route during client-side
 * navigation, including fixed/reference routes that intentionally have no
 * appearance control. This changes presentation only; authority is untouched.
 */
export function KlinikosAtmosphereRouteSync({ pathname }: { pathname: string }) {
  useEffect(() => {
    const media = window.matchMedia(SYSTEM_QUERY);
    const refresh = () => {
      const stored = window.localStorage.getItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY);
      const preference = normalizeAppearancePreference(stored);
      if (stored !== preference) {
        window.localStorage.setItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY, preference);
      }
      applyAtmosphere(preference, pathname);
    };

    refresh();
    media.addEventListener("change", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      media.removeEventListener("change", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [pathname]);

  return null;
}

export function KlinikosAtmosphereController({
  onOpenChange,
  open: controlledOpen,
}: {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
} = {}) {
  const pathname = usePathname();
  const appearancePolicy = appearancePolicyForPath(pathname);
  const [preference, setPreference] = useState<KlinikosAppearancePreference>("system");
  const [atmosphere, setAtmosphere] = useState<KlinikosAtmosphere>("day");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    const stored = window.localStorage.getItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY);
    const nextPreference = normalizeAppearancePreference(stored);
    if (stored !== nextPreference) {
      window.localStorage.setItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY, nextPreference);
    }
    setPreference(nextPreference);
    setAtmosphere(applyAtmosphere(nextPreference, pathname));
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia(SYSTEM_QUERY);
    const refresh = () => setAtmosphere(applyAtmosphere(preference, pathname));
    refresh();
    media.addEventListener("change", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      media.removeEventListener("change", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [pathname, preference]);

  const currentLabel = atmosphere === "night" ? "Dark" : "Light";

  function choose(next: KlinikosAppearancePreference) {
    setPreference(next);
    window.localStorage.setItem(KLINIKOS_ATMOSPHERE_STORAGE_KEY, next);
    const nextAtmosphere = applyAtmosphere(next, pathname);
    setAtmosphere(nextAtmosphere);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { preference: next, atmosphere: nextAtmosphere } }));
  }

  if (!appearancePolicy.controllerVisible) return null;

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby="klinikos-appearance-description"
          className="k-atmosphere-popover fixed bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4.25rem))] right-3 z-[100] max-h-[min(680px,calc(100dvh-6rem))] overflow-y-auto overscroll-contain sm:right-6"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            closeButtonRef.current?.focus();
          }}
        >
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="k-kicker">Appearance</p>
              <Dialog.Title className="mt-2 text-lg font-semibold tracking-[-.03em]">Marble or Obsidian</Dialog.Title>
              <Dialog.Description className="k-muted mt-2 max-w-xs text-xs leading-5" id="klinikos-appearance-description">System follows your device preference. Light uses warm Marble; Dark uses Obsidian.</Dialog.Description>
            </div>
            <Dialog.Close asChild><button ref={closeButtonRef} type="button" className="k-icon-button min-h-11 min-w-11" aria-label="Close appearance settings"><X className="size-4" /></button></Dialog.Close>
          </div>

          <div className="mt-6 divide-y divide-[var(--k-line)] border-y border-[var(--k-line)]">
            {options.map((option) => {
              const Icon = option.icon;
              const selected = preference === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  className="flex min-h-11 w-full items-center gap-4 py-4 text-left"
                  onClick={() => choose(option.value)}
                  aria-pressed={selected}
                >
                  <span className="k-atmosphere-option-icon"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="k-muted mt-1 block text-xs leading-5">{option.description}</span>
                  </span>
                  {selected ? <Check className="size-4 text-[var(--k-accent)]" /> : null}
                </button>
              );
            })}
          </div>

          <p className="k-muted mt-5 text-xs leading-5">Current presentation: <span className="font-semibold text-[var(--k-text)]">{currentLabel}</span>. Appearance never changes permissions, safety rules, entitlements, or product behavior.</p>
        </Dialog.Content>
      </Dialog.Portal>

      <Dialog.Trigger asChild>
        <button
          type="button"
          className="k-atmosphere-trigger min-h-11"
          aria-label="Open appearance settings"
          title="Appearance"
        >
          <Palette className="size-4" />
          <span className="hidden sm:inline">{preference === "system" ? `System · ${currentLabel}` : currentLabel}</span>
        </button>
      </Dialog.Trigger>
    </Dialog.Root>
  );
}
