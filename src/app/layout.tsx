import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import NavUserIconWrapper from "@/components/nav-user-icon-wrapper";
import { Analytics } from "@vercel/analytics/react";
import { Navigation } from "@/components/navigation";

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
          <Navigation />
          <div className="fixed top-6 right-6 z-50">
            <NavUserIconWrapper />
          </div>
          <main className="relative z-10 pb-16 px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">{children}</main>
          {/* <Footer /> */}
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
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
