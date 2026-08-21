import { PRIVATE_PAGE_METADATA } from "@/lib/seo/private-metadata";

export const metadata = PRIVATE_PAGE_METADATA;

export default function ClinicPrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
