import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "The Grid" };

export default function GridPage() {
  return <GridRoute view="overview" />;
}
