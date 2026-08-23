import type { Metadata } from "next";
import { NetworkDirectoryRoute } from "@/components/clinic/network/network-directory-route";

export const metadata: Metadata = { title: "Network Directory Administration" };

export default async function NetworkDirectoryPage({ searchParams }: { searchParams: Promise<{ connect?: string }> }) {
  const { connect } = await searchParams;
  const initialTargetOrganizationId = typeof connect === "string" ? connect.trim().slice(0, 120) : "";
  return <NetworkDirectoryRoute initialTargetOrganizationId={initialTargetOrganizationId} />;
}