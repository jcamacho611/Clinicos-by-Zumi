import type { Metadata } from "next";
import { GridRoute } from "@/components/clinic/grid/grid-route";

export const metadata: Metadata = { title: "Grid Authority" };

export default function GridAdminPage() {
  return <GridRoute view="admin" />;
}
