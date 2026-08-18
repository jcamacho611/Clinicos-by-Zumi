import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import NdaGeneratorClient from "./NdaGeneratorClient";

export default async function LegalDocumentGeneratorPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "settings", "manage")) redirect("/dashboard");

  return <NdaGeneratorClient />;
}
