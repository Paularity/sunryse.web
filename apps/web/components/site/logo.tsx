import Link from "next/link";
import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * The SunRyse logo lockup (sun mark + SunRyse + SOLAR SERVICES). Never restyle it.
 * `dark` is the reversed version for navy backgrounds (lighter "Ryse" for contrast).
 */
export function Logo({ dark, className, href = "/" }: { dark?: boolean; className?: string; href?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <Link href={href} aria-label="SunRyse Solar Services home" className={cn("flex min-h-11 shrink-0 items-center gap-2.5", className)}>
      <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden>
        <defs>
          <linearGradient id={`lg${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFC93C" />
            <stop offset="1" stopColor="#FF5A1F" />
          </linearGradient>
        </defs>
        <g stroke={`url(#lg${id})`} strokeWidth="2.2" strokeLinecap="round">
          <line x1="20" y1="3" x2="20" y2="7" />
          <line x1="8" y1="9" x2="10.6" y2="11.8" />
          <line x1="32" y1="9" x2="29.4" y2="11.8" />
          <line x1="3" y1="18" x2="6.6" y2="19" />
          <line x1="37" y1="18" x2="33.4" y2="19" />
        </g>
        <path d="M8 22a12 12 0 0 1 24 0z" fill={`url(#lg${id})`} />
        <path d="M10 23.5h22l-3.5 7H6.5z" fill="#1E6FE8" />
        <path d="M14 23.5l-2.5 7M19.5 23.5l-2.5 7M25 23.5l-2.5 7M8.3 27h22" stroke="#FFFFFF" strokeWidth=".9" />
        <path d="M3 31c9 7 26 7 34-5" stroke="#2DB84C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-logo text-[22px] font-extrabold tracking-[-0.02em]">
          <span className="text-sun">Sun</span>
          <span className={dark ? "bg-[linear-gradient(135deg,#7DB6FF,#3B8BFF)] bg-clip-text text-transparent" : "text-sky"}>Ryse</span>
        </span>
        <span className={cn("mt-1 font-label text-[9px] uppercase tracking-[0.3em]", dark ? "text-[#C9D4F2]" : "text-navy-900")}>
          Solar Services
        </span>
      </span>
    </Link>
  );
}
