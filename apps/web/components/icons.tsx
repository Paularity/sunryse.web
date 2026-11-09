import {
  Activity, Award, Battery, Building2, Calculator, Cctv, Check, ClipboardCheck, Clock, Droplet, Factory, FileText, Frame,
  Gauge, Headset, House, Leaf, Lightbulb, Mail, MapPin, MessageCircle, Phone, Plug, ShieldCheck, SolarPanel, Sun, Trees,
  TrendingDown, Users, Wrench, Zap, type LucideIcon, type LucideProps,
} from "lucide-react";

import type { IconName, Tone } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const ICONS: Record<IconName, LucideIcon> = {
  "trending-down": TrendingDown, leaf: Leaf, battery: Battery, wrench: Wrench, headset: Headset, sun: Sun, zap: Zap,
  home: House, building: Building2, factory: Factory, "clipboard-check": ClipboardCheck, "solar-panel": SolarPanel,
  "shield-check": ShieldCheck, frame: Frame, lightbulb: Lightbulb, droplet: Droplet, plug: Plug, cctv: Cctv, award: Award,
  users: Users, check: Check, phone: Phone, mail: Mail, "map-pin": MapPin, message: MessageCircle, clock: Clock,
  trees: Trees, gauge: Gauge, calculator: Calculator, "file-text": FileText, activity: Activity,
};

/** One stroke icon set across the site (lucide, 1.75 stroke). */
/** Mounting structure: A-frame from the design (lucide has no equivalent). */
function AFrame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M3 20h18M5 20 12 6l7 14M8.5 13h7" />
    </svg>
  );
}

export function Icon({ name, className, ...props }: { name: IconName } & LucideProps) {
  if (name === "frame") return <AFrame className={cn("size-5 shrink-0", className)} />;
  const Cmp = ICONS[name] ?? Sun;
  return <Cmp aria-hidden strokeWidth={1.75} className={cn("size-5 shrink-0", className)} {...props} />;
}

/** Brand tone → CSS colour token (used as the --c custom property for glow tiles). */
export const TONE: Record<Tone, string> = {
  sun: "var(--color-sun-300)",
  amber: "var(--color-sun-500)",
  flame: "var(--color-sun-600)",
  sky: "var(--color-sky-500)",
  leaf: "var(--color-leaf-500)",
  navy: "var(--color-navy-900)",
};

/** Readable text colour on light backgrounds for each tone. */
export const TONE_TEXT: Record<Tone, string> = {
  sun: "text-sun-800",
  amber: "text-sun-700",
  flame: "text-sun-700",
  sky: "text-sky-600",
  leaf: "text-leaf-600",
  navy: "text-navy-900",
};

/** Social brand marks (lucide no longer ships brand icons). */
export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
    instagram: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
    messenger: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
    viber: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
    tiktok: <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      {paths[platform] ?? paths.messenger}
    </svg>
  );
}
