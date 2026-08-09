import type { Metadata } from "next";
import { NetworkDirectoryRoute } from "@/components/clinic/network/network-directory-route";

export const metadata: Metadata = { title: "Network Administration" };

export default function AdminNetworkPage() {
  return <NetworkDirectoryRoute admin />;
}
