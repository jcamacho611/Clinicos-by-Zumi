import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Locations" };

export default function GridLocationsPage() {
  return <GridRoute view="locations" />;
}
