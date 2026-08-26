import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * These are the app's working primitives, imported by ~90 files. They are not the design
 * system — that is `@/components/ds`, which renders through the Black Label tokens and is
 * what /design-system documents. Both export Button, Badge, Card and Input with different
 * APIs, which is a live hazard: an import from the wrong one compiles and renders, just
 * off-brand.
 *
 * The palette below is still generic Tailwind (sky, slate, rose). Moving it onto the
 * Black Label tokens is the right change and is deliberately not made here, because it
 * repaints every button in the product and wants a human looking at the result before it
 * ships. The focus ring is the exception: it is brand chrome rather than a surface
 * colour, it is declared once for every button in the app, and it is only visible on
 * keyboard focus — so it moves onto the accent now, which is theme-aware and therefore
 * correct in both Marble and Obsidian.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--k-accent)_45%,transparent)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-white shadow-[0_12px_26px_rgba(15,23,42,.18)] hover:bg-slate-800",
        primary:
          "bg-[var(--bl-ember)] text-[var(--bl-black-cherry)] shadow-[0_12px_28px_color-mix(in_oklch,var(--bl-ember)_28%,transparent)] hover:bg-[var(--bl-ember-soft)]",
        secondary: "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        danger: "bg-rose-600 text-white hover:bg-rose-500",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 px-5 text-[15px]",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
