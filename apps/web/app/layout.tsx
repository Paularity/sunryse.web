import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Sora, Space_Grotesk } from "next/font/google";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Headlines: Space Grotesk. Sora 800 is kept only for the logo wordmark.
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["500", "600", "700"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["800"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["500"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "SunRyse Solar Services — Clean Energy, Brighter Tomorrow",
    template: "%s · SunRyse Solar Services",
  },
  description:
    "Residential, commercial and industrial solar in the Philippines: design, installation, hybrid and battery systems, and after-sales support.",
  openGraph: {
    type: "website",
    siteName: "SunRyse Solar Services",
    locale: "en_PH",
    images: [{ url: "/images/projects/residential-blue-house.jpg", width: 1200, height: 630, alt: "SunRyse rooftop solar installation" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f7faff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${sora.variable} ${manrope.variable} ${jetbrains.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <SmoothScroll />
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
