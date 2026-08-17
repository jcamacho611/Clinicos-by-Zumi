import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupNppesByNpi, normalizeNpi } from "@/lib/connectors/nppes";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CMS NPPES connector", () => {
  it("normalizes a formatted 10-digit NPI", () => {
    expect(normalizeNpi("123-456-7890")).toBe("1234567890");
  });

  it("rejects invalid NPIs before any network request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(lookupNppesByNpi("12345")).rejects.toThrow(/10 digits/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads public NPI and taxonomy evidence without turning it into credential authority", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      result_count: 1,
      results: [{
        number: "1234567890",
        enumeration_type: "NPI-1",
        basic: {
          first_name: "Ada",
          last_name: "Lovelace",
          credential: "RN",
          status: "A",
          enumeration_date: "2020-01-01",
          last_updated: "2026-08-01",
        },
        taxonomies: [{
          code: "163W00000X",
          desc: "Registered Nurse",
          primary: true,
          state: "NY",
          license: "PUBLIC-EVIDENCE",
        }],
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const result = await lookupNppesByNpi("1234567890");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requested = String(fetchMock.mock.calls[0]?.[0]);
    expect(requested).toContain("version=2.1");
    expect(requested).toContain("number=1234567890");
    expect(result).toMatchObject({
      source: "CMS NPPES",
      npi: "1234567890",
      name: "Ada Lovelace",
      credential: "RN",
      taxonomies: [{ code: "163W00000X", description: "Registered Nurse", primary: true, state: "NY" }],
    });
    expect(result?.authorityNotice).toMatch(/does not establish professional licensure/i);
    expect(result).not.toHaveProperty("verified", true);
    expect(result).not.toHaveProperty("eligible", true);
  });

  it("returns null when CMS has no matching NPI record", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ result_count: 0, results: [] }), { status: 200 }));
    await expect(lookupNppesByNpi("1234567890")).resolves.toBeNull();
  });
});