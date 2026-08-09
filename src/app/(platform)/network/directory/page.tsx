import type { Metadata } from "next";
import { NetworkDirectoryRoute } from "@/components/clinic/network/network-directory-route";

export const metadata: Metadata = { title: "Network Directory Administration" };

export default function NetworkDirectoryPage() {
  return <NetworkDirectoryRoute />;
}
