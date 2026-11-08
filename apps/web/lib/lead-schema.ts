import { z } from "zod";

/** Quote request form — shared by the client form and the /api/leads route. */
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/, "Enter a valid PH mobile number, e.g. 0917 123 4567"),
  email: z.union([z.email("Enter a valid email"), z.literal("")]).optional(),
  segment: z.enum(["residential", "commercial", "industrial"]),
  monthlyBill: z.coerce.number().min(0).max(10_000_000).optional(),
  roofType: z.enum(["metal", "tile", "concrete", "unsure"]).optional(),
  address: z.string().trim().max(240).optional(),
  message: z.string().trim().max(2000).optional(),
  consent: z.literal(true, { error: "Please agree to be contacted" }),
  calcSnapshot: z.record(z.string(), z.unknown()).optional(),
  source: z.string().max(64).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
