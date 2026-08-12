export type SourceAuthorityTier = "primary" | "authoritative" | "professional" | "secondary" | "unknown";

const PRIMARY_SUFFIXES = [".gov", ".mil"];
const AUTHORITATIVE_DOMAINS = new Set([
  "hl7.org",
  "fhir.org",
  "loinc.org",
  "snomed.org",
  "dicomstandard.org",
  "rfc-editor.org",
  "ietf.org",
  "w3.org",
  "owasp.org",
  "postgresql.org",
  "openid.net",
]);

const PROFESSIONAL_DOMAINS = new Set([
  "ama-assn.org",
  "aha.org",
  "ahrq.gov",
  "nih.gov",
  "cdc.gov",
  "fda.gov",
]);

function hostname(url: string) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

export function classifySourceAuthority(url: string): SourceAuthorityTier {
  const host = hostname(url);
  if (!host) return "unknown";
  if (PRIMARY_SUFFIXES.some((suffix) => host.endsWith(suffix))) return "primary";
  if (AUTHORITATIVE_DOMAINS.has(host) || [...AUTHORITATIVE_DOMAINS].some((domain) => host.endsWith(`.${domain}`))) return "authoritative";
  if (PROFESSIONAL_DOMAINS.has(host) || [...PROFESSIONAL_DOMAINS].some((domain) => host.endsWith(`.${domain}`))) return "professional";
  if (host.endsWith(".edu")) return "professional";
  return "secondary";
}

const AUTHORITY_SCORE: Record<SourceAuthorityTier, number> = {
  primary: 1,
  authoritative: 0.95,
  professional: 0.85,
  secondary: 0.55,
  unknown: 0.25,
};

export type EvidenceQuality = {
  score: number;
  authorityScore: number;
  diversityScore: number;
  domains: string[];
  tiers: Record<SourceAuthorityTier, number>;
};

export function assessEvidenceQuality(urls: readonly string[]): EvidenceQuality {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const domains = [...new Set(uniqueUrls.map(hostname).filter(Boolean))];
  const tiers: Record<SourceAuthorityTier, number> = { primary: 0, authoritative: 0, professional: 0, secondary: 0, unknown: 0 };
  let authorityTotal = 0;

  for (const url of uniqueUrls) {
    const tier = classifySourceAuthority(url);
    tiers[tier] += 1;
    authorityTotal += AUTHORITY_SCORE[tier];
  }

  const authorityScore = uniqueUrls.length ? authorityTotal / uniqueUrls.length : 0;
  const diversityScore = Math.min(1, domains.length / 4);
  return {
    score: Number((authorityScore * 0.75 + diversityScore * 0.25).toFixed(4)),
    authorityScore: Number(authorityScore.toFixed(4)),
    diversityScore: Number(diversityScore.toFixed(4)),
    domains,
    tiers,
  };
}
