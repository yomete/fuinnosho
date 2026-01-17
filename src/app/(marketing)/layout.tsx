import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fūin no Sho - Film Inventory for Analog Photographers",
  description:
    "Track your film stock, plan trips with reservations, log development chemistry. Your film deserves better than a spreadsheet.",
  openGraph: {
    title: "Fūin no Sho - Film Inventory for Analog Photographers",
    description: "Track your film stock, plan trips with reservations, log development chemistry.",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
