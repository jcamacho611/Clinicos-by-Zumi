import { redirect } from "next/navigation";
import { CommercialReturnClient } from "@/components/commercial/commercial-return-client";
import { getClinicSession } from "@/lib/auth/session";

export const metadata = {
  title: "Verify payment | Klinikos",
  description: "Klinikos verifies payment on the server before updating access.",
};

export default async function CommercialReturnPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const session = await getClinicSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const state = params.state?.trim();
  if (!state || state.length < 16 || state.length > 96 || !/^[A-Za-z0-9_-]+$/.test(state)) {
    redirect("/clinic");
  }

  return <CommercialReturnClient state={state} />;
}
