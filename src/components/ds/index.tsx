/**
 * Klinikos Design System — core primitives.
 *
 * Transcribed from the design-system export with the exact prop contracts its
 * adherence config declares, so the linter's component rules hold against this
 * implementation:
 *
 *   Badge    tone: neutral | observing | mapping | analyzing | signal | resolved
 *   Button   variant: primary | dark | outline | ghost | gold · size: sm | md | lg
 *   Card     dark
 *   Input    label, dark
 *   ZumiOrb  state: dormant | observing | mapping | analyzing | signal | resolved
 *
 * Every value is a token via var(). No raw hex, no raw px in colour or spacing
 * positions — the same two rules the adherence config enforces.
 *
 * These render on any subtree carrying `data-klinikos-ds` (see DsSurface).
 */

import type { CSSProperties, ReactNode } from "react";

export const zumiStates = ["dormant", "observing", "mapping", "analyzing", "signal", "resolved"] as const;
export type ZumiState = (typeof zumiStates)[number];

export const badgeTones = ["neutral", ...zumiStates.filter((state) => state !== "dormant")] as const;
export type BadgeTone = (typeof badgeTones)[number];

export const buttonVariants = ["primary", "dark", "outline", "ghost", "gold"] as const;
export type ButtonVariant = (typeof buttonVariants)[number];

export const buttonSizes = ["sm", "md", "lg"] as const;
export type ButtonSize = (typeof buttonSizes)[number];

/**
 * Opts a subtree into the design system.
 *
 * The tokens are scoped to this attribute so a page that has not migrated keeps the
 * legacy palette rather than silently inverting its text colour.
 */
export function DsSurface({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} data-klinikos-ds="" style={{ fontFamily: "var(--font-sans)", ...style }}>
      {children}
    </div>
  );
}

const TONES: Record<BadgeTone, CSSProperties> = {
  neutral: { background: "var(--line-dark)", color: "var(--ink-dim)" },
  observing: { background: "color-mix(in oklch, var(--status-observing) 22%, transparent)", color: "var(--status-observing)" },
  mapping: { background: "color-mix(in oklch, var(--status-mapping) 20%, transparent)", color: "var(--status-mapping)" },
  analyzing: { background: "color-mix(in oklch, var(--status-analyzing) 20%, transparent)", color: "var(--status-analyzing)" },
  signal: { background: "color-mix(in oklch, var(--status-signal) 20%, transparent)", color: "var(--status-signal)" },
  resolved: { background: "color-mix(in oklch, var(--status-resolved) 20%, transparent)", color: "var(--status-resolved)" },
};

/** Operational-state micro-label sharing Zumi's six-state palette. */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      style={{
        ...TONES[tone],
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        padding: "var(--space-1) var(--space-3)",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-micro)",
        fontWeight: 800,
        letterSpacing: "var(--tracking-wide)",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: { background: "var(--accent-signal)", color: "var(--obsidian)", border: "none" },
  dark: { background: "var(--obsidian)", color: "var(--ink)", border: "var(--border-hair-dark)" },
  outline: { background: "transparent", color: "inherit", border: "1px solid currentColor" },
  ghost: { background: "transparent", color: "inherit", border: "none" },
  // Gold is reserved for premium and paid moments — pricing, founding program.
  gold: { background: "var(--accent-premium)", color: "var(--obsidian)", border: "none" },
};

const SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "var(--space-2) var(--space-4)", fontSize: "var(--text-micro)" },
  md: { padding: "var(--space-3) var(--space-5)", fontSize: "var(--text-small)" },
  lg: { padding: "var(--space-4) var(--space-6)", fontSize: "var(--text-body)" },
};

/**
 * Rectangular, hairline or solid, never a pill. Hover drops opacity rather than
 * inverting colour; press scales down. No shadow-pop.
 */
export function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled,
  className,
  style,
  type = "button",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={className}
      disabled={disabled}
      onClick={onClick}
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        letterSpacing: "0.01em",
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        minHeight: "44px",
        transition: "opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard)",
        ...VARIANTS[variant],
        ...SIZES[size],
        ...style,
      }}
      type={type}
    >
      {children}
    </button>
  );
}

/** Hairline-bordered block. Dark or paper — the border does the work, not a shadow. */
export function Card({
  dark = false,
  children,
  className,
  style,
}: {
  dark?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: dark ? "var(--surface-raised)" : "var(--surface-paper)",
        border: dark ? "var(--border-hair-dark)" : "var(--border-hair-light)",
        color: dark ? "var(--text-primary)" : "var(--text-on-paper)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-6)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Underline field, not boxed — hairlines over containers. */
export function Input({
  label,
  dark = false,
  placeholder,
  value,
  onChange,
  type = "text",
  required,
  style,
}: {
  label?: string;
  dark?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  style?: CSSProperties;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontFamily: "var(--font-sans)" }}>
      {label && (
        <span
          style={{
            fontSize: "var(--text-micro)",
            fontWeight: 800,
            letterSpacing: "var(--tracking-wide)",
            textTransform: "uppercase",
            color: dark ? "var(--text-secondary)" : "var(--text-on-paper-dim)",
          }}
        >
          {label}
        </span>
      )}
      <input
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: dark ? "var(--border-hair-dark)" : "var(--border-hair-light)",
          color: dark ? "var(--text-primary)" : "var(--text-on-paper)",
          fontSize: "var(--text-body-lg)",
          padding: "var(--space-3) var(--space-1)",
          outline: "none",
          fontFamily: "var(--font-sans)",
          minHeight: "44px",
          ...style,
        }}
        type={type}
        value={value}
      />
    </label>
  );
}

type OrbConfig = { glow: number; nodeOpacity: number; lineOpacity: number; speed: number; color: string; scale: number };

const STATE_CONFIG: Record<ZumiState, OrbConfig> = {
  dormant: { glow: 0.18, nodeOpacity: 0.12, lineOpacity: 0, speed: 60, color: "var(--accent-signal)", scale: 0.94 },
  observing: { glow: 0.32, nodeOpacity: 0.55, lineOpacity: 0.08, speed: 46, color: "var(--accent-signal)", scale: 0.97 },
  mapping: { glow: 0.48, nodeOpacity: 0.85, lineOpacity: 0.4, speed: 32, color: "var(--accent-intelligence)", scale: 1 },
  analyzing: { glow: 0.62, nodeOpacity: 1, lineOpacity: 0.65, speed: 18, color: "var(--accent-intelligence)", scale: 1.03 },
  signal: { glow: 0.85, nodeOpacity: 1, lineOpacity: 0.9, speed: 10, color: "var(--status-signal)", scale: 1.08 },
  resolved: { glow: 0.55, nodeOpacity: 0.9, lineOpacity: 0.55, speed: 90, color: "var(--accent-premium)", scale: 1 },
};

const NODE_COUNT = 8;
const NODE_ANGLES = Array.from({ length: NODE_COUNT }, (_, index) => (360 / NODE_COUNT) * index);

/**
 * ZumiOrb — the signature intelligence structure.
 *
 * A faceted core with orbiting signal nodes that reorganise as Zumi's operating
 * state changes. Not a chat avatar: a systems diagram of continuity forming.
 *
 * Decorative, so it is hidden from assistive technology. Callers that need the state
 * announced should render their own text — the orb is never the only carrier of a
 * status a user must perceive.
 */
export function ZumiOrb({ state = "dormant", size = 240 }: { state?: ZumiState; size?: number }) {
  const config = STATE_CONFIG[state];
  const radius = size * 0.38;

  return (
    <div aria-hidden="true" style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)`,
          opacity: config.glow,
          filter: `blur(${size * 0.12}px)`,
          transition: "opacity var(--duration-slow) var(--ease-out-expo), background var(--duration-slow) var(--ease-out-expo)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: radius * 2,
          height: radius * 2,
          transform: `scale(${config.scale})`,
          transition: "transform var(--duration-slow) var(--ease-out-expo)",
          animation: `zumi-spin ${config.speed}s linear infinite`,
        }}
      >
        {NODE_ANGLES.map((degrees) => {
          const radians = (degrees * Math.PI) / 180;
          const x = radius + radius * Math.cos(radians);
          const y = radius + radius * Math.sin(radians);
          return (
            <div key={degrees} style={{ position: "absolute", inset: 0 }}>
              <div
                style={{
                  position: "absolute",
                  left: radius,
                  top: radius,
                  width: radius,
                  height: 1,
                  transformOrigin: "0 0",
                  transform: `rotate(${degrees}deg)`,
                  background: `linear-gradient(90deg, ${config.color}, transparent)`,
                  opacity: config.lineOpacity,
                  transition: "opacity 600ms var(--ease-out-expo)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: x - 3,
                  top: y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: config.color,
                  opacity: config.nodeOpacity,
                  boxShadow: `0 0 12px ${config.color}`,
                  transition: "opacity 600ms var(--ease-out-expo)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
