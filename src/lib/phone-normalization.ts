export function normalizeKlinikosPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/[^0-9]/g, "");
    const normalized = `+${digits}`;
    return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
  }

  // Klinikos is currently US-first. A bare 10-digit value is safe to normalize to +1.
  // Other countries must be supplied explicitly in E.164 form rather than guessed.
  const digits = trimmed.replace(/[^0-9]/g, "");
  return /^\d{10}$/.test(digits) ? `+1${digits}` : null;
}
