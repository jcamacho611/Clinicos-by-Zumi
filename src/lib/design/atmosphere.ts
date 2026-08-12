export const klinikosAtmospherePreferences = ["auto", "dawn", "day", "golden", "night"] as const;
export type KlinikosAtmospherePreference = (typeof klinikosAtmospherePreferences)[number];
export type KlinikosAtmosphere = Exclude<KlinikosAtmospherePreference, "auto">;

export const KLINIKOS_ATMOSPHERE_STORAGE_KEY = "klinikos-atmosphere";

export function atmosphereForLocalHour(hour: number): KlinikosAtmosphere {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "golden";
  return "night";
}

export const klinikosAtmosphereBootstrap = `(() => { try { const key = "${KLINIKOS_ATMOSPHERE_STORAGE_KEY}"; const values = ${JSON.stringify(klinikosAtmospherePreferences)}; const stored = localStorage.getItem(key); const preference = values.includes(stored) ? stored : "auto"; const hour = new Date().getHours(); const automatic = hour >= 5 && hour < 9 ? "dawn" : hour >= 9 && hour < 17 ? "day" : hour >= 17 && hour < 20 ? "golden" : "night"; const atmosphere = preference === "auto" ? automatic : preference; document.documentElement.dataset.klinikosAtmosphere = atmosphere; document.documentElement.dataset.klinikosAtmospherePreference = preference; document.documentElement.style.colorScheme = atmosphere === "night" ? "dark" : "light"; } catch (_) {} })();`;
