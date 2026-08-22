export const klinikosAtmospherePreferences = ["auto", "light", "dark"] as const;
export type KlinikosAtmospherePreference = (typeof klinikosAtmospherePreferences)[number];
export type KlinikosAtmosphere = "dawn" | "day" | "golden" | "night";

export const KLINIKOS_ATMOSPHERE_STORAGE_KEY = "klinikos-atmosphere";

export function atmosphereForLocalHour(hour: number): KlinikosAtmosphere {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "golden";
  return "night";
}

export function normalizeAtmospherePreference(value: string | null): KlinikosAtmospherePreference {
  if (value === "auto" || value === "light" || value === "dark") return value;
  const legacy = value === "night" ? "dark"
    : value === "dawn" || value === "day" || value === "golden" ? "light"
      : null;
  return legacy ?? "auto";
}

export function atmosphereForPreference(
  preference: KlinikosAtmospherePreference,
  hour: number,
  referenceLocked = false,
): KlinikosAtmosphere {
  if (referenceLocked) return "night";
  if (preference === "dark") return "night";
  if (preference === "light") return "day";
  return atmosphereForLocalHour(hour);
}

export const klinikosAtmosphereBootstrap = `(() => {
  try {
    const key = "${KLINIKOS_ATMOSPHERE_STORAGE_KEY}";
    const raw = localStorage.getItem(key);
    const preference = raw === "auto" || raw === "light" || raw === "dark"
      ? raw
      : raw === "night"
        ? "dark"
        : raw === "dawn" || raw === "day" || raw === "golden"
          ? "light"
          : "auto";
    if (raw && raw !== preference) localStorage.setItem(key, preference);
    const hour = new Date().getHours();
    const automatic = hour >= 5 && hour < 9
      ? "dawn"
      : hour >= 9 && hour < 17
        ? "day"
        : hour >= 17 && hour < 20
          ? "golden"
          : "night";
    const referenceLocked = location.pathname === "/";
    const atmosphere = referenceLocked
      ? "night"
      : preference === "dark"
        ? "night"
        : preference === "light"
          ? "day"
          : automatic;
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
