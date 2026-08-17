export type PatientSearchRecord = {
  firstName: string;
  lastName: string;
  mrn: string;
  phone: string;
  email?: string | null;
  insurance: string;
  plan: string;
  memberId?: string | null;
  provider: string;
  location?: string | null;
  preferredLanguage?: string | null;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase();
}

export function patientMatchesQuery(patient: PatientSearchRecord, rawQuery: string) {
  const query = normalize(rawQuery);
  if (!query) return true;

  const searchable = [
    patient.firstName,
    patient.lastName,
    `${patient.firstName} ${patient.lastName}`,
    `${patient.lastName} ${patient.firstName}`,
    patient.mrn,
    patient.phone,
    patient.email,
    patient.insurance,
    patient.plan,
    patient.memberId,
    patient.provider,
    patient.location,
    patient.preferredLanguage,
  ].map(normalize);

  const terms = query.split(/\s+/).filter(Boolean);
  return terms.every((term) => searchable.some((value) => value.includes(term)));
}

export function filterPatientSearch<T extends PatientSearchRecord>(patients: readonly T[], query: string) {
  return patients.filter((patient) => patientMatchesQuery(patient, query));
}
