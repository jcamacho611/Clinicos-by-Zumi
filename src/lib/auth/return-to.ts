import { klinikosPathCatalog } from "@/lib/paths/catalog";

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

export function safeMemberReturnTo(value: unknown) {
  const candidate = safeReturnTo(value);
  if (!candidate) return null;

  const parsed = new URL(candidate, "https://klinikos.local");
  if (parsed.pathname !== "/member" || parsed.hash) return null;

  const keys = Array.from(parsed.searchParams.keys());
  if (keys.length === 0) return "/member";
  if (keys.length !== 1 || keys[0] !== "path") return null;

  const pathIds = parsed.searchParams.getAll("path");
  if (pathIds.length !== 1) return null;

  const pathId = pathIds[0];
  if (!klinikosPathCatalog.some((path) => path.id === pathId)) return null;

  return `/member?path=${encodeURIComponent(pathId)}`;
}

export function safePersonReturnTo(value: unknown) {
  const candidate = safeReturnTo(value);
  if (!candidate) return null;
  const pathname = new URL(candidate, "https://klinikos.local").pathname;
  if (pathname === "/member") return safeMemberReturnTo(candidate);
  return pathname === "/grid" || pathname === "/edu" ? candidate : null;
}

export function safeClinicReturnTo(value: unknown) {
  const candidate = safeReturnTo(value);
  if (!candidate) return null;
  const pathname = new URL(candidate, "https://klinikos.local").pathname;
  if (pathname === "/member" || pathname === "/signup" || pathname === "/login") return null;
  return candidate;
}
