"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Person, StatusBadge } from "@/components/clinic/workspace-kit";
import { filterPatientSearch } from "@/lib/patient-search";
import type { Patient } from "@/lib/types";

export function PatientListSearch({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState("");
  const filteredPatients = useMemo(() => filterPatientSearch(patients, query), [patients, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-50">
          <Search className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="sr-only">Search patients</span>
          <input
            aria-describedby="patient-search-result-count"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, MRN, phone, payer..."
            type="search"
            value={query}
          />
          {hasQuery ? (
            <button
              aria-label="Clear patient search"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              onClick={() => setQuery("")}
              type="button"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </label>
        <p className="text-[10px] font-bold text-slate-400" id="patient-search-result-count" aria-live="polite">
          {hasQuery ? `${filteredPatients.length} of ${patients.length} patients` : `${patients.length} patients`}
        </p>
      </div>

      {filteredPatients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[9px] font-extrabold uppercase tracking-[.14em] text-slate-400">
                <th className="px-5 py-3">Patient</th>
                <th className="px-3 py-3">DOB / MRN</th>
                <th className="px-3 py-3">Coverage</th>
                <th className="px-3 py-3">Care team</th>
                <th className="px-3 py-3">Next step</th>
                <th className="px-3 py-3">Balance</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr className="border-b border-slate-100 text-xs transition last:border-0 hover:bg-slate-50/70" key={patient.id}>
                  <td className="px-5 py-4">
                    <Link href={`/patients/${patient.id}`}>
                      <Person
                        color={patient.riskLevel === "Urgent" ? "rose" : patient.riskLevel === "Needs Provider" ? "amber" : "teal"}
                        detail={`${patient.phone} · ${patient.preferredLanguage}`}
                        initials={patient.initials}
                        name={`${patient.firstName} ${patient.lastName}`}
                      />
                    </Link>
                  </td>
                  <td className="px-3 py-4"><p className="font-bold text-slate-700">{patient.dob}</p><p className="mt-1 text-[10px] text-slate-400">{patient.mrn}</p></td>
                  <td className="px-3 py-4"><p className="font-bold text-slate-700">{patient.insurance}</p><p className="mt-1 text-[10px] text-slate-400">{patient.plan}</p></td>
                  <td className="px-3 py-4 text-slate-600">{patient.provider}</td>
                  <td className="px-3 py-4"><p className="font-bold text-slate-700">{patient.nextAppointment}</p><p className="mt-1 text-[10px] text-slate-400">Last: {patient.lastVisit}</p></td>
                  <td className="px-3 py-4 font-extrabold text-slate-900">${patient.balance}</td>
                  <td className="px-5 py-4"><StatusBadge status={patient.riskLevel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-extrabold text-slate-800">No patients match this search.</p>
          <p className="mt-2 text-xs text-slate-500">Try a name, MRN, phone number, payer, plan, provider, location, language, or member ID.</p>
          <button className="mt-4 text-xs font-extrabold text-sky-700 hover:text-sky-900" onClick={() => setQuery("")} type="button">Clear search</button>
        </div>
      )}
    </Card>
  );
}
