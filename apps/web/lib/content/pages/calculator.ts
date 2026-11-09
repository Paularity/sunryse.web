import "server-only";

import data from "@/content/pages/calculator.json";

export type CalculatorPageContent = typeof data;

export const getCalculatorPage = async (): Promise<CalculatorPageContent> => data;
