import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Hud, Section, SectionHeader } from "@/components/fx";
import { Button } from "@/components/ui/button";
import type { HomeContent, Project, UiLabels } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { cn } from "@/lib/utils";

const SEGMENT: Record<Project["segment"], string> = { residential: "segmentResidential", commercial: "segmentCommercial", industrial: "segmentIndustrial" };

export function ProjectsBento({ content, projects, ui }: { content: HomeContent["projects"]; projects: Project[]; ui: UiLabels }) {
  const shown = projects.slice(0, 4);
  return (
    <Section tone="light" labelledBy="proj-h">
      <SectionHeader
        id="proj-h"
        eyebrow={content.eyebrow}
        heading={content.heading}
        aside={
          <Button asChild variant="line" size="xl">
            <Link href="/projects">
              {content.ctaLabel} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mr-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pr-4 sm:-mr-6 sm:pr-6 lg:mr-0 lg:grid lg:grid-cols-[1.4fr_1fr_1fr] lg:grid-rows-[260px_260px] lg:gap-4 lg:overflow-visible lg:pr-0">
        {shown.map((p, i) => (
          <Link
            key={p.slug}
            href="/projects"
            className={cn(
              "group relative block min-h-80 flex-[0_0_84%] snap-start overflow-hidden rounded-[22px] text-white shadow-[0_20px_40px_-24px_rgb(11_31_77/0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:flex-[0_0_72%] lg:min-h-0 lg:flex-none",
              i === 0 && "lg:row-span-2",
            )}
          >
            <Image
              src={p.image.src}
              alt={p.image.alt}
              fill
              sizes={i === 0 ? "(min-width:1024px) 40vw, 84vw" : "(min-width:1024px) 28vw, 84vw"}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(7_20_51/0.7))]" />
            <Hud className="absolute left-3.5 top-3.5 z-[2]">{t(ui, SEGMENT[p.segment])}</Hud>
            <span className="absolute inset-x-3.5 bottom-3.5 z-[2] flex justify-between gap-2 rounded-xl border border-white/20 bg-navy-950/55 px-3.5 py-3 font-label text-[11px] uppercase leading-snug tracking-[0.12em] backdrop-blur-md">
              <span>{p.location}</span>
              <span className="text-sun-300">{p.sizeKwp}</span>
            </span>
          </Link>
        ))}
        <Link
          href="/projects"
          className="group relative flex min-h-80 flex-[0_0_84%] snap-start flex-col justify-between overflow-hidden rounded-[22px] bg-sun p-6 text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:flex-[0_0_72%] lg:min-h-0 lg:flex-none"
        >
          <span aria-hidden className="pointer-events-none absolute -right-[90px] -top-[90px] size-[260px] rounded-full border border-white/60 shadow-[inset_0_0_0_40px_rgb(255_255_255/0.07),inset_0_0_0_41px_rgb(255_255_255/0.35)]" />
          <span className="relative font-label text-[11px] uppercase tracking-[0.12em]">{content.allCount}</span>
          <span className="relative flex items-end justify-between gap-3">
            <span className="font-display text-[28px] font-bold leading-[1.05] tracking-[-0.03em]">{content.allLabel}</span>
            <span aria-hidden className="grid size-11 flex-none place-items-center rounded-full bg-navy-900 text-white transition-transform duration-300 group-hover:-rotate-45">
              <ArrowRight className="size-[18px]" />
            </span>
          </span>
        </Link>
      </div>
    </Section>
  );
}
