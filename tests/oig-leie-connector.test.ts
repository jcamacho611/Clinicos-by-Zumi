import { afterEach, describe, expect, it, vi } from "vitest";
import { screenOigLeieByNpi } from "@/lib/connectors/oig-leie";

afterEach(() => vi.restoreAllMocks());

describe("HHS OIG LEIE screening connector", () => {
  it("finds exact NPI candidates in the downloadable public file", async () => {
    const csv = [
      "LASTNAME,FIRSTNAME,MIDNAME,BUSNAME,GENERAL,SPECIALTY,UPIN,NPI,DOB,ADDRESS,CITY,STATE,ZIP,EXCLTYPE,EXCLDATE,REINDATE,WAIVERDATE,WAIVERSTATE",
      "DOE,JANE,,,NURSE,RN,,1234567890,,1 MAIN ST,BROOKLYN,NY,11201,1128a1,20260101,,,",
      "SMITH,JOHN,,,PHYSICIAN,MD,,9999999999,,2 MAIN ST,QUEENS,NY,11101,1128b4,20260102,,,",
    ].join("\n");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(csv, { status: 200, headers: { "content-type": "text/csv" } }));

    const result = await screenOigLeieByNpi("1234567890");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/oig\.hhs\.gov\/exclusions\/downloadables\/UPDATED\.csv/);
    expect(result.possibleMatches).toHaveLength(1);
    expect(result.possibleMatches[0]).toMatchObject({ firstName: "JANE", lastName: "DOE", npi: "1234567890", state: "NY", exclusionType: "1128a1" });
    expect(result.verificationNotice).toMatch(/not final identity verification/i);
  });

  it("returns a truthful no-match screening result rather than calling the person verified", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("LASTNAME,FIRSTNAME,NPI\nDOE,JANE,9999999999", { status: 200 }));
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
});