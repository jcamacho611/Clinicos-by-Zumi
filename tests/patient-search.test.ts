import { describe, expect, it } from "vitest";
import { filterPatientSearch, patientMatchesQuery, type PatientSearchRecord } from "@/lib/patient-search";

const patients: PatientSearchRecord[] = [
  {
    firstName: "Maya",
    lastName: "Thompson",
    mrn: "MRN-1001",
    phone: "212-555-0101",
    email: "maya@example.test",
    insurance: "Metro Health",
    plan: "Gold PPO",
    memberId: "MEM-101",
    provider: "Nadja R., NP",
    location: "Brooklyn",
    preferredLanguage: "English",
  },
  {
    firstName: "Darius",
    lastName: "Coleman",
    mrn: "MRN-2002",
    phone: "718-555-0202",
    email: "darius@example.test",
    insurance: "Empire Care",
    plan: "Essential HMO",
    memberId: "MEM-202",
    provider: "Dr. Samuel Lee",
    location: "Queens",
    preferredLanguage: "Spanish",
  },
];

describe("patient index search", () => {
  it("returns every tenant-scoped patient when search is empty", () => {
    expect(filterPatientSearch(patients, "")).toHaveLength(2);
  });

  it("matches common patient-index identifiers and coverage fields", () => {
    expect(filterPatientSearch(patients, "MRN-2002")).toEqual([patients[1]]);
    expect(filterPatientSearch(patients, "212-555")).toEqual([patients[0]]);
    expect(filterPatientSearch(patients, "Gold PPO")).toEqual([patients[0]]);
    expect(filterPatientSearch(patients, "MEM-202")).toEqual([patients[1]]);
  });

  it("supports case-insensitive multi-term searches without broadening tenant scope", () => {
    expect(filterPatientSearch(patients, "maya metro")).toEqual([patients[0]]);
    expect(filterPatientSearch(patients, "DARIUS spanish")).toEqual([patients[1]]);
  });

  it("does not match unrelated records", () => {
    expect(patientMatchesQuery(patients[0], "Queens HMO")).toBe(false);
    expect(filterPatientSearch(patients, "not-a-patient")).toEqual([]);
  });
});
