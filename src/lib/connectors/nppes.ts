import "server-only";

import { connectorTimeoutSignal, readBoundedResponseText } from "@/lib/connectors/http-guardrails";

const NPPES_ENDPOINT = "https://npiregistry.cms.hhs.gov/api/";
const NPPES_VERSION = "2.1";
const NPPES_MAX_RESPONSE_BYTES = 512 * 1024;

export type NppesTaxonomy = {
  code: string | null;
  description: string | null;
  primary: boolean;
  state: string | null;
  license: string | null;
};

export type NppesLookupResult = {
  source: "CMS NPPES";
  sourceVersion: "2.1";
  npi: string;
  enumerationType: string | null;
  status: string | null;
  name: string;
  credential: string | null;
  lastUpdated: string | null;
  enumerationDate: string | null;
  taxonomies: NppesTaxonomy[];
  authorityNotice: string;
};

type NppesPayload = {
  result_count?: unknown;
  results?: unknown;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function providerName(result: JsonRecord) {
  const basic = asRecord(result.basic) ?? {};
  const organizationName = asString(basic.organization_name);
  if (organizationName) return organizationName;
  const first = asString(basic.first_name);
  const middle = asString(basic.middle_name);
  const last = asString(basic.last_name);
  return [first, middle, last].filter(Boolean).join(" ") || "NPPES record";
}

function normalizeTaxonomies(value: unknown): NppesTaxonomy[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).flatMap((entry) => {
    const taxonomy = asRecord(entry);
    if (!taxonomy) return [];
    return [{
      code: asString(taxonomy.code),
      description: asString(taxonomy.desc),
      primary: taxonomy.primary === true,
      state: asString(taxonomy.state),
      license: asString(taxonomy.license),
    }];
  });
}

export function normalizeNpi(value: string) {
  const npi = value.replace(/\D/g, "");
  if (!/^\d{10}$/.test(npi)) throw new Error("NPI must contain exactly 10 digits.");
  return npi;
}

export async function lookupNppesByNpi(rawNpi: string): Promise<NppesLookupResult | null> {
  const npi = normalizeNpi(rawNpi);
  const url = new URL(NPPES_ENDPOINT);
  url.searchParams.set("version", NPPES_VERSION);
  url.searchParams.set("number", npi);

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 86_400 },
    signal: connectorTimeoutSignal(),
  });
  if (!response.ok) throw new Error(`CMS NPPES returned HTTP ${response.status}.`);

  const text = await readBoundedResponseText(response, NPPES_MAX_RESPONSE_BYTES, "CMS NPPES");
  let payload: NppesPayload;
  try {
    payload = JSON.parse(text) as NppesPayload;
  } catch {
    throw new Error("CMS NPPES returned an invalid JSON response.");
  }
  const results = Array.isArray(payload.results) ? payload.results : [];
  const first = results
    .slice(0, 10)
    .map(asRecord)
    .find((result) => result && asString(result.number) === npi) ?? null;
  if (!first) return null;

  const basic = asRecord(first.basic) ?? {};
  return {
    source: "CMS NPPES",
    sourceVersion: NPPES_VERSION,
    npi: asString(first.number) ?? npi,
    enumerationType: asString(first.enumeration_type),
    status: asString(basic.status),
    name: providerName(first),
    credential: asString(basic.credential),
    lastUpdated: asString(basic.last_updated),
    enumerationDate: asString(basic.enumeration_date),
    taxonomies: normalizeTaxonomies(first.taxonomies),
    authorityNotice: "NPPES is public NPI/taxonomy evidence. An NPI record does not establish professional licensure, credentialing, scope, privileges, malpractice coverage, or eligibility for a Klinikos opportunity.",
  };
}
