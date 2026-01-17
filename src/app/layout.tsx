import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { AnalyticsWrapper } from "@/components/analytics-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fūin no Sho - Film Inventory",
  description:
    "Manage your film inventory and get advice on best film to use for shoots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative`}
      >
        <Providers>
          {/* Ambient background effects */}
          <div className="ambient-bg" />
          <div className="vignette" />
          <div className="film-grain" />
          {children}
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: '#1a1614',
                border: '1px solid #2a2420',
                color: '#e8e4e0',
              },
            }}
          />
          <AnalyticsWrapper />
        </Providers>
      </body>
    </html>
  );
}
