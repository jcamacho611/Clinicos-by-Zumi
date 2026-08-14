export function safeReturnTo(value: unknown) {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.length > 500 || /[\r\n\\]/.test(candidate)) return null;
  try {
    const parsed = new URL(candidate, "https://klinikos.local");
    if (parsed.origin !== "https://klinikos.local") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
