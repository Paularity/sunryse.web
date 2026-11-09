import { cn } from "@/lib/utils";

const bar = "rounded-full bg-navy-900/10 motion-safe:animate-pulse";

/**
 * Suspense fallback for the service / solution detail routes. Mirrors the page hero
 * (light gradient, padded by var(--site-top), copy column + photo frame) so navigation is instant.
 */
export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <section
      aria-hidden
      className={cn(
        "relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-200)_0%,var(--color-day-100)_45%,var(--color-dawn-50)_100%)] pb-[clamp(48px,7vw,80px)] pt-[calc(var(--site-top)+24px)]",
        className,
      )}
    >
      <div className="container-site grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-5">
          <span className={cn(bar, "h-3 w-48")} />
          <span className={cn(bar, "h-12 w-full max-w-[520px] rounded-2xl sm:h-16")} />
          <span className={cn(bar, "h-12 w-3/4 max-w-[400px] rounded-2xl sm:h-16")} />
          <span className={cn(bar, "h-4 w-full max-w-[540px]")} />
          <span className={cn(bar, "h-4 w-2/3 max-w-[360px]")} />
          <div className="flex flex-wrap gap-2.5">
            <span className={cn(bar, "h-14 w-44 rounded-xl")} />
            <span className={cn(bar, "h-14 w-40 rounded-xl")} />
          </div>
        </div>
        <div className="h-[320px] rounded-[28px] bg-navy-900/10 motion-safe:animate-pulse sm:h-[420px] lg:h-[520px]" />
      </div>
    </section>
  );
}
