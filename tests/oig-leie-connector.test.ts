import { afterEach, describe, expect, it, vi } from "vitest";
import { clearOigLeieDatasetCache, screenOigLeieByNpi } from "@/lib/connectors/oig-leie";

afterEach(() => {
  clearOigLeieDatasetCache();
  vi.restoreAllMocks();
});

describe("HHS OIG LEIE screening connector", () => {
  it("finds exact NPI candidates in the downloadable public file", async () => {
    const csv = [
      "LASTNAME,FIRSTNAME,MIDNAME,BUSNAME,GENERAL,SPECIALTY,UPIN,NPI,DOB,ADDRESS,CITY,STATE,ZIP,EXCLTYPE,EXCLDATE,REINDATE,WAIVERDATE,WAIVERSTATE",
      "PROVIDER,SAMPLE,,,CLINICAL,LICENSED,,1234567890,,1 SAMPLE ST,BROOKLYN,NY,11201,1128a1,20260101,,,",
      "ORGANIZATION,,,,BUSINESS,SERVICE,,9999999999,,2 SAMPLE ST,QUEENS,NY,11101,1128b4,20260102,,,",
    ].join("\n");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(csv, { status: 200, headers: { "content-type": "text/csv", "last-modified": "Mon, 10 Aug 2026 12:00:00 GMT" } }));

    const result = await screenOigLeieByNpi("1234567890");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/oig\.hhs\.gov\/exclusions\/downloadables\/UPDATED\.csv/);
    expect(result.possibleMatches).toHaveLength(1);
    expect(result.possibleMatches[0]).toMatchObject({ firstName: "SAMPLE", lastName: "PROVIDER", npi: "1234567890", state: "NY", exclusionType: "1128a1" });
    expect(result.sourceUpdatedAt).toBe("2026-08-10T12:00:00.000Z");
    expect(result.verificationNotice).toMatch(/not final identity verification/i);
  });

  it("returns a truthful no-match screening result rather than calling the person verified", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("LASTNAME,FIRSTNAME,NPI\nPROVIDER,SAMPLE,9999999999", { status: 200 }));
    const result = await screenOigLeieByNpi("1234567890");
    expect(result.possibleMatches).toEqual([]);
    expect(result).not.toHaveProperty("verified", true);
    expect(result).not.toHaveProperty("eligible", true);
  });

  it("rejects malformed NPIs before downloading the database", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(screenOigLeieByNpi("123")).rejects.toThrow(/10 digits/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reuses the parsed dataset index within the cache window", async () => {
    const csv = "LASTNAME,FIRSTNAME,NPI\nPROVIDER,SAMPLE,1234567890\nORGANIZATION,,9999999999";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(csv, { status: 200 }));

    await screenOigLeieByNpi("1234567890");
    await screenOigLeieByNpi("9999999999");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a declared dataset larger than the configured safety limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("LASTNAME,FIRSTNAME,NPI", {
      status: 200,
      headers: { "content-length": String(20 * 1024 * 1024 + 1) },
    }));
    await expect(screenOigLeieByNpi("1234567890")).rejects.toThrow(/safety limit/i);
  });
});
