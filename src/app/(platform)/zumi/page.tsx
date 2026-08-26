import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Zumi",
  description: "Expanded Zumi conversation for guided Klinikos work.",
};

export default async function ZumiPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "ai", "read")) return notFound();

  // The persistent Zumi instance lives in AppShell. Visiting /zumi changes that
  // same mounted conversation into its expanded presentation instead of creating
  // a second assistant instance or resetting its in-memory context.
  return null;
}
