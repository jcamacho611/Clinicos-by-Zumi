import "server-only";

const LEIE_DATABASE_URL = "https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv";

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
  verificationNotice: string;
};

function normalizeNpi(value: string) {
  const npi = value.replace(/\D/g, "");
  if (!/^\d{10}$/.test(npi)) throw new Error("NPI must contain exactly 10 digits.");
  return npi;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
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
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      continue;
    }
    field += character;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
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

export async function screenOigLeieByNpi(rawNpi: string): Promise<OigLeieScreeningResult> {
  const npi = normalizeNpi(rawNpi);
  const response = await fetch(LEIE_DATABASE_URL, {
    headers: { accept: "text/csv" },
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`HHS OIG LEIE returned HTTP ${response.status}.`);

  const rows = parseCsv(await response.text());
  const headers = rows.shift() ?? [];
  const npiIndex = fieldIndex(headers, "NPI");
  if (npiIndex < 0) throw new Error("HHS OIG LEIE file did not contain the expected NPI column.");

  const lastNameIndex = fieldIndex(headers, "LASTNAME", "LAST NAME");
  const firstNameIndex = fieldIndex(headers, "FIRSTNAME", "FIRST NAME");
  const businessNameIndex = fieldIndex(headers, "BUSNAME", "BUSINESS NAME");
  const generalIndex = fieldIndex(headers, "GENERAL");
  const specialtyIndex = fieldIndex(headers, "SPECIALTY");
  const stateIndex = fieldIndex(headers, "STATE");
  const typeIndex = fieldIndex(headers, "EXCLTYPE", "EXCLUSION TYPE");
  const dateIndex = fieldIndex(headers, "EXCLDATE", "EXCLUSION DATE");

  const possibleMatches = rows
    .filter((row) => (row[npiIndex] ?? "").replace(/\D/g, "") === npi)
    .slice(0, 20)
    .map((row) => ({
      lastName: lastNameIndex >= 0 ? nullable(row[lastNameIndex]) : null,
      firstName: firstNameIndex >= 0 ? nullable(row[firstNameIndex]) : null,
      businessName: businessNameIndex >= 0 ? nullable(row[businessNameIndex]) : null,
      general: generalIndex >= 0 ? nullable(row[generalIndex]) : null,
      specialty: specialtyIndex >= 0 ? nullable(row[specialtyIndex]) : null,
      npi: nullable(row[npiIndex]),
      state: stateIndex >= 0 ? nullable(row[stateIndex]) : null,
      exclusionType: typeIndex >= 0 ? nullable(row[typeIndex]) : null,
      exclusionDate: dateIndex >= 0 ? nullable(row[dateIndex]) : null,
    }));

  return {
    source: "HHS OIG LEIE",
    queryNpi: npi,
    possibleMatches,
    screenedAt: new Date().toISOString(),
    verificationNotice: "The downloadable LEIE is a free screening source, not final identity verification. A possible match requires authorized human review and the OIG online verification process where appropriate. No-match screening alone does not establish licensure, credentialing, privileges, scope, or Grid eligibility.",
  };
}