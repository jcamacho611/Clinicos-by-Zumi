import type { Metadata } from "next";
import { NetworkCommandRoute } from "@/components/clinic/network/network-command-route";

export const metadata: Metadata = { title: "Clinic Network Map" };

export default function NetworkMapPage() {
  return <NetworkCommandRoute view="map" />;
}
