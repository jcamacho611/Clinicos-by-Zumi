import type { Metadata } from "next";
import { NetworkCommandRoute } from "@/components/clinic/network/network-command-route";

export const metadata: Metadata = { title: "Partner Handoff Control" };

export default function NetworkHandoffsPage() {
  return <NetworkCommandRoute view="handoffs" />;
}
