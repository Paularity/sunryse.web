import "server-only";

import data from "@/content/pages/calculator.json";
import { pageContent } from "@/lib/content/strapi-page";

export type CalculatorPageContent = typeof data;

/** Copy from Strapi (calculator-page.content) merged over the bundled defaults. */
export const getCalculatorPage = (): Promise<CalculatorPageContent> => pageContent("calculator-page", data);
