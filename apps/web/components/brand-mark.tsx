import Image from "next/image";

import type { Brand } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/**
 * A brand partner: its uploaded logo when there is one, else its name as text.
 * `decorative` hides the logo from screen readers (e.g. the duplicated half of a marquee).
 */
export function BrandMark({ brand, className, decorative }: { brand: Brand; className?: string; decorative?: boolean }) {
  if (!brand.logo) return <>{brand.name}</>;
  return (
    <Image
      src={brand.logo.src}
      alt={decorative ? "" : brand.logo.alt || brand.name}
      width={240}
      height={96}
      sizes="240px"
      className={cn("block w-auto max-w-full object-contain", className)}
    />
  );
}
