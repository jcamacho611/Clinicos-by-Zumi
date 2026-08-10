import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { PatientCreateForm } from "@/components/clinic/patient-create-form";

export default async function NewPatientPage() {
  const session = await getClinicSession();
  if (!session) redirect("/login");
  if (!can(session.role, "patients", "create")) redirect("/patients");
  return <PatientCreateForm />;
}
