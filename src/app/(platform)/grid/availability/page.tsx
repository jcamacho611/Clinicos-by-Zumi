import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Availability" };

export default function GridAvailabilityPage() {
  return <GridRoute view="availability" />;
}
