import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "sonner";
import NavUserIconWrapper from "@/components/nav-user-icon-wrapper";
import { Analytics } from "@vercel/analytics/react";
import { SyncButton } from "@/components/sync-button";

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed flex items-center gap-2 top-4 right-4 z-50">
            <SyncButton />
            <NavUserIconWrapper />
            <ThemeToggle />
          </div>
          <main className="pb-16">{children}</main>
          {/* <Footer /> */}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
