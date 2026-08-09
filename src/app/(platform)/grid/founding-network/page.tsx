import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Founding Network" };

export default function GridFoundingNetworkPage() {
  return <GridRoute view="founding-network" />;
}
