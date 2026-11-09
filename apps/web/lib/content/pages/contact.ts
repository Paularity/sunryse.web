import "server-only";

import data from "@/content/pages/contact.json";
import type { IconName } from "@/lib/content/types";

export type ContactPageContent = Omit<typeof data, "properties"> & {
  properties: { value: "residential" | "commercial" | "industrial"; label: string; description: string; icon: IconName }[];
};

export const getContactPage = async (): Promise<ContactPageContent> => data as ContactPageContent;
