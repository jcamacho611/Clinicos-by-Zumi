import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-10 place-items-center rounded-[14px] bg-slate-950 shadow-[0_12px_30px_rgba(7,29,45,.25)]", className)} aria-hidden="true">
      <span className="absolute size-5 rounded-full border-[3px] border-teal-300" />
      <span className="absolute h-[3px] w-6 rotate-45 rounded-full bg-lime-300" />
    </span>
  );
}
