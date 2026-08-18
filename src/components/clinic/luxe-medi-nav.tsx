"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDollarSign, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/luxe-medi", label: "Studio", icon: Sparkles },
  { href: "/luxe-medi/acquisition", label: "Acquisition", icon: CircleDollarSign },
] as const;

export function LuxeMediNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Luxe Medi workspace" className="flex flex-wrap gap-2 rounded-2xl border border-[#e6817b]/12 bg-[#12090b]/45 p-2">
      {items.map((item) => {
        const active = item.href === "/luxe-medi" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition",
              active
                ? "border-[#e6817b]/25 bg-[#e6817b]/[.12] text-[#fff8f6]"
                : "border-transparent text-[#b89f9b] hover:border-[#e6817b]/12 hover:bg-[#e6817b]/[.06] hover:text-[#f8efed]",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4 text-[#e6817b]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
