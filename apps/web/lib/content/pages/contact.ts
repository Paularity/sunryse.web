import "server-only";

import data from "@/content/pages/contact.json";
import { pageContent } from "@/lib/content/strapi-page";
import type { IconName } from "@/lib/content/types";

export type ContactPageContent = Omit<typeof data, "properties"> & {
  properties: { value: "residential" | "commercial" | "industrial"; label: string; description: string; icon: IconName }[];
};

/** Copy from Strapi (contact-page.content) merged over the bundled defaults. */
export const getContactPage = () => pageContent("contact-page", data as ContactPageContent);
