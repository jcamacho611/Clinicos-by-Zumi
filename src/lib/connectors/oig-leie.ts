import "server-only";

import { connectorTimeoutSignal, readBoundedResponseText } from "@/lib/connectors/http-guardrails";

const LEIE_DATABASE_URL = "https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv";
const LEIE_MAX_RESPONSE_BYTES = 20 * 1024 * 1024;
const LEIE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type OigLeieCandidate = OigLeieScreeningResult["possibleMatches"][number];

type OigLeieDatasetCache = {
  expiresAtMs: number;
  sourceUpdatedAt: string | null;
  byNpi: Map<string, OigLeieCandidate[]>;
};

let datasetCache: OigLeieDatasetCache | null = null;
let datasetLoad: Promise<OigLeieDatasetCache> | null = null;

export type OigLeieScreeningResult = {
  source: "HHS OIG LEIE";
  queryNpi: string;
  possibleMatches: Array<{
    lastName: string | null;
    firstName: string | null;
    businessName: string | null;
    general: string | null;
    specialty: string | null;
    npi: string | null;
    state: string | null;
    exclusionType: string | null;
    exclusionDate: string | null;
  }>;
  screenedAt: string;
  sourceUpdatedAt: string | null;
  verificationNotice: string;
};

function normalizeNpi(value: string) {
  const npi = value.replace(/\D/g, "");
  if (!/^\d{10}$/.test(npi)) throw new Error("NPI must contain exactly 10 digits.");
  return npi;
}

function visitCsvRows(text: string, visit: (row: string[]) => void) {
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (character === "," && !quoted) {
      row.push(field.trim());
      field = "";
      continue;
    }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim());
      field = "";
      if (row.some((value) => value.length > 0)) visit(row);
      row = [];
      continue;
    }
    field += character;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((value) => value.length > 0)) visit(row);
  }
}

function cleanHeader(value: string) {
  return value.replace(/^\uFEFF/, "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function nullable(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function fieldIndex(headers: string[], ...candidates: string[]) {
  const normalized = headers.map(cleanHeader);
  for (const candidate of candidates) {
    const index = normalized.indexOf(cleanHeader(candidate));
    if (index >= 0) return index;
  }
  return -1;
}

function normalizedSourceDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildDatasetIndex(text: string) {
  let headers: string[] | null = null;
  let indexes: ReturnType<typeof resolveIndexes> | null = null;
  const byNpi = new Map<string, OigLeieCandidate[]>();

  visitCsvRows(text, (row) => {
    if (!headers) {
      headers = row;
      indexes = resolveIndexes(row);
      return;
    }
    if (!indexes) return;
    const rowNpi = (row[indexes.npi] ?? "").replace(/\D/g, "");
    if (!/^\d{10}$/.test(rowNpi)) return;
    const matches = byNpi.get(rowNpi) ?? [];
    if (matches.length >= 20) return;
    matches.push({
      lastName: indexes.lastName >= 0 ? nullable(row[indexes.lastName]) : null,
      firstName: indexes.firstName >= 0 ? nullable(row[indexes.firstName]) : null,
      businessName: indexes.businessName >= 0 ? nullable(row[indexes.businessName]) : null,
      general: indexes.general >= 0 ? nullable(row[indexes.general]) : null,
      specialty: indexes.specialty >= 0 ? nullable(row[indexes.specialty]) : null,
      npi: nullable(row[indexes.npi]),
      state: indexes.state >= 0 ? nullable(row[indexes.state]) : null,
      exclusionType: indexes.type >= 0 ? nullable(row[indexes.type]) : null,
      exclusionDate: indexes.date >= 0 ? nullable(row[indexes.date]) : null,
    });
    byNpi.set(rowNpi, matches);
  });

  if (!headers || !indexes) throw new Error("HHS OIG LEIE file did not contain a header row.");
  return byNpi;
}

function resolveIndexes(headers: string[]) {
  const npi = fieldIndex(headers, "NPI");
  if (npi < 0) throw new Error("HHS OIG LEIE file did not contain the expected NPI column.");
  return {
    npi,
    lastName: fieldIndex(headers, "LASTNAME", "LAST NAME"),
    firstName: fieldIndex(headers, "FIRSTNAME", "FIRST NAME"),
    businessName: fieldIndex(headers, "BUSNAME", "BUSINESS NAME"),
    general: fieldIndex(headers, "GENERAL"),
    specialty: fieldIndex(headers, "SPECIALTY"),
    state: fieldIndex(headers, "STATE"),
    type: fieldIndex(headers, "EXCLTYPE", "EXCLUSION TYPE"),
    date: fieldIndex(headers, "EXCLDATE", "EXCLUSION DATE"),
  };
}

async function loadDataset() {
  const now = Date.now();
  if (datasetCache && datasetCache.expiresAtMs > now) return datasetCache;
  if (datasetLoad) return datasetLoad;

  datasetLoad = (async () => {
    const response = await fetch(LEIE_DATABASE_URL, {
      headers: { accept: "text/csv" },
      next: { revalidate: 86_400 },
      signal: connectorTimeoutSignal(),
    });
    if (!response.ok) throw new Error(`HHS OIG LEIE returned HTTP ${response.status}.`);

    const text = await readBoundedResponseText(response, LEIE_MAX_RESPONSE_BYTES, "HHS OIG LEIE");
    const loaded = {
      expiresAtMs: now + LEIE_CACHE_TTL_MS,
      sourceUpdatedAt: normalizedSourceDate(response.headers.get("last-modified")),
      byNpi: buildDatasetIndex(text),
    };
    datasetCache = loaded;
    return loaded;
  })();

  try {
    return await datasetLoad;
  } finally {
    datasetLoad = null;
  }
}

export function clearOigLeieDatasetCache() {
  datasetCache = null;
  datasetLoad = null;
}

export async function screenOigLeieByNpi(rawNpi: string): Promise<OigLeieScreeningResult> {
  const npi = normalizeNpi(rawNpi);
  const dataset = await loadDataset();

  return {
    source: "HHS OIG LEIE",
    queryNpi: npi,
    possibleMatches: dataset.byNpi.get(npi) ?? [],
    screenedAt: new Date().toISOString(),
    sourceUpdatedAt: dataset.sourceUpdatedAt,
    verificationNotice: "The downloadable LEIE is a preliminary exact-NPI screening source, not final identity verification, and it does not provide exclusion clearance. Every result requires documented human review and the OIG online verification process where appropriate. A no-candidate result does not establish licensure, credentialing, privileges, scope, or Grid eligibility.",
  };
}
