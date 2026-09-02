import {
  publicAppearanceBootstrapRules,
  resolvePublicRoutePresentation,
  type PublicAppearanceMode,
} from "@/lib/screen-experience-route-presentation";

export const klinikosAppearancePreferences = ["system", "light", "dark"] as const;
export type KlinikosAppearancePreference = (typeof klinikosAppearancePreferences)[number];
export type KlinikosAtmosphere = "dawn" | "day" | "golden" | "night";

/** Compatibility alias while existing consumers converge on the Black Label naming. */
export type KlinikosAtmospherePreference = KlinikosAppearancePreference;

export const KLINIKOS_ATMOSPHERE_STORAGE_KEY = "klinikos-atmosphere";

export type KlinikosAppearancePolicy = {
  controllerVisible: boolean;
  referenceLocked: boolean;
  resolvedBy: "reference" | "user-preference" | "route";
};

/**
 * Adaptive surfaces honor the person's theme. Reference-locked and still-route-owned
 * legacy surfaces declare the material they actually render, so the global control
 * never promises an appearance change that the mounted page cannot yet deliver.
 */
export function appearancePolicyForPath(pathname: string): KlinikosAppearancePolicy {
  const mode = resolvePublicRoutePresentation(pathname)?.appearanceMode;
  const referenceLocked = mode === "reference-obsidian";
  return {
    controllerVisible: mode === "adaptive",
    referenceLocked,
    resolvedBy: referenceLocked ? "reference" : mode === "adaptive" ? "user-preference" : "route",
  };
}

export function atmosphereForLocalHour(hour: number): KlinikosAtmosphere {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "golden";
  return "night";
}

export function normalizeAppearancePreference(value: string | null): KlinikosAppearancePreference {
  if (value === "system" || value === "light" || value === "dark") return value;
  if (value === "night") return "dark";
  if (value === "dawn" || value === "day" || value === "golden") return "light";
  if (value === "auto") return "system";
  return "system";
}

export function atmosphereForAppearance(
  preference: KlinikosAppearancePreference,
  prefersDark: boolean,
  referenceLocked = false,
): KlinikosAtmosphere {
  if (referenceLocked) return "night";
  if (preference === "dark") return "night";
  if (preference === "light") return "day";
  return prefersDark ? "night" : "day";
}

export function atmosphereForPresentation(
  mode: PublicAppearanceMode | undefined,
  preference: KlinikosAppearancePreference,
  prefersDark: boolean,
): KlinikosAtmosphere {
  if (mode === "fixed-marble") return "day";
  if (mode === "reference-obsidian" || mode === "fixed-obsidian") return "night";
  return atmosphereForAppearance(preference, prefersDark);
}

export const klinikosAtmosphereBootstrap = `(() => {
  try {
    const key = "${KLINIKOS_ATMOSPHERE_STORAGE_KEY}";
    const raw = localStorage.getItem(key);
    const preference = raw === "system" || raw === "light" || raw === "dark"
      ? raw
      : raw === "night"
        ? "dark"
        : raw === "dawn" || raw === "day" || raw === "golden"
          ? "light"
          : raw === "auto"
            ? "system"
            : "system";
    if (raw && raw !== preference) localStorage.setItem(key, preference);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const rules = ${JSON.stringify(publicAppearanceBootstrapRules)};
    const pathname = location.pathname.length > 1 ? location.pathname.replace(/\\/+$/, "") : location.pathname;
    const routeRule = rules.find((rule) => rule.match === "exact"
      ? pathname === rule.pathname
      : rule.match === "children"
        ? pathname.startsWith(rule.pathname + "/")
        : pathname === rule.pathname || pathname.startsWith(rule.pathname + "/"));
    const appearanceMode = routeRule?.appearanceMode;
    const atmosphere = appearanceMode === "fixed-marble"
      ? "day"
      : appearanceMode === "reference-obsidian" || appearanceMode === "fixed-obsidian"
        ? "night"
        : preference === "dark"
        ? "night"
        : preference === "light"
          ? "day"
          : prefersDark
            ? "night"
            : "day";
    const applySurface = () => {
      const surface = document.getElementById("klinikos-page-content");
      if (!surface) return false;
      surface.classList.toggle("grid-marble-surface", atmosphere !== "night");
      return true;
    };
    document.documentElement.dataset.klinikosAtmosphere = atmosphere;
    document.documentElement.dataset.klinikosAtmospherePreference = preference;
    document.documentElement.style.colorScheme = atmosphere === "night" ? "dark" : "light";
    if (!applySurface()) {
      const observer = new MutationObserver(() => {
        if (applySurface()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  } catch (_) {}
})();`;
