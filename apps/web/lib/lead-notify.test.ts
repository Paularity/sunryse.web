import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { leadEmail } from "./lead-notify";

describe("lead email", () => {
  it("lists only the filled fields and links to the CMS", () => {
    const { subject, text } = leadEmail(
      {
        name: "Ana Cruz",
        phone: "0917 123 4567",
        segment: "residential",
        monthlyBill: 9000,
        packageName: "6 kW Hybrid System",
        addOns: ["Extra battery module", "EV charger"],
        preferredPayment: "Bank solar loan",
        message: "",
        source: "pricing",
      },
      "https://cms.example.com/admin/x",
    );
    expect(subject).toBe("New lead: Ana Cruz · 6 kW Hybrid System");
    expect(text).toBe(
      [
        "Name: Ana Cruz",
        "Mobile: 0917 123 4567",
        "Property: residential",
        "Monthly bill (₱): 9000",
        "Package: 6 kW Hybrid System",
        "Add-ons: Extra battery module, EV charger",
        "Payment: Bank solar loan",
        "Source: pricing",
        "",
        "Open in the CMS: https://cms.example.com/admin/x",
      ].join("\n"),
    );
  });

  it("marks calculator leads without a package", () => {
    expect(leadEmail({ name: "Ben", phone: "09171234567", source: "calculator" }).subject).toBe(
      "New lead: Ben · calculator",
    );
  });
});
