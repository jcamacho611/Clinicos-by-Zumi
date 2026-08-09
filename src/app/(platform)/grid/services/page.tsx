import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Services" };

export default function GridServicesPage() {
  return <GridRoute view="services" />;
}
